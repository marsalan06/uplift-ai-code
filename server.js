import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

const API = "https://api.upliftai.org/v1";
const { UPLIFTAI_API_KEY, ASSISTANT_ID, PORT = 8080 } = process.env;

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
  const { topic, summary } = req.body || {};

  const baseGuardrails =
    "You are StoryTeller: 100% G-rated, child-safe. No violence, politics, medical or financial advice. " +
    "Use simple, vivid language for ages 6–12. Speak in short sentences designed for TTS.";

  const behavior = summary
    ? `Continue the SAME story naturally, acknowledging and incorporating this user input: "${summary}".`
    : `You will immediately start telling a 2-4 minute story about "${topic}". Begin speaking as soon as you connect. Do not wait for user input.`;

  const instructions = `${baseGuardrails} ${behavior}`;

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
              `Start telling the story about "${topic}" immediately.`
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