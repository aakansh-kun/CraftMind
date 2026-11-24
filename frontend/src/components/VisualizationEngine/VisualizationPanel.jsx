import React from 'react';
import BuildVisualizer from './BuildVisualizer';
import RedstoneVisualizer from './RedstoneVisualizer';
import SurvivalVisualizer from './SurvivalVisualizer';
import CreateVisualizer from './CreateVisualizer';

export default function VisualizationPanel({ data, onClose, mode }) {
  if (!data) return null;

  // Case 1: Temporary generating state while awaiting new response
  if (data.status === 'generating') {
    return (
      <div className="visualizer-panel">
        <div className="panel-header">
          <div className="panel-title-group">
            <span className="panel-badge" style={{ borderColor: '#eab308', color: '#eab308' }}>
              ⏳ PROCESSING
            </span>
            <h2 className="panel-title">GENERATING BLUEPRINT...</h2>
            <p className="panel-subtitle">Computing spatial block coordinates and simulation kinetics</p>
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
        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center', minHeight: '320px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⛏️</div>
          <h3 style={{ color: '#f8fafc', fontSize: '1.25rem', marginBottom: '0.5rem', fontFamily: 'monospace' }}>GENERATING BLUEPRINT...</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '360px', margin: '0 auto', lineHeight: '1.5' }}>
            CraftMind is analyzing the response, preparing block manifests, layer projections, and kinetic animation parameters.
          </p>
        </div>
      </div>
    );
  }

  // Case 2: No visualization available for this response
  if (data.noVisualization) {
    return (
      <div className="visualizer-panel">
        <div className="panel-header">
          <div className="panel-title-group">
            <span className="panel-badge" style={{ borderColor: '#64748b', color: '#94a3b8' }}>
              ℹ️ NOTICE
            </span>
            <h2 className="panel-title">No Visualization Available</h2>
            <p className="panel-subtitle">For this response</p>
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
        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center', minHeight: '320px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.6 }}>📐</div>
          <h3 style={{ color: '#f8fafc', fontSize: '1.15rem', marginBottom: '0.5rem', fontFamily: 'monospace' }}>No visualization available for this response.</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', maxWidth: '380px', margin: '0 auto', lineHeight: '1.5' }}>
            The assistant generated instructions above, but no structured 3D spatial model or schematic applies to this specific query. Unrelated blueprints are never substituted.
          </p>
        </div>
      </div>
    );
  }

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
