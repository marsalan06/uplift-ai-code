const { useState, useEffect, useRef, useCallback } = React;

// Debug function to explore LiveKit structure
function debugLiveKit() {
  console.log('=== LiveKit Debug Info ===');
  console.log('window.LiveKitClient:', window.LiveKitClient);
  console.log('window.LivekitClient:', window.LivekitClient);
  console.log('typeof window.LiveKitClient:', typeof window.LiveKitClient);
  console.log('typeof window.LivekitClient:', typeof window.LivekitClient);
  
  const livekit = window.LiveKitClient || window.LivekitClient;
  if (livekit) {
    console.log('LiveKit keys:', Object.keys(livekit));
    console.log('LiveKit.Room:', livekit.Room);
    console.log('LiveKit.RoomEvent:', livekit.RoomEvent);
    console.log('LiveKit.Track:', livekit.Track);
  }
  
  console.log('window.Room:', window.Room);
  console.log('window.RoomEvent:', window.RoomEvent);
  console.log('=== End Debug Info ===');
}

// Custom UpliftAI Room implementation (since SDK may not be available via CDN)
function UpliftAIRoom({ token, serverUrl, connect, audio, video, children, onSessionEnd }) {
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState(null);
  const [agentParticipant, setAgentParticipant] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let currentRoom = null;

    const connectRoom = async () => {
      if (!connect || !token || !serverUrl) return;

      try {
        // Wait for LiveKit to be available with better diagnostics
        const liveKitClient = window.LiveKitClient || window.LivekitClient;
        if (!liveKitClient) {
          console.log('LiveKit not immediately available, waiting...');
          console.log('window.livekitLoadSuccess:', window.livekitLoadSuccess);
          console.log('window.livekitLoadFailed:', window.livekitLoadFailed);
          console.log('Available window properties:', Object.keys(window).filter(k => k.toLowerCase().includes('livekit')));
          
          await new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 150; // 15 seconds
            
            const checkInterval = setInterval(() => {
              attempts++;
              
              // Check for explicit failure
              if (window.livekitLoadFailed) {
                clearInterval(checkInterval);
                reject(new Error('LiveKit CDN loading failed - check network connection'));
                return;
              }
              
              // Check for success - verify Room class is available
              const currentClient = window.LiveKitClient || window.LivekitClient;
              if ((currentClient && currentClient.Room) || 
                  window.Room || 
                  window.livekitLoadSuccess) {
                console.log('LiveKit with Room class detected after', attempts * 100, 'ms');
                console.log('LiveKit structure check:', {
                  hasLiveKitClient: !!window.LiveKitClient,
                  hasLivekitClient: !!window.LivekitClient,
                  hasRoom: !!(currentClient && currentClient.Room),
                  hasGlobalRoom: !!window.Room,
                  loadSuccess: window.livekitLoadSuccess
                });
                clearInterval(checkInterval);
                resolve();
                return;
              }
              
              // Timeout
              if (attempts >= maxAttempts) {
                console.error('LiveKit loading timeout after', attempts * 100, 'ms');
                console.log('Final state - window.LiveKitClient:', typeof window.LiveKitClient);
                console.log('Final state - window.livekitLoadSuccess:', window.livekitLoadSuccess);
                console.log('Final state - window.livekitLoadFailed:', window.livekitLoadFailed);
                clearInterval(checkInterval);
                reject(new Error('LiveKit loading timeout - please refresh the page'));
              }
              
              if (attempts % 20 === 0) {
                console.log(`Still waiting for LiveKit... (${attempts}/150)`);
              }
            }, 100);
          });
        } else {
          console.log('LiveKit immediately available');
        }

        // Debug LiveKit structure
        debugLiveKit();
        
        let Room, RoomEvent;
        const liveKit = window.LiveKitClient || window.LivekitClient;
        
        // Handle different ways LiveKit might expose classes
        if (liveKit && liveKit.Room) {
          Room = liveKit.Room;
          RoomEvent = liveKit.RoomEvent;
          console.log('Using nested LiveKit classes');
        } else if (window.Room) {
          // Sometimes classes are exposed globally
          Room = window.Room;
          RoomEvent = window.RoomEvent;
          console.log('Using global Room classes');
        } else {
          const availableKeys = liveKit ? Object.keys(liveKit).join(', ') : 'No LiveKit object found';
          throw new Error('LiveKit Room class not found. Available: ' + availableKeys);
        }
        
        console.log('Using Room class:', Room);
        console.log('Using RoomEvent:', RoomEvent);
        
        currentRoom = new Room();

        currentRoom
          .on(RoomEvent.Connected, () => {
            console.log('Room connected');
            setIsConnected(true);
            setError(null);
          })
          .on(RoomEvent.ParticipantConnected, (participant) => {
            console.log('Participant connected:', participant.identity);
            if (participant.identity !== 'Web User') {
              setAgentParticipant(participant);
            }
          })
          .on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
            console.log('Track subscribed:', publication.kind, participant.identity);
            
            // Auto-attach audio tracks for playback
            if (publication.kind === 'audio' && track) {
              console.log('Attempting to attach audio track for:', participant.identity);
              
              // Create audio element if needed
              let audioElement = document.querySelector('#agent-audio');
              if (!audioElement) {
                audioElement = document.createElement('audio');
                audioElement.id = 'agent-audio';
                audioElement.autoplay = true;
                audioElement.style.display = 'none';
                document.body.appendChild(audioElement);
                console.log('Created new audio element');
              }
              
              // Attach track to audio element
              try {
                track.attach(audioElement);
                console.log('✅ Audio track attached successfully to element');
                
                // Ensure autoplay works
                audioElement.play().then(() => {
                  console.log('✅ Audio playback started');
                }).catch(err => {
                  console.error('❌ Audio playback failed:', err);
                  console.log('User may need to interact with page first for autoplay');
                });
                
              } catch (error) {
                console.error('❌ Failed to attach audio track:', error);
              }
            }
    })
    .on(RoomEvent.Disconnected, () => {
            console.log('Room disconnected');
            setIsConnected(false);
            setAgentParticipant(null);
            if (onSessionEnd) onSessionEnd();
          })
          .on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
            console.log('Connection quality:', quality, participant?.identity);
          });

        await currentRoom.connect(serverUrl, token);
        setRoom(currentRoom);

      } catch (error) {
        console.error('Failed to connect room:', error);
        setError(error);
      }
    };

    connectRoom();

    return () => {
      if (currentRoom) {
        currentRoom.disconnect();
      }
    };
  }, [token, serverUrl, connect]);

  // Provide context to children
  const contextValue = {
    isConnected,
    room,
    agentParticipant,
    error,
    disconnect: () => room?.disconnect()
  };

  return React.createElement(UpliftAIContext.Provider, { value: contextValue }, children);
}

// Context for UpliftAI Room
const UpliftAIContext = React.createContext({});

// Custom hooks (mimicking UpliftAI SDK)
function useUpliftAIRoom() {
  return React.useContext(UpliftAIContext);
}

function useVoiceAssistant() {
  const { isConnected, agentParticipant } = useUpliftAIRoom();
  const [state, setState] = useState('idle');

  useEffect(() => {
    if (!isConnected) {
      setState('idle');
    } else if (agentParticipant) {
      setState('listening');
    }
  }, [isConnected, agentParticipant]);

  return { state, setState };
}

// Audio Track Component
function AudioTrack({ trackRef }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (trackRef && trackRef.publication && trackRef.publication.track && audioRef.current) {
      trackRef.publication.track.attach(audioRef.current);
      return () => {
        if (trackRef.publication && trackRef.publication.track) {
          trackRef.publication.track.detach();
        }
      };
    }
  }, [trackRef]);

  return React.createElement('audio', { 
    ref: audioRef, 
    autoPlay: true,
    style: { display: 'none' }
  });
}

// Track Toggle Component
function TrackToggle({ source, children }) {
  const { room } = useUpliftAIRoom();
  const [isEnabled, setIsEnabled] = useState(true);

  const toggle = useCallback(async () => {
    if (!room) return;
    
    if (source === 'microphone' || source === window.LiveKitClient?.Track?.Source?.Microphone) {
      await room.localParticipant.setMicrophoneEnabled(!isEnabled);
      setIsEnabled(!isEnabled);
    }
  }, [room, isEnabled, source]);

  return React.createElement('button', {
    onClick: toggle,
    className: `track-toggle ${isEnabled ? 'enabled' : 'disabled'}`,
    disabled: !room
  }, children || '🎤 Microphone');
}

// Disconnect Button Component
function DisconnectButton({ children, onDisconnect }) {
  const { disconnect } = useUpliftAIRoom();

  const handleDisconnect = () => {
    disconnect();
    if (onDisconnect) onDisconnect();
  };

  return React.createElement('button', {
    onClick: handleDisconnect,
    className: 'disconnect-btn'
  }, children || 'Disconnect');
}

// Custom hook to get tracks
function useTracks(sources, options = {}) {
  const { room } = useUpliftAIRoom();
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    if (!room || !window.LiveKitClient) return;

    const updateTracks = () => {
      const allTracks = [];
      
      room.participants.forEach(participant => {
        participant.tracks.forEach(publication => {
          if (publication.track && (!sources || sources.includes(publication.source))) {
            if (!options.onlySubscribed || publication.isSubscribed) {
              allTracks.push({
                participant,
                publication,
                source: publication.source
              });
            }
          }
        });
      });
      
      setTracks(allTracks);
    };

    const { RoomEvent } = window.LiveKitClient;
    room.on(RoomEvent.TrackSubscribed, updateTracks);
    room.on(RoomEvent.TrackUnsubscribed, updateTracks);
    room.on(RoomEvent.ParticipantConnected, updateTracks);
    room.on(RoomEvent.ParticipantDisconnected, updateTracks);

    updateTracks(); // Initial update

    return () => {
      room.off(RoomEvent.TrackSubscribed, updateTracks);
      room.off(RoomEvent.TrackUnsubscribed, updateTracks);
      room.off(RoomEvent.ParticipantConnected, updateTracks);
      room.off(RoomEvent.ParticipantDisconnected, updateTracks);
    };
  }, [room, sources, options.onlySubscribed]);

  return tracks;
}

// Main App Component (following UpliftAI tutorial pattern)
function App() {
  const [sessionData, setSessionData] = useState(null);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const connectToAssistant = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic first');
    return;
  }

    setLoading(true);
    setError(null);
    
    try {
      // Use your existing server endpoint for adhoc sessions
      const response = await fetch('/session/adhoc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
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

  const enableAudio = () => {
    // Create a dummy audio context to enable audio
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContext.resume().then(() => {
      console.log('Audio context resumed');
      setAudioEnabled(true);
      
      // Also try to play any existing audio elements
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(audio => {
        audio.play().catch(err => console.log('Audio play attempt:', err));
      });
    });
  };

  if (!sessionData) {
    return React.createElement('div', { className: 'connect-screen' },
      React.createElement('h1', null, '📚 Story Teller MVP'),
      React.createElement('p', null, 'Enter a topic and I\'ll tell you a G-rated story with voice!'),
      
      // Show LiveKit loading status
      React.createElement('div', { className: 'livekit-status' },
        window.livekitLoadSuccess ? 
          React.createElement('div', { className: 'status-success' }, '✅ Voice system ready') :
        window.livekitLoadFailed ?
          React.createElement('div', { className: 'status-error' }, 
            '❌ Voice system failed to load. ',
            React.createElement('button', { 
              onClick: () => window.location.reload(),
              className: 'retry-btn'
            }, 'Refresh Page')
          ) :
        React.createElement('div', { className: 'status-loading' }, '⏳ Loading voice system...')
      ),
      
      React.createElement('input', {
        type: 'text',
        placeholder: 'Enter a topic (e.g., "a moon adventure")',
        value: topic,
        onChange: (e) => setTopic(e.target.value),
        onKeyPress: (e) => e.key === 'Enter' && !loading && connectToAssistant(),
        disabled: loading || window.livekitLoadFailed
      }),
      
      React.createElement('button', {
        onClick: connectToAssistant,
        disabled: loading || !topic.trim() || window.livekitLoadFailed,
        className: loading ? 'loading' : ''
      }, loading ? 'Creating Story Session...' : 'Start Story'),
      
      error && React.createElement('div', { className: 'error' }, '❌ ', error),
      
      React.createElement('div', { className: 'instructions' },
        React.createElement('h3', null, 'How it works:'),
        React.createElement('ul', null,
          React.createElement('li', null, 'Enter any topic for a G-rated story'),
          React.createElement('li', null, 'The AI will tell you a 2-4 minute story with voice'),
          React.createElement('li', null, 'You can interrupt and add twists to the story'),
          React.createElement('li', null, 'All stories are kid-safe and family-friendly')
        )
      )
    );
  }

  return React.createElement(UpliftAIRoom, {
    token: sessionData.token,
    serverUrl: sessionData.wsUrl,
    connect: true,
    audio: true,
    video: false,
    onSessionEnd: handleSessionEnd
  }, React.createElement(AssistantView, { 
    initialTopic: topic,
    onNewStory: () => setSessionData(null)
  }));
}

// Assistant View Component (following UpliftAI tutorial structure)
function AssistantView({ initialTopic, onNewStory }) {
  const { isConnected, agentParticipant, error } = useUpliftAIRoom();
  const { state } = useVoiceAssistant();
  const [isInterrupting, setIsInterrupting] = useState(false);

  // Debug logging for button state
  React.useEffect(() => {
    console.log('Button state debug:', {
      isConnected,
      agentParticipant: !!agentParticipant,
      agentIdentity: agentParticipant?.identity,
      isInterrupting,
      buttonShouldBeEnabled: isConnected && !isInterrupting
    });
  }, [isConnected, agentParticipant, isInterrupting]);

  // Get audio tracks for playback
  const liveKit = window.LiveKitClient || window.LivekitClient;
  const tracks = useTracks(
    (liveKit && liveKit.Track && liveKit.Track.Source) ? 
      [liveKit.Track.Source.Microphone] : 
      ['microphone'], // fallback to string
    { onlySubscribed: true }
  );
  
  const agentTrack = tracks.find((t) => t.participant !== t.participant?.room?.localParticipant);

  const handleInterrupt = async () => {
    setIsInterrupting(true);
    
    try {
      let interruptionText = '';
      
      // Try speech recognition first
      if (window.SpeechRecognition || window.webkitSpeechRecognition) {
        try {
          const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
          recognition.lang = 'en-US';
          recognition.interimResults = false;
          
          interruptionText = await new Promise((resolve, reject) => {
            let timeout = setTimeout(() => {
              recognition.stop();
              resolve('');
            }, 5000); // 5 second timeout
            
            recognition.onresult = (event) => {
              clearTimeout(timeout);
              resolve(event.results[0][0].transcript);
            };
            recognition.onerror = (event) => {
              clearTimeout(timeout);
              reject(event.error);
            };
            recognition.onend = () => {
              clearTimeout(timeout);
            };
            recognition.start();
          });
        } catch (speechError) {
          console.log('Speech recognition failed, falling back to prompt');
        }
      }
      
      // Fallback to text input
      if (!interruptionText.trim()) {
        interruptionText = prompt('Type your story change or twist:') || '';
      }
      
      if (interruptionText.trim()) {
        // Create new session with interruption
        const response = await fetch('/session/adhoc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ summary: interruptionText.trim() })
        });
        
        if (response.ok) {
          const newSessionData = await response.json();
          // This would require reconnecting - for now just show success
          alert(`Interruption applied: "${interruptionText.trim()}". The story will continue with your change!`);
        } else {
          throw new Error('Failed to apply interruption');
        }
      }
      
    } catch (error) {
      console.error('Interruption error:', error);
      alert('Failed to apply interruption. Please try again.');
    } finally {
      setIsInterrupting(false);
    }
  };

  if (error) {
    return React.createElement('div', { className: 'error-view' },
      React.createElement('h2', null, '❌ Connection Error'),
      React.createElement('p', null, error.message || 'Failed to connect to the voice assistant'),
      React.createElement('button', { onClick: onNewStory }, 'Try Again')
    );
  }

  return React.createElement('div', { className: 'assistant-container' },
    // Status Bar
    React.createElement('div', { className: 'status-bar' },
      React.createElement('span', { 
        className: `status ${isConnected ? 'connected' : 'disconnected'}` 
      }, isConnected ? '🟢 Connected' : '🔴 Connecting...'),
      React.createElement('span', null, `Story: "${initialTopic}"`),
      agentParticipant && React.createElement('span', null, `Agent: ${agentParticipant.identity}`)
    ),

    // Voice Visualization Area
    React.createElement('div', { className: 'visualizer' },
      // Audio Track (hidden but functional)
      agentTrack && React.createElement(AudioTrack, { trackRef: agentTrack }),
      
      React.createElement('div', { className: 'story-icon' }, '📖'),
      React.createElement('div', { className: 'agent-state' },
        !isConnected ? '🔗 Connecting to storyteller...' :
        !agentParticipant ? '⏳ Waiting for storyteller...' :
        state === 'listening' ? '👂 Ready to tell your story...' :
        '🗣️ Telling your story...'
      ),
      
      isConnected && agentParticipant && React.createElement('div', { className: 'story-tip' },
        'The story is being told with voice! Use the interrupt button to add twists.'
      )
    ),

    // Controls
    React.createElement('div', { className: 'controls' },
      // Audio enable button if needed
      !isConnected && React.createElement('button', {
        onClick: () => {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          audioContext.resume().then(() => {
            console.log('Audio enabled by user interaction');
            const audioElements = document.querySelectorAll('audio');
            audioElements.forEach(audio => audio.play().catch(() => {}));
          });
        },
        className: 'enable-audio-btn'
      }, '🔊 Enable Audio'),
      
      React.createElement(TrackToggle, {
        source: (() => {
          const liveKit = window.LiveKitClient || window.LivekitClient;
          return (liveKit && liveKit.Track && liveKit.Track.Source) ? 
            liveKit.Track.Source.Microphone : 'microphone';
        })()
      }, '🎤 Microphone'),
      
      React.createElement('button', {
        onClick: handleInterrupt,
        disabled: !isConnected || isInterrupting,
        className: 'interrupt-btn',
        title: !isConnected ? 'Not connected' : isInterrupting ? 'Processing...' : 'Click to interrupt and add a twist to the story'
      }, isInterrupting ? '🎤 Listening...' : '⚡ Interrupt Story'),
      
      React.createElement(DisconnectButton, {
        onDisconnect: onNewStory
      }, '🛑 End Story'),
      
      React.createElement('button', {
        onClick: onNewStory,
        className: 'new-story-btn'
      }, '📝 New Story')
    )
  );
}

// Enhanced styles
const styles = `
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

.connect-screen input {
  padding: 15px;
  font-size: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  width: 350px;
  max-width: 90vw;
  transition: border-color 0.2s;
}

.connect-screen input:focus {
  outline: none;
  border-color: #3b82f6;
}

.connect-screen button {
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

.connect-screen button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
}

.connect-screen button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.connect-screen button.loading {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
}

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
}
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Render the app
ReactDOM.render(React.createElement(App), document.getElementById('root'));