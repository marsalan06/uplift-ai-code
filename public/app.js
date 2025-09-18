const { useState } = React;

// Error Boundary Component for React 18
window.ErrorBoundary = class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return React.createElement('div', { className: 'error-view' },
        React.createElement('h2', null, '❌ Application Error'),
        React.createElement('p', null, 'Something went wrong in the application.'),
        React.createElement('details', { style: { whiteSpace: 'pre-wrap', marginTop: '10px' } },
          React.createElement('summary', null, 'Error Details'),
          this.state.error && this.state.error.toString(),
          React.createElement('br'),
          this.state.errorInfo.componentStack
        ),
        React.createElement('button', {
          onClick: () => {
            this.setState({ hasError: false, error: null, errorInfo: null });
            window.location.reload();
          },
          className: 'connect-btn',
          style: { marginTop: '20px' }
        }, 'Reload Application')
      );
    }

    return this.props.children;
  }
};

// Main App Component (simplified and modular)
function App() {
  const [sessionData, setSessionData] = useState(null);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Advanced story controls
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [storyControls, setStoryControls] = useState({
    length: 3, // minutes
    setting: 'fantasy',
    mainCharacter: '',
    tone: 'kindergarten',
    complexity: 8, // age
    includeSummary: false
  });

  const connectToAssistant = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic first');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Use server endpoint for adhoc sessions with story controls
      const response = await fetch('/session/adhoc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          topic,
          storyControls: {
            ...storyControls,
            mainCharacter: storyControls.mainCharacter || `character from ${topic}`
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create session: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Session created:', data);
      setSessionData(data);
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionEnd = () => {
    setSessionData(null);
    setError(null);
  };

  // Show connect screen if no session
  if (!sessionData) {
    return React.createElement(window.ConnectScreen, {
      topic,
      setTopic,
      onConnect: connectToAssistant,
      loading,
      error,
      storyControls,
      setStoryControls,
      showAdvanced,
      setShowAdvanced
    });
  }

  // Show assistant view when connected
  return React.createElement(window.UpliftAIRoom, {
    token: sessionData.token,
    serverUrl: sessionData.wsUrl,
    connect: true,
    audio: true,
    video: false,
    onSessionEnd: handleSessionEnd
  }, React.createElement(window.AssistantView, { 
    initialTopic: topic,
    onNewStory: () => setSessionData(null),
    storyControls
  }));
}

// Enhanced styles for the new components
const styles = `
/* Connect Screen Styles */
.connect-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 20px;
  padding: 20px;
  text-align: center;
}

.connect-screen h1 {
  color: #2563eb;
  margin-bottom: 10px;
  font-size: 2.5rem;
}

.connect-screen p {
  color: #6b7280;
  font-size: 1.1rem;
  margin-bottom: 20px;
}

.topic-input {
  padding: 15px;
  font-size: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  width: 350px;
  max-width: 90vw;
  transition: border-color 0.2s;
}

.topic-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.connect-btn {
  padding: 15px 30px;
  font-size: 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
}

.connect-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
}

.connect-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.connect-btn.loading {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
}

/* Story Controls Styles */
.story-controls {
  width: 100%;
  max-width: 500px;
  margin: 20px 0;
}

.advanced-toggle {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  padding: 10px 15px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
  transition: all 0.2s;
}

.advanced-toggle:hover {
  background: #e5e7eb;
}

.advanced-panel {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-top: 10px;
  text-align: left;
}

.control-group {
  margin-bottom: 15px;
}

.control-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.text-input, .select-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.text-input:focus, .select-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-group input[type="checkbox"] {
  width: auto;
}

/* LiveKit Status Styles */
.livekit-status {
  margin: 15px 0;
  padding: 10px;
  border-radius: 8px;
  font-weight: 500;
}

.status-success {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.status-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.status-loading {
  background: #fffbeb;
  color: #92400e;
  border: 1px solid #fed7aa;
}

.retry-btn {
  background: #dc2626;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-left: 10px;
}

.retry-btn:hover {
  background: #b91c1c;
}

/* Instructions Styles */
.instructions {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
  text-align: left;
  max-width: 500px;
}

.instructions h3 {
  color: #374151;
  margin-bottom: 10px;
}

.instructions ul {
  color: #6b7280;
  line-height: 1.6;
}

/* Error Styles */
.error {
  color: #dc2626;
  background: #fef2f2;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #fecaca;
  max-width: 400px;
}

.error-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 20px;
  text-align: center;
}

/* Assistant Container Styles */
.assistant-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 16px;
  margin-bottom: 30px;
  border: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 10px;
}

.status.connected {
  color: #16a34a;
  font-weight: 600;
}

.status.disconnected {
  color: #dc2626;
  font-weight: 600;
}

.story-settings {
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
}

.visualizer {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 60px 40px;
  margin: 30px 0;
  text-align: center;
  color: white;
  position: relative;
  overflow: hidden;
}

.visualizer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 70%);
  pointer-events: none;
}

.story-icon {
  font-size: 5rem;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
}

.agent-state {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 10px;
  position: relative;
  z-index: 1;
}

.story-tip {
  font-size: 1rem;
  opacity: 0.9;
  position: relative;
  z-index: 1;
}

/* Controls Styles */
.controls {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.controls button {
  padding: 12px 20px;
  font-size: 14px;
  border-radius: 10px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  font-weight: 500;
  min-width: 120px;
}

.track-toggle.enabled {
  background: #16a34a;
  color: white;
}

.track-toggle.disabled {
  background: #dc2626;
  color: white;
}

.interrupt-btn {
  background: #f59e0b;
  color: white;
}

.interrupt-btn:hover:not(:disabled) {
  background: #d97706;
  transform: translateY(-2px);
}

.interrupt-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

.disconnect-btn, .new-story-btn {
  background: #6366f1;
  color: white;
}

.enable-audio-btn {
  background: #10b981;
  color: white;
}

.enable-audio-btn:hover {
  background: #059669;
  transform: translateY(-2px);
}

.disconnect-btn:hover, .new-story-btn:hover {
  background: #4f46e5;
  transform: translateY(-2px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .status-bar {
    flex-direction: column;
    text-align: center;
  }
  
  .controls {
    flex-direction: column;
    align-items: center;
  }
  
  .controls button {
    width: 200px;
  }
  
  .advanced-panel {
    padding: 15px;
  }
  
  .topic-input {
    width: 90vw;
  }
}
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Render the app using React 18 createRoot API with Error Boundary
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(window.ErrorBoundary, null, React.createElement(App)));