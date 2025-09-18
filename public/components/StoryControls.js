// Story Controls Component
function StoryControls({ storyControls, setStoryControls, showAdvanced, setShowAdvanced }) {
  const { useState } = React;

  const settingOptions = [
    { value: 'fantasy', label: 'Fantasy World' },
    { value: 'space', label: 'Space Adventure' },
    { value: 'modern', label: 'Modern Day' },
    { value: 'history', label: 'Historical' },
    { value: 'religious', label: 'Religious Events' },
    { value: 'leaders', label: 'World Leaders & Inspirations' },
    { value: 'underwater', label: 'Underwater' },
    { value: 'forest', label: 'Forest/Nature' },
    { value: 'city', label: 'City Life' }
  ];

  const toneOptions = [
    { value: 'kindergarten', label: 'Kindergarten (Simple & Fun)' },
    { value: 'elementary', label: 'Elementary (Engaging)' },
    { value: 'middle', label: 'Middle School (Detailed)' },
    { value: 'lecture', label: 'Lecture (Educational)' }
  ];

  const updateControl = (key, value) => {
    setStoryControls(prev => ({ ...prev, [key]: value }));
  };

  return React.createElement('div', { className: 'story-controls' },
    // Advanced Options Toggle
    React.createElement('button', {
      onClick: () => setShowAdvanced(!showAdvanced),
      className: 'advanced-toggle',
      type: 'button'
    }, showAdvanced ? '▼ Hide Advanced Options' : '▶ Show Advanced Options'),

    // Advanced Options Panel
    showAdvanced && React.createElement('div', { className: 'advanced-panel' },
      // Story Length
      React.createElement('div', { className: 'control-group' },
        React.createElement('label', null, 'Story Length: ', storyControls.length, ' minutes'),
        React.createElement('input', {
          type: 'range',
          min: 1,
          max: 5,
          step: 0.5,
          value: storyControls.length,
          onChange: (e) => updateControl('length', parseFloat(e.target.value)),
          className: 'slider'
        })
      ),

      // Setting
      React.createElement('div', { className: 'control-group' },
        React.createElement('label', null, 'Setting:'),
        React.createElement('select', {
          value: storyControls.setting,
          onChange: (e) => updateControl('setting', e.target.value),
          className: 'select-input'
        }, settingOptions.map(option =>
          React.createElement('option', { 
            key: option.value, 
            value: option.value 
          }, option.label)
        ))
      ),

      // Main Character
      React.createElement('div', { className: 'control-group' },
        React.createElement('label', null, 'Main Character:'),
        React.createElement('input', {
          type: 'text',
          value: storyControls.mainCharacter,
          onChange: (e) => updateControl('mainCharacter', e.target.value),
          placeholder: 'e.g., brave little mouse, curious robot, wise owl',
          className: 'text-input'
        })
      ),

      // Tone
      React.createElement('div', { className: 'control-group' },
        React.createElement('label', null, 'Tone & Style:'),
        React.createElement('select', {
          value: storyControls.tone,
          onChange: (e) => updateControl('tone', e.target.value),
          className: 'select-input'
        }, toneOptions.map(option =>
          React.createElement('option', { 
            key: option.value, 
            value: option.value 
          }, option.label)
        ))
      ),

      // Age Complexity
      React.createElement('div', { className: 'control-group' },
        React.createElement('label', null, 'Age Level: ', storyControls.complexity, ' years'),
        React.createElement('input', {
          type: 'range',
          min: 6,
          max: 20,
          step: 1,
          value: storyControls.complexity,
          onChange: (e) => updateControl('complexity', parseInt(e.target.value)),
          className: 'slider'
        })
      ),

      // Include Summary
      React.createElement('div', { className: 'control-group checkbox-group' },
        React.createElement('label', null,
          React.createElement('input', {
            type: 'checkbox',
            checked: storyControls.includeSummary,
            onChange: (e) => updateControl('includeSummary', e.target.checked)
          }),
          ' Include story summary at the end'
        )
      )
    )
  );
}

// Export for global use
window.StoryControls = StoryControls;
