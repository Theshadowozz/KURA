# KURA AI

> **AI-Powered Language Preservation Tools for Southeast Asia**
> Developed by **Team GRIDFX** · UNIMAS Hackathon 2026 · Finals Entry

[![Demo Video](https://img.shields.io/badge/Demo-YouTube-red?logo=youtube)](https://youtu.be/C101BjyOyhQ)
[![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)](https://python.org)
[![React](https://img.shields.io/badge/React-18.2.0-61dafb?logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.3.0-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Languages](https://img.shields.io/badge/Languages-24%20Regional-green)](./backend/dictionary)
[![Mobile Responsive](https://img.shields.io/badge/Mobile-Responsive-blue?logo=chrome)](https://www.w3schools.com/css/css_rwd_intro.asp)

---

## What is KURA AI?

KURA AI is an AI-powered web platform designed to **preserve and revitalize regional languages across Southeast Asia**. It provides **6 interactive tools** for **24 underrepresented regional languages** — many of which are absent from mainstream tools like Google Translate or Duolingo.

The platform addresses three core problems:
- **Access:** No interactive digital tools exist for most SEA regional languages
- **Communication barriers:** No real-time bridge between speakers of different regional languages
- **Cultural erosion:** Language death means centuries of identity, history, and knowledge disappear

---

## Features (6)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **AI Chatbot** | Real-time **streaming** AI conversation with token-by-token response and visual typing indicator, grounded in 24-language knowledge base |
| 2 | **Dictionary** | Language reference tool with search, pronunciation, examples, and audio playback for all 24 regional languages |
| 3 | **Quick Speak** | One-way text-to-speech utility — type text, select language, and hear native pronunciation instantly |
| 4 | **Two-Way Communication** | Live voice-to-voice translation between any two regional languages with real-time audio feedback |
| 5 | **SEA Language Map** | Interactive map with **24 precisely-placed regional language dots** — click to see language status, speaker count, cultural facts, and language family |
| 6 | **Language Quiz** | Gamified multiple-choice quiz with non-repeating question cycles to reinforce language learning and track progress |

---

## Supported Languages (24)

**Southeast Asia & East Asia Regional Languages:**

Indonesia · English · Mandarin · Thai · Vietnamese · Malay · Tagalog · Khmer · Minangkabau · Javanese · Sundanese · Lao · Shan · Karen · Hmong · Isan · Lanna · Tay · Cham · Khmer Krom · Cebuano · Ilocano · Iban · Kadazan-Dusun

+ Additional data: Dusun, Tutong, Teochew, Hokkien, Tetum, Mambae

---

## Tech Stack

- **Frontend:** React 18 + Vite  
- **Backend:** FastAPI (v0.3.0) + OpenRouter + Groq + gTTS + HuggingFace SEA-LION

---

## What's New in v2.1 (Latest Update — 2026-05-10)

See [`UPDATE_LOG.txt`](./UPDATE_LOG.txt) for the full detailed changelog.

**Latest improvements:**

- **Dictionary Feature:** Complete language reference with search, pronunciation, examples, and audio playback
- **Quick Speak:** Simple one-way text-to-speech for instant pronunciation learning
- **6 Total Features:** Expanded from 4 to 6 interactive tools
- **24 Supported Languages:** Added English and Mandarin to the 22 existing regional languages
- **UI Polish:** Updated tab layout, improved responsive design, better color scheme and typography

---

## Architecture

```
Browser (React 18 + Vite)
         │
    HTTP / SSE (Streaming)
         │
  FastAPI Backend (v0.3.0)
    ├── OpenRouter API
    │   └── Arcee-AI Trinity Large Preview  (chat, translation, greetings)
    ├── Groq API
    │   └── Whisper Large-v3  (speech-to-text for voice input)
    ├── Google TTS (gTTS)
    │   └── Text-to-Speech (audio output with language-specific routing)
    ├── HuggingFace API (SEA-LION)
    │   └── SEA-LION 7B Instruct (regional language refinement)
    └── Knowledge Base & Dictionary
        ├── sea_languages_knowledge.json (24 languages: greetings, facts, status)
        ├── dictionary/*.json (24 language dictionary files)
        └── LLM training data (cultural knowledge, phrases)
```

**Backend Features:**
- **Streaming responses** using FastAPI StreamingResponse + SSE for real-time token delivery
- **Dictionary data loading** with efficient JSON parsing and caching
- **Language status tracking** (Safe/Vulnerable/Endangered) for preservation awareness
- **Multi-engine TTS routing** with language-specific fallbacks
- **Romanization support** for script-incompatible languages (Karen, Shan, Hmong)
- **SEA-LION refinement** for improved regional language translation accuracy

---

## APIs & Models Used

| Service | Model | Purpose |
|---------|-------|---------|
| [OpenRouter](https://openrouter.ai) | `arcee-ai/trinity-large-preview` | Chat responses, translation, greeting generation |
| [Groq](https://console.groq.com) | `whisper-large-v3` | Speech-to-text for voice input |
| [Google TTS (gTTS)](https://pypi.org/project/gTTS/) | — | Text-to-speech audio output with language-specific routing |
| [HuggingFace](https://huggingface.co) | `aisingapore/sea-lion-7b-instruct` | Regional SEA language translation refinement |

> **AI Disclosure:** LLM tools were also used during development for code debugging, refactoring, and documentation. All cultural datasets, architecture decisions, and feature design were created by the GRIDFX team.

---

# Setup Instructions

## Prerequisites

- **Node.js** v18+ → https://nodejs.org/  
- **Python** 3.10+ → https://www.python.org/  
- **OpenRouter API Key (free)** → https://openrouter.ai/keys
- **Groq API Key (free)** → https://console.groq.com/
- **HuggingFace API Token (free, optional)** → https://huggingface.co/settings/tokens *(for SEA-LION refinement)*

---

## 1. Clone the Repository

```bash
git clone https://github.com/USERNAME/KURA.git
cd KURA
```

---

## 2. Backend Setup

```bash
cd backend

# Copy the environment file
cp .env.example .env
```

Edit `.env` and add your keys:
```env
OPENROUTER_API_KEY=your_openrouter_key_here
GROQ_API_KEY=your_groq_key_here
HF_TOKEN=your_huggingface_token_here
CORS_ORIGINS=http://localhost:5173
```

```bash
# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate       # macOS/Linux
# venv\Scripts\activate        # Windows

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --port 8000
```

Backend runs at: **http://localhost:8000**

---

## 3. Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# (default: VITE_API_URL=http://localhost:8000 — no changes needed for local dev)

# Run the development server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 4. Open the App

Make sure **both** backend and frontend are running, then open:

```
http://localhost:5173
```

---

## Folder Structure

```
KURA/
├── backend/
│   ├── main.py                      # FastAPI server (all endpoints)
│   ├── requirements.txt             # Python dependencies
│   ├── sea_languages_knowledge.json # Knowledge base — 24 SEA languages
│   ├── dictionary/                  # Language dictionaries (24 JSON files)
│   │   ├── Minangkabau.json
│   │   ├── Sunda.json
│   │   ├── Jawa.json
│   │   ├── Tay.json
│   │   └── ... (20 more language files)
│   └── .env.example                 # Environment variable template
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                  # Main React component (all 6 features)
│   │   ├── styles.css               # Global styles + responsive design
│   │   ├── main.jsx                 # React entry point
│   │   ├── api.jsx                  # API client
│   │   ├── components/              # React components (6 feature panels)
│   │   │   ├── ChatPanel.jsx
│   │   │   ├── DictionaryPanel.jsx  # NEW
│   │   │   ├── QuickPhrasePanel.jsx # NEW
│   │   │   ├── TalkPanel.jsx
│   │   │   ├── MapPanel.jsx
│   │   │   ├── QuizPanel.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── HomePage.jsx
│   │   │   └── Tabs.jsx
│   │   ├── handlers/                # Feature handlers
│   │   │   ├── index.js
│   │   │   ├── chat/
│   │   │   ├── dictionary/          # NEW
│   │   │   ├── talk/
│   │   │   ├── map/
│   │   │   └── quiz/
│   │   ├── lib/                     # Utilities (audio, utils, constants)
│   │   └── utils/                   # Markdown and constant utilities
│   ├── public/
│   │   └── logo/                    # Branding assets
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── build/                       # Production build output
│
├── UPDATE_LOG.txt                   # Detailed changelog of all updates (v2.1)
├── README.md                        # This file
└── .gitignore
```

---

## System Requirements

- **Recommended:** 2GB RAM, 150MB disk space for dependencies + dictionaries
- **Browsers:** Chrome, Firefox, Safari, Edge (all modern versions with ES6+ support)
- **Mobile:** Fully responsive design tested on iOS Safari and Android Chrome
- **Network:** Stable internet for API calls (OpenRouter, Groq, HuggingFace)

---

## Responsive Design Breakpoints

- **Desktop:** Full layout with all 6 features visible in tabs
- **Tablet (900px):** Stacked hero section, wrapped tabs (3 columns), reduced font sizes
- **Mobile (640px):** Compressed padding, 2-column tab layout, adaptive panel heights
- **Small Phone (380px):** Single-column tabs, minimal spacing, optimized touch targets

---

## Backend Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Health check |
| POST | `/chat` | Chat (non-streaming, fallback) |
| POST | `/chat/stream` | Chat streaming via SSE |
| POST | `/translate-speak` | Translate text + generate audio |
| POST | `/process-voice` | Voice-to-text + translate + audio |
| POST | `/map-audio` | Generate greeting audio + cultural info |
| GET | `/phrasebook/{language}` | Dictionary data per language |
| POST | `/speak` | Text-to-speech only |
| POST | `/learn` | Add vocabulary (future feature) |

---

## AI Disclosure & Implementation

The development of **KURA AI** integrates several artificial intelligence technologies to enable real-time language processing, translation, and audio interaction. While the system architecture, cultural datasets, and implementation were designed by the **GRIDFX team**, several AI tools were utilized to power specific functionalities within the platform.

### Arcee-AI via OpenRouter

The reasoning and response generation of the **Kura Chat** feature are powered by the **Arcee-AI Trinity Large Preview model**, accessed through the **OpenRouter API**.  
This model processes user queries while being grounded with a curated regional knowledge base to ensure contextual understanding of Southeast Asian languages and cultural nuances.

### Groq + Whisper

KURA AI uses **Groq Cloud** for high-speed AI inference.  
The **Whisper-large-v3** model hosted on Groq is used for speech-to-text processing in the Two-Way Communication feature.  
Groq's **Language Processing Units (LPUs)** enable extremely low-latency voice processing.

### Google Text-to-Speech (gTTS)

KURA AI uses **gTTS (Google Text-to-Speech)** to convert translated text into spoken audio.  
This enables features such as:
- **Quick Speak:** Direct text-to-speech playback
- **Two-Way Communication:** Audio responses
- **SEA Map:** Greeting pronunciation playback
- **Dictionary:** Word pronunciation guides

**Multi-engine routing:** Different languages are routed to different TTS engines based on phonetic compatibility (Lao→Thai TTS, Karen/Shan→Malay TTS, etc.).

### HuggingFace SEA-LION

KURA AI integrates **HuggingFace's SEA-LION 7B Instruct model** to refine translations for regional SEA languages.  
This specialized model improves translation accuracy for languages with limited mainstream support.

### AI Assistance During Development

Large Language Model (LLM) tools were also used during the development process for:
- Code refactoring and debugging
- Backend middleware optimization
- Asynchronous logic improvements
- Technical documentation drafting

### Human–AI Collaboration

The GRIDFX team emphasizes that AI tools function as **computational engines and assistants**, while the cultural data curation, system architecture, feature design, and project direction were carried out by human developers and analysts.

---

## Data Privacy & Responsible AI

- **No data retention:** Voice recordings and text inputs are processed in-session only and never stored
- **Zero-retention architecture:** No user accounts, no history logs, no backend database of conversations
- **Scope guardrails:** AI is constrained to language, culture, and translation tasks only
- **Cultural sensitivity:** Knowledge base and dictionary entries reviewed for accuracy and respect for minority language communities
- **Transparency:** All AI tools and models disclosed above; human team responsible for architecture and data curation
- **Language preservation focus:** Platform prioritizes underrepresented regional languages often excluded from mainstream tools

---

## Dictionary Data Format

Each language file (`backend/dictionary/{Language}.json`) follows this structure:

```json
{
  "language": "Indonesian",
  "code": "id",
  "entries": [
    {
      "word": "terima kasih",
      "pronunciation": "trima kasih",
      "meaning": "thank you",
      "partOfSpeech": "noun",
      "example": "Terima kasih atas bantuanmu",
      "exampleTranslation": "Thank you for your help"
    }
  ]
}
```

---

## Contributing

This project was developed for the UNIMAS Hackathon 2026 (Finals Entry). For modifications or contributions, please consult with Team GRIDFX.

---

## Team

| Name | Role |
|------|------|
| Syahreza | Frontend Developer |
| Rifqi | Backend Developer |
| Rayhan | Backend Developer |
| Nabiilah | Data Analyst |
| Tiara | Data Analyst |

---

## License

This project was developed for the UNIMAS Hackathon 2026. All rights reserved by Team GRIDFX.

---

## Version History

- **v2.1** (2026-05-10): Dictionary, Quick Speak, 24 languages, UI polish
- **v2.0** (2026-04-30): Streaming chat, 22 language map, cultural info, mobile responsive
- **v1.0** (2026-04-XX): Initial hackathon submission
