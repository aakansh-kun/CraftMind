import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';

export default function ChatMessage({ message, onOpenVisualizer }) {
  const isAssistant = message.role === 'assistant';
  const metadata = message.metadata;
  const viz = message.visualization;

  // Strip craftmind-viz / json:viz code block so user only sees clean Markdown in chat
  const displayContent = isAssistant && message.content
    ? message.content.replace(/```(?:craftmind-viz|json:viz)\s*[\s\S]*?```/g, '').trim()
    : message.content;

  return (
    <div
      className={`chat-row ${isAssistant ? 'row-assistant' : 'row-user'}`}
      data-testid={isAssistant ? 'assistant-message' : undefined}
    >
      <div className={`message-bubble ${isAssistant ? 'bubble-assistant' : 'bubble-user'}`}>
        {/* Assistant Header */}
        {isAssistant && (
          <div className="assistant-badge-row">
            <div className="assistant-avatar">⛏️</div>
            <span className="assistant-title">CraftMind</span>
            {metadata && (
              <span
                data-testid="meta-source"
                className={`meta-source-pill ${metadata.resolution_source === 'LLM_CACHE' ? 'pill-cache' : 'pill-live'}`}
              >
                {metadata.resolution_source}
              </span>
            )}
          </div>
        )}

        {/* Message Content */}
        <div className="message-text">
          {isAssistant ? (
            <MarkdownRenderer content={displayContent} />
          ) : (
            <div className="user-plain-text">{message.content}</div>
          )}
        </div>

        {/* Contextual Visualizer Action Buttons */}
        {isAssistant && viz && (
          <div className="contextual-action-bar">
            {viz.type === 'build' && (
              <>
                <button
                  type="button"
                  className="ctx-btn primary"
                  onClick={() => onOpenVisualizer(viz, 'blueprint')}
                >
                  📐 OPEN BLUEPRINT
                </button>
                <button
                  type="button"
                  className="ctx-btn"
                  onClick={() => onOpenVisualizer(viz, 'layers')}
                >
                  🧱 VIEW LAYERS ({viz.layers?.length || 0})
                </button>
                <button
                  type="button"
                  className="ctx-btn secondary"
                  onClick={() => onOpenVisualizer(viz, 'simulate')}
                >
                  ▶ SIMULATE BUILD
                </button>
              </>
            )}

            {viz.type === 'redstone' && (
              <button
                type="button"
                className="ctx-btn primary"
                onClick={() => onOpenVisualizer(viz)}
              >
                ⚡ TEST CIRCUIT INTERACTIVELY
              </button>
            )}

            {viz.type === 'survival' && (
              <button
                type="button"
                className="ctx-btn primary"
                onClick={() => onOpenVisualizer(viz)}
              >
                🗡️ VIEW EXPEDITION ROADMAP
              </button>
            )}

            {viz.type === 'create' && (
              <button
                type="button"
                className="ctx-btn primary"
                onClick={() => onOpenVisualizer(viz)}
              >
                ⚙️ INSPECT MOD ARCHITECTURE
              </button>
            )}
          </div>
        )}

        {/* Required Metadata HUD */}
        {isAssistant && metadata && (
          <div className="message-meta-hud">
            <span className="meta-hud-item">
              <span className="meta-label">Model:</span>
              <strong data-testid="meta-model">{metadata.model}</strong>
            </span>

            <span className="meta-hud-item">
              <span className="meta-label">Latency:</span>
              <strong data-testid="meta-latency">{metadata.latency_ms} ms</strong>
            </span>

            <span className="meta-hud-item">
              <span className="meta-label">Input Tokens:</span>
              <strong data-testid="meta-input-tokens">{metadata.input_tokens}</strong>
            </span>

            <span className="meta-hud-item">
              <span className="meta-label">Output Tokens:</span>
              <strong data-testid="meta-output-tokens">{metadata.output_tokens}</strong>
            </span>

            {metadata.key_id && (
              <span className="meta-hud-item">
                <span className="meta-label">Key:</span>
                <strong>{metadata.key_id}</strong>
              </span>
            )}

            {metadata.fallback_attempts > 0 && (
              <span className="meta-hud-item highlight-fallback">
                <span className="meta-label">Failovers:</span>
                <strong>{metadata.fallback_attempts}</strong>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
