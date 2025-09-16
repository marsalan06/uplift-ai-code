# Uplift Story‑Teller MVP (Node + HTML/JS)

A tiny, production‑style MVP that tells a **G‑rated story** from a topic, **speaks it with TTS**, and supports **“barge‑in” interruptions** that are folded back into context (by restarting a session with a summary prompt). No React needed.

https://docs.upliftai.org (Realtime Assistants are in **beta**).

## Features
- Start a new story from a **topic** (2–4 minutes, kid‑safe guard‑rails).
- **Interrupt** mid‑story: say/type a change (e.g., “make the cat afraid of heights”) and the bot continues with that twist.
- **Live audio** via WebRTC (LiveKit); the browser auto‑plays the agent’s remote audio track.
- Uses **Adhoc Session** to inject dynamic instructions per run; optionally supports **Public Session** for a persisted assistant.

## Quickstart

```bash
git clone <your-fork-or-download>
cd story-teller-mvp
cp .env.example .env
# put your key in .env: UPLIFTAI_API_KEY=sk_xxx...

npm install
npm run start
# open http://localhost:8080
```

### 1) Get an API key
Create an account on Uplift AI and grab your **UPLIFTAI_API_KEY**.

### 2) (Optional) Create a persisted assistant
You can run entirely with **Adhoc Sessions** (no assistant needed).  
If you want a persisted public assistant too:

```bash
# Create assistant (kid-safe guardrails)
curl -X POST https://api.upliftai.org/v1/realtime-assistants   -H "Authorization: Bearer $UPLIFTAI_API_KEY"   -H "Content-Type: application/json"   -d '{
    "name": "Story Teller",
    "public": true,
    "config": {
      "agent": {
        "instructions": "You are StoryTeller: G-rated stories, simple language, stop when user interrupts and continue accordingly.",
        "initialGreeting": false
      },
      "stt": { "default": { "provider": "groq", "model": "whisper-large-v3", "language": "en" } },
      "tts": { "default": { "provider": "upliftai", "voiceId": "v_meklc281", "outputFormat": "MP3_22050_32" } },
      "llm": { "default": { "provider": "groq", "model": "openai/gpt-oss-120b" } }
    }
  }'
# Save realtimeAssistantId to .env as ASSISTANT_ID if you want to test /session/public
```

### 3) Run
- Visit `http://localhost:8080`
- Enter a **topic** and click **Start Story**.
- While it’s speaking, press & hold **Interrupt**, say your change (or type it if your browser doesn’t support SpeechRecognition). Release to apply.
- Click **Stop** to end the session.

## How it works

### Server
- `/session/adhoc` → **Create Adhoc Session** with per‑run instructions that include the **topic** or the **interruption summary**.  
  Response: `{ token, wsUrl, roomName }`

- `/session/public` → **Create Public Session** for a persisted assistant (assistant must be `public: true`).  
  Response: `{ token, wsUrl, roomName }`

### Browser
- Uses the **LiveKit** JS client to connect with `{ wsUrl, token }` and auto‑play the agent’s audio track.
- Interruptions are implemented by ending the current session and spinning up a new **Adhoc** session that tells the agent to “continue the same story, incorporating: <summary>”.

## Notes & Production Tips
- Keep your **API key** server‑side. Public sessions don’t require a key but only work for `public: true` assistants.
- Rate‑limit and log session creation.
- Consider regional model choices for latency to your users (Pakistan/South Asia).

## Relevant docs (Uplift AI)
- Create Session (backend; returns `{ token, wsUrl, roomName }`)
- Create Public Session (frontend‑safe for `public: true` assistants)
- Create Adhoc Session (temporary config per session)
- Core Concepts (sessions, agent instructions, tools)

## License
MIT