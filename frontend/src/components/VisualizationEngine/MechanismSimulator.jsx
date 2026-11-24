import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  BLOCK_CATALOG,
  projectIsometric,
  getSimulationSnapshot
} from './buildModel';

export default function MechanismSimulator({ model }) {
  // Simulator Mode: 'construction' | 'working'
  const [simMode, setSimMode] = useState('working');

  // Camera State (shared across modes)
  const [rotation, setRotation] = useState(0); // 0 | 90 | 180 | 270
  const [zoom, setZoom] = useState(1);
  const rotationDirections = { 0: 'NORTH', 90: 'EAST', 180: 'SOUTH', 270: 'WEST' };

  // ============================================================================
  // 1. CONSTRUCTION MODE STATE & LOGIC
  // ============================================================================
  const steps = useMemo(() => model?.steps || [], [model]);
  const totalSteps = steps.length;
  const [constructionStep, setConstructionStep] = useState(totalSteps > 0 ? totalSteps : 1);
  const [isConstructionPlaying, setIsConstructionPlaying] = useState(false);

  // Construction auto-play timer
  useEffect(() => {
    let timer;
    if (isConstructionPlaying && simMode === 'construction') {
      timer = setInterval(() => {
        setConstructionStep((prev) => {
          if (prev >= totalSteps) {
            setIsConstructionPlaying(false);
            return totalSteps;
          }
          const next = prev + 1;
          // Subtle camera auto-turn at key milestones
          if (next === Math.floor(totalSteps / 2)) {
            setRotation(90);
          } else if (next === totalSteps) {
            setRotation(180);
          }
          return next;
        });
      }, 1600);
    }
    return () => clearInterval(timer);
  }, [isConstructionPlaying, simMode, totalSteps]);

  // ============================================================================
  // 2. WORKING SIMULATION MODE STATE & LOGIC
  // ============================================================================
  const simulationConfig = useMemo(() => model?.simulation || { stages: [], duration: 10000 }, [model]);
  const simDuration = simulationConfig.duration || 10000;

  const [simTime, setSimTime] = useState(0);
  const [isSimPlaying, setIsSimPlaying] = useState(false);
  const [loopEnabled, setLoopEnabled] = useState(false);

  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(null);

  const tickSimulation = useCallback((timestamp) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = timestamp;
    }
    const delta = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    setSimTime((prevTime) => {
      const nextTime = prevTime + delta;
      if (nextTime >= simDuration) {
        if (loopEnabled) {
          return 0;
        } else {
          setIsSimPlaying(false);
          return simDuration;
        }
      }
      return nextTime;
    });

    animFrameRef.current = requestAnimationFrame(tickSimulation);
  }, [simDuration, loopEnabled]);

  useEffect(() => {
    if (isSimPlaying && simMode === 'working') {
      lastTimeRef.current = null;
      animFrameRef.current = requestAnimationFrame(tickSimulation);
    } else {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      lastTimeRef.current = null;
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isSimPlaying, simMode, tickSimulation]);

  // Clean up all timers when switching modes
  const handleSwitchMode = (newMode) => {
    setIsConstructionPlaying(false);
    setIsSimPlaying(false);
    if (newMode === 'construction') {
      setConstructionStep(0);
    } else {
      setSimTime(0);
    }
    setSimMode(newMode);
  };

  // Camera handlers
  const handleRotateCW = () => setRotation((prev) => (prev + 90) % 360);
  const handleRotateCCW = () => setRotation((prev) => (prev + 270) % 360);
  const handleResetCamera = () => {
    setRotation(0);
    setZoom(1);
  };

  // SVG dimensions & coordinate constants
  const dimensions = model?.dimensions || { width: 7, length: 7, height: 8 };
  const svgWidth = 480;
  const svgHeight = 360;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2 + 35 * zoom;

  const TILE_W = 38 * zoom;
  const TILE_H = 20 * zoom;
  const BLOCK_H = 24 * zoom;

  // Compute Simulation Snapshot for Working Simulation Mode
  const simSnapshot = useMemo(() => {
    if (simMode !== 'working') return null;
    return getSimulationSnapshot(
      simulationConfig,
      simTime,
      dimensions,
      rotation,
      TILE_W,
      TILE_H,
      BLOCK_H
    );
  }, [simMode, simulationConfig, simTime, dimensions, rotation, TILE_W, TILE_H, BLOCK_H]);

  // Projected blocks based on mode
  const projectedBlocks = useMemo(() => {
    const rawBlocks = model?.blocks || [];

    return rawBlocks
      .filter((block) => {
        if (simMode === 'construction') {
          return block.step <= constructionStep;
        }
        // In working simulation, the entire completed farm is present
        return true;
      })
      .map((block) => {
        const proj = projectIsometric(block.x, block.y, block.z, dimensions, rotation, TILE_W, TILE_H, BLOCK_H);
        const isNewlyPlaced = simMode === 'construction' && block.step === constructionStep;

        // Mechanism simulation highlights
        const isWaterFlowing = simMode === 'working' && simSnapshot?.activeWater && block.type === 'water';
        const isLavaActive = simMode === 'working' && simSnapshot?.activeLava && block.type === 'lava';

        let isHopperActive = false;
        if (simMode === 'working' && simSnapshot?.activeHopper) {
          isHopperActive = block.type === 'hopper' &&
            Math.abs(block.x - simSnapshot.activeHopper.x) <= 1 &&
            Math.abs(block.z - simSnapshot.activeHopper.z) <= 1;
        }

        let isChestActive = false;
        if (simMode === 'working' && simSnapshot?.activeChest) {
          isChestActive = block.type === 'chest';
        }

        return {
          ...block,
          ...proj,
          isNewlyPlaced,
          isWaterFlowing,
          isLavaActive,
          isHopperActive,
          isChestActive
        };
      })
      .sort((a, b) => a.depth - b.depth);
  }, [model?.blocks, simMode, constructionStep, dimensions, rotation, TILE_W, TILE_H, BLOCK_H, simSnapshot]);

  // Format time mm:ss
  const formatTime = (ms) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentStepData = steps[Math.max(0, constructionStep - 1)] || {};

  return (
    <div className="mechanism-simulator-container">
      {/* 1. Header & Simulator Mode Switcher */}
      <div className="simulator-header-bar">
        <div className="sim-mode-toggle-group">
          <button
            type="button"
            className={`sim-mode-btn ${simMode === 'construction' ? 'active' : ''}`}
            onClick={() => handleSwitchMode('construction')}
          >
            🧱 CONSTRUCTION SIMULATOR
          </button>
          <button
            type="button"
            className={`sim-mode-btn ${simMode === 'working' ? 'active' : ''}`}
            onClick={() => handleSwitchMode('working')}
          >
            ⚙ WORKING SIMULATION
          </button>
        </div>

        {/* Camera Toolbar */}
        <div className="sim-camera-tools">
          <button type="button" className="sim-cam-btn" onClick={handleRotateCCW} title="Rotate -90°">
            ↺ -90°
          </button>
          <span className="sim-compass-pill">
            🧭 {rotationDirections[rotation]} ({rotation}°)
          </span>
          <button type="button" className="sim-cam-btn" onClick={handleRotateCW} title="Rotate +90°">
            ↻ +90°
          </button>
          <button
            type="button"
            className="sim-cam-btn"
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
            title="Zoom Out"
          >
            −
          </button>
          <button
            type="button"
            className="sim-cam-btn"
            onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
            title="Zoom In"
          >
            +
          </button>
          <button type="button" className="sim-cam-btn reset" onClick={handleResetCamera} title="Reset View">
            RESET
          </button>
        </div>
      </div>

      {/* 2. Primary 2.5D Isometric SVG Scene */}
      <div className="sim-viewport">
        {/* Dynamic Status Banner Overlay */}
        <div className="sim-overlay-banner">
          {simMode === 'construction' ? (
            <div className="banner-text">
              {constructionStep === 0 ? (
                <span>EMPTY BUILD SITE — READY TO COMMENCE CONSTRUCTION</span>
              ) : constructionStep === totalSteps ? (
                <span className="complete-glow">✓ BUILD COMPLETE — STRUCTURE VERIFIED</span>
              ) : (
                <span>BUILDING: STEP {constructionStep} OF {totalSteps} ({currentStepData.title})</span>
              )}
            </div>
          ) : (
            <div className="banner-text">
              <span className="stage-num-badge">STAGE {(simSnapshot?.activeStageIdx || 0) + 1}/6</span>
              <strong className="status-highlight">{simSnapshot?.statusBanner || 'SIMULATION RUNNING'}</strong>
            </div>
          )}
        </div>

        <svg
          className="sim-svg"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Ground Grid lines */}
          <g className="iso-grid-base" transform={`translate(${centerX}, ${centerY})`}>
            <polygon
              points={`0,0 ${dimensions.width * (TILE_W / 2)},${dimensions.width * (TILE_H / 2)} ${(dimensions.width - dimensions.length) * (TILE_W / 2)},${(dimensions.width + dimensions.length) * (TILE_H / 2)} ${-dimensions.length * (TILE_W / 2)},${dimensions.length * (TILE_H / 2)}`}
              fill="rgba(15, 23, 42, 0.5)"
              stroke="#334155"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          </g>

          {/* Rendered 3D Isometric Structure Blocks */}
          <g className="iso-blocks" transform={`translate(${centerX}, ${centerY})`}>
            {projectedBlocks.map((b, idx) => {
              const cat = BLOCK_CATALOG[b.type] || BLOCK_CATALOG.stone_bricks;
              const halfW = TILE_W / 2;
              const halfH = TILE_H / 2;
              const bx = b.isoX;
              const by = b.isoY;

              const topPoints = `${bx},${by - BLOCK_H} ${bx + halfW},${by - BLOCK_H + halfH} ${bx},${by - BLOCK_H + TILE_H} ${bx - halfW},${by - BLOCK_H + halfH}`;
              const leftPoints = `${bx - halfW},${by - BLOCK_H + halfH} ${bx},${by - BLOCK_H + TILE_H} ${bx},${by + TILE_H} ${bx - halfW},${by + halfH}`;
              const rightPoints = `${bx},${by - BLOCK_H + TILE_H} ${bx + halfW},${by - BLOCK_H + halfH} ${bx + halfW},${by + halfH} ${bx},${by + TILE_H}`;

              let strokeColor = '#1c1917';
              let strokeWidth = '1';
              let fillTop = cat.topColor;
              let fillLeft = cat.leftColor;
              let fillRight = cat.rightColor;

              // Active visual effects
              if (b.isNewlyPlaced) {
                strokeColor = '#fbbf24';
                strokeWidth = '2';
              } else if (b.isWaterFlowing) {
                strokeColor = '#38bdf8';
                strokeWidth = '1.8';
                fillTop = 'rgba(56, 189, 248, 0.95)';
              } else if (b.isLavaActive) {
                strokeColor = '#ea580c';
                strokeWidth = '2';
                fillTop = '#f97316';
              } else if (b.isHopperActive || b.isChestActive) {
                strokeColor = '#fbbf24';
                strokeWidth = '2.2';
              }

              return (
                <g
                  key={`sim-block-${b.x}-${b.y}-${b.z}-${idx}`}
                  className={`sim-block-cube ${b.isNewlyPlaced ? 'block-drop-anim' : ''} ${b.isWaterFlowing ? 'water-flowing-anim' : ''} ${b.isLavaActive ? 'lava-flame-anim' : ''}`}
                >
                  <polygon points={leftPoints} fill={fillLeft} stroke={strokeColor} strokeWidth={strokeWidth} />
                  <polygon points={rightPoints} fill={fillRight} stroke={strokeColor} strokeWidth={strokeWidth} />
                  <polygon points={topPoints} fill={fillTop} stroke={strokeColor} strokeWidth={strokeWidth} />

                  {/* Icon label on block top */}
                  {zoom >= 0.85 && cat.icon && (
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

                  {/* Water flow arrow overlay */}
                  {b.isWaterFlowing && (
                    <text
                      x={bx}
                      y={by - BLOCK_H + halfH + 4}
                      fontSize={11 * zoom}
                      textAnchor="middle"
                      fill="#ffffff"
                      className="water-flow-indicator"
                    >
                      🌊
                    </text>
                  )}
                </g>
              );
            })}

            {/* Render Working Simulation Entities (Golem, Villagers, Items) */}
            {simMode === 'working' && simSnapshot?.entities && (
              simSnapshot.entities.map((entity) => {
                const ex = entity.isoX;
                const ey = entity.isoY;
                const isGolem = entity.type === 'iron_golem';
                const isItem = entity.type === 'iron_ingot' || entity.type === 'poppy';

                return (
                  <g
                    key={`sim-ent-${entity.id}`}
                    transform={`translate(${ex}, ${ey})`}
                    opacity={entity.opacity}
                    className={`sim-entity ${entity.isDamaged ? 'entity-damaged-flash' : ''}`}
                  >
                    {/* Shadow / Base Marker */}
                    <ellipse
                      cx={0}
                      cy={4}
                      rx={isGolem ? 14 * zoom : isItem ? 6 * zoom : 10 * zoom}
                      ry={isGolem ? 6 * zoom : isItem ? 3 * zoom : 5 * zoom}
                      fill="rgba(0, 0, 0, 0.45)"
                    />

                    {/* Mob / Item Avatar */}
                    {isGolem ? (
                      <g className="golem-avatar">
                        <rect
                          x={-12 * zoom}
                          y={-28 * zoom}
                          width={24 * zoom}
                          height={28 * zoom}
                          rx={3}
                          fill={entity.isDamaged ? '#ef4444' : '#e2e8f0'}
                          stroke="#475569"
                          strokeWidth="1.5"
                        />
                        <text
                          x={0}
                          y={-10 * zoom}
                          fontSize={16 * zoom}
                          textAnchor="middle"
                        >
                          🤖
                        </text>
                        {/* Downward chute drop indicator */}
                        {entity.y < 3 && entity.y > 1 && (
                          <text x={16 * zoom} y={-10 * zoom} fontSize={12} fill="#ea580c">
                            ⬇
                          </text>
                        )}
                      </g>
                    ) : isItem ? (
                      <g className="item-drop-avatar">
                        <circle cx={0} cy={-6 * zoom} r={7 * zoom} fill="#38bdf8" opacity="0.3" />
                        <text x={0} y={-2 * zoom} fontSize={12 * zoom} textAnchor="middle">
                          {entity.icon || '◽'}
                        </text>
                      </g>
                    ) : (
                      <g className="villager-avatar">
                        <text x={0} y={-6 * zoom} fontSize={18 * zoom} textAnchor="middle">
                          {entity.icon || '👨‍🌾'}
                        </text>
                        {entity.isAlert && (
                          <text x={8 * zoom} y={-20 * zoom} fontSize={12} fill="#ef4444" fontWeight="bold">
                            !
                          </text>
                        )}
                      </g>
                    )}
                  </g>
                );
              })
            )}
          </g>
        </svg>
      </div>

      {/* 3. MODE-SPECIFIC CONTROLLERS & TIMELINES */}
      {simMode === 'construction' ? (
        /* ================= CONSTRUCTION TIMELINE ================= */
        <div className="sim-controls-panel construction-panel">
          <div className="playback-actions-bar">
            <button
              type="button"
              className={`sim-playback-btn ${isConstructionPlaying ? 'playing' : ''}`}
              onClick={() => setIsConstructionPlaying(!isConstructionPlaying)}
            >
              {isConstructionPlaying ? '❚❚ PAUSE BUILD' : '▶ PLAY BUILD'}
            </button>
            <button
              type="button"
              className="sim-playback-btn secondary"
              onClick={() => {
                setIsConstructionPlaying(false);
                setConstructionStep(0);
                setRotation(0);
              }}
            >
              ↻ RESET SITE
            </button>

            <div className="step-stepper-group">
              <button
                type="button"
                className="step-arrow-btn"
                disabled={constructionStep <= 0}
                onClick={() => setConstructionStep((s) => Math.max(0, s - 1))}
              >
                ◀ PREV
              </button>
              <span className="step-indicator-text">
                STEP <strong>{constructionStep}</strong> / {totalSteps}
              </span>
              <button
                type="button"
                className="step-arrow-btn"
                disabled={constructionStep >= totalSteps}
                onClick={() => setConstructionStep((s) => Math.min(totalSteps, s + 1))}
              >
                NEXT ▶
              </button>
            </div>
          </div>

          {/* Stepper Timeline Nodes */}
          <div className="stepper-nodes-row">
            <button
              type="button"
              className={`step-node ${constructionStep === 0 ? 'current' : ''}`}
              onClick={() => setConstructionStep(0)}
              title="Empty Site"
            >
              0
            </button>
            {steps.map((st, idx) => {
              const stepNum = idx + 1;
              const isPassed = constructionStep >= stepNum;
              const isCurrent = constructionStep === stepNum;
              return (
                <React.Fragment key={st.number || idx}>
                  <div className={`step-track-line ${isPassed ? 'passed' : ''}`} />
                  <button
                    type="button"
                    className={`step-node ${isCurrent ? 'current' : ''} ${isPassed ? 'passed' : ''}`}
                    onClick={() => setConstructionStep(stepNum)}
                    title={`Step ${stepNum}: ${st.title}`}
                  >
                    {stepNum}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Step Detail Explanation */}
          <div className="step-explanation-box">
            {constructionStep === 0 ? (
              <p className="step-narrative">Ground grid cleared. Ready to start building.</p>
            ) : (
              <div>
                <strong className="step-exp-title">{currentStepData.title || `Phase ${constructionStep}`}</strong>
                <p className="step-narrative">{currentStepData.description}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= WORKING SIMULATION TIMELINE ================= */
        <div className="sim-controls-panel working-panel">
          <div className="playback-actions-bar">
            <button
              type="button"
              className={`sim-playback-btn ${isSimPlaying ? 'playing' : ''}`}
              onClick={() => {
                if (simTime >= simDuration) {
                  setSimTime(0);
                }
                setIsSimPlaying(!isSimPlaying);
              }}
            >
              {isSimPlaying ? '❚❚ PAUSE' : simTime >= simDuration ? '↻ REPLAY' : '▶ RUN'}
            </button>
            <button
              type="button"
              className="sim-playback-btn secondary"
              onClick={() => {
                setIsSimPlaying(false);
                setSimTime(0);
              }}
            >
              ↻ RESET
            </button>

            <label className="loop-checkbox-label">
              <input
                type="checkbox"
                checked={loopEnabled}
                onChange={(e) => setLoopEnabled(e.target.checked)}
              />
              <span>Loop Simulation</span>
            </label>

            <div className="time-display-pill">
              {formatTime(simTime)} / {formatTime(simDuration)}
            </div>
          </div>

          {/* Timeline Scrubber */}
          <div className="timeline-scrubber-track">
            <input
              type="range"
              min="0"
              max={simDuration}
              value={simTime}
              onChange={(e) => {
                setIsSimPlaying(false);
                setSimTime(parseInt(e.target.value, 10));
              }}
              className="time-slider"
            />
          </div>

          {/* Stages Breakdown List */}
          <div className="sim-stages-compact-list">
            {(simulationConfig.stages || []).map((stage, sIdx) => {
              const isCurrent = simSnapshot?.activeStageIdx === sIdx;
              const isDone = simTime >= stage.end;

              return (
                <div
                  key={stage.id || sIdx}
                  className={`stage-pill-item ${isCurrent ? 'active-stage' : ''} ${isDone ? 'done-stage' : ''}`}
                  onClick={() => {
                    setIsSimPlaying(false);
                    setSimTime(stage.start);
                  }}
                  title={stage.detail}
                >
                  <span className="stage-pill-icon">{stage.icon}</span>
                  <span className="stage-pill-label">{stage.label}</span>
                  {isCurrent && <span className="pill-dot">●</span>}
                </div>
              );
            })}
          </div>

          {/* Cycle Complete Banner if reached end */}
          {simSnapshot?.isComplete && !loopEnabled && (
            <div className="cycle-complete-card">
              <div className="complete-msg">
                <strong>✓ SIMULATION CYCLE COMPLETE</strong>
                <span>Items successfully stored in Vault Chest (+4 Iron Ingots, +1 Poppy).</span>
              </div>
              <button
                type="button"
                className="replay-cycle-btn"
                onClick={() => {
                  setSimTime(0);
                  setIsSimPlaying(true);
                }}
              >
                ▶ RUN AGAIN
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
