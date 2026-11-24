import React from 'react';
import BuildVisualizer from './BuildVisualizer';
import RedstoneVisualizer from './RedstoneVisualizer';
import SurvivalVisualizer from './SurvivalVisualizer';
import CreateVisualizer from './CreateVisualizer';

export default function VisualizationPanel({ data, onClose, mode }) {
  if (!data) return null;

  const type = data.type || (mode ? mode.toLowerCase() : 'build');

  const getModeBadge = () => {
    switch (type) {
      case 'build':
        return { label: '🏗️ BUILD BLUEPRINT', color: '#16a34a' };
      case 'redstone':
        return { label: '⚡ REDSTONE LOGIC', color: '#dc2626' };
      case 'survival':
        return { label: '🗡️ SURVIVAL ROADMAP', color: '#0284c7' };
      case 'create':
        return { label: '⚙️ TECHNICAL ARCHITECTURE', color: '#9333ea' };
      default:
        return { label: '📐 BLUEPRINT', color: '#16a34a' };
    }
  };

  const badge = getModeBadge();

  return (
    <div className="visualizer-panel">
      {/* Panel Top Header */}
      <div className="panel-header">
        <div className="panel-title-group">
          <span className="panel-badge" style={{ borderColor: badge.color, color: badge.color }}>
            {badge.label}
          </span>
          <h2 className="panel-title">{data.title || 'Interactive Visualizer'}</h2>
          {data.subtitle && <p className="panel-subtitle">{data.subtitle}</p>}
        </div>
        <button
          type="button"
          className="panel-close-btn"
          onClick={onClose}
          title="Minimize Visualizer"
        >
          ✕
        </button>
      </div>

      {/* Router based on data.type */}
      <div className="panel-body">
        {type === 'build' && <BuildVisualizer data={data} />}
        {type === 'redstone' && <RedstoneVisualizer data={data} />}
        {type === 'survival' && <SurvivalVisualizer data={data} />}
        {type === 'create' && <CreateVisualizer data={data} />}
      </div>
    </div>
  );
}
