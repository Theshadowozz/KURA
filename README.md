# 🌏 KURA AI

An AI-based language tool for the Southeast Asia region, developed for a hackathon.

## Fitur
1. Language Chatbot — Q&A about languages in Southeast Asia (SEA).
2. Two-Way Communication — Translate text between languages and listen to the audio (similar to Google Translate conversation mode).
3. Regional Language Map — Click a country on the Southeast Asia map and hear a random greeting in a local language.

## Tech Stack
- **Frontend:** React 18 + Vite
- **Backend:** FastAPI + Groq (LLM) + gTTS (Text-to-Speech)

---

## 🚀 Cara Menjalankan

### Prasyarat
- **Node.js** v18+ → [download](https://nodejs.org/)
- **Python** 3.10+ → [download](https://www.python.org/)
- **Groq API Key** (gratis) → [daftar di sini](https://console.groq.com/)

### 1. Clone repo
```bash
git clone https://github.com/USERNAME/KURA.git
cd KURA
```

### 2. Setup Backend
```bash
cd backend

# Copy file env
cp .env.example .env

# Edit .env, isi GROQ_API_KEY with you key
# GROQ_API_KEY=gsk_xxxxx

# Install dependencies
pip install -r requirements.txt

# Running server
uvicorn main:app --reload --port 8000
```
The backend will run on `http://localhost:8000`

### 3. Setup Frontend
```bash
cd frontend

# Install dependencies
npm install

# Running dev server
npm run dev
```
The Frontend will run on `http://localhost:5173`

### 4. Buka di browser
Open **http://localhost:5173** — Make sure the backend is also running..

---

## 📁 Struktur Folder
```
├── backend/
│   ├── main.py            # FastAPI server
│   ├── requirements.txt   # Python dependencies
│   ├── .env.example       # Template environment variables
│   └── .env               # (tidak di-upload) your API KEY
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main Components in React
│   │   ├── styles.css     # Styling (dark/light mode)
│   │   └── main.jsx       # Entry point
│   ├── public/
│   │   └── image.png      # Picture map SEA
│   ├── package.json
│   └── .env.example       # Template env frontend
├── .gitignore
└── README.md
```

## 👤 Tim
- Syahreza (Frontend)
- Rifqi (Backend)
- Rayhan (Backend)
- Nabiilah (Data Analyst)
- Tiara (Data Analyst)
