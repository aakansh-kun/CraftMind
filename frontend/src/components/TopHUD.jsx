import React from 'react';

export default function TopHUD({ activeMode, hasVisualizer, isVisualizerOpen, onToggleVisualizer, sessionId }) {
  const getModeInfo = () => {
    switch (activeMode) {
      case 'BUILD':
        return { label: 'BUILD MODE', color: '#16a34a', icon: '🧱' };
      case 'REDSTONE':
        return { label: 'REDSTONE MODE', color: '#dc2626', icon: '⚡' };
      case 'SURVIVAL':
        return { label: 'SURVIVAL MODE', color: '#0284c7', icon: '🗡️' };
      case 'CREATE':
        return { label: 'CREATE MODE', color: '#9333ea', icon: '⚙️' };
      default:
        return { label: 'BUILD MODE', color: '#16a34a', icon: '🧱' };
    }
  };

  const modeInfo = getModeInfo();

  return (
    <header className="craftmind-hud">
      {/* Brand area */}
      <div className="hud-brand">
        <div className="hud-logo-cube">⛏️</div>
        <div className="hud-titles">
          <span className="hud-name">CRAFTMIND</span>
          <span className="hud-tagline">AI MINECRAFT COMPANION</span>
        </div>
      </div>

      {/* Mode Indicator */}
      <div className="hud-mode-pill" style={{ borderColor: modeInfo.color }}>
        <span className="hud-mode-icon">{modeInfo.icon}</span>
        <span className="hud-mode-label">{modeInfo.label}</span>
      </div>

      {/* Right status items */}
      <div className="hud-right">
        {hasVisualizer && (
          <button
            type="button"
            className={`hud-viz-toggle ${isVisualizerOpen ? 'active' : ''}`}
            onClick={onToggleVisualizer}
            title="Toggle Visualizer Panel"
          >
            📐 {isVisualizerOpen ? 'HIDE BLUEPRINT' : 'SHOW BLUEPRINT'}
          </button>
        )}

        <div className="hud-status" title="FastAPI & LiteLLM Active">
          <span className="hud-status-dot"></span>
          <span className="hud-status-text">AI CORE ● ONLINE</span>
        </div>

        <div className="hud-session" title={`Current Session: ${sessionId}`}>
          SID: <span>{sessionId.slice(0, 10)}</span>
        </div>
      </div>
    </header>
  );
}
