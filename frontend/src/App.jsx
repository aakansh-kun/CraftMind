import React, { useState, useRef, useEffect } from 'react';
import TopHUD from './components/TopHUD';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import VisualizationPanel from './components/VisualizationEngine/VisualizationPanel';
import { parseVisualizationData } from './components/VisualizationEngine/visualizationParser';

const API_BASE = (import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== '')
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
  : (import.meta.env.DEV ? 'http://localhost:8000' : '');

export default function App() {
  // Generate a brand new session ID on each page load/mount
  const [sessionId, setSessionId] = useState(() => `s-${Math.random().toString(36).substring(2, 10)}`);

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [activeMode, setActiveMode] = useState('BUILD');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [simulateFailure, setSimulateFailure] = useState('');

  // Sessions history state
  const [sessions, setSessions] = useState([]);

  // Visualization state
  const [activeVisualization, setActiveVisualization] = useState(null);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, error]);

  // Fetch recent sessions list from backend SQLite
  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_BASE}/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (e) {
      console.warn('Failed to fetch sessions from backend:', e);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Start fresh session
  const handleNewSession = () => {
    setSessionId(`s-${Math.random().toString(36).substring(2, 10)}`);
    setMessages([]);
    setActiveVisualization(null);
    setIsVisualizerOpen(false);
    setError(null);
    fetchSessions();
  };

  // Open an existing session from Recent Chats
  const handleSelectSession = async (session) => {
    if (!session || !session.id) return;
    setError(null);
    setLoading(true);

    try {
      // 1. Fetch conversation messages
      const msgRes = await fetch(`${API_BASE}/sessions/${session.id}/messages`);
      if (msgRes.ok) {
        const data = await msgRes.json();
        const loadedMessages = (data.messages || []).map((m, idx) => {
          let viz = null;
          if (m.role === 'assistant') {
            viz = parseVisualizationData(m.content, '', session.mode || 'BUILD');
          }
          return {
            id: Date.now() + idx,
            role: m.role,
            content: m.content,
            metadata: m.metadata,
            visualization: viz,
          };
        });

        setSessionId(session.id);
        setActiveMode(session.mode || 'BUILD');
        setMessages(loadedMessages);

        // 2. Fetch any stored visualization from SQLite
        try {
          const vizRes = await fetch(`${API_BASE}/sessions/${session.id}/visualization`);
          if (vizRes.ok) {
            const vizJson = await vizRes.json();
            if (vizJson && vizJson.data) {
              setActiveVisualization(vizJson.data);
              setIsVisualizerOpen(true);
            }
          } else {
            // Check if any loaded message has visualization
            const lastAssistantViz = loadedMessages.slice().reverse().find(m => m.visualization)?.visualization;
            if (lastAssistantViz) {
              setActiveVisualization(lastAssistantViz);
              setIsVisualizerOpen(true);
            } else {
              setActiveVisualization(null);
              setIsVisualizerOpen(false);
            }
          }
        } catch (vizErr) {
          console.warn('Could not load session visualization:', vizErr);
        }
      } else {
        setError(`Could not load session (${msgRes.status})`);
      }
    } catch (err) {
      setError(`Network error loading session history: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete a session from SQLite
  const handleDeleteSession = async (targetSessionId) => {
    try {
      const res = await fetch(`${API_BASE}/sessions/${targetSessionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (targetSessionId === sessionId) {
          handleNewSession();
        } else {
          fetchSessions();
        }
      }
    } catch (err) {
      console.warn('Failed to delete session:', err);
    }
  };

  const handleSelectPrompt = (promptText) => {
    setInputMessage(promptText);
  };

  const handleOpenVisualizer = (vizData) => {
    setActiveVisualization(vizData);
    setIsVisualizerOpen(true);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmed = inputMessage.trim();
    if (!trimmed || loading) return;

    setError(null);
    const userMsg = {
      role: 'user',
      content: trimmed,
      id: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (simulateFailure) {
        headers['X-Simulate-Failure'] = simulateFailure;
      }

      const bodyPayload = {
        session_id: sessionId,
        message: trimmed,
        mode: activeMode,
      };
      if (systemPrompt.trim()) {
        bodyPayload.system_prompt = systemPrompt.trim();
      }

      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorDetail = 'An error occurred';
        if (data && data.detail) {
          if (Array.isArray(data.detail)) {
            errorDetail = data.detail.map((err) => `${err.loc?.join('.') || 'field'}: ${err.msg}`).join('; ');
          } else {
            errorDetail = String(data.detail);
          }
        }
        setError(`Error (${response.status}): ${errorDetail}`);
      } else {
        // Parse structured visualization data
        const viz = parseVisualizationData(data.reply, trimmed, activeMode);

        const assistantMsg = {
          role: 'assistant',
          content: data.reply,
          metadata: data.metadata,
          visualization: viz,
          id: Date.now() + 1,
        };

        setMessages((prev) => [...prev, assistantMsg]);

        // Auto-open visualizer if structured blueprint was detected
        if (viz) {
          setActiveVisualization(viz);
          setIsVisualizerOpen(true);

          // Persist visualization into SQLite database
          fetch(`${API_BASE}/sessions/${sessionId}/visualization`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: activeMode, data: viz }),
          }).catch((err) => console.warn('Failed to persist visualization:', err));
        }

        // Refresh recent sessions so title appears in sidebar
        fetchSessions();
      }
    } catch (err) {
      setError(`Network error: Could not reach CraftMind backend at ${API_BASE}. Verify the server is running.`);
    } finally {
      setLoading(false);
    }
  };

  const getLoadingMessage = () => {
    switch (activeMode) {
      case 'BUILD':
        return 'CRAFTMIND IS PLANNING BLUEPRINT & GATHERING MATERIALS...';
      case 'REDSTONE':
        return 'ANALYZING REDSTONE CIRCUIT & LOGIC PATHS...';
      case 'SURVIVAL':
        return 'CALCULATING EXPEDITION PROGRESSION & GEAR READINESS...';
      case 'CREATE':
        return 'COMPILING MOD ARCHITECTURE & REGISTRY DEFINITIONS...';
      default:
        return 'CRAFTMIND IS THINKING...';
    }
  };

  return (
    <div className="craftmind-app">
      {/* Top HUD */}
      <TopHUD
        activeMode={activeMode}
        hasVisualizer={Boolean(activeVisualization)}
        isVisualizerOpen={isVisualizerOpen}
        onToggleVisualizer={() => setIsVisualizerOpen(!isVisualizerOpen)}
        sessionId={sessionId}
      />

      {/* Main 3-Region Workspace */}
      <div className={`workspace-layout ${isVisualizerOpen && activeVisualization ? 'with-visualizer' : ''}`}>
        {/* Left Sidebar */}
        <Sidebar
          activeMode={activeMode}
          onSelectMode={(mode) => setActiveMode(mode)}
          onSelectPrompt={handleSelectPrompt}
          onNewSession={handleNewSession}
          sessions={sessions}
          currentSessionId={sessionId}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          systemPrompt={systemPrompt}
          onSystemPromptChange={setSystemPrompt}
          simulateFailure={simulateFailure}
          onSimulateFailureChange={setSimulateFailure}
        />

        {/* Center: Chat Window */}
        <main className="chat-viewport">
          <div className="chat-messages-scroll">
            {messages.length === 0 ? (
              <div className="empty-state-hero">
                <div className="hero-block-logo">⛏️</div>
                <h2 className="hero-title">CRAFTMIND COMPANION</h2>
                <p className="hero-subtitle">
                  Your expert AI companion for Minecraft architectural construction, redstone engineering, survival mastery, and mod development.
                </p>

                <div className="hero-modes-row">
                  <div className="hero-card" onClick={() => setActiveMode('BUILD')}>
                    <span className="card-icon">🧱</span>
                    <strong>BUILD MODE</strong>
                    <span>Interactive 3D layer slicer & material manifests</span>
                  </div>
                  <div className="hero-card" onClick={() => setActiveMode('REDSTONE')}>
                    <span className="card-icon">⚡</span>
                    <strong>REDSTONE MODE</strong>
                    <span>Logic gates, lever simulation & signal graphs</span>
                  </div>
                  <div className="hero-card" onClick={() => setActiveMode('SURVIVAL')}>
                    <span className="card-icon">🗡️</span>
                    <strong>SURVIVAL MODE</strong>
                    <span>Boss checklists & dynamic readiness gauge</span>
                  </div>
                  <div className="hero-card" onClick={() => setActiveMode('CREATE')}>
                    <span className="card-icon">⚙️</span>
                    <strong>CREATE MODE</strong>
                    <span>Mod lifecycle, file trees & technical syntax</span>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onOpenVisualizer={handleOpenVisualizer}
                />
              ))
            )}

            {/* AI Loading State */}
            {loading && (
              <div className="chat-row row-assistant">
                <div className="message-bubble bubble-assistant loading-bubble">
                  <div className="loading-content">
                    <span className="loading-pixel-cube">⛏️</span>
                    <span className="loading-text">{getLoadingMessage()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="error-banner">
                <span className="error-icon">⚠️</span>
                <div className="error-text">
                  <strong>AI CORE NOTICE:</strong> {error}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Prompt Input */}
          <footer className="chat-input-bar">
            <form className="chat-form" onSubmit={handleSendMessage}>
              <input
                data-testid="chat-input"
                type="text"
                className="chat-text-input"
                placeholder={`Ask CraftMind in ${activeMode} mode (e.g., "${activeMode === 'BUILD' ? 'How do I build an iron farm?' : activeMode === 'REDSTONE' ? 'Show me a 2x2 piston door circuit' : activeMode === 'SURVIVAL' ? 'Ender Dragon preparation checklist' : 'Custom sword mod structure'}")`}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={loading}
                autoFocus
              />
              <button
                data-testid="send-button"
                type="submit"
                className="chat-send-btn"
                disabled={loading || !inputMessage.trim()}
              >
                {loading ? 'CRAFTING...' : 'SEND ➤'}
              </button>
            </form>
          </footer>
        </main>

        {/* Right: Contextual Visualizer Panel */}
        {isVisualizerOpen && activeVisualization && (
          <aside className="visualizer-aside">
            <VisualizationPanel
              data={activeVisualization}
              mode={activeMode}
              onClose={() => setIsVisualizerOpen(false)}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
