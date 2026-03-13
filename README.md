# 🌏 KURA AI

An AI-powered language tool for the Southeast Asia region, developed for a hackathon.

LINK VIDEO DEMO : 

## Features
1. **Language Chatbot** — Q&A about languages in Southeast Asia (SEA).  
2. **Two-Way Communication** — Translate text between languages and listen to the audio (similar to Google Translate conversation mode).  
3. **Regional Language Map** — Click a country on the Southeast Asia map and hear a random greeting in a local language.

## Tech Stack
- **Frontend:** React 18 + Vite  
- **Backend:** FastAPI + Groq (LLM) + gTTS (Text-to-Speech)

---

# 🚀 How to Run

## Prerequisites
- **Node.js** v18+ → https://nodejs.org/  
- **Python** 3.10+ → https://www.python.org/  
- **Groq API Key (free)** → https://console.groq.com/

---

## 1. Clone the Repository
```bash
git clone https://github.com/USERNAME/KURA.git
cd KURA

2. Backend Setup

cd backend

# Copy the environment file
cp .env.example .env

# Edit .env and add your GROQ_API_KEY
# GROQ_API_KEY=gsk_xxxxx

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --port 8000

The backend will run at:
http://localhost:8000

3. Frontend Setup

cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev

The frontend will run at:
http://localhost:5173

4. Open in Browser

Open:

http://localhost:5173

Make sure the backend server is also running.

📁 Folder Structure

├── backend/
│   ├── main.py            # FastAPI server
│   ├── requirements.txt   # Python dependencies
│   ├── .env.example       # Environment variable template
│   └── .env               # (not uploaded) your API key
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main React component
│   │   ├── styles.css     # Styling (dark/light mode)
│   │   └── main.jsx       # Entry point
│   ├── public/
│   │   └── image.png      # Southeast Asia map image
│   ├── package.json
│   └── .env.example       # Frontend environment template
├── .gitignore
└── README.md

👤 Team

Syahreza — Frontend Developer

Rifqi — Backend Developer

Rayhan — Backend Developer

Nabiilah — Data Analyst

Tiara — Data Analyst