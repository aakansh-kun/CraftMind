import time
import logging
from typing import List, Dict, Any, Optional, Tuple
from fastapi import HTTPException
from app.config import settings
from app.schemas import ChatResponseMetadata

logger = logging.getLogger("craftmind.llm")

DEFAULT_SYSTEM_PROMPT = (
    "You are CraftMind, an expert AI Minecraft companion. "
    "You possess comprehensive, accurate knowledge of Minecraft mechanics, "
    "including architectural building and aesthetics, Redstone engineering and logic, "
    "survival strategies, resource gathering, commands, and Minecraft modding and development. "
    "Provide clear, practical, and structured guidance tailored to players of all skill levels. "
    "Do not make unsupported claims about game versions when uncertain."
)

BUILD_SYSTEM_PROMPT = (
    "You are CraftMind, an expert AI Minecraft companion and master architect. "
    "You possess comprehensive, accurate knowledge of Minecraft building mechanics, aesthetics, "
    "farm designs, redstone contraptions, and structural layouts across Java & Bedrock editions (v1.21.x). "
    "Provide clear, practical, structured step-by-step guidance in Markdown tailored to players.\n\n"
    "CRITICAL VISUALIZATION REQUIREMENT:\n"
    "When the user's message is asking how to build, construct, or design any physical Minecraft structure, "
    "farm, building, machine, or base (e.g. Sugarcane Farm, Creeper Farm, Modern Villa, Nether Portal Hub, "
    "Storage Room, Medieval Bridge, Mob Farm, etc.), you MUST append a valid ```craftmind-viz``` JSON code block "
    "at the very end of your response after your Markdown explanation.\n"
    "Keep your Markdown explanation concise and practical (under 300 words) so the complete craftmind-viz JSON block fits fully.\n\n"
    "The craftmind-viz block defines the 3D voxel coordinate model for the visualizer. Use this exact schema:\n"
    "```craftmind-viz\n"
    "{\n"
    '  "schema_version": 1,\n'
    '  "type": "build",\n'
    '  "title": "<Concise Build Name, e.g. Sugarcane Farm>",\n'
    '  "edition": "Java & Bedrock 1.21.x",\n'
    '  "version": "1.21.x",\n'
    '  "dimensions": { "width": <int 3-15>, "length": <int 3-15>, "height": <int 2-12> },\n'
    '  "materials": [\n'
    '    { "type": "<block_type>", "name": "<Block Name>", "quantity": <int> }\n'
    '  ],\n'
    '  "steps": [\n'
    '    { "number": 1, "title": "<Step 1 Title>", "description": "<Summary>" }\n'
    '  ],\n'
    '  "blocks": [\n'
    '    { "x": <int 0..width-1>, "y": <int 0..height-1>, "z": <int 0..length-1>, "type": "<block_type>", "step": <int> }\n'
    '  ]\n'
    "}\n"
    "```\n\n"
    "STRICT RULES FOR CRAFTMIND-VIZ:\n"
    "1. Coordinate system: y=0 is the bottom/ground layer. x is width (0 to width-1), z is length (0 to length-1). "
    "Every block coordinate must strictly satisfy: 0 <= x < dimensions.width, 0 <= y < dimensions.height, 0 <= z < dimensions.length.\n"
    "2. Keep dimensions compact and representative: width 3 to 15, length 3 to 15, height 2 to 12. "
    "Total blocks should be between 15 and 150 blocks (if a farm is massive, model one clean functional slice/module).\n"
    "3. Use standard block names in snake_case: stone, cobblestone, stone_bricks, oak_planks, spruce_planks, oak_log, "
    "glass, water, lava, chest, hopper, observer, piston, sticky_piston, redstone, repeater, comparator, sugarcane, bamboo, "
    "sand, dirt, farmland, trapdoor, slab, stair, torch, lantern, bed, door, obsidian, magma, quartz, terracotta, concrete, soul_sand.\n"
    "4. Do NOT output HTML, JSX, markdown, or scripts inside the craftmind-viz JSON. Ensure the JSON is completely closed.\n"
    "5. If the question is purely conceptual, conversational, or not a physical build instruction, do NOT output any craftmind-viz block."
)


def get_system_prompt_for_mode(mode: Optional[str] = None) -> str:
    """
    Returns the appropriate system prompt based on companion mode.
    """
    if mode and mode.upper() == "BUILD":
        return BUILD_SYSTEM_PROMPT
    return DEFAULT_SYSTEM_PROMPT

# Initialize LiteLLM cache if enabled
import os
os.environ["LITELLM_LOCAL_MODEL_COST_MAP"] = "True"

try:
    import litellm
    from litellm.caching import Cache

    if settings.ENABLE_CACHE:
        # Enable LiteLLM in-memory cache
        litellm.cache = Cache(type="local")
    # Suppress verbose litellm logging in production
    litellm.suppress_debug_info = True
except Exception as e:
    logger.warning("Failed to initialize LiteLLM caching: %s", e)


def parse_simulated_failures(header_value: Optional[str]) -> Dict[str, int]:
    """
    Parses X-Simulate-Failure header.
    Examples:
      'key_1=429' -> {'key_1': 429}
      'key_1=429,key_2=500' -> {'key_1': 429, 'key_2': 500}
      '*=429' -> {'*': 429}
    """
    if not header_value:
        return {}
    failures = {}
    parts = header_value.split(",")
    for part in parts:
        part = part.strip()
        if "=" in part:
            k, v = part.split("=", 1)
            try:
                code = int(v.strip())
                if code in (429, 500, 502, 503):
                    failures[k.strip()] = code
            except ValueError:
                pass
    return failures


def get_configured_providers() -> List[Dict[str, Any]]:
    """
    Returns ordered provider configurations:
    1. Primary: key_1 -> Gemini
    2. Fallback: key_2 -> Groq
    """
    return [
        {
            "key_id": "key_1",
            "provider": "gemini",
            "model": settings.GEMINI_MODEL,
            "api_key": settings.GEMINI_API_KEY,
        },
        {
            "key_id": "key_2",
            "provider": "groq",
            "model": settings.GROQ_MODEL,
            "api_key": settings.GROQ_API_KEY,
        },
    ]


def is_eligible_failure(e: Exception) -> bool:
    """
    Determines whether an exception is an eligible failure for key failover:
    429 (rate-limit / quota), 500, 502, 503, connection/timeout errors.
    """
    status_code = getattr(e, "status_code", None)
    if status_code in (429, 500, 502, 503):
        return True

    exc_name = type(e).__name__.lower()
    if any(
        target in exc_name
        for target in [
            "ratelimit",
            "internalserver",
            "badgateway",
            "serviceunavailable",
            "apiconnection",
            "timeout",
            "apierror",
        ]
    ):
        return True

    msg = str(e).lower()
    if any(err_str in msg for err_str in ["429", "quota", "rate limit", "resource_exhausted", "500", "502", "503", "service unavailable"]):
        return True

    return False


def is_litellm_cache_hit(response: Any) -> bool:
    """
    Checks if a LiteLLM response was served from cache.
    """
    if response is None:
        return False

    hidden = getattr(response, "_hidden_params", None)
    if isinstance(hidden, dict) and hidden.get("cache_hit"):
        return True

    if hasattr(response, "get"):
        hidden = response.get("_hidden_params")
        if isinstance(hidden, dict) and hidden.get("cache_hit"):
            return True

    if hasattr(response, "model_extra") and isinstance(response.model_extra, dict):
        hidden = response.model_extra.get("_hidden_params")
        if isinstance(hidden, dict) and hidden.get("cache_hit"):
            return True

    return False


async def execute_chat_turn(
    messages: List[Dict[str, str]],
    simulate_header: Optional[str] = None,
) -> Tuple[str, ChatResponseMetadata]:
    """
    Executes a chat completion across configured providers with automatic failover,
    failure simulation support, latency tracking, and LiteLLM caching detection.
    """
    import litellm

    start_time = time.perf_counter()
    providers = get_configured_providers()

    simulated_failures = {}
    if settings.ENABLE_FAILURE_SIMULATION and simulate_header:
        simulated_failures = parse_simulated_failures(simulate_header)

    fallback_attempts = 0
    last_error = None

    for provider_cfg in providers:
        key_id = provider_cfg["key_id"]
        model = provider_cfg["model"]
        api_key = provider_cfg["api_key"]

        # Check for simulated failure on this provider
        sim_code = simulated_failures.get(key_id) or simulated_failures.get("*")
        if sim_code:
            logger.info("Simulating %d failure on %s", sim_code, key_id)
            fallback_attempts += 1
            last_error = f"Simulated failure {sim_code} on {key_id}"
            continue

        try:
            # LiteLLM call with caching enabled
            response = await litellm.acompletion(
                model=model,
                messages=messages,
                api_key=api_key if api_key else None,
                caching=settings.ENABLE_CACHE,
                max_tokens=4096,
            )

            latency_ms = int(round((time.perf_counter() - start_time) * 1000))

            # Check cache hit status
            cache_hit = is_litellm_cache_hit(response)

            reply = ""
            if response.choices and len(response.choices) > 0:
                reply = response.choices[0].message.content or ""

            # Extract token counts
            usage = getattr(response, "usage", None)
            input_tokens = getattr(usage, "prompt_tokens", 0) if usage else 0
            output_tokens = getattr(usage, "completion_tokens", 0) if usage else 0

            if cache_hit:
                metadata = ChatResponseMetadata(
                    resolution_source="LLM_CACHE",
                    model=model,
                    latency_ms=latency_ms,
                    input_tokens=input_tokens or 0,
                    output_tokens=output_tokens or 0,
                    key_id=None,
                    fallback_attempts=0,
                )
            else:
                metadata = ChatResponseMetadata(
                    resolution_source="LIVE_INFERENCE",
                    model=model,
                    latency_ms=latency_ms,
                    input_tokens=input_tokens or 0,
                    output_tokens=output_tokens or 0,
                    key_id=key_id,
                    fallback_attempts=fallback_attempts,
                )

            return reply, metadata

        except Exception as e:
            logger.warning("Error with provider %s (%s): %s", key_id, model, e)
            if is_eligible_failure(e):
                fallback_attempts += 1
                last_error = e
                continue
            else:
                # If ineligible or unrecoverable, we also treat as failure to attempt fallback
                fallback_attempts += 1
                last_error = e
                continue

    # If all configured providers failed
    logger.error("All providers unavailable. Last error: %s", last_error)
    raise HTTPException(status_code=503, detail="all providers unavailable")
