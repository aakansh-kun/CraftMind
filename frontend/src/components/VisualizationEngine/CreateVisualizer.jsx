import React, { useState } from 'react';

export default function CreateVisualizer({ data }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [copied, setCopied] = useState(false);

  const architecture = data?.architecture || [];
  const fileTree = data?.fileTree || [];
  const commandSnippet = data?.commandSnippet;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Recursive file tree node renderer
  const renderTree = (items, depth = 0) => {
    return (
      <div className="tree-level" style={{ paddingLeft: depth > 0 ? '1rem' : 0 }}>
        {items.map((node, idx) => (
          <div key={idx} className="tree-node">
            <div
              className={`tree-entry ${node.type} ${selectedFile?.name === node.name ? 'entry-active' : ''}`}
              onClick={() => node.type === 'file' && setSelectedFile(node)}
            >
              <span className="entry-icon">{node.type === 'dir' ? '📁' : '📄'}</span>
              <span className="entry-name">{node.name}</span>
            </div>
            {node.children && renderTree(node.children, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="create-visualizer">
      {/* Mod Architecture Tree */}
      <div className="arch-section">
        <div className="section-title">MOD ARCHITECTURE & REGISTRY LIFECYCLE</div>
        <div className="arch-flow">
          {architecture.map((item, idx) => (
            <div key={idx} className="arch-card">
              <div className="arch-step-num">0{idx + 1}</div>
              <div className="arch-card-content">
                <div className="arch-title">{item.title}</div>
                <div className="arch-desc">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Project File Tree */}
      <div className="tree-section">
        <div className="section-header">
          <span className="section-title">PROJECT SOURCE DIRECTORY</span>
          <span className="material-count">Click files to inspect</span>
        </div>
        <div className="tree-browser">
          <div className="tree-viewport">
            {renderTree(fileTree)}
          </div>
          {selectedFile && (
            <div className="file-preview-card">
              <div className="preview-header">
                <span className="file-tag">FILE DETAILS</span>
                <strong>{selectedFile.name}</strong>
              </div>
              <p className="preview-desc">{selectedFile.desc || 'Source file component.'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Vanilla Command Equivalent */}
      {commandSnippet && (
        <div className="command-section">
          <div className="section-header">
            <span className="section-title">{commandSnippet.title || 'VANILLA COMMAND SNIPPET'}</span>
            <button
              type="button"
              className="copy-btn"
              onClick={() => handleCopy(commandSnippet.command)}
            >
              {copied ? '✓ COPIED!' : '📋 COPY'}
            </button>
          </div>
          <pre className="command-box">
            <code>{commandSnippet.command}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
