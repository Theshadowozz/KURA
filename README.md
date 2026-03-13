# 🌏 KURA AI

An AI-powered language tool for the Southeast Asia region, developed for a hackathon.

LINK VIDEO DEMO : https://youtu.be/C101BjyOyhQ

## Features
1. **Language Chatbot** — Q&A about languages in Southeast Asia (SEA).  
2. **Two-Way Communication** — Translate text between languages and listen to the audio (similar to Google Translate conversation mode).  
3. **Regional Language Map** — Click a country on the Southeast Asia map and hear a random greeting in a local language.

## Tech Stack
- **Frontend:** React 18 + Vite  
- **Backend:** FastAPI + Groq (LLM) + gTTS (Text-to-Speech)

## AI Disclosure

The development of **KURA AI** integrates several artificial intelligence technologies to enable real-time language processing, translation, and audio interaction. While the system architecture, cultural datasets, and implementation were designed by the **GRIDFX team**, several AI tools were utilized to power specific functionalities within the platform.

### Groq
KURA AI uses **Groq Cloud** for high-speed AI inference.  
The **Whisper-large-v3** model hosted on Groq is used for speech-to-text processing in the Two-Way Communication feature.  
Groq’s **Language Processing Units (LPUs)** enable extremely low-latency voice processing, allowing the system to produce translation responses in approximately one second.

### Arcee-AI via OpenRouter
The reasoning capabilities of the **Kura Chat** feature are powered by the **Arcee-AI Trinity Large model**, accessed through the **OpenRouter API**.  
This model processes user queries while being grounded with a curated regional knowledge base (`minangkabau_knowledge.json`) to ensure contextual understanding of Southeast Asian languages and cultural nuances.

### Google Text-to-Speech (gTTS)
KURA AI uses **gTTS (Google Text-to-Speech)** to convert translated text into spoken audio.  
This enables features such as voice playback in the **Two-Way Communication** tool and the **Interactive Language Map**, where users can hear greetings in various Southeast Asian languages.

### AI Assistance During Development
Large Language Model (LLM) tools were also used during the development process for:
- code refactoring and debugging,
- improving backend middleware configuration,
- optimizing asynchronous logic,
- assisting in drafting technical documentation.

### Human–AI Collaboration
The GRIDFX team emphasizes that AI tools function as **computational engines and assistants**, while the cultural data curation, system architecture, feature design, and project direction were carried out by human developers and analysts.  
The project represents a collaborative synergy between **human cultural knowledge and AI technological capabilities**.

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