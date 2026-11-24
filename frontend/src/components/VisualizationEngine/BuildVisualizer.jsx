import React, { useState, useEffect, useMemo, useRef } from 'react';
import MaterialsGrid from './MaterialsGrid';
import MechanismSimulator from './MechanismSimulator';
import {
  BLOCK_CATALOG,
  buildCanonicalModel,
  projectIsometric,
  getTopViewGrid,
  getFrontViewGrid
} from './buildModel';

export default function BuildVisualizer({ data }) {
  // 1. Canonical 3D Build Model
  const model = useMemo(() => buildCanonicalModel(data), [data]);

  // View state
  const [activeTab, setActiveTab] = useState('isometric'); // 'isometric' | 'top' | 'front' | 'simulation'
  const [currentStep, setCurrentStep] = useState(0);
  const [currentLayer, setCurrentLayer] = useState(0);
  const [layerMode, setLayerMode] = useState('stacked'); // 'stacked' | 'single'
  const [showFutureGhost, setShowFutureGhost] = useState(true);

  // Isometric Camera Controls
  const [rotation, setRotation] = useState(0); // 0 | 90 | 180 | 270
  const [zoom, setZoom] = useState(1);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [hoveredBlock, setHoveredBlock] = useState(null);

  // Auto-play step construction
  const [isAutoPlayingSteps, setIsAutoPlayingSteps] = useState(false);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStage, setSimStage] = useState(0);

  // Edition state
  const [edition, setEdition] = useState(() => model?.edition?.includes('Bedrock') ? 'Bedrock' : 'Java');
  const [mcVersion, setMcVersion] = useState('1.21.x');

  const steps = model?.steps || [];
  const dimensions = model?.dimensions || { width: 7, length: 7, height: 8 };
  const simulation = model?.simulation || { stages: [] };

  // Sync currentLayer with step when changing steps
  useEffect(() => {
    if (steps[currentStep]?.layer) {
      setCurrentLayer(Math.min(dimensions.height - 1, Math.max(0, steps[currentStep].layer - 1)));
    }
  }, [currentStep, steps, dimensions.height]);

  // Step auto-play timer
  useEffect(() => {
    let timer;
    if (isAutoPlayingSteps && steps.length > 0) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) {
            setIsAutoPlayingSteps(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2200);
    }
    return () => clearInterval(timer);
  }, [isAutoPlayingSteps, steps.length]);

  // Simulation timer
  useEffect(() => {
    let interval;
    if (isSimulating && simulation.stages.length > 0) {
      interval = setInterval(() => {
        setSimStage((prev) => (prev + 1) % simulation.stages.length);
      }, 1900);
    }
    return () => clearInterval(interval);
  }, [isSimulating, simulation.stages.length]);

  if (!model) {
    return (
      <div className="build-visualizer empty-viz">
        <p>No 3D blueprint model available for this response.</p>
      </div>
    );
  }

  const currentStepData = steps[currentStep] || steps[0] || {};

  // Rotate camera
  const handleRotateCW = () => setRotation((prev) => (prev + 90) % 360);
  const handleRotateCCW = () => setRotation((prev) => (prev + 270) % 360);
  const handleResetCamera = () => {
    setRotation(0);
    setZoom(1);
    setSelectedMaterial(null);
  };

  // Rotation cardinal direction
  const rotationDirections = { 0: 'NORTH', 90: 'EAST', 180: 'SOUTH', 270: 'WEST' };

  // Calculate projected isometric blocks
  const TILE_W = 38 * zoom;
  const TILE_H = 20 * zoom;
  const BLOCK_H = 24 * zoom;

  // Filter and project blocks for isometric view
  const projectedBlocks = useMemo(() => {
    const rawBlocks = model.blocks || [];
    const activeStepNumber = currentStep + 1;

    return rawBlocks
      .filter((block) => {
        // Layer filtering
        if (layerMode === 'single' && block.y !== currentLayer) return false;
        if (layerMode === 'stacked' && block.y > currentLayer) return false;

        // Future steps hiding
        if (!showFutureGhost && block.step > activeStepNumber) return false;

        return true;
      })
      .map((block) => {
        const proj = projectIsometric(block.x, block.y, block.z, dimensions, rotation, TILE_W, TILE_H, BLOCK_H);
        const isCurrentStep = block.step === activeStepNumber;
        const isFutureStep = block.step > activeStepNumber;
        const isPastStep = block.step < activeStepNumber;
        const isMaterialMatch = selectedMaterial ? block.type === selectedMaterial : true;

        return {
          ...block,
          ...proj,
          isCurrentStep,
          isFutureStep,
          isPastStep,
          isMaterialMatch,
        };
      })
      .sort((a, b) => a.depth - b.depth);
  }, [model.blocks, currentStep, currentLayer, layerMode, showFutureGhost, rotation, selectedMaterial, dimensions, TILE_W, TILE_H, BLOCK_H]);

  // Center coordinate offset for SVG
  const svgWidth = 480;
  const svgHeight = 360;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2 + 30 * zoom;

  // Top view grid
  const topViewGrid = useMemo(() => {
    return getTopViewGrid(model, currentLayer, layerMode === 'stacked');
  }, [model, currentLayer, layerMode]);

  // Front view grid
  const frontViewGrid = useMemo(() => {
    return getFrontViewGrid(model);
  }, [model]);

  return (
    <div className="build-visualizer">
      {/* Blueprint Header with Dimensions & Edition */}
      <div className="blueprint-header-bar">
        <div className="blueprint-title-row">
          <span className="bp-icon">🧱</span>
          <div className="bp-heading">
            <h3 className="bp-title">{model.title}</h3>
            <span className="bp-dimensions">
              {dimensions.width}W × {dimensions.length}L × {dimensions.height}H Blocks ({model.blocks.length} Total Blocks)
            </span>
          </div>
        </div>

        {/* Edition & Version Selectors */}
        <div className="edition-selector-group">
          <button
            type="button"
            className={`edition-chip ${edition === 'Java' ? 'active' : ''}`}
            onClick={() => setEdition('Java')}
            title="Target Minecraft Java Edition"
          >
            ☕ JAVA
          </button>
          <button
            type="button"
            className={`edition-chip ${edition === 'Bedrock' ? 'active' : ''}`}
            onClick={() => setEdition('Bedrock')}
            title="Target Minecraft Bedrock Edition"
          >
            📱 BEDROCK
          </button>
          <select
            className="version-select"
            value={mcVersion}
            onChange={(e) => setMcVersion(e.target.value)}
          >
            <option value="1.21.x">v1.21.x Tricky Trials</option>
            <option value="1.20.x">v1.20.x Trails & Tales</option>
            <option value="1.19.x">v1.19.x Wild</option>
          </select>
        </div>
      </div>

      {/* Primary View Mode Tabs */}
      <div className="viz-subtabs">
        <button
          type="button"
          className={`viz-subtab ${activeTab === 'isometric' ? 'active' : ''}`}
          onClick={() => setActiveTab('isometric')}
        >
          🔷 ISOMETRIC 3D
        </button>
        <button
          type="button"
          className={`viz-subtab ${activeTab === 'top' ? 'active' : ''}`}
          onClick={() => setActiveTab('top')}
        >
          🗺️ TOP (LAYER SLICE)
        </button>
        <button
          type="button"
          className={`viz-subtab ${activeTab === 'front' ? 'active' : ''}`}
          onClick={() => setActiveTab('front')}
        >
          🏢 FRONT ELEVATION
        </button>
        <button
          type="button"
          className={`viz-subtab ${activeTab === 'simulation' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulation')}
        >
          ⚡ MECHANISM FLOW
        </button>
      </div>

      {/* Layer Slicer Slider (Available on Isometric, Top, and Front) */}
      {activeTab !== 'simulation' && (
        <div className="layer-slicer-card">
          <div className="slicer-header">
            <div className="slicer-info">
              <span className="slicer-label">ELEVATION SLICER:</span>
              <strong className="slicer-val">Y = {currentLayer} (Layer {currentLayer + 1} of {dimensions.height})</strong>
            </div>
            <div className="slicer-mode-toggles">
              <button
                type="button"
                className={`slicer-toggle-btn ${layerMode === 'stacked' ? 'active' : ''}`}
                onClick={() => setLayerMode('stacked')}
                title="Show all blocks from ground up to this layer"
              >
                STACKED (0 → {currentLayer})
              </button>
              <button
                type="button"
                className={`slicer-toggle-btn ${layerMode === 'single' ? 'active' : ''}`}
                onClick={() => setLayerMode('single')}
                title="Show only blocks on this exact Y layer"
              >
                SINGLE SLICE
              </button>
            </div>
          </div>
          <div className="slicer-slider-track">
            <input
              type="range"
              min="0"
              max={dimensions.height - 1}
              value={currentLayer}
              onChange={(e) => setCurrentLayer(parseInt(e.target.value, 10))}
              className="layer-slider"
            />
            <div className="slider-ticks">
              {Array.from({ length: dimensions.height }).map((_, idx) => (
                <span
                  key={idx}
                  className={`tick ${idx === currentLayer ? 'current' : ''}`}
                  onClick={() => setCurrentLayer(idx)}
                >
                  Y{idx}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: ISOMETRIC 3D VIEW */}
      {activeTab === 'isometric' && (
        <div className="isometric-container">
          {/* Isometric Camera Toolbar */}
          <div className="iso-toolbar">
            <div className="camera-rot-group">
              <button
                type="button"
                className="cam-btn"
                onClick={handleRotateCCW}
                title="Rotate 90° Counter-Clockwise"
              >
                ↺ -90°
              </button>
              <span className="compass-pill">
                🧭 {rotationDirections[rotation]} ({rotation}°)
              </span>
              <button
                type="button"
                className="cam-btn"
                onClick={handleRotateCW}
                title="Rotate 90° Clockwise"
              >
                ↻ +90°
              </button>
            </div>

            <div className="camera-zoom-group">
              <button
                type="button"
                className="cam-btn"
                onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
                title="Zoom Out"
              >
                −
              </button>
              <span className="zoom-val">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                className="cam-btn"
                onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
                title="Zoom In"
              >
                +
              </button>
              <button
                type="button"
                className="cam-btn reset"
                onClick={handleResetCamera}
                title="Reset Camera & Filter"
              >
                RESET
              </button>
            </div>

            <label className="ghost-toggle">
              <input
                type="checkbox"
                checked={showFutureGhost}
                onChange={(e) => setShowFutureGhost(e.target.checked)}
              />
              <span>Ghost Future Steps</span>
            </label>
          </div>

          {/* Isometric SVG Canvas */}
          <div className="iso-svg-viewport">
            <svg
              className="iso-svg"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Ground Grid Gridlines */}
              <g className="iso-grid-base" transform={`translate(${centerX}, ${centerY})`}>
                <polygon
                  points={`0,0 ${dimensions.width * (TILE_W / 2)},${dimensions.width * (TILE_H / 2)} ${(dimensions.width - dimensions.length) * (TILE_W / 2)},${(dimensions.width + dimensions.length) * (TILE_H / 2)} ${-dimensions.length * (TILE_W / 2)},${dimensions.length * (TILE_H / 2)}`}
                  fill="rgba(15, 23, 42, 0.45)"
                  stroke="#334155"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              </g>

              {/* Rendered 3D Isometric Blocks */}
              <g className="iso-blocks" transform={`translate(${centerX}, ${centerY})`}>
                {projectedBlocks.map((b, idx) => {
                  const cat = BLOCK_CATALOG[b.type] || BLOCK_CATALOG.stone_bricks;
                  const halfW = TILE_W / 2;
                  const halfH = TILE_H / 2;
                  const bx = b.isoX;
                  const by = b.isoY;

                  // Diamond points for top face
                  const topPoints = `${bx},${by - BLOCK_H} ${bx + halfW},${by - BLOCK_H + halfH} ${bx},${by - BLOCK_H + TILE_H} ${bx - halfW},${by - BLOCK_H + halfH}`;
                  // Left face points
                  const leftPoints = `${bx - halfW},${by - BLOCK_H + halfH} ${bx},${by - BLOCK_H + TILE_H} ${bx},${by + TILE_H} ${bx - halfW},${by + halfH}`;
                  // Right face points
                  const rightPoints = `${bx},${by - BLOCK_H + TILE_H} ${bx + halfW},${by - BLOCK_H + halfH} ${bx + halfW},${by + halfH} ${bx},${by + TILE_H}`;

                  // Visual state styling
                  let blockOpacity = 1;
                  let strokeColor = '#1c1917';
                  let strokeWidth = '1';

                  if (b.isFutureStep) {
                    blockOpacity = 0.25;
                    strokeColor = '#64748b';
                    strokeWidth = '0.8';
                  } else if (b.isPastStep) {
                    blockOpacity = 0.8;
                  }

                  if (b.isCurrentStep) {
                    strokeColor = '#eab308'; // Glowing gold for step in progress
                    strokeWidth = '2';
                  }

                  if (selectedMaterial) {
                    if (b.isMaterialMatch) {
                      strokeColor = '#38bdf8'; // Cyan highlight for selected material
                      strokeWidth = '2.5';
                      blockOpacity = 1;
                    } else {
                      blockOpacity = 0.2;
                    }
                  }

                  return (
                    <g
                      key={`${b.x}-${b.y}-${b.z}-${idx}`}
                      className={`iso-block-cube ${b.isCurrentStep ? 'is-active-step' : ''} ${b.isMaterialMatch ? 'is-filtered' : ''}`}
                      opacity={blockOpacity}
                      onMouseEnter={() => setHoveredBlock(b)}
                      onMouseLeave={() => setHoveredBlock(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Left Face */}
                      <polygon
                        points={leftPoints}
                        fill={cat.leftColor}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                      />
                      {/* Right Face */}
                      <polygon
                        points={rightPoints}
                        fill={cat.rightColor}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                      />
                      {/* Top Face */}
                      <polygon
                        points={topPoints}
                        fill={cat.topColor}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                      />
                      {/* Icon or Label on Top Face */}
                      {zoom >= 0.85 && cat.icon && !b.isFutureStep && (
                        <text
                          x={bx}
                          y={by - BLOCK_H + halfH + 3}
                          fontSize={9 * zoom}
                          textAnchor="middle"
                          fill={cat.textColor || '#ffffff'}
                          style={{ pointerEvents: 'none', userSelect: 'none' }}
                        >
                          {cat.icon}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredBlock && (
              <div className="iso-hover-card">
                <span className="hc-icon">{BLOCK_CATALOG[hoveredBlock.type]?.icon || '🧱'}</span>
                <div className="hc-details">
                  <strong>{BLOCK_CATALOG[hoveredBlock.type]?.name || hoveredBlock.type}</strong>
                  <span>Coordinate: [X: {hoveredBlock.x}, Y: {hoveredBlock.y}, Z: {hoveredBlock.z}]</span>
                  <span>Step: {hoveredBlock.step}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: TOP VIEW (LAYER SLICE) */}
      {activeTab === 'top' && (
        <div className="top-view-container">
          <div className="view-legend-banner">
            <span>Grid: <strong>{dimensions.width} Columns (X) × {dimensions.length} Rows (Z)</strong></span>
            <span>Elevation: <strong>Y = {currentLayer}</strong></span>
          </div>

          <div className="top-grid-wrapper">
            <div
              className="top-grid"
              style={{
                gridTemplateColumns: `repeat(${dimensions.width}, 44px)`
              }}
            >
              {topViewGrid.map((row, rIdx) =>
                row.map((cellBlock, cIdx) => {
                  if (!cellBlock) {
                    return (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        className="top-cell empty-cell"
                        title={`[X: ${cIdx}, Z: ${rIdx}] - Air / Empty`}
                      >
                        <span className="coord-sub">
                          {cIdx},{rIdx}
                        </span>
                      </div>
                    );
                  }

                  const cat = BLOCK_CATALOG[cellBlock.type] || BLOCK_CATALOG.stone_bricks;
                  const isCurrent = cellBlock.step === currentStep + 1;
                  const isMatFiltered = selectedMaterial ? cellBlock.type === selectedMaterial : true;

                  return (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      className={`top-cell filled-cell ${isCurrent ? 'active-step-cell' : ''} ${!isMatFiltered ? 'dimmed-cell' : ''}`}
                      style={{
                        backgroundColor: cat.leftColor,
                        borderTopColor: cat.topColor,
                        borderRightColor: cat.rightColor,
                        borderLeftColor: cat.leftColor,
                        borderBottomColor: cat.rightColor,
                      }}
                      title={`[X: ${cellBlock.x}, Y: ${cellBlock.y}, Z: ${cellBlock.z}]: ${cat.name} (Step ${cellBlock.step})`}
                      onClick={() => setSelectedMaterial(cellBlock.type)}
                    >
                      <span className="top-cell-icon">{cat.icon}</span>
                      <span className="coord-sub">Y{cellBlock.y}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: FRONT ELEVATION VIEW */}
      {activeTab === 'front' && (
        <div className="front-view-container">
          <div className="view-legend-banner">
            <span>Elevation Profile: <strong>Looking North along Z axis</strong></span>
            <span>Height: <strong>{dimensions.height} Blocks (Y=0 to Y={dimensions.height - 1})</strong></span>
          </div>

          <div className="front-grid-wrapper">
            <div
              className="front-grid"
              style={{
                gridTemplateColumns: `repeat(${dimensions.width}, 44px)`
              }}
            >
              {frontViewGrid.map((row, rIdx) =>
                row.map((cellBlock, cIdx) => {
                  const currentElevation = dimensions.height - 1 - rIdx;
                  if (!cellBlock) {
                    return (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        className="front-cell empty-cell"
                        title={`[X: ${cIdx}, Y: ${currentElevation}] - Air`}
                      >
                        <span className="coord-sub">Y{currentElevation}</span>
                      </div>
                    );
                  }

                  const cat = BLOCK_CATALOG[cellBlock.type] || BLOCK_CATALOG.stone_bricks;
                  const isCurrent = cellBlock.step === currentStep + 1;
                  const isMatFiltered = selectedMaterial ? cellBlock.type === selectedMaterial : true;

                  return (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      className={`front-cell filled-cell ${isCurrent ? 'active-step-cell' : ''} ${!isMatFiltered ? 'dimmed-cell' : ''}`}
                      style={{
                        backgroundColor: cat.leftColor,
                        borderColor: isCurrent ? '#eab308' : cat.topColor,
                      }}
                      title={`[X: ${cellBlock.x}, Y: ${cellBlock.y}, Z: ${cellBlock.z}]: ${cat.name}`}
                      onClick={() => setSelectedMaterial(cellBlock.type)}
                    >
                      <span className="front-cell-icon">{cat.icon}</span>
                      <span className="coord-sub">Y{cellBlock.y}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: MECHANISM SIMULATION & CONSTRUCTION ANIMATOR */}
      {activeTab === 'simulation' && (
        <MechanismSimulator model={model} />
      )}

      {/* Construction Step Navigator Card */}
      {steps.length > 0 && activeTab !== 'simulation' && (
        <div className="step-navigator-card">
          <div className="step-nav-header">
            <div className="step-counter-badge">
              STEP {currentStep + 1} OF {steps.length}
            </div>
            <strong className="step-title-text">
              {currentStepData.title || `Phase ${currentStep + 1}`}
            </strong>
          </div>

          <p className="step-narrative">{currentStepData.description}</p>

          <div className="step-nav-actions">
            <button
              type="button"
              className="step-btn secondary"
              disabled={currentStep === 0}
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            >
              ◀ PREVIOUS
            </button>
            <button
              type="button"
              className={`step-btn auto-play ${isAutoPlayingSteps ? 'is-playing' : ''}`}
              onClick={() => setIsAutoPlayingSteps(!isAutoPlayingSteps)}
            >
              {isAutoPlayingSteps ? '⏸ PAUSE BUILD' : '⏯ AUTO-BUILD'}
            </button>
            <button
              type="button"
              className="step-btn primary"
              disabled={currentStep >= steps.length - 1}
              onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
            >
              NEXT ▶
            </button>
          </div>
        </div>
      )}

      {/* Materials Inventory Section */}
      <MaterialsGrid
        materials={model.materials}
        model={model}
        selectedMaterial={selectedMaterial}
        onSelectMaterial={setSelectedMaterial}
      />
    </div>
  );
}
