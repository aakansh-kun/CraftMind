import React, { useState } from 'react';

export default function RedstoneVisualizer({ data }) {
  // Lever state: ON (powered) or OFF (unpowered)
  const [isPowered, setIsPowered] = useState(false);
  const [repeaterTicks, setRepeaterTicks] = useState(1);

  const components = data?.components || [];
  const timingSteps = data?.timingSteps || [];

  return (
    <div className="redstone-visualizer">
      {/* Component BOM / Manifest */}
      <div className="redstone-components">
        <div className="section-header">
          <span className="section-title">CIRCUIT COMPONENTS</span>
          <span className="material-count">{components.length} components</span>
        </div>
        <div className="inventory-grid">
          {components.map((item, idx) => (
            <div key={item.id || idx} className="inv-slot" title={`${item.name} (${item.count})`}>
              <div className="inv-icon">{item.icon || '🔴'}</div>
              <div className="inv-qty">{item.count}</div>
              <div className="inv-tooltip">
                <strong>{item.name}</strong>
                <span>Count: {item.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Circuit Schematic */}
      <div className="schematic-board">
        <div className="section-header">
          <span className="section-title">INTERACTIVE LOGIC SCHEMATIC</span>
          <span className={`power-badge ${isPowered ? 'powered' : 'unpowered'}`}>
            {isPowered ? '⚡ SIGNAL ACTIVE (15)' : '○ SIGNAL LOW (0)'}
          </span>
        </div>

        {/* Schematic Circuit Graph */}
        <div className="circuit-diagram">
          {/* 1. Input Node: Lever */}
          <div
            className={`circuit-node node-lever ${isPowered ? 'node-active' : ''}`}
            onClick={() => setIsPowered(!isPowered)}
            role="button"
            tabIndex={0}
            title="Click to toggle lever state"
          >
            <div className="node-icon">🕹️</div>
            <div className="node-label">LEVER INPUT</div>
            <div className={`lever-state ${isPowered ? 'state-on' : 'state-off'}`}>
              [ {isPowered ? 'ON' : 'OFF'} ]
            </div>
          </div>

          {/* Wire 1 */}
          <div className={`wire-segment ${isPowered ? 'wire-lit' : ''}`}>
            <span className="signal-arrow">➔</span>
          </div>

          {/* 2. Repeater Node */}
          <div
            className={`circuit-node node-repeater ${isPowered ? 'node-active' : ''}`}
            onClick={() => setRepeaterTicks((prev) => (prev % 4) + 1)}
            title="Click to adjust delay ticks"
          >
            <div className="node-icon">⏱️</div>
            <div className="node-label">REPEATER</div>
            <div className="node-sub">{repeaterTicks}-Tick Delay</div>
          </div>

          {/* Wire 2 */}
          <div className={`wire-segment ${isPowered ? 'wire-lit' : ''}`}>
            <span className="signal-arrow">➔</span>
          </div>

          {/* 3. Inverter Torch Node */}
          <div className={`circuit-node node-torch ${!isPowered ? 'node-active' : ''}`}>
            <div className="node-icon">{!isPowered ? '🔥' : '🕯️'}</div>
            <div className="node-label">INVERTER TORCH</div>
            <div className="node-sub">{!isPowered ? 'LIT (High)' : 'OFF (Inverted)'}</div>
          </div>

          {/* Wire 3 */}
          <div className={`wire-segment ${!isPowered ? 'wire-lit' : ''}`}>
            <span className="signal-arrow">➔</span>
          </div>

          {/* 4. Actuator: Sticky Pistons & Doorway */}
          <div className={`circuit-node node-piston ${!isPowered ? 'node-active' : ''}`}>
            <div className="node-icon">{!isPowered ? '🚪' : '🧱'}</div>
            <div className="node-label">2x2 PISTON DOOR</div>
            <div className={`door-status ${!isPowered ? 'door-closed' : 'door-open'}`}>
              {!isPowered ? 'EXTENDED (CLOSED)' : 'RETRACTED (OPEN)'}
            </div>
          </div>
        </div>

        {/* Interactive Instruction Note */}
        <div className="circuit-instruction">
          👉 <em>Click the <strong>[ LEVER ]</strong> above to propagate the redstone charge and toggle the door mechanism!</em>
        </div>
      </div>

      {/* Signal Timing Analysis */}
      {timingSteps && timingSteps.length > 0 && (
        <div className="timing-breakdown">
          <div className="section-title">SIGNAL PROPAGATION SEQUENCE</div>
          <ol className="timing-list">
            {timingSteps.map((step, idx) => (
              <li key={idx} className="timing-item">
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
