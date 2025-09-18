// Connect Screen Component
function ConnectScreen({ 
  topic, 
  setTopic, 
  onConnect, 
  loading, 
  error, 
  storyControls, 
  setStoryControls, 
  showAdvanced, 
  setShowAdvanced 
}) {
  return React.createElement('div', { className: 'connect-screen' },
    React.createElement('h1', null, '📚 Story Teller MVP'),
    React.createElement('p', null, 'Enter a topic and I\'ll tell you a G-rated story with voice!'),
    
    // LiveKit Status
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
    
    // Topic Input
    React.createElement('input', {
      type: 'text',
      placeholder: 'Enter a topic (e.g., "a moon adventure")',
      value: topic,
      onChange: (e) => setTopic(e.target.value),
      onKeyPress: (e) => e.key === 'Enter' && !loading && onConnect(),
      disabled: loading || window.livekitLoadFailed,
      className: 'topic-input'
    }),

    // Story Controls
    React.createElement(window.StoryControls, {
      storyControls,
      setStoryControls,
      showAdvanced,
      setShowAdvanced
    }),
    
    // Connect Button
    React.createElement('button', {
      onClick: onConnect,
      disabled: loading || !topic.trim() || window.livekitLoadFailed,
      className: loading ? 'loading connect-btn' : 'connect-btn'
    }, loading ? 'Creating Story Session...' : 'Start Story'),
    
    // Error Display
    error && React.createElement('div', { className: 'error' }, '❌ ', error),
    
    // Instructions
    React.createElement('div', { className: 'instructions' },
      React.createElement('h3', null, 'How it works:'),
      React.createElement('ul', null,
        React.createElement('li', null, 'Enter any topic for a G-rated story'),
        React.createElement('li', null, 'Customize your story with advanced options'),
        React.createElement('li', null, 'The AI will tell you a personalized story with voice'),
        React.createElement('li', null, 'You can interrupt and add twists to the story'),
        React.createElement('li', null, 'All stories are kid-safe and family-friendly')
      )
    )
  );
}

// Export for global use
window.ConnectScreen = ConnectScreen;
