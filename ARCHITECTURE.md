 # KURA AI — System Architecture & Feasibility

 Tanggal: 2026-05-10

 Dokumentasi ini merangkum arsitektur teknis KURA AI, alur data per fitur, daftar endpoint, variabel lingkungan, requirement deployment, dan ringkasan feasibility / handoff.

 ## Ringkasan singkat

 - Frontend: React 18 + Vite (SPA)
 - Backend: FastAPI (Python 3.10+) — single-file app (`backend/main.py`)
 - Streaming: Server-Sent Events (SSE) untuk chat streaming
 - STT: Groq (Whisper large-v3)
 - LLM: OpenRouter (Arcee-AI Trinity Large Preview)
 - TTS: gTTS (Google Text-to-Speech) with language fallbacks
 - Optional refinement: HuggingFace SEA-LION (via `HF_TOKEN`)

 ## High-level diagram (text)

 ```text
 [Browser - React/Vite]
    ├─ ChatPanel, Dictionary, QuickSpeak, Talk, Map, Quiz
    └─ HTTP / SSE
         ↓
 [FastAPI backend : localhost:8000]
    ├─ /chat/stream  (SSE) -> OpenRouter
    ├─ /chat          (fallback)
    ├─ /talk, /talk/voice -> Groq Whisper -> OpenRouter -> gTTS
    ├─ /map-audio     -> knowledge base + OpenRouter -> gTTS
    ├─ /speak         -> gTTS
    └─ /quiz, /phrasebook
```

 ## API Endpoints (current)

 - GET  /health
 - POST /chat                — non-streaming chat (fallback)
 - GET  /chat/stream         — SSE streaming chat responses (token stream)
 - POST /talk                — text translate + generate audio
 - POST /talk/voice          — voice-to-voice (STT → translate → TTS)
 - POST /translate-speak     — translate text + audio (combined)
 - GET  /map-audio/{lang}    — generate greeting + cultural info + audio
 - GET  /phrasebook/{language} — dictionary / phrasebook data
 - POST /speak               — TTS-only (quick speak)
 - GET  /quiz/question       — quiz question (non-repeating cycle)
 - POST /learn               — add vocabulary (planning)

 ## Data stores & files

 - `backend/sea_languages_knowledge.json` — knowledge base (greetings, cultural_notes, status, speaker counts, quiz items)
 - `backend/dictionary/*.json` — per-language dictionary files (24 files expected)
 - In-memory caches in backend for light-weight performance (no persistent DB)

 ## Feature Data Flows (concise)

 - Chat (stream)
   1. Browser opens SSE to `/chat/stream` with language/context
   2. Backend forwards prompt to OpenRouter, streams tokens back to client
   3. Frontend appends chunks, shows blinking cursor

 - Two-way voice
   1. Browser records audio (MediaRecorder) and POSTs to `/talk/voice`
   2. Backend sends audio to Groq Whisper → transcript
   3. Transcript used with OpenRouter for translation/generation
   4. Output text → gTTS → base64 audio returned to client

 - Map greeting
   1. Client GET `/map-audio/{lang}`
   2. Backend reads `sea_languages_knowledge.json` entry, builds prompt (romanize if needed)
   3. OpenRouter generates greeting → gTTS converts to audio
   4. Response includes greeting, cultural_fact, speakers, status, family, base64 audio

 - Dictionary / Quick Speak
   - Dictionary reads JSON; Quick Speak calls `/speak` for TTS

 - Quiz
   - Backend returns a non-repeating question per cycle, `did_reset` flag when cycle finishes

 ## Env / Secrets

 Backend `.env` (required):

 ```text
 OPENROUTER_API_KEY=...
 GROQ_API_KEY=...        # optional but required for voice features
 HF_TOKEN=...            # optional (HuggingFace SEA-LION)
 CORS_ORIGINS=http://localhost:5173
 ```

 Frontend `.env`:

 ```text
 VITE_API_URL=http://localhost:8000
 ```

 ## Deployment checklist

 - Acquire production keys and set env securely (OpenRouter, Groq, HF if used).
 - Host FastAPI behind ASGI server (uvicorn/gunicorn/workers) and a reverse proxy (nginx) for TLS & buffering control.
 - Configure `Cache-Control: no-cache` and `X-Accel-Buffering: no` for SSE endpoints to avoid buffering.
 - Use HTTPS for all external endpoints.
 - Provision storage for logs / monitoring (do NOT store user audio or transcripts if privacy required).
 - Scale: Groq/OpenRouter rate-limits and costs — add queueing (background workers) for heavy loads.

 ## Feasibility & Handoff (matches slide requirements)

 1) High-Fidelity Prototype — Evidence present
    - Working frontend (`frontend/src/*`) with all 6 panels (`ChatPanel`, `DictionaryPanel`, `QuickPhrasePanel`, `TalkPanel`, `MapPanel`, `QuizPanel`).
    - Backend API endpoints implemented in `backend/main.py` including streaming and TTS.
    - Run locally with `uvicorn main:app --reload --port 8000` and `npm run dev` for frontend.

 2) Refinement Requirement — Notes / next steps
    - Add a minimal `STYLE_GUIDE.md` and a short `UX_TESTS.md` listing tested edge cases (offline, slow network, missing API key, audio device permissions).
    - Improve consistent global loading/fallback states across panels (some handlers already set loading booleans; audit for missing cases).
    - Add an automated smoke test for SSE chat and `/talk/voice` (upload a small sample audio file) to validate STT→TTS chain.

 3) Feasibility Plan — Go-to-Market & handoff checklist
    - Deployment environment: small VPS (2 CPU, 4GB RAM) for prototype; scale to containerized kubernetes for production.
    - Cost considerations: per-request costs for OpenRouter and Groq; estimate usage and set quotas.
    - Demo: host frontend on static hosting (Netlify / Vercel) and backend on a small cloud VM with TLS + domain.
    - Handoff: include `README.md`, `UPDATE_LOG.txt`, `ARCHITECTURE.md`, `.env.example`, and a short runbook.md with steps to obtain API keys and run services.

 ## Quick run (developer)

 1. Backend
 ```bash
 cd backend
 cp .env.example .env
 # fill keys
 python -m venv venv
 source venv/bin/activate    # Windows: venv\Scripts\activate
 pip install -r requirements.txt
 uvicorn main:app --reload --port 8000
 ```

 2. Frontend
 ```bash
 cd frontend
 npm install
 npm run dev
 ```

 ## Testing checklist (recommended)

 - SSE chat: verify token streaming, interrupt/resume behavior
 - Two-way voice: record short audio, verify translation + playback latency
 - Map: click several dots, check cultural fact and status mapping
 - Dictionary: search, play audio for headwords
 - Quick Speak: input phrase, verify TTS quality and fallback
 - Accessibility: keyboard navigation, ARIA labels, color contrast

 ## Known Gaps / TODO

 - Persistent database (none) — consider adding light DB (SQLite/Postgres) for analytics and user opt-in saving
 - Formal design system / component library (STYLE_GUIDE missing) — recommended for handoff
 - Monitoring & alerting not included (add Sentry/Prometheus)

 ---

 _File generated/updated by project assistant. Cross-check with `UPDATE_LOG.txt` and `README.md` for release notes._
