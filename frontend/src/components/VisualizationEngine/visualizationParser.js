/**
 * CraftMind Visualization Engine Parser
 * 
 * Safely extracts or synthesizes structured interactive blueprint/circuit/progression data
 * from assistant replies. Never executes arbitrary code.
 */

// Canonical templates for classic Minecraft requests
const CANONICAL_TEMPLATES = {
  gold_farm: {
    type: 'build',
    title: 'Nether Portal Zombie Piglin Gold Farm',
    edition: 'Java & Bedrock 1.20+',
    dimensions: { width: 7, length: 7, height: 8 },
    materials: [
      { id: 'obsidian', name: 'Obsidian Portal Blocks', quantity: 64, icon: '🔮' },
      { id: 'magma', name: 'Magma Blocks', quantity: 48, icon: '🌋' },
      { id: 'glass', name: 'Glass Viewing Blocks', quantity: 32, icon: '🔲' },
      { id: 'hopper', name: 'Hoppers', quantity: 4, icon: '📥' },
      { id: 'chest', name: 'Double Chest', quantity: 2, icon: '📦' },
      { id: 'trapdoor', name: 'Oak Trapdoors', quantity: 8, icon: '🪵' },
      { id: 'stone_bricks', name: 'Stone Bricks', quantity: 48, icon: '🧱' },
      { id: 'slab', name: 'Stone Slabs', quantity: 16, icon: '➖' },
      { id: 'water', name: 'Water Buckets', quantity: 2, icon: '💧' }
    ],
    steps: [
      { number: 1, title: 'Ground Collection Vault', description: 'Place double chest connected to 4 collection hoppers, capped with stone slabs for safe kill zone.', layer: 1 },
      { number: 2, title: 'Reinforced Drop Chute', description: 'Surround the hoppers with glass and stone brick walls to contain falling Zombified Piglins.', layer: 2 },
      { number: 3, title: 'Fall Softening Chute', description: 'Extend the drop chute upward to guarantee exactly 22 blocks of fall damage.', layer: 3 },
      { number: 4, title: 'Magma Spawning Platform', description: 'Construct a 7x7 spawning floor of magma blocks with a 2x2 central drop opening.', layer: 4 },
      { number: 5, title: 'Trapdoor Deception Rim', description: 'Line the chute opening with open wooden trapdoors; Piglins perceive them as solid floor and plunge.', layer: 4 },
      { number: 6, title: 'Nether Portal Ignition Base', description: 'Erect massive obsidian portal frames along the platform perimeter for rapid tick spawning.', layer: 5 },
      { number: 7, title: 'Upper Portal Columns', description: 'Raise obsidian vertical pillars to complete the 23-block high Nether Portal matrix.', layer: 6 },
      { number: 8, title: 'Water Flush & Obsidian Cap', description: 'Cap top portal beam and install directional water streams funneling mobs into chute.', layer: 7 }
    ],
    layers: [
      {
        level: 1,
        name: 'L1: Vault & Hopper Base',
        grid: [
          ['stone', 'stone', 'stone', 'stone', 'stone', 'stone', 'stone'],
          ['stone', 'stone', 'stone', 'stone', 'stone', 'stone', 'stone'],
          ['stone', 'chest', 'hopper', 'hopper', 'stone', 'stone', 'stone'],
          ['stone', 'chest', 'hopper', 'hopper', 'stone', 'stone', 'stone'],
          ['stone', 'stone', 'stone', 'stone', 'stone', 'stone', 'stone'],
          ['stone', 'stone', 'stone', 'stone', 'stone', 'stone', 'stone'],
          ['stone', 'stone', 'stone', 'stone', 'stone', 'stone', 'stone']
        ]
      },
      {
        level: 2,
        name: 'L2: Lower Glass Drop Shaft',
        grid: [
          ['stone', 'stone', 'stone', 'stone', 'stone', 'stone', 'stone'],
          ['stone', 'stone', 'stone', 'stone', 'stone', 'stone', 'stone'],
          ['stone', 'glass', 'slab', 'slab', 'glass', 'stone', 'stone'],
          ['stone', 'glass', 'slab', 'slab', 'glass', 'stone', 'stone'],
          ['stone', 'stone', 'stone', 'stone', 'stone', 'stone', 'stone'],
          ['stone', 'stone', 'stone', 'stone', 'stone', 'stone', 'stone'],
          ['stone', 'stone', 'stone', 'stone', 'stone', 'stone', 'stone']
        ]
      },
      {
        level: 3,
        name: 'L3: Mid Drop Shaft',
        grid: [
          ['air', 'air', 'air', 'air', 'air', 'air', 'air'],
          ['air', 'stone', 'stone', 'stone', 'stone', 'air', 'air'],
          ['air', 'stone', 'chute', 'chute', 'stone', 'air', 'air'],
          ['air', 'stone', 'chute', 'chute', 'stone', 'air', 'air'],
          ['air', 'stone', 'stone', 'stone', 'stone', 'air', 'air'],
          ['air', 'air', 'air', 'air', 'air', 'air', 'air'],
          ['air', 'air', 'air', 'air', 'air', 'air', 'air']
        ]
      },
      {
        level: 4,
        name: 'L4: Magma Platform & Trapdoors',
        grid: [
          ['magma', 'magma', 'magma', 'magma', 'magma', 'magma', 'magma'],
          ['magma', 'magma', 'magma', 'magma', 'magma', 'magma', 'magma'],
          ['magma', 'magma', 'trapdoor', 'trapdoor', 'magma', 'magma', 'magma'],
          ['magma', 'magma', 'trapdoor', 'trapdoor', 'magma', 'magma', 'magma'],
          ['magma', 'magma', 'magma', 'magma', 'magma', 'magma', 'magma'],
          ['magma', 'magma', 'magma', 'magma', 'magma', 'magma', 'magma'],
          ['magma', 'magma', 'magma', 'magma', 'magma', 'magma', 'magma']
        ]
      },
      {
        level: 5,
        name: 'L5: Obsidian Portal Sill',
        grid: [
          ['obsidian', 'obsidian', 'obsidian', 'obsidian', 'obsidian', 'obsidian', 'obsidian'],
          ['obsidian', 'air', 'water', 'water', 'air', 'air', 'obsidian'],
          ['obsidian', 'water', 'chute', 'chute', 'water', 'air', 'obsidian'],
          ['obsidian', 'water', 'chute', 'chute', 'water', 'air', 'obsidian'],
          ['obsidian', 'air', 'water', 'water', 'air', 'air', 'obsidian'],
          ['obsidian', 'air', 'air', 'air', 'air', 'air', 'obsidian'],
          ['obsidian', 'obsidian', 'obsidian', 'obsidian', 'obsidian', 'obsidian', 'obsidian']
        ]
      },
      {
        level: 6,
        name: 'L6: Portal Energy & Columns',
        grid: [
          ['obsidian', 'air', 'air', 'air', 'air', 'air', 'obsidian'],
          ['obsidian', 'portal', 'portal', 'portal', 'portal', 'portal', 'obsidian'],
          ['obsidian', 'portal', 'portal', 'portal', 'portal', 'portal', 'obsidian'],
          ['obsidian', 'portal', 'portal', 'portal', 'portal', 'portal', 'obsidian'],
          ['obsidian', 'portal', 'portal', 'portal', 'portal', 'portal', 'obsidian'],
          ['obsidian', 'portal', 'portal', 'portal', 'portal', 'portal', 'obsidian'],
          ['obsidian', 'air', 'air', 'air', 'air', 'air', 'obsidian']
        ]
      },
      {
        level: 7,
        name: 'L7: Upper Portal Columns',
        grid: [
          ['obsidian', 'air', 'air', 'air', 'air', 'air', 'obsidian'],
          ['obsidian', 'portal', 'portal', 'portal', 'portal', 'portal', 'obsidian'],
          ['obsidian', 'portal', 'portal', 'portal', 'portal', 'portal', 'obsidian'],
          ['obsidian', 'portal', 'portal', 'portal', 'portal', 'portal', 'obsidian'],
          ['obsidian', 'portal', 'portal', 'portal', 'portal', 'portal', 'obsidian'],
          ['obsidian', 'portal', 'portal', 'portal', 'portal', 'portal', 'obsidian'],
          ['obsidian', 'air', 'air', 'air', 'air', 'air', 'obsidian']
        ]
      },
      {
        level: 8,
        name: 'L8: Obsidian Portal Cap',
        grid: [
          ['obsidian', 'obsidian', 'obsidian', 'obsidian', 'obsidian', 'obsidian', 'obsidian'],
          ['obsidian', 'slab', 'slab', 'slab', 'slab', 'slab', 'obsidian'],
          ['obsidian', 'slab', 'slab', 'slab', 'slab', 'slab', 'obsidian'],
          ['obsidian', 'slab', 'slab', 'slab', 'slab', 'slab', 'obsidian'],
          ['obsidian', 'slab', 'slab', 'slab', 'slab', 'slab', 'obsidian'],
          ['obsidian', 'slab', 'slab', 'slab', 'slab', 'slab', 'obsidian'],
          ['obsidian', 'obsidian', 'obsidian', 'obsidian', 'obsidian', 'obsidian', 'obsidian']
        ]
      }
    ],
    simulation: {
      duration: 10000,
      yieldRateText: '~680 Gold Ingots / Hr',
      stages: [
        {
          id: 'portal_spawn',
          label: 'Stage 1: Nether Portal Tick',
          icon: '🔮',
          start: 0,
          end: 2200,
          detail: 'Rapid portal block updates trigger continuous Zombified Piglin generation onto the platform.',
          statusBanner: 'NETHER PORTAL TICK: ZOMBIFIED PIGLIN SPAWNED'
        },
        {
          id: 'trapdoor_plunge',
          label: 'Stage 2: Trapdoor Pathfinding',
          icon: '🪵',
          start: 2200,
          end: 4400,
          detail: 'Piglins treat open trapdoors as full walkable blocks and sprint forward into the center chute.',
          statusBanner: 'PIGLINS PATHFINDING ACROSS TRAPDOORS INTO CHUTE'
        },
        {
          id: 'fall_softening',
          label: 'Stage 3: 22-Block Gravity Softening',
          icon: '🕳️',
          start: 4400,
          end: 6400,
          detail: 'Gravity chute drop strips Piglin health down to half a heart for instant finishing.',
          statusBanner: 'FALL DAMAGE APPLIED: SOFTENED TO HALF-HEART'
        },
        {
          id: 'looting_strike',
          label: 'Stage 4: Sweeping Blade Neutralization',
          icon: '⚔️',
          start: 6400,
          end: 8000,
          detail: 'Entity crusher or sweeping blade defeats softened piglins, yielding gold nuggets, ingots, and XP.',
          statusBanner: 'PIGLINS HARVESTED: EXP & GOLD DROPS EMITTED'
        },
        {
          id: 'hopper_funnel',
          label: 'Stage 5: Hopper Collection',
          icon: '📥',
          start: 8000,
          end: 9200,
          detail: 'High-speed hoppers below slabs filter gold nuggets, golden swords, and ingots into the sorter.',
          statusBanner: 'HOPPERS COLLECTING GOLD DROPS'
        },
        {
          id: 'vault_store',
          label: 'Stage 6: Gold Vault Deposit',
          icon: '🪙',
          start: 9200,
          end: 10000,
          detail: 'Hoppers store 100% pure gold harvest directly into double vault chests.',
          statusBanner: '✓ CYCLE COMPLETE: +8 GOLD NUGGETS, +1 GOLD INGOT STORED',
          storedItemsText: '+8 Gold Nuggets, +1 Gold Ingot, +2 Rotten Flesh'
        }
      ],
      entities: [
        {
          id: 'piglin_1',
          type: 'zombie',
          name: 'Zombified Piglin',
          icon: '🐷',
          position: { x: 3, y: 4.2, z: 1 },
          spawnTime: 0,
          despawnTime: 6400,
          damageStartTime: 5200,
          path: [
            { time: 0, x: 5.0, y: 4.5, z: 2.0 },
            { time: 2200, x: 3.5, y: 4.5, z: 2.5 },
            { time: 4400, x: 3.0, y: 3.5, z: 3.0 },
            { time: 5400, x: 3.0, y: 1.5, z: 3.0 },
            { time: 6400, x: 3.0, y: 1.2, z: 3.0 }
          ]
        },
        {
          id: 'gold_ingot_drop',
          type: 'gold_block',
          name: 'Gold Ingot',
          icon: '🪙',
          spawnTime: 6400,
          despawnTime: 9500,
          path: [
            { time: 6400, x: 3.0, y: 1.2, z: 3.0 },
            { time: 7400, x: 3.0, y: 0.8, z: 2.5 },
            { time: 8400, x: 2.5, y: 0.3, z: 2.2 },
            { time: 9500, x: 1.5, y: 0.3, z: 2.2 }
          ]
        }
      ]
    }
  },

  medieval_tower: {
    type: 'build',
    title: 'Medieval Watchtower Blueprint',
    edition: 'Any Edition',
    dimensions: { width: 5, length: 5, height: 10 },
    materials: [
      { id: 'stone_bricks', name: 'Stone Bricks', quantity: 128, icon: '🧱' },
      { id: 'cobblestone', name: 'Cobblestone', quantity: 64, icon: '🪨' },
      { id: 'oak_logs', name: 'Oak Logs', quantity: 32, icon: '🪵' },
      { id: 'oak_planks', name: 'Spruce / Oak Planks', quantity: 32, icon: '🪵' },
      { id: 'stair', name: 'Stone Brick Stairs', quantity: 24, icon: '🪜' },
      { id: 'slab', name: 'Stone Slabs', quantity: 16, icon: '➖' },
      { id: 'torch', name: 'Wall Torches', quantity: 8, icon: '🕯️' },
      { id: 'door', name: 'Arched Door', quantity: 1, icon: '🚪' }
    ],
    steps: [
      { number: 1, title: 'Cobblestone Ring Foundation', description: 'Lay a solid 5x5 cobblestone foundation with interior earthen floor.', layer: 1 },
      { number: 2, title: 'Corner Oak Pillars & Entry', description: 'Raise 4 corner oak logs and stone brick walls with arched doorway.', layer: 2 },
      { number: 3, title: 'Lower Arrow Slit Apertures', description: 'Build stone brick walls with 1-block central arrow slits on all faces.', layer: 3 },
      { number: 4, title: 'Mid-Level Sentry Floor', description: 'Lay spruce plank deck with ladder opening and equipment cache.', layer: 4 },
      { number: 5, title: 'Upper Sentry Chamber', description: 'Raise upper stone walls with defensive window gaps.', layer: 5 },
      { number: 6, title: 'Overhanging Machicolations', description: 'Stair-step inverted stone brick stairs 1 block out from perimeter.', layer: 6 },
      { number: 7, title: 'Crenellated Parapet Battlements', description: 'Place alternating stone brick blocks and torches for 360-degree archer cover.', layer: 7 }
    ],
    layers: [
      {
        level: 1,
        name: 'L1: Cobblestone Base',
        grid: [
          ['cobble', 'cobble', 'cobble', 'cobble', 'cobble'],
          ['cobble', 'cobble', 'cobble', 'cobble', 'cobble'],
          ['cobble', 'cobble', 'cobble', 'cobble', 'cobble'],
          ['cobble', 'cobble', 'cobble', 'cobble', 'cobble'],
          ['cobble', 'cobble', 'cobble', 'cobble', 'cobble']
        ]
      },
      {
        level: 2,
        name: 'L2: Entrance & Corner Pillars',
        grid: [
          ['log', 'stone', 'stone', 'stone', 'log'],
          ['stone', 'air', 'air', 'air', 'stone'],
          ['stone', 'air', 'air', 'air', 'stone'],
          ['stone', 'air', 'air', 'air', 'stone'],
          ['log', 'stone', 'door', 'stone', 'log']
        ]
      },
      {
        level: 3,
        name: 'L3: Lower Arrow Slits',
        grid: [
          ['log', 'stone', 'air', 'stone', 'log'],
          ['stone', 'air', 'air', 'air', 'stone'],
          ['air', 'air', 'ladder', 'air', 'air'],
          ['stone', 'air', 'air', 'air', 'stone'],
          ['log', 'stone', 'air', 'stone', 'log']
        ]
      },
      {
        level: 4,
        name: 'L4: Sentry Deck Floor',
        grid: [
          ['log', 'plank', 'plank', 'plank', 'log'],
          ['plank', 'plank', 'plank', 'plank', 'plank'],
          ['plank', 'plank', 'air', 'plank', 'plank'],
          ['plank', 'plank', 'plank', 'plank', 'plank'],
          ['log', 'plank', 'plank', 'plank', 'log']
        ]
      },
      {
        level: 5,
        name: 'L5: Upper Watch Deck',
        grid: [
          ['stone', 'stone', 'air', 'stone', 'stone'],
          ['stone', 'torch', 'air', 'torch', 'stone'],
          ['air', 'air', 'air', 'air', 'air'],
          ['stone', 'torch', 'air', 'torch', 'stone'],
          ['stone', 'stone', 'air', 'stone', 'stone']
        ]
      },
      {
        level: 6,
        name: 'L6: Overhanging Machicolations',
        grid: [
          ['stair', 'stair', 'stair', 'stair', 'stair'],
          ['stair', 'stone', 'stone', 'stone', 'stair'],
          ['stair', 'stone', 'air', 'stone', 'stair'],
          ['stair', 'stone', 'stone', 'stone', 'stair'],
          ['stair', 'stair', 'stair', 'stair', 'stair']
        ]
      },
      {
        level: 7,
        name: 'L7: Parapet Battlements',
        grid: [
          ['stone', 'air', 'stone', 'air', 'stone'],
          ['air', 'air', 'air', 'air', 'air'],
          ['stone', 'air', 'torch', 'air', 'stone'],
          ['air', 'air', 'air', 'air', 'air'],
          ['stone', 'air', 'stone', 'air', 'stone']
        ]
      }
    ],
    simulation: {
      duration: 8000,
      yieldRateText: '360° Sentry Defense Radius',
      stages: [
        {
          id: 'ground_scan',
          label: 'Stage 1: Ground Perimeter Watch',
          icon: '🛡️',
          start: 0,
          end: 2000,
          detail: 'Sentry monitors surrounding valley from reinforced ground entrance.',
          statusBanner: 'GROUND PERIMETER SECURED'
        },
        {
          id: 'hostile_spotted',
          label: 'Stage 2: Hostile Mob Sighting',
          icon: '👀',
          start: 2000,
          end: 4000,
          detail: 'Outpost watch detects hostile pillager scout party approaching the frontier.',
          statusBanner: 'HOSTILE SCOUTS DETECTED: ELEVATING TO SENTRY DECK'
        },
        {
          id: 'arrow_slit_volley',
          label: 'Stage 3: Arrow Slit Defense Volley',
          icon: '🏹',
          start: 4000,
          end: 6000,
          detail: 'Archers utilize narrow 1-block arrow slits for total cover while returning fire.',
          statusBanner: 'ARROW SLIT VOLLEY ENGAGED: ZERO SENTRY EXPOSURE'
        },
        {
          id: 'battlements_clear',
          label: 'Stage 4: Battlements Crown All-Clear',
          icon: '🏰',
          start: 6000,
          end: 8000,
          detail: 'Frontier secured from overhanging crown machicolations. Watchtower rotation complete.',
          statusBanner: '✓ TOWER DEFENSE CYCLE COMPLETE: PERIMETER RESTORED'
        }
      ]
    }
  },

  iron_farm: {
    type: 'build',
    title: 'Compact Iron Golem Farm',
    edition: 'Java & Bedrock 1.20+',
    dimensions: { width: 7, length: 7, height: 8 },
    materials: [
      { id: 'stone_bricks', name: 'Stone Bricks', quantity: 64, icon: '🧱' },
      { id: 'beds', name: 'Beds', quantity: 3, icon: '🛏️' },
      { id: 'villagers', name: 'Villagers', quantity: 3, icon: '👨‍🌾' },
      { id: 'water', name: 'Water Buckets', quantity: 2, icon: '💧' },
      { id: 'lava', name: 'Lava Bucket', quantity: 1, icon: '🔥' },
      { id: 'hopper', name: 'Hoppers', quantity: 3, icon: '📥' },
      { id: 'chest', name: 'Double Chest', quantity: 2, icon: '📦' },
      { id: 'signs', name: 'Oak Signs', quantity: 3, icon: '🪧' },
      { id: 'glass', name: 'Glass Blocks', quantity: 24, icon: '🔲' },
      { id: 'zombie', name: 'Nametagged Zombie', quantity: 1, icon: '🧟' }
    ],
    steps: [
      { number: 1, title: 'Ground Collection Vault', description: 'Dig a 3x3 pit, place double chest and connect 3 hoppers leading into it.', layer: 1 },
      { number: 2, title: 'Kill Chamber Base', description: 'Surround the hoppers with stone bricks and place 3 signs to hold the lava float.', layer: 2 },
      { number: 3, title: 'Lava Blade & Sign Placement', description: 'Pour lava directly above the signs. Golems take head damage while drops fall safe.', layer: 3 },
      { number: 4, title: 'Spawning Platform Walls', description: 'Erect 3-block high glass containment walls around the 7x7 perimeter.', layer: 4 },
      { number: 5, title: 'Villager Sleep Quarters', description: 'Construct isolated 3-bed chamber with trapdoor sightlines towards the center.', layer: 5 },
      { number: 6, title: 'Zombie Scare Pod', description: 'Place a boat or cauldron holding 1 named hostile zombie to trigger panic spawning.', layer: 6 },
      { number: 7, title: 'Water Flow Streams', description: 'Place water sources in opposing corners to funnel all spawned golems into the center chute.', layer: 7 },
      { number: 8, title: 'Roof Slab Shielding', description: 'Cover entire farm top with stone slabs to prevent lightning strikes from turning villagers into witches.', layer: 8 }
    ],
    layers: [
      {
        level: 1,
        name: 'L1: Collection & Storage',
        grid: [
          ['stone', 'stone', 'stone', 'stone', 'stone'],
          ['stone', 'chest', 'hopper', 'hopper', 'stone'],
          ['stone', 'chest', 'hopper', 'air', 'stone'],
          ['stone', 'stone', 'stone', 'stone', 'stone']
        ]
      },
      {
        level: 2,
        name: 'L2: Chute & Sign Base',
        grid: [
          ['stone', 'stone', 'stone', 'stone', 'stone'],
          ['stone', 'glass', 'sign', 'glass', 'stone'],
          ['stone', 'glass', 'sign', 'glass', 'stone'],
          ['stone', 'stone', 'stone', 'stone', 'stone']
        ]
      },
      {
        level: 3,
        name: 'L3: Lava Blade',
        grid: [
          ['stone', 'stone', 'stone', 'stone', 'stone'],
          ['stone', 'glass', 'lava', 'glass', 'stone'],
          ['stone', 'glass', 'glass', 'glass', 'stone'],
          ['stone', 'stone', 'stone', 'stone', 'stone']
        ]
      },
      {
        level: 4,
        name: 'L4: Water Flow Stream',
        grid: [
          ['stone', 'water', 'water', 'water', 'stone'],
          ['water', 'water', 'hole', 'water', 'water'],
          ['water', 'water', 'hole', 'water', 'water'],
          ['stone', 'water', 'water', 'water', 'stone']
        ]
      },
      {
        level: 5,
        name: 'L5: Villager Chamber',
        grid: [
          ['wall', 'bed', 'bed', 'bed', 'wall'],
          ['wall', 'villager', 'villager', 'villager', 'wall'],
          ['wall', 'glass', 'air', 'glass', 'wall'],
          ['wall', 'wall', 'wall', 'wall', 'wall']
        ]
      },
      {
        level: 6,
        name: 'L6: Zombie Threat Pod',
        grid: [
          ['air', 'air', 'air', 'air', 'air'],
          ['air', 'glass', 'zombie', 'glass', 'air'],
          ['air', 'glass', 'boat', 'glass', 'air'],
          ['air', 'air', 'air', 'air', 'air']
        ]
      },
      {
        level: 7,
        name: 'L7: Roof Slab Protection',
        grid: [
          ['slab', 'slab', 'slab', 'slab', 'slab'],
          ['slab', 'slab', 'slab', 'slab', 'slab'],
          ['slab', 'slab', 'slab', 'slab', 'slab'],
          ['slab', 'slab', 'slab', 'slab', 'slab']
        ]
      }
    ],
    simulation: {
      duration: 10000,
      yieldRateText: '~330 Iron Ingots / Hr',
      stages: [
        {
          id: 'villager_panic',
          label: 'Stage 1: Villagers Panic',
          icon: '👨‍🌾',
          start: 0,
          end: 1800,
          detail: 'Villagers detect the hostile zombie line-of-sight and gossip in high distress, meeting the village panic threshold.',
          statusBanner: 'VILLAGERS PANIC: HOSTILE DETECTED'
        },
        {
          id: 'golem_spawn',
          label: 'Stage 2: Iron Golem Spawns',
          icon: '🤖',
          start: 1800,
          end: 3600,
          detail: 'Distress gossip triggers the village defense mechanism: 1 Iron Golem spawns on the upper spawning deck.',
          statusBanner: 'IRON GOLEM SPAWNED ON UPPER DECK'
        },
        {
          id: 'water_funnel',
          label: 'Stage 3: Water Funneling',
          icon: '🌊',
          start: 3600,
          end: 5800,
          detail: 'Corner water currents push the heavy Golem across the platform and into the central collection chute.',
          statusBanner: 'WATER CURRENTS FUNNELING GOLEM TO CHUTE',
          activeWater: true
        },
        {
          id: 'lava_blade',
          label: 'Stage 4: Chute Drop & Lava Blade',
          icon: '🔥',
          start: 5800,
          end: 7600,
          detail: 'Golem plunges 2 blocks down into suspended lava. Head takes fire damage while drops remain safe below.',
          statusBanner: 'LAVA BLADE ENGAGED: HEAD DAMAGE',
          activeLava: true
        },
        {
          id: 'hopper_collection',
          label: 'Stage 5: Hopper Collection',
          icon: '📥',
          start: 7600,
          end: 9000,
          detail: 'The Golem disintegrates into Iron Ingots and Poppies, falling safely through signs into collection hoppers.',
          statusBanner: 'HOPPERS COLLECTING DROPS',
          activeHopper: { x: 2, y: 0, z: 1 }
        },
        {
          id: 'vault_storage',
          label: 'Stage 6: Vault Storage',
          icon: '📦',
          start: 9000,
          end: 10000,
          detail: 'Hoppers deposit the harvest into the double chest. Farm is primed for the next spawn cycle.',
          statusBanner: '✓ CYCLE COMPLETE: +4 IRON INGOTS STORED',
          activeChest: { x: 1, y: 0, z: 1 },
          storedItemsText: '+4 Iron Ingots, +1 Poppy'
        }
      ],
      entities: [
        {
          id: 'villager_1',
          type: 'villager',
          name: 'Farmer Villager',
          icon: '👨‍🌾',
          position: { x: 1, y: 4.2, z: 1 },
          alertStartTime: 0,
          alertEndTime: 3600
        },
        {
          id: 'villager_2',
          type: 'villager',
          name: 'Fletcher Villager',
          icon: '👨‍🌾',
          position: { x: 2, y: 4.2, z: 1 },
          alertStartTime: 0,
          alertEndTime: 3600
        },
        {
          id: 'villager_3',
          type: 'villager',
          name: 'Librarian Villager',
          icon: '👨‍🌾',
          position: { x: 3, y: 4.2, z: 1 },
          alertStartTime: 0,
          alertEndTime: 3600
        },
        {
          id: 'zombie_1',
          type: 'zombie',
          name: 'Nametagged Threat',
          icon: '🧟',
          position: { x: 2, y: 5.2, z: 2 }
        },
        {
          id: 'golem_1',
          type: 'iron_golem',
          name: 'Iron Golem',
          icon: '🤖',
          spawnTime: 1800,
          despawnTime: 7600,
          damageStartTime: 6400,
          path: [
            { time: 1800, x: 3.2, y: 3.5, z: 0.8 },
            { time: 3600, x: 3.2, y: 3.5, z: 0.8 },
            { time: 4800, x: 2.6, y: 3.5, z: 1.4 },
            { time: 5800, x: 2.0, y: 3.5, z: 1.6 },
            { time: 6400, x: 2.0, y: 2.2, z: 1.6 },
            { time: 7600, x: 2.0, y: 1.6, z: 1.6 }
          ]
        },
        {
          id: 'ingot_drop_1',
          type: 'iron_ingot',
          name: 'Iron Ingot',
          icon: '◽',
          spawnTime: 7600,
          despawnTime: 9500,
          path: [
            { time: 7600, x: 2.0, y: 1.6, z: 1.6 },
            { time: 8200, x: 2.0, y: 0.8, z: 1.4 },
            { time: 8900, x: 2.0, y: 0.3, z: 1.1 },
            { time: 9500, x: 1.2, y: 0.3, z: 1.1 }
          ]
        },
        {
          id: 'ingot_drop_2',
          type: 'iron_ingot',
          name: 'Iron Ingot',
          icon: '◽',
          spawnTime: 7700,
          despawnTime: 9600,
          path: [
            { time: 7700, x: 2.1, y: 1.5, z: 1.7 },
            { time: 8300, x: 2.0, y: 0.8, z: 1.4 },
            { time: 9000, x: 2.0, y: 0.3, z: 1.1 },
            { time: 9600, x: 1.2, y: 0.3, z: 1.1 }
          ]
        },
        {
          id: 'poppy_drop',
          type: 'poppy',
          name: 'Poppy',
          icon: '🌹',
          spawnTime: 7800,
          despawnTime: 9700,
          path: [
            { time: 7800, x: 1.9, y: 1.6, z: 1.5 },
            { time: 8400, x: 2.0, y: 0.8, z: 1.4 },
            { time: 9100, x: 2.0, y: 0.3, z: 1.1 },
            { time: 9700, x: 1.2, y: 0.3, z: 1.1 }
          ]
        }
      ]
    }
  },

  starter_house: {
    type: 'build',
    title: 'Cozy Oak & Stone Starter Cottage',
    edition: 'Any Edition',
    dimensions: { width: 7, length: 9, height: 6 },
    materials: [
      { id: 'oak_logs', name: 'Oak Logs', quantity: 32, icon: '🪵' },
      { id: 'cobblestone', name: 'Cobblestone', quantity: 64, icon: '🪨' },
      { id: 'oak_planks', name: 'Oak Planks', quantity: 96, icon: '🪵' },
      { id: 'glass_panes', name: 'Glass Panes', quantity: 16, icon: '🔲' },
      { id: 'oak_door', name: 'Oak Door', quantity: 1, icon: '🚪' },
      { id: 'torches', name: 'Torches', quantity: 12, icon: '🕯️' },
      { id: 'bed', name: 'Red Bed', quantity: 1, icon: '🛏️' },
      { id: 'crafting_table', name: 'Crafting Table', quantity: 1, icon: '🪑' },
      { id: 'furnace', name: 'Furnace', quantity: 2, icon: '🔥' }
    ],
    steps: [
      { number: 1, title: 'Corner Pillar Foundation', description: 'Place 4-block high oak logs at each corner of the 7x9 footprint.', layer: 1 },
      { number: 2, title: 'Cobblestone Floor', description: 'Fill the foundation perimeter and interior floor with cobblestone.', layer: 1 },
      { number: 3, title: 'Plank Walls & Windows', description: 'Raise oak plank walls to 3 blocks high, leaving 2x1 window gaps.', layer: 2 },
      { number: 4, title: 'Front Entrance & Door', description: 'Install oak door facing outward and fit glass panes into window frames.', layer: 2 },
      { number: 5, title: 'A-Frame Cobblestone Roof', description: 'Stair-step cobblestone stairs along the short sides to create an A-frame gable.', layer: 4 },
      { number: 6, title: 'Interior Furniture Layout', description: 'Place bed against rear wall, with dual furnaces, crafting table, and double chest.', layer: 2 }
    ],
    layers: [
      {
        level: 1,
        name: 'L1: Floor Foundation',
        grid: [
          ['log', 'cobble', 'cobble', 'cobble', 'cobble', 'cobble', 'log'],
          ['cobble', 'wood', 'wood', 'wood', 'wood', 'wood', 'cobble'],
          ['cobble', 'wood', 'wood', 'wood', 'wood', 'wood', 'cobble'],
          ['cobble', 'wood', 'wood', 'wood', 'wood', 'wood', 'cobble'],
          ['log', 'cobble', 'door', 'cobble', 'cobble', 'cobble', 'log']
        ]
      },
      {
        level: 2,
        name: 'L2: Living Quarters',
        grid: [
          ['log', 'plank', 'bed', 'chest', 'furnace', 'plank', 'log'],
          ['plank', 'air', 'air', 'air', 'air', 'crafting', 'plank'],
          ['glass', 'air', 'air', 'air', 'air', 'air', 'glass'],
          ['plank', 'air', 'air', 'air', 'air', 'air', 'plank'],
          ['log', 'plank', 'door', 'plank', 'plank', 'plank', 'log']
        ]
      },
      {
        level: 3,
        name: 'L3: Upper Wall Trim',
        grid: [
          ['log', 'plank', 'plank', 'plank', 'plank', 'plank', 'log'],
          ['plank', 'torch', 'air', 'air', 'air', 'torch', 'plank'],
          ['plank', 'air', 'air', 'air', 'air', 'air', 'plank'],
          ['plank', 'torch', 'air', 'air', 'air', 'torch', 'plank'],
          ['log', 'plank', 'plank', 'plank', 'plank', 'plank', 'log']
        ]
      },
      {
        level: 4,
        name: 'L4: Roof Pitch',
        grid: [
          ['stair', 'stair', 'stair', 'stair', 'stair', 'stair', 'stair'],
          ['air', 'stair', 'stair', 'stair', 'stair', 'stair', 'air'],
          ['air', 'air', 'slab', 'slab', 'slab', 'air', 'air']
        ]
      }
    ],
    simulation: {
      stages: [
        { id: 'foundation', label: '1. Foundation Laid', icon: '🪨', detail: 'Solid cobblestone perimeter resists mob entry.' },
        { id: 'framing', label: '2. Timber Framing', icon: '🪵', detail: 'Sturdy oak pillars create architectural depth.' },
        { id: 'enclosure', label: '3. Enclosed Space', icon: '🚪', detail: 'Sealed windows and door eliminate creeper line-of-sight.' },
        { id: 'lighting', label: '4. Light Level 14', icon: '🕯️', detail: 'Torches guarantee zero hostile mob spawns inside.' }
      ]
    }
  },

  piston_door: {
    type: 'redstone',
    title: 'Flush 2x2 Sticky Piston Door',
    subtitle: 'Classic seamless hidden entrance mechanism',
    components: [
      { id: 'sticky_piston', name: 'Sticky Pistons', count: 4, icon: '🟩' },
      { id: 'redstone_dust', name: 'Redstone Dust', count: 12, icon: '🔴' },
      { id: 'redstone_torch', name: 'Redstone Torches', count: 2, icon: '🕯️' },
      { id: 'repeater', name: 'Repeater (1-tick)', count: 2, icon: '⏱️' },
      { id: 'lever', name: 'Input Lever / Pressure Plates', count: 2, icon: '🕹️' }
    ],
    circuit: {
      inputNode: { id: 'lever', label: 'Lever Input', activeLabel: 'Powered (HIGH)', inactiveLabel: 'Unpowered (LOW)' },
      nodes: [
        { id: 'inverter', label: 'Torch Inverter', type: 'inverter', desc: 'Inverts signal so door stays closed by default' },
        { id: 'wire_left', label: 'Left Feed Line', type: 'wire', delay: 1 },
        { id: 'wire_right', label: 'Right Feed Line', type: 'wire', delay: 1 },
        { id: 'pistons_left', label: 'Left Pistons (2x)', type: 'piston', state: 'extended' },
        { id: 'pistons_right', label: 'Right Pistons (2x)', type: 'piston', state: 'extended' },
        { id: 'door_blocks', label: 'Doorway', type: 'doorway', state: 'closed' }
      ]
    },
    timingSteps: [
      '1. Lever activates -> Sends signal down into underfloor wiring.',
      '2. Signal powers block under redstone torch -> Torch turns OFF (inversion).',
      '3. Both piston pairs depower simultaneously.',
      '4. Pistons retract 1 block -> 2x2 stone blocks pull back into wall cavity.',
      '5. Walkway is completely open and safe to pass!'
    ]
  },

  ender_dragon: {
    type: 'survival',
    title: 'Ender Dragon Triumph Progression',
    subtitle: 'Step-by-step roadmap from overworld prep to dragon kill',
    stages: [
      { id: 'overworld', title: '1. Overworld Armory', desc: 'Craft full diamond set, diamond sword (Sharpness IV), and Power V bow.', completed: true },
      { id: 'nether', title: '2. Nether Incursion', desc: 'Raid Nether Fortress for 8+ Blaze Rods; barter with Piglins for 16+ Ender Pearls.', completed: true },
      { id: 'eyes', title: '3. Eyes of Ender', desc: 'Craft 14 Eyes of Ender and throw them to locate nearest Stronghold portal room.', completed: true },
      { id: 'stronghold', title: '4. Stronghold Navigation', desc: 'Locate portal room, light 12 frames, and establish forward spawn bed outside.', completed: false },
      { id: 'the_end', title: '5. End Arrival', desc: 'Pillar up obsidian towers with water buckets to explode all End Crystals.', completed: false },
      { id: 'perch_fight', title: '6. Perch Execution', desc: 'Wait for dragon to perch on bedrock fountain; strike head with beds or crits.', completed: false }
    ],
    checklist: [
      { id: 'armor', label: 'Full Diamond Armor (Protection IV)', required: true, checked: true },
      { id: 'bow', label: 'Bow with Infinity + Power IV/V', required: true, checked: true },
      { id: 'water', label: '2x Water Buckets (MLG fall cushion)', required: true, checked: true },
      { id: 'pearls', label: '16x Ender Pearls (escape void)', required: true, checked: true },
      { id: 'potions', label: '3x Slow Falling Potions (vital)', required: true, checked: false },
      { id: 'golden_apples', label: '8x Golden Apples / Totems', required: false, checked: false },
      { id: 'blocks', label: '4x Stacks of Cobblestone (pillaring)', required: true, checked: true },
      { id: 'beds', label: '6x Wool Beds (speedrun explosion strategy)', required: false, checked: false }
    ]
  },

  custom_sword: {
    type: 'create',
    title: 'Fabric/NeoForge Custom Sword Mod',
    subtitle: 'Technical architecture, file tree, and registration guide',
    architecture: [
      { title: 'Mod Entrypoint', desc: 'Initializes mod ID "craftmind" and registers custom Creative Tab.' },
      { title: 'Deferred Register', desc: 'Holds deferred registry for Items and Blocks via Registries.ITEM.' },
      { title: 'Custom Sword Item', desc: 'Extends SwordItem with custom ToolMaterial (Ruby/Amethyst tier).' },
      { title: 'Item Properties', desc: 'Configures attack damage (+8.5), attack speed (-2.4), and durability (1800).' },
      { title: 'Asset Models & Textures', desc: 'JSON item model inheriting from "item/handheld" linked to 16x16 PNG texture.' },
      { title: 'Crafting Recipe', desc: 'Datapack shaped recipe requiring 2x custom gems + 1x blaze rod.' }
    ],
    fileTree: [
      { name: 'src/main/java/com/craftmind/', type: 'dir', children: [
        { name: 'CraftMindMod.java', type: 'file', desc: 'Main mod initializer & registry calls' },
        { name: 'item/', type: 'dir', children: [
          { name: 'ModItems.java', type: 'file', desc: 'Registers RUBY_SWORD with Item.Settings' },
          { name: 'RubySwordItem.java', type: 'file', desc: 'Custom ability triggers on hit' }
        ]}
      ]},
      { name: 'src/main/resources/', type: 'dir', children: [
        { name: 'assets/craftmind/', type: 'dir', children: [
          { name: 'models/item/ruby_sword.json', type: 'file', desc: 'Parent: item/handheld' },
          { name: 'textures/item/ruby_sword.png', type: 'file', desc: '16x16 pixel sprite' },
          { name: 'lang/en_us.json', type: 'file', desc: '{"item.craftmind.ruby_sword": "Ruby Blade"}' }
        ]},
        { name: 'data/craftmind/recipes/', type: 'dir', children: [
          { name: 'ruby_sword.json', type: 'file', desc: 'Shaped crafting recipe specification' }
        ]},
        { name: 'fabric.mod.json', type: 'file', desc: 'Mod metadata, version, and dependencies' }
      ]}
    ],
    commandSnippet: {
      title: 'Quick Command Equivalent (Vanilla)',
      command: '/give @p diamond_sword[custom_name=\'{"text":"Ruby Blade","color":"red"}\',attribute_modifiers=[{type:"generic.attack_damage",amount:9,slot:"mainhand",operation:"add_value"}]] 1'
    }
  }
};

/**
 * Parses assistant message and returns structured visualization object if appropriate.
 */
export function parseVisualizationData(messageContent, userPrompt = '', activeMode = 'BUILD') {
  if (!messageContent) return null;

  // 1. Check for explicit JSON block tagged craftmind-viz
  const vizBlockRegex = /```(?:craftmind-viz|json:viz)\s*([\s\S]*?)```/;
  const match = messageContent.match(vizBlockRegex);
  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed && parsed.type) {
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse craftmind-viz json block:', e);
    }
  }

  // 2. Keyword & semantic matching for dedicated canonical blueprints
  const combined = (userPrompt + ' ' + messageContent).toLowerCase();

  // BUILD: Gold Farm (Zombie Piglin Nether Portal Farm)
  if (
    combined.includes('gold farm') ||
    combined.includes('piglin farm') ||
    (combined.includes('zombie piglin') && combined.includes('farm')) ||
    (combined.includes('gold') && combined.includes('farm') && !combined.includes('iron'))
  ) {
    return CANONICAL_TEMPLATES.gold_farm;
  }

  // BUILD: Iron Farm
  if (combined.includes('iron farm') || (combined.includes('golem') && combined.includes('farm'))) {
    return CANONICAL_TEMPLATES.iron_farm;
  }

  // BUILD: Medieval Tower / Watchtower
  if (
    combined.includes('medieval tower') ||
    combined.includes('watchtower') ||
    (combined.includes('tower') && (combined.includes('medieval') || combined.includes('stone') || combined.includes('sentry')))
  ) {
    return CANONICAL_TEMPLATES.medieval_tower;
  }

  // BUILD: Starter House / Cottage / Base
  if (
    combined.includes('starter house') ||
    combined.includes('starter base') ||
    combined.includes('starter cottage') ||
    combined.includes('cozy cottage') ||
    combined.includes('simple house')
  ) {
    return CANONICAL_TEMPLATES.starter_house;
  }

  // REDSTONE: Piston Door / Doorway
  if (
    combined.includes('piston door') ||
    combined.includes('2x2 door') ||
    combined.includes('flush door') ||
    combined.includes('hidden door') ||
    (activeMode === 'REDSTONE' && combined.includes('door'))
  ) {
    return CANONICAL_TEMPLATES.piston_door;
  }

  // SURVIVAL: Ender dragon / Nether
  if (
    combined.includes('ender dragon') ||
    combined.includes('dragon fight') ||
    combined.includes('beat the dragon') ||
    combined.includes('the end crystals') ||
    (activeMode === 'SURVIVAL' && (combined.includes('dragon') || combined.includes('boss')))
  ) {
    return CANONICAL_TEMPLATES.ender_dragon;
  }

  // CREATE: Mod / Datapack / Custom Sword
  if (
    combined.includes('sword mod') ||
    combined.includes('custom sword') ||
    combined.includes('custom item') ||
    (activeMode === 'CREATE' && (combined.includes('sword') || combined.includes('item')))
  ) {
    return CANONICAL_TEMPLATES.custom_sword;
  }

  // STRICT REQUIREMENT: If the response has no valid BuildModel, return null.
  // NEVER substitute sample, demo, or unrelated blueprints (e.g. Medieval Watchtower for Gold Farm).
  return null;
}
