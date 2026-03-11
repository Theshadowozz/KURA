import base64
import io
import os
import json
import tempfile
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from openai import OpenAI
from gtts import gTTS
from groq import Groq

# ==============================
# LOAD ENV
# ==============================
load_dotenv()

api_key = os.getenv("OPENROUTER_API_KEY")
if not api_key:
    raise RuntimeError("OPENROUTER_API_KEY is not set.")

# ==============================
# OPENROUTER CLIENT (FIXED)
# ==============================
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=api_key,
    default_headers={
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "Kura AI"
    }
)

# ✅ GANTI MODEL YANG VALID
MODEL_NAME = "arcee-ai/trinity-large-preview:free"

# ==============================
# GROQ CLIENT
# ==============================
groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    print("Warning: GROQ_API_KEY is not set. Voice processing will fail.")
else:
    groq_client = Groq(api_key=groq_api_key)

app = FastAPI(title="Kura API", version="0.3.0")

# ==============================
# CORS
# ==============================
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# ==============================
# SYSTEM PROMPT
# ==============================
def build_system_prompt():
    with open("minangkabau_knowledge.json", "r", encoding="utf-8") as f:
        knowledge_json = json.load(f)

    knowledge_data = json.dumps(knowledge_json, indent=2, ensure_ascii=False)

    return f"""
Kamu adalah AI bernama Kura yang fokus pada pelestarian bahasa Minangkabau.

Berikut data referensi:
{knowledge_data}

Jawab dengan bahasa Indonesia sederhana dan ramah.
Jika di luar topik, arahkan kembali ke bahasa Minangkabau.
"""

# ==============================
# LEARN ENDPOINT
# ==============================
class LearnRequest(BaseModel):
    indonesia: str
    minang: str


@app.post("/learn")
def learn_word(request: LearnRequest):
    try:
        with open("minangkabau_knowledge.json", "r", encoding="utf-8") as f:
            data = json.load(f)

        if "kosakata" not in data:
            data["kosakata"] = {}

        data["kosakata"][request.indonesia.lower()] = request.minang.lower()

        with open("minangkabau_knowledge.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        return {"message": "Kata berhasil disimpan!"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================
# MODELS
# ==============================
class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str


class TranslateSpeakRequest(BaseModel):
    input_language: str
    output_language: str
    text: str


class TranslateSpeakResponse(BaseModel):
    translation: str
    audio_base64: Optional[str]


class ProcessVoiceResponse(BaseModel):
    original_text: str
    translation: str
    audio_base64: Optional[str] = None

# ==============================
# HEALTH
# ==============================
@app.get("/health")
def health():
    return {"status": "ok"}

# ==============================
# CHAT
# ==============================
@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):

    if not request.messages:
        raise HTTPException(status_code=400, detail="messages is required")

    messages = [{"role": "system", "content": build_system_prompt()}]
    messages.extend([message.model_dump() for message in request.messages])

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            temperature=0.7
        )

        reply = response.choices[0].message.content
        return ChatResponse(reply=reply)

    except Exception as error:
        print("OPENROUTER ERROR:", error)
        raise HTTPException(status_code=500, detail=str(error))

# ==============================
# TRANSLATE + SPEAK
# ==============================
@app.post("/translate-speak", response_model=TranslateSpeakResponse)
def translate_speak(request: TranslateSpeakRequest):

    if not request.text:
        raise HTTPException(status_code=400, detail="text is required")

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": "Kamu adalah penerjemah profesional. HANYA terjemahkan teks."
                },
                {
                    "role": "user",
                    "content": f"""
Bahasa sumber: {request.input_language}
Bahasa tujuan: {request.output_language}
Teks: {request.text}
"""
                }
            ],
            temperature=0.3
        )

        translation = response.choices[0].message.content.strip()

        tts = gTTS(text=translation, lang="en")
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        audio_base64 = base64.b64encode(audio_buffer.read()).decode("utf-8")

        return TranslateSpeakResponse(
            translation=translation,
            audio_base64=audio_base64
        )

    except Exception as error:
        print("TRANSLATE ERROR:", error)
        raise HTTPException(status_code=500, detail=str(error))

# ==============================
# PROCESS VOICE (VOICE TO TEXT / VOICE TO VOICE)
# ==============================
@app.post("/process-voice", response_model=ProcessVoiceResponse)
async def process_voice(
    audio: UploadFile = File(...),
    input_language: str = Form(...),
    output_language: str = Form(...),
    mode: str = Form(...)  # 'text' or 'voice'
):
    if not groq_api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured")

    temp_audio_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
            temp_audio.write(await audio.read())
            temp_audio_path = temp_audio.name

        with open(temp_audio_path, "rb") as file:
            transcription = groq_client.audio.transcriptions.create(
                file=(audio.filename, file.read()),
                model="whisper-large-v3",
                response_format="json"
            )
        
        original_text = transcription.text.strip()
        if not original_text:
            raise HTTPException(status_code=400, detail="Could not transcribe audio")

        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": "Kamu adalah penerjemah profesional. HANYA terjemahkan teks."
                },
                {
                    "role": "user",
                    "content": f"Bahasa sumber: {input_language}\nBahasa tujuan: {output_language}\nTeks: {original_text}"
                }
            ],
            temperature=0.3
        )

        translation = response.choices[0].message.content.strip()

        audio_base64 = None
        if mode == "voice":
            tts = gTTS(text=translation, lang="en")
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)
            audio_base64 = base64.b64encode(audio_buffer.read()).decode("utf-8")

        return ProcessVoiceResponse(
            original_text=original_text,
            translation=translation,
            audio_base64=audio_base64
        )
    except Exception as error:
        print("PROCESS VOICE ERROR:", error)
        raise HTTPException(status_code=500, detail=str(error))
    finally:
        if temp_audio_path and os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)