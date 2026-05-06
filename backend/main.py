import base64
import io
import os
import json
import random
import tempfile
from typing import List, Optional
import requests

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from openai import OpenAI
from gtts import gTTS
from groq import Groq

# ==============================
# LOAD ENV
# ==============================
load_dotenv()
hf_token = os.getenv("HF_TOKEN")
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
MODEL_NAME = "arcee-ai/trinity-large-preview"

# ==============================
# GROQ CLIENT
# ==============================
groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    print("Warning: GROQ_API_KEY is not set. Voice processing will fail.")
else:
    groq_client = Groq(api_key=groq_api_key)

# ==============================
# SEA-LION REFINER (HuggingFace)
# ==============================
SEA_REGIONAL_LANGUAGES = {"minang", "jawa", "sunda", "iban", "kadazan-dusun", "dusun", "tetum"}

def refine_sea_language(text: str) -> str:
    """Refine regional SEA language translation using SEA-LION via HuggingFace API."""
    if not hf_token:
        return text  # fallback: return as-is if no token
    try:
        API_URL = "https://api-inference.huggingface.co/models/aisingapore/sea-lion-7b-instruct"
        headers = {"Authorization": f"Bearer {hf_token}"}
        payload = {"inputs": text, "parameters": {"max_new_tokens": 150}}
        res = requests.post(API_URL, headers=headers, json=payload, timeout=10)
        result = res.json()
        if isinstance(result, list) and result:
            return result[0].get("generated_text", text)
    except Exception as e:
        print("SEA-LION REFINE ERROR:", e)
    return text  # fallback jika error

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
# LANGUAGE TO gTTS CODE MAPPING
# ==============================
LANG_CODE_MAP = {
    "Indonesia": "id",
    "English": "en",
    "Mandarin": "zh-CN",
    "Thai": "th",
    "Vietnamese": "vi",
    "Malay": "ms",
    "Tagalog": "tl",
    "Khmer": "km",
    "Kuy": "th",
    "Minang": "id",
    "Minangkabau": "id",
    "Jawa": "id",
    "Sunda": "id",
    "Shan": "my",
    "Karen": "my",
    "Lao": "lo",
    "Hmong": "lo",
    "Isan": "th",
    "Lanna": "th",
    "Tay": "vi",
    "Khmer Krom": "km",
    "Cham": "vi",
    "Cebuano": "tl",
    "Ilocano": "tl",
    "Iban": "ms",
    "Kadazan-Dusun": "ms",
    "Dusun": "ms",
    "Tutong": "ms",
    "Teochew": "zh-CN",
    "Hokkien": "zh-CN",
    "Tetum": "pt",
    "Mambae": "pt",
}

def get_gtts_lang(language_name: str) -> str:
    return LANG_CODE_MAP.get(language_name, "id")

# ==============================
# KNOWLEDGE BASE LOADER
# ==============================
def load_knowledge_base():
    with open("sea_languages_knowledge.json", "r", encoding="utf-8") as f:
        return json.load(f)

# ==============================
# SYSTEM PROMPT
# ==============================
def get_language_index() -> str:
    kb = load_knowledge_base()
    lines = []
    for lang, data in kb.get("languages", {}).items():
        lines.append(
            f"- {lang} ({data.get('local_name', '')}) | {data.get('country', '')} | "
            f"Speakers: {data.get('speakers', 'unknown')} | Status: {data.get('status', 'unknown')}"
        )
    return "\n".join(lines)


def get_relevant_language_data(query: str) -> str:
    kb = load_knowledge_base()
    languages = kb.get("languages", {})
    query_lower = query.lower()
    matched = {}
    for lang, data in languages.items():
        if lang.lower() in query_lower or data.get("local_name", "").lower() in query_lower:
            matched[lang] = data
    if not matched:
        return ""
    return json.dumps(matched, indent=2, ensure_ascii=False)


def build_system_prompt(user_messages: list | None = None):
    language_index = get_language_index()
    extra_context = ""
    if user_messages:
        combined_query = " ".join(
            m.get("content", "") for m in user_messages if m.get("role") == "user"
        )
        lang_data = get_relevant_language_data(combined_query)
        if lang_data:
            extra_context = f"\n\nDetailed language data for mentioned languages:\n{lang_data}"

    return f"""You are Kura, an AI assistant specialised in Southeast Asian (SEA) regional language preservation.

You have knowledge of 22 regional languages across 11 ASEAN countries.

## Available Languages Index:
{language_index}
{extra_context}

## Your Role:
- Answer questions about SEA regional languages: greetings, vocabulary, phrases, grammar, culture, and preservation status.
- Provide translations between languages when asked.
- Share cultural context and stories behind language traditions.
- Highlight language endangerment and preservation efforts.
- Respond in English by default. Switch language if the user writes in another language.
- If asked about a topic unrelated to SEA languages or cultures, politely redirect the conversation back.

## Response Style:
- Be conversational and natural. Don't always use structured format.
- If user just greets (hello, hi, etc), respond with a friendly greeting back first, then offer help.
- If user asks for language overview or general info about a language, use structured format with headings and bullets.
- If user asks for specific translations, phrases, or vocabulary, provide direct answers first, then add context if helpful.
- Use structured sections (## Heading:) and bullet points (- item) only when providing comprehensive language guides.
- Do not use ** ** around words. Just write naturally.

## When to Use Structured Format:
- User asks: "Tell me about [language]" or "I want to learn [language]" → Use full structured response
- User asks: "How do you say X in [language]?" → Answer directly, no structured format needed
- User asks: "What are common phrases in [language]?" → Use structured format with sections

Be friendly, accurate, culturally respectful, and contextual in all responses.
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
        with open("sea_languages_knowledge.json", "r", encoding="utf-8") as f:
            data = json.load(f)

        if "languages" not in data:
            data["languages"] = {}
        if "Minangkabau" not in data["languages"]:
            data["languages"]["Minangkabau"] = {}
        if "vocabulary" not in data["languages"]["Minangkabau"]:
            data["languages"]["Minangkabau"]["vocabulary"] = {}

        data["languages"]["Minangkabau"]["vocabulary"][
            request.indonesia.lower()
        ] = request.minang.lower()

        with open("sea_languages_knowledge.json", "w", encoding="utf-8") as f:
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


class MapAudioRequest(BaseModel):
    language: str


class MapGreeting(BaseModel):
    text: str
    meaning: Optional[str] = None


class MapAudioResponse(BaseModel):
    text: str
    audio_base64: str
    speakers: Optional[str] = None
    status: Optional[str] = None
    cultural_fact: Optional[str] = None
    family: Optional[str] = None


MAP_GREETING_DATA = {
    "Shan": {"tts_lang": "en", "greetings": [
        {"text": "Sawn yam", "meaning": "Hello"},
        {"text": "Na gat li", "meaning": "Good morning"},
        {"text": "Kawp jai", "meaning": "Thank you"}
    ]},
    "Karen": {"tts_lang": "en", "greetings": [
        {"text": "Ta bluh doh", "meaning": "Hello"},
        {"text": "Ghaw ler ah", "meaning": "Good morning"},
        {"text": "Ta bluh", "meaning": "Thank you"}
    ]},
    "Lao": {"tts_lang": "lo", "greetings": [
        {"text": "Sabaidee", "meaning": "Hello"},
        {"text": "Sabaidee ton sao", "meaning": "Good morning"},
        {"text": "Khawp jai", "meaning": "Thank you"}
    ]},
    "Hmong": {"tts_lang": "en", "greetings": [
        {"text": "Nyob zoo", "meaning": "Hello"},
        {"text": "Nyob zoo sawv ntxov", "meaning": "Good morning"},
        {"text": "Ua tsaug", "meaning": "Thank you"}
    ]},
    "Lanna": {"tts_lang": "th", "greetings": [
        {"text": "Sawadee jao", "meaning": "Hello"},
        {"text": "Sawadee ton sao jao", "meaning": "Good morning"},
        {"text": "Khop jao", "meaning": "Thank you"}
    ]},
    "Isan": {"tts_lang": "th", "greetings": [
        {"text": "Sawatdi", "meaning": "Hello"},
        {"text": "Sawatdi ton sao", "meaning": "Good morning"},
        {"text": "Khop chai", "meaning": "Thank you"}
    ]},
    "Tay": {"tts_lang": "vi", "greetings": [
        {"text": "Chao", "meaning": "Hello"},
        {"text": "Chao buoi sang", "meaning": "Good morning"},
        {"text": "Cam on", "meaning": "Thank you"}
    ]},
    "Cham": {"tts_lang": "vi", "greetings": [
        {"text": "Salaam", "meaning": "Hello"},
        {"text": "Salaam tapak", "meaning": "Good morning"},
        {"text": "Terima kasih", "meaning": "Thank you"}
    ]},
    "Khmer Krom": {"tts_lang": "km", "greetings": [
        {"text": "Suosdei", "meaning": "Hello", "audio_text": "\u179f\u17bd\u179f\u17d2\u178a\u17b8"},
        {"text": "Arun suasdei", "meaning": "Good morning", "audio_text": "\u17a2\u179a\u17bb\u178e\u179f\u17bd\u179f\u17d2\u178a\u17b8"},
        {"text": "Awkun", "meaning": "Thank you", "audio_text": "\u17a2\u179a\u1782\u17bb\u178e"}
    ]},
    "Khmer": {"tts_lang": "km", "greetings": [
        {"text": "Chom reap suor", "meaning": "Formal hello", "audio_text": "\u1787\u17c6\u179a\u17b6\u1794\u179f\u17bd\u179a"},
        {"text": "Arun suasdei", "meaning": "Good morning", "audio_text": "\u17a2\u179a\u17bb\u178e\u179f\u17bd\u179f\u17d2\u178a\u17b8"},
        {"text": "Awkun", "meaning": "Thank you", "audio_text": "\u17a2\u179a\u1782\u17bb\u178e"}
    ]},
    "Kuy": {"tts_lang": "th", "greetings": [
        {"text": "Sabaai", "meaning": "Hello"},
        {"text": "Sabaai pruk", "meaning": "Good morning"},
        {"text": "Aw kun", "meaning": "Thank you"}
    ]},
    "Ilocano": {"tts_lang": "tl", "greetings": [
        {"text": "Kablaaw", "meaning": "Hello"},
        {"text": "Naimbag a bigat", "meaning": "Good morning"},
        {"text": "Agyamanak", "meaning": "Thank you"}
    ]},
    "Cebuano": {"tts_lang": "tl", "greetings": [
        {"text": "Hello", "meaning": "Hello"},
        {"text": "Maayong buntag", "meaning": "Good morning"},
        {"text": "Salamat", "meaning": "Thank you"}
    ]},
    "Iban": {"tts_lang": "ms", "greetings": [
        {"text": "Selamat datai", "meaning": "Welcome"},
        {"text": "Selamat pagi", "meaning": "Good morning"},
        {"text": "Terima kasih", "meaning": "Thank you"}
    ]},
    "Kadazan-Dusun": {"tts_lang": "ms", "greetings": [
        {"text": "Kopisanangan", "meaning": "Hello"},
        {"text": "Kopisanangan dongkosuabon", "meaning": "Good morning"},
        {"text": "Pounsikou", "meaning": "Thank you"}
    ]},
    "Teochew": {"tts_lang": "zh-CN", "greetings": [
        {"text": "Leu ho", "meaning": "Hello"},
        {"text": "Ja", "meaning": "Good morning"},
        {"text": "Joi sia", "meaning": "Thank you"}
    ]},
    "Hokkien": {"tts_lang": "zh-CN", "greetings": [
        {"text": "Li ho", "meaning": "Hello"},
        {"text": "Goa cha", "meaning": "Good morning"},
        {"text": "Kam sia", "meaning": "Thank you"}
    ]},
    "Dusun": {"tts_lang": "ms", "greetings": [
        {"text": "Kopisanangan", "meaning": "Hello"},
        {"text": "Kopisanangan dongkosuabon", "meaning": "Good morning"},
        {"text": "Pounsikou", "meaning": "Thank you"}
    ]},
    "Tutong": {"tts_lang": "ms", "greetings": [
        {"text": "Selamat pagi", "meaning": "Good morning"},
        {"text": "Selamat petang", "meaning": "Good afternoon"},
        {"text": "Terima kasih", "meaning": "Thank you"}
    ]},
    "Minangkabau": {"tts_lang": "id", "greetings": [
        {"text": "Assalamualaikum", "meaning": "Hello"},
        {"text": "Salamaik pagi", "meaning": "Good morning"},
        {"text": "Tarimo kasih", "meaning": "Thank you"}
    ]},
    "Sunda": {"tts_lang": "id", "greetings": [
        {"text": "Sampurasun", "meaning": "Hello"},
        {"text": "Wilujeng enjing", "meaning": "Good morning"},
        {"text": "Nuhun", "meaning": "Thank you"}
    ]},
    "Jawa": {"tts_lang": "id", "greetings": [
        {"text": "Halo", "meaning": "Hello"},
        {"text": "Sugeng enjing", "meaning": "Good morning"},
        {"text": "Matur nuwun", "meaning": "Thank you"}
    ]},
    "Tetum": {"tts_lang": "pt", "greetings": [
        {"text": "Elo", "meaning": "Hello"},
        {"text": "Bondia", "meaning": "Good morning"},
        {"text": "Obrigadu", "meaning": "Thank you"}
    ]},
    "Mambae": {"tts_lang": "pt", "greetings": [
        {"text": "Elo", "meaning": "Hello"},
        {"text": "Bondia", "meaning": "Good morning"},
        {"text": "Obrigadu", "meaning": "Thank you"}
    ]},
}


class PhrasebookResponse(BaseModel):
    language: str
    local_name: str
    country: str
    speakers: str
    status: str
    greetings: dict
    vocabulary: dict
    common_phrases: list

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

    max_history = 10  # Keep last 10 messages (5 exchanges) to avoid token limits.
    raw_messages = [message.model_dump() for message in request.messages]
    trimmed_messages = raw_messages[-max_history:] if len(raw_messages) > max_history else raw_messages
    messages = [{"role": "system", "content": build_system_prompt(trimmed_messages)}]
    messages.extend(trimmed_messages)

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
# CHAT STREAM (SSE)
# ==============================
@app.post("/chat/stream")
def chat_stream(request: ChatRequest):
    if not request.messages:
        raise HTTPException(status_code=400, detail="messages is required")

    MAX_HISTORY = 10
    raw_messages = [message.model_dump() for message in request.messages]
    trimmed_messages = raw_messages[-MAX_HISTORY:] if len(raw_messages) > MAX_HISTORY else raw_messages
    messages_list = [{"role": "system", "content": build_system_prompt(trimmed_messages)}]
    messages_list.extend(trimmed_messages)

    def generate():
        try:
            stream = client.chat.completions.create(
                model=MODEL_NAME,
                messages=messages_list,
                temperature=0.7,
                stream=True
            )
            for chunk in stream:
                delta = chunk.choices[0].delta
                if delta.content:
                    yield f"data: {json.dumps({'content': delta.content})}\n\n"
        except Exception as error:
            print("STREAM ERROR:", error)
            yield f"data: {json.dumps({'error': str(error)})}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )

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
                    "content": (
                        "You are Kura, a professional translator specialising in Southeast Asian languages, "
                        "including regional and minority languages. "
                        "Translate the given text accurately and naturally. "
                        "Return ONLY the translated text — no explanations, no notes, no alternatives."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        f"Source language: {request.input_language}\n"
                        f"Target language: {request.output_language}\n"
                        f"Text: {request.text}"
                    )
                }
            ],
            temperature=0.3
        )

        translation = response.choices[0].message.content.strip()

        # 🔥 Refine dengan SEA-LION jika output adalah bahasa daerah
        if request.output_language.lower() in SEA_REGIONAL_LANGUAGES:
            translation = refine_sea_language(translation)

        gtts_lang = get_gtts_lang(request.output_language)
        tts = gTTS(text=translation, lang=gtts_lang)
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
                    "content": (
                        "You are Kura, a professional translator specialising in Southeast Asian languages, "
                        "including regional and minority languages. "
                        "Translate the given text accurately and naturally. "
                        "Return ONLY the translated text — no explanations, no notes, no alternatives."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        f"Source language: {input_language}\n"
                        f"Target language: {output_language}\n"
                        f"Text: {original_text}"
                    )
                }
            ],
            temperature=0.3
        )

        translation = response.choices[0].message.content.strip()

        # 🔥 Refine dengan SEA-LION jika output adalah bahasa daerah
        if output_language.lower() in SEA_REGIONAL_LANGUAGES:
            translation = refine_sea_language(translation)

        audio_base64 = None
        if mode == "voice":
            gtts_lang = get_gtts_lang(output_language)
            tts = gTTS(text=translation, lang=gtts_lang)
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

# ==============================
# PHRASEBOOK
# ==============================
@app.get("/phrasebook/{language}", response_model=PhrasebookResponse)
def get_phrasebook(language: str):
    try:
        kb = load_knowledge_base()
        data = kb["languages"].get(language)
        if not data:
            for key, val in kb["languages"].items():
                if key.lower() == language.lower():
                    data = val
                    language = key
                    break
        if not data:
            raise HTTPException(status_code=404, detail=f"Language '{language}' not found")

        return PhrasebookResponse(
            language=language,
            local_name=data.get("local_name", language),
            country=data.get("country", ""),
            speakers=data.get("speakers", "unknown"),
            status=data.get("status", "unknown"),
            greetings=data.get("greetings", {}),
            vocabulary=data.get("vocabulary", {}),
            common_phrases=data.get("common_phrases", []),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================
# MAP AUDIO
# ==============================
@app.post("/map-audio", response_model=MapAudioResponse)
def map_audio(request: MapAudioRequest):
    if not request.language:
        raise HTTPException(status_code=400, detail="language is required")

    try:
        # Generate a natural greeting in the requested regional language
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are Kura, a Southeast Asian regional language expert. "
                        "Your task is to produce a short, natural greeting or expression "
                        "in the requested regional language. "
                        "Reply with ONLY the greeting text itself — no explanation, "
                        "no transliteration, no quotes, no punctuation beyond what is natural. "
                        "Maximum 10 words."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        f"Give one common greeting or short expression in the {request.language} language."
                    )
                }
            ],
            temperature=0.7
        )

        greeting_text = response.choices[0].message.content.strip()

        # Convert greeting to audio using the correct language code
        gtts_lang = get_gtts_lang(request.language)
        tts = gTTS(text=greeting_text, lang=gtts_lang)
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        audio_base64 = base64.b64encode(audio_buffer.read()).decode("utf-8")

        # Enrich response with knowledge base data
        speakers = None
        status = None
        cultural_fact = None
        family = None
        try:
            kb = load_knowledge_base()
            lang_data = None
            for key, val in kb["languages"].items():
                if key.lower() == request.language.lower():
                    lang_data = val
                    break
            if lang_data:
                speakers = lang_data.get("speakers")
                status = lang_data.get("status")
                family = lang_data.get("family")
                cultural_notes = lang_data.get("cultural_notes", "")
                # Pick the first sentence of cultural_notes as the fact
                if cultural_notes:
                    sentences = [s.strip() for s in cultural_notes.replace("\n", " ").split(".") if s.strip()]
                    cultural_fact = sentences[0] + "." if sentences else None
        except Exception:
            pass  # cultural enrichment is non-critical

        return MapAudioResponse(
            text=greeting_text,
            audio_base64=audio_base64,
            speakers=speakers,
            status=status,
            cultural_fact=cultural_fact,
            family=family,
        )

    except Exception as error:
        print("MAP AUDIO ERROR:", error)
        raise HTTPException(status_code=500, detail=str(error))
