import React, { useState } from 'react';

export default function SurvivalVisualizer({ data }) {
  const initialChecklist = data?.checklist || [];
  const [checklist, setChecklist] = useState(initialChecklist);
  const [activeStage, setActiveStage] = useState(0);

  const stages = data?.stages || [];

  const toggleItem = (id) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const totalCount = checklist.length;
  const checkedCount = checklist.filter((item) => item.checked).length;
  const readinessPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <div className="survival-visualizer">
      {/* Dynamic Readiness Bar (Transparently derived from checklist completion) */}
      <div className="readiness-panel">
        <div className="readiness-header">
          <span className="section-title">EXPEDITION READINESS</span>
          <span className="readiness-score">{readinessPercent}%</span>
        </div>
        <div className="readiness-track">
          <div
            className="readiness-fill"
            style={{ width: `${readinessPercent}%` }}
          />
        </div>
        <div className="readiness-meta">
          <span>{checkedCount} of {totalCount} requirements satisfied</span>
          <span className="readiness-verdict">
            {readinessPercent >= 80 ? '🟢 READY FOR COMBAT' : readinessPercent >= 50 ? '🟡 GEARING UP' : '🔴 UNPREPARED'}
          </span>
        </div>
      </div>

      {/* Progression Timeline Tree */}
      <div className="progression-section">
        <div className="section-title">PROGRESSION ROADMAP</div>
        <div className="progression-tree">
          {stages.map((stage, idx) => (
            <div
              key={stage.id || idx}
              className={`stage-node ${activeStage === idx ? 'node-selected' : ''} ${stage.completed ? 'node-done' : ''}`}
              onClick={() => setActiveStage(idx)}
            >
              <div className="node-marker">
                {stage.completed ? '✓' : idx + 1}
              </div>
              <div className="node-body">
                <div className="node-title">{stage.title}</div>
                <div className="node-desc">{stage.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Preparation Checklist */}
      <div className="checklist-section">
        <div className="section-header">
          <span className="section-title">GEAR & PROVISIONS CHECKLIST</span>
          <span className="material-count">Click to toggle items</span>
        </div>
        <div className="checklist-items">
          {checklist.map((item) => (
            <label key={item.id} className="checklist-item">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleItem(item.id)}
                className="mc-checkbox"
              />
              <span className={`item-label ${item.checked ? 'item-checked' : ''}`}>
                {item.label}
              </span>
              {item.required && <span className="req-tag">VITAL</span>}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
