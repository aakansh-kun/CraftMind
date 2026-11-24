import React from 'react';
import { BLOCK_CATALOG } from './buildModel';

export default function MaterialsGrid({
  materials,
  model,
  selectedMaterial,
  onSelectMaterial
}) {
  if (!materials || !materials.length) return null;

  // Calculate placed count for each material directly from the 3D block model
  const placedCounts = {};
  if (model?.blocks) {
    model.blocks.forEach((block) => {
      placedCounts[block.type] = (placedCounts[block.type] || 0) + 1;
    });
  }

  return (
    <div className="materials-container">
      <div className="section-header">
        <div className="header-left">
          <span className="section-title">📦 INVENTORY MANIFEST</span>
          <span className="material-count">{materials.length} ITEMS</span>
        </div>
        {selectedMaterial && (
          <button
            type="button"
            className="clear-filter-btn"
            onClick={() => onSelectMaterial(null)}
            title="Reset highlight"
          >
            ✕ CLEAR FILTER
          </button>
        )}
      </div>

      <div className="inventory-grid">
        {materials.map((item, idx) => {
          const typeKey = item.id || 'stone';
          const catalogItem = BLOCK_CATALOG[typeKey] || {};
          const isSelected = selectedMaterial === typeKey;
          const placed = placedCounts[typeKey] || 0;
          const required = item.quantity || 1;
          const remaining = Math.max(0, required - placed);

          return (
            <div
              key={typeKey || idx}
              className={`inv-slot ${isSelected ? 'active-filter' : ''}`}
              onClick={() => onSelectMaterial(isSelected ? null : typeKey)}
              title={`Click to filter: ${item.name} (Required: ${required}, Placed: ${placed}, Left: ${remaining})`}
            >
              <div className="inv-icon">{item.icon || catalogItem.icon || '📦'}</div>
              <div className="inv-qty">{required}</div>
              <div className="inv-placed-badge">
                <span className="badge-placed">{placed}</span>
                <span className="badge-slash">/</span>
                <span className="badge-req">{required}</span>
              </div>
              <div className="inv-tooltip">
                <strong className="tt-name">{item.name}</strong>
                <div className="tt-row">
                  <span>Required:</span> <strong>{required}</strong>
                </div>
                <div className="tt-row">
                  <span>In Model:</span> <strong>{placed} blocks</strong>
                </div>
                <div className="tt-row">
                  <span>Remaining:</span> <strong>{remaining}</strong>
                </div>
                <div className="tt-action">Click to highlight in 3D</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
