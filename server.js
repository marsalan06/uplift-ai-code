import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

const API = "https://api.upliftai.org/v1";
const { UPLIFTAI_API_KEY, ASSISTANT_ID, PORT = 8080 } = process.env;

// Helper functions for generating story instructions

function getSettingContext(setting) {
  const settingMap = {
    fantasy: "Set the story in a magical fantasy world with enchanted forests, castles, magical creatures, and wonder.",
    space: "Set the story in outer space, on distant planets, space stations, or during space exploration adventures.",
    modern: "Set the story in the present day with familiar settings like homes, schools, parks, and cities.",
    history: "Set the story in a historical time period, incorporating accurate historical elements and figures in an age-appropriate way.",
    religious: "Incorporate positive religious themes, values, and stories that teach kindness, compassion, and moral lessons.",
    leaders: "Feature inspirational world leaders, inventors, or historical figures as positive role models who overcame challenges.",
    underwater: "Set the story in underwater worlds with sea creatures, coral reefs, submarines, or ocean adventures.",
    forest: "Set the story in natural forest settings with wildlife, trees, camping, and nature exploration.",
    city: "Set the story in an urban environment with buildings, neighborhoods, community helpers, and city life."
  };
  
  return settingMap[setting] || settingMap.fantasy;
}

function getToneInstructions(tone, complexity) {
  const ageAppropriate = complexity <= 8 ? "very simple" : complexity <= 12 ? "moderately simple" : complexity <= 16 ? "more detailed" : "sophisticated but clear";
  
  const toneMap = {
    kindergarten: `Use very simple words, short sentences, and a playful, excited tone. Include sounds, repetition, and interactive elements. Make it ${ageAppropriate} for age ${complexity}.`,
    elementary: `Use clear, engaging language with some descriptive words. Include exciting moments and relatable characters. Make it ${ageAppropriate} for age ${complexity}.`,
    middle: `Use richer vocabulary and more complex sentence structures. Include detailed descriptions and character development. Make it ${ageAppropriate} for age ${complexity}.`,
    lecture: `Use educational language with interesting facts woven into the story. Explain concepts clearly while maintaining engagement. Make it ${ageAppropriate} for age ${complexity}.`
  };
  
  return toneMap[tone] || toneMap.kindergarten;
}

function getCharacterInstructions(mainCharacter, topic) {
  if (mainCharacter && mainCharacter.trim()) {
    return `The main character should be ${mainCharacter}. Make this character brave, kind, and relatable.`;
  }
  
  // Generate character based on topic if none specified
  const topicLower = topic.toLowerCase();
  if (topicLower.includes('space') || topicLower.includes('moon') || topicLower.includes('planet')) {
    return "The main character should be a curious young astronaut or space explorer.";
  } else if (topicLower.includes('animal') || topicLower.includes('forest') || topicLower.includes('jungle')) {
    return "The main character should be a friendly, clever animal.";
  } else if (topicLower.includes('magic') || topicLower.includes('wizard') || topicLower.includes('fairy')) {
    return "The main character should be a young person discovering their magical abilities.";
  } else {
    return "The main character should be a brave, curious child who loves adventure.";
  }
}

/**
 * POST /session/public
 * Create a PUBLIC session for a persisted assistant (assistant must be public)
 * Docs: Create Public Session
 * - No Authorization header required
 * - Returns { token, wsUrl, roomName }
 */
app.post("/session/public", async (req, res) => {
  try {
    if (!ASSISTANT_ID) {
      return res.status(400).json({ error: "ASSISTANT_ID not configured in .env" });
    }
    const r = await fetch(`${API}/realtime-assistants/${ASSISTANT_ID}/createPublicSession`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantName: "Web User" }),
    });
    if (!r.ok) throw new Error(`createPublicSession failed: ${r.status}`);
    res.json(await r.json());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

/**
 * POST /session/adhoc
 * Create an ADHOC session with dynamic instructions (topic or interruption summary)
 * Requires server-side Authorization with your API key.
 * Body: { topic?: string, summary?: string }
 * Docs: Create Adhoc Session
 */
app.post("/session/adhoc", async (req, res) => {
  const { topic, summary, storyControls = {} } = req.body || {};

  // Extract story controls with defaults
  const {
    length = 3,
    setting = 'fantasy',
    mainCharacter = '',
    tone = 'kindergarten',
    complexity = 8,
    includeSummary = false
  } = storyControls;

  // Base safety guardrails (never changeable)
  const baseGuardrails =
    "You are StoryTeller: 100% G-rated, child-safe. No violence, politics, medical or financial advice. " +
    "All content must be positive, educational, and appropriate for children.";

  // Generate setting-specific context
  const settingContext = getSettingContext(setting);
  
  // Generate tone and complexity instructions
  const toneInstructions = getToneInstructions(tone, complexity);
  
  // Generate character instructions
  const characterInstructions = getCharacterInstructions(mainCharacter, topic);
  
  // Generate length instructions
  const lengthInstructions = `Tell a story that lasts approximately ${length} minutes when spoken aloud.`;
  
  // Generate summary instructions
  const summaryInstructions = includeSummary 
    ? "End the story with a brief, educational summary of the key lessons or interesting facts mentioned."
    : "";

  const behavior = summary
    ? `Continue the SAME story naturally, acknowledging and incorporating this user input: "${summary}". Maintain the same setting, characters, and tone as before.`
    : `You will immediately start telling a story about "${topic}". ${settingContext} ${characterInstructions} Begin speaking as soon as you connect. Do not wait for user input.`;

  const instructions = `${baseGuardrails} ${toneInstructions} ${lengthInstructions} ${behavior} ${summaryInstructions}`.trim();

  // Debug logging
  console.log('Story Controls Received:', {
    topic,
    summary: summary ? 'Yes' : 'No',
    controls: storyControls
  });
  console.log('Generated Instructions:', instructions);

  try {
    const r = await fetch(`${API}/realtime-assistants/adhoc/createSession`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${UPLIFTAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        participantName: "Web User",
        config: {
          session: { ttl: 1800 },
          agent: { 
            instructions, 
            initialGreeting: true,
            greetingInstructions: summary ? 
              "Continue the story with the user's input." : 
              `Start telling a ${length}-minute ${setting} story about "${topic}" immediately. Use a ${tone} tone appropriate for age ${complexity}.`
          },
          stt: { default: { provider: "groq", model: "whisper-large-v3", language: "en" } },
          tts: { default: { provider: "upliftai", voiceId: "v_meklc281", outputFormat: "MP3_22050_32" } },
          llm: { default: { provider: "groq", model: "openai/gpt-oss-120b" } }
        }
      })
    });
    if (!r.ok) throw new Error(`adhoc createSession failed: ${r.status}`);
    res.json(await r.json());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`Story Teller MVP running on http://localhost:${PORT}`);
});