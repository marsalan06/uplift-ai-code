# Story Controls Documentation

## Overview
The Story Teller MVP now includes advanced story customization options that allow users to personalize their storytelling experience while maintaining G-rated, child-safe content.

## Story Control Parameters

### 1. **Length** (1-5 minutes)
- **Default**: 3 minutes
- **Description**: Controls the approximate duration of the spoken story
- **Implementation**: Generates length-specific instructions for the AI

### 2. **Setting** (Dropdown)
- **Options**:
  - `fantasy` - Magical worlds with enchanted forests, castles, magical creatures
  - `space` - Outer space, planets, space stations, exploration adventures
  - `modern` - Present day settings: homes, schools, parks, cities
  - `history` - Historical time periods with accurate, age-appropriate elements
  - `religious` - Positive religious themes teaching kindness and moral lessons
  - `leaders` - Inspirational world leaders, inventors, historical figures
  - `underwater` - Sea creatures, coral reefs, submarines, ocean adventures
  - `forest` - Natural settings with wildlife, trees, camping, nature exploration
  - `city` - Urban environments with neighborhoods, community helpers

### 3. **Main Character** (Text Input)
- **Default**: Auto-generated based on topic
- **Description**: Allows custom character specification
- **Examples**: "brave little mouse", "curious robot", "wise owl"
- **Fallback**: If empty, generates character based on topic keywords

### 4. **Tone & Style** (Dropdown)
- **Options**:
  - `kindergarten` - Simple words, short sentences, playful tone, sounds, repetition
  - `elementary` - Clear, engaging language with descriptive words and exciting moments
  - `middle` - Richer vocabulary, complex sentences, detailed descriptions, character development
  - `lecture` - Educational language with facts woven in, clear concept explanations

### 5. **Age Complexity** (6-20 years, Slider)
- **Default**: 8 years
- **Description**: Adjusts vocabulary, sentence complexity, and concept difficulty
- **Implementation**: Works with tone to create age-appropriate content

### 6. **Include Summary** (Checkbox)
- **Default**: false
- **Description**: Adds educational summary at story end with key lessons/facts

## Protected Guardrails (Unchangeable)

The following safety measures are hardcoded and cannot be modified by users:

- ✅ **100% G-rated content**
- ✅ **No violence, politics, medical or financial advice**
- ✅ **Child-safe themes only**
- ✅ **Positive, educational values**
- ✅ **Age-appropriate language**

## API Integration

### Request Format
```javascript
POST /session/adhoc
{
  "topic": "moon adventure",
  "storyControls": {
    "length": 3,
    "setting": "space",
    "mainCharacter": "brave astronaut",
    "tone": "kindergarten",
    "complexity": 8,
    "includeSummary": false
  }
}
```

### Generated Instructions
The server combines all parameters into comprehensive AI instructions:

1. **Base Guardrails** - Safety and content restrictions
2. **Tone Instructions** - Language complexity and style based on tone + age
3. **Setting Context** - Environment and world-building details
4. **Character Instructions** - Main character description and traits
5. **Length Instructions** - Story duration guidance
6. **Behavior Instructions** - Story initiation and flow
7. **Summary Instructions** - Optional educational wrap-up

## Example Generated Instruction

For a space adventure with kindergarten tone for age 8:

```
You are StoryTeller: 100% G-rated, child-safe. No violence, politics, medical or financial advice. All content must be positive, educational, and appropriate for children. 

Use very simple words, short sentences, and a playful, excited tone. Include sounds, repetition, and interactive elements. Make it very simple for age 8. 

Tell a story that lasts approximately 3 minutes when spoken aloud. 

You will immediately start telling a story about "moon adventure". Set the story in outer space, on distant planets, space stations, or during space exploration adventures. The main character should be a curious young astronaut or space explorer. Begin speaking as soon as you connect. Do not wait for user input.
```

## UI Components

### StoryControls.js
- Collapsible advanced options panel
- Range sliders for length and age
- Dropdowns for setting and tone
- Text input for character
- Checkbox for summary option

### ConnectScreen.js
- Integrates story controls into main connection screen
- Shows/hides advanced options
- Validates inputs before submission

## Future Enhancements

Potential additions while maintaining safety:
- Story templates/presets
- Voice speed control
- Background music options
- Multi-part story series
- Character voice variations
- Interactive story branches
