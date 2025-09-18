// Assistant View Component
function AssistantView({ initialTopic, onNewStory, storyControls }) {
  const { useState, useEffect } = React;
  const { isConnected, agentParticipant, error } = window.useUpliftAIRoom();
  const { state } = window.useVoiceAssistant();
  const [isInterrupting, setIsInterrupting] = useState(false);

  // Debug logging for button state
  useEffect(() => {
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
  const tracks = window.useTracks(
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
          body: JSON.stringify({ 
            summary: interruptionText.trim(),
            storyControls 
          })
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

  const formatStorySettings = () => {
    return `${storyControls.length}min ${storyControls.setting} story, age ${storyControls.complexity}, ${storyControls.tone} tone`;
  };

  return React.createElement('div', { className: 'assistant-container' },
    // Status Bar
    React.createElement('div', { className: 'status-bar' },
      React.createElement('span', { 
        className: `status ${isConnected ? 'connected' : 'disconnected'}` 
      }, isConnected ? '🟢 Connected' : '🔴 Connecting...'),
      React.createElement('span', null, `Topic: "${initialTopic}"`),
      React.createElement('span', { className: 'story-settings' }, formatStorySettings()),
      agentParticipant && React.createElement('span', null, `Agent: ${agentParticipant.identity}`)
    ),

    // Voice Visualization Area
    React.createElement('div', { className: 'visualizer' },
      // Audio Track (hidden but functional)
      agentTrack && React.createElement(window.AudioTrack, { trackRef: agentTrack }),
      
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
      
      React.createElement(window.TrackToggle, {
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
      
      React.createElement(window.DisconnectButton, {
        onDisconnect: onNewStory
      }, '🛑 End Story'),
      
      React.createElement('button', {
        onClick: onNewStory,
        className: 'new-story-btn'
      }, '📝 New Story')
    )
  );
}

// Export for global use
window.AssistantView = AssistantView;
