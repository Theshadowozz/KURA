# 🌏 SEA Lingo AI

Tools bahasa berbasis AI untuk kawasan Southeast Asia. Dibuat untuk Hackathon.

## Fitur
1. **Chatbot Bahasa** — Tanya jawab seputar bahasa-bahasa di SEA
2. **Komunikasi 2 Arah** — Terjemahkan teks antar bahasa + dengarkan suaranya (seperti Google Translate conversation mode)
3. **Peta Bahasa Daerah** — Klik negara di peta SEA, dengar sapaan dalam bahasa daerah secara random

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
git clone https://github.com/USERNAME/sea-lingo-ai.git
cd sea-lingo-ai
```

### 2. Setup Backend
```bash
cd backend

# Salin file env
cp .env.example .env

# Edit .env, isi GROQ_API_KEY dengan key kamu
# GROQ_API_KEY=gsk_xxxxx

# Install dependencies
pip install -r requirements.txt

# Jalankan server
uvicorn main:app --reload --port 8000
```
Backend akan berjalan di `http://localhost:8000`

### 3. Setup Frontend
```bash
cd frontend

# Install dependencies
npm install

# Jalankan dev server
npm run dev
```
Frontend akan berjalan di `http://localhost:5173`

### 4. Buka di browser
Buka **http://localhost:5173** — pastikan backend juga sedang jalan.

---

## 📁 Struktur Folder
```
├── backend/
│   ├── main.py            # FastAPI server
│   ├── requirements.txt   # Python dependencies
│   ├── .env.example       # Template environment variables
│   └── .env               # (tidak di-upload) API key kamu
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Komponen utama React
│   │   ├── styles.css     # Styling (dark/light mode)
│   │   └── main.jsx       # Entry point
│   ├── public/
│   │   └── image.png      # Gambar peta SEA
│   ├── package.json
│   └── .env.example       # Template env frontend
├── .gitignore
└── README.md
```

## 👤 Tim
- Syahreza (Developer)
