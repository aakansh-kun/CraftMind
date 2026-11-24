import React, { useState } from 'react';

const MODE_DEFINITIONS = [
  {
    id: 'BUILD',
    label: 'BUILD',
    icon: '🧱',
    desc: 'Blueprints, palettes, layers, step-by-step',
    samplePrompts: [
      'How do I build an iron farm?',
      'Give me step-by-step instructions to build a simple starter house.',
      'Help me build a medieval tower.'
    ]
  },
  {
    id: 'REDSTONE',
    label: 'REDSTONE',
    icon: '⚡',
    desc: 'Circuits, logic gates, clocks, mechanisms',
    samplePrompts: [
      'Show me how to build a 2x2 piston door.',
      'Create a simple Redstone lamp circuit.',
      'How does a redstone comparator work?'
    ]
  },
  {
    id: 'SURVIVAL',
    label: 'SURVIVAL',
    icon: '🗡️',
    desc: 'Progression, gear checklists, boss preparation',
    samplePrompts: [
      'Give me a progression plan for defeating the Ender Dragon.',
      'What should I bring to the Nether?',
      'Early game survival checklist.'
    ]
  },
  {
    id: 'CREATE',
    label: 'CREATE',
    icon: '⚙️',
    desc: 'Modding, datapacks, commands, technical',
    samplePrompts: [
      'Show me the architecture for a simple Minecraft mod that adds a custom sword.',
      'Help me create a Minecraft command that gives the player Speed II.',
      'How do I register a custom block in Fabric?'
    ]
  }
];

const MODE_ICONS = {
  BUILD: '🧱',
  REDSTONE: '⚡',
  SURVIVAL: '🗡️',
  CREATE: '⚙️'
};

function formatSessionTime(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
}

function groupSessions(sessions) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const startOfYesterday = startOfToday - oneDayMs;
  const startOfSevenDays = startOfToday - 7 * oneDayMs;

  const groups = {
    TODAY: [],
    YESTERDAY: [],
    'PREVIOUS 7 DAYS': [],
    OLDER: []
  };

  sessions.forEach((s) => {
    const t = new Date(s.updated_at || s.created_at).getTime();
    if (isNaN(t)) {
      groups.OLDER.push(s);
    } else if (t >= startOfToday) {
      groups.TODAY.push(s);
    } else if (t >= startOfYesterday) {
      groups.YESTERDAY.push(s);
    } else if (t >= startOfSevenDays) {
      groups['PREVIOUS 7 DAYS'].push(s);
    } else {
      groups.OLDER.push(s);
    }
  });

  return groups;
}

export default function Sidebar({
  activeMode,
  onSelectMode,
  onSelectPrompt,
  onNewSession,
  sessions = [],
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  systemPrompt,
  onSystemPromptChange,
  simulateFailure,
  onSimulateFailureChange
}) {
  const [showDevTools, setShowDevTools] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [showAllSessions, setShowAllSessions] = useState(false);

  const currentModeDef = MODE_DEFINITIONS.find((m) => m.id === activeMode) || MODE_DEFINITIONS[0];

  const grouped = groupSessions(sessions);
  const displayedSessionsCount = sessions.length;
  const hasMultipleSessions = displayedSessionsCount > 10;

  return (
    <aside className="craftmind-sidebar">
      {/* 1. Companion Modes */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">COMPANION MODES</div>
        <div className="mode-stack">
          {MODE_DEFINITIONS.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={`mode-card ${activeMode === mode.id ? 'active' : ''}`}
              onClick={() => onSelectMode(mode.id)}
            >
              <div className="mode-card-header">
                <span className="mode-card-icon">{mode.icon}</span>
                <span className="mode-card-label">{mode.label}</span>
              </div>
              <div className="mode-card-desc">{mode.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Recent Chats Section */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">RECENT CHATS</div>

        {/* + NEW CHAT Button */}
        <button
          type="button"
          className="new-chat-top-btn"
          onClick={onNewSession}
          title="Start fresh active conversation"
        >
          <span>＋</span> NEW CHAT
        </button>

        {/* Grouped Sessions List */}
        <div className="recent-chats-container">
          {sessions.length === 0 ? (
            <div className="empty-history-hint" style={{ fontSize: '0.68rem', color: 'var(--text-muted)', padding: '0.4rem 0.2rem' }}>
              No recent conversations yet.
            </div>
          ) : (
            Object.entries(grouped).map(([groupTitle, list]) => {
              if (!list || list.length === 0) return null;
              return (
                <div key={groupTitle} className="recent-group">
                  <div className="recent-group-title">{groupTitle}</div>
                  {list.slice(0, showAllSessions ? 50 : 8).map((sess) => {
                    const isActive = sess.id === currentSessionId;
                    const modeIcon = MODE_ICONS[sess.mode] || '🧱';
                    const timeFormatted = formatSessionTime(sess.updated_at || sess.created_at);

                    return (
                      <div
                        key={sess.id}
                        className={`session-item ${isActive ? 'active' : ''}`}
                        onClick={() => onSelectSession(sess)}
                        title={`Open chat: ${sess.title}`}
                      >
                        <div className="session-item-left">
                          <span className="session-mode-icon">{modeIcon}</span>
                          <div className="session-text-stack">
                            <span className="session-title">{sess.title}</span>
                            {timeFormatted && <span className="session-time">{timeFormatted}</span>}
                          </div>
                        </div>

                        {/* Delete Session Button */}
                        <button
                          type="button"
                          className="session-del-btn"
                          title="Delete conversation"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSessionToDelete(sess);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}

          {hasMultipleSessions && (
            <button
              type="button"
              className="show-more-sessions-btn"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.62rem',
                cursor: 'pointer',
                textAlign: 'left',
                padding: '0.3rem 0.2rem'
              }}
              onClick={() => setShowAllSessions(!showAllSessions)}
            >
              {showAllSessions ? '▲ SHOW FEWER' : `▼ SHOW MORE (${displayedSessionsCount} TOTAL)`}
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div
          className="delete-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}
          onClick={() => setSessionToDelete(null)}
        >
          <div
            className="delete-modal-box"
            style={{
              background: '#1a1d24',
              border: '2px solid #ef4444',
              borderRadius: '6px',
              padding: '1.25rem',
              maxWidth: '360px',
              width: '90%',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ color: '#ef4444', fontSize: '0.95rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              ⚠️ DELETE CONVERSATION
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '1rem', lineHeight: '1.4' }}>
              Are you sure you want to delete <strong>"{sessionToDelete.title}"</strong>?
              This will permanently remove all messages and saved blueprint visualizations from SQLite.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-main)',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.72rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => setSessionToDelete(null)}
              >
                CANCEL
              </button>
              <button
                type="button"
                style={{
                  background: '#ef4444',
                  border: 'none',
                  color: '#ffffff',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  onDeleteSession(sessionToDelete.id);
                  setSessionToDelete(null);
                }}
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Mode Quick Prompts */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">{activeMode} BLUEPRINT IDEAS</div>
        <div className="prompt-suggestions">
          {currentModeDef.samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              className="prompt-chip"
              onClick={() => onSelectPrompt(prompt)}
            >
              <span className="chip-arrow">➔</span>
              <span className="chip-text">{prompt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Collapsible Developer Tools / Advanced Panel */}
      <div className="sidebar-section devtools-container">
        <button
          type="button"
          className="devtools-toggle"
          onClick={() => setShowDevTools(!showDevTools)}
        >
          {showDevTools ? '▲ HIDE DEVELOPER TOOLS' : '▼ DEVELOPER TOOLS / FAILOVER'}
        </button>

        {showDevTools && (
          <div className="devtools-panel">
            <div className="dev-group">
              <label className="dev-label">Custom System Prompt:</label>
              <textarea
                data-testid="system-prompt-input"
                className="dev-textarea"
                placeholder="Override CraftMind system prompt (optional)..."
                value={systemPrompt}
                onChange={(e) => onSystemPromptChange(e.target.value)}
              />
            </div>

            <div className="dev-group">
              <label className="dev-label">Failure Simulation (X-Simulate-Failure):</label>
              <select
                className="dev-select"
                value={simulateFailure}
                onChange={(e) => onSimulateFailureChange(e.target.value)}
              >
                <option value="">None (Normal Live Inference)</option>
                <option value="key_1=429">key_1=429 (Gemini 429 -&gt; Groq Fallback)</option>
                <option value="key_1=500">key_1=500 (Gemini 500 -&gt; Groq Fallback)</option>
                <option value="*=429">*=429 (All Keys Fail -&gt; 503)</option>
                <option value="key_1=429,key_2=500">key_1=429,key_2=500 (All Fail -&gt; 503)</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
