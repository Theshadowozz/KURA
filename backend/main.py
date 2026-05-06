import base64
import io
import os
import json
import tempfile
import random
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

app = FastAPI(title="Kura API", version="0.3.0")

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
    # Major ASEAN languages (fully supported by gTTS)
    "Indonesia": "id",
    "English": "en",
    "Mandarin": "zh-CN",
    "Thai": "th",
    "Vietnamese": "vi",
    "Malay": "ms",
    "Tagalog": "tl",
    "Khmer": "km",

    # Indonesian regional languages → fallback to Indonesian
    "Minang": "id",
    "Jawa": "id",
    "Sunda": "id",

    # Myanmar regional languages
    # Karen/Shan scripts differ from Burmese — use "en" TTS with romanized text
    "Shan": "en",
    "Karen": "en",

    # Lao & related
    # "lo" is NOT supported by gTTS — Lao uses Thai TTS (closely related phonetics)
    # Hmong is romanized (RPA) — use English TTS
    "Lao": "th",
    "Hmong": "en",

    # Thai regional → fallback to Thai
    "Isan": "th",
    "Lanna": "th",

    # Vietnamese regional → fallback to Vietnamese
    "Tay": "vi",
    "Khmer Krom": "km",
    "Cham": "vi",

    # Filipino regional → fallback to Tagalog/Filipino
    "Cebuano": "tl",
    "Ilocano": "tl",

    # Malaysian regional → fallback to Malay
    "Iban": "ms",
    "Kadazan-Dusun": "ms",
    "Dusun": "ms",
    "Tutong": "ms",

    # Singapore regional → fallback to Chinese/Malay
    "Teochew": "zh-CN",
    "Hokkien": "zh-CN",

    # Timor Leste → fallback to Portuguese (official)
    "Tetum": "pt",
    "Mambae": "pt",
}

# Languages where the native script is incompatible with the assigned TTS engine.
# For these, the map_audio prompt will request romanized (Latin) output so the
# TTS engine can actually pronounce the text.
ROMANIZE_LANGS = {"Karen", "Shan", "Hmong"}

def get_gtts_lang(language_name: str) -> str:
    """Return gTTS language code for a given language name. Defaults to 'id'."""
    return LANG_CODE_MAP.get(language_name, "id")

# ==============================
# KNOWLEDGE BASE LOADER
# ==============================
def load_knowledge_base():
    with open("sea_languages_knowledge.json", "r", encoding="utf-8") as f:
        return json.load(f)

def get_language_index() -> str:
    """Return a compact index of all languages for the system prompt."""
    kb = load_knowledge_base()
    lines = []
    for lang, data in kb["languages"].items():
        lines.append(
            f"- {lang} ({data.get('local_name', '')}) | {data.get('country', '')} | "
            f"Speakers: {data.get('speakers', 'unknown')} | Status: {data.get('status', 'unknown')}"
        )
    return "\n".join(lines)

def get_relevant_language_data(query: str) -> str:
    """Load full data only for languages mentioned in the query."""
    kb = load_knowledge_base()
    languages = kb["languages"]
    query_lower = query.lower()

    matched = {}
    for lang, data in languages.items():
        if lang.lower() in query_lower or data.get("local_name", "").lower() in query_lower:
            matched[lang] = data

    # If no specific language matched, return top-level index only
    if not matched:
        return ""

    return json.dumps(matched, indent=2, ensure_ascii=False)

# ==============================
# SYSTEM PROMPT
# ==============================
def build_system_prompt(user_messages: list = None):
    language_index = get_language_index()

    # Try to detect relevant languages from conversation
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

Be friendly, accurate, and culturally respectful in all responses.
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

        # Add to Minangkabau vocabulary section
        if "Minangkabau" not in data["languages"]:
            data["languages"]["Minangkabau"] = {}
        if "vocabulary" not in data["languages"]["Minangkabau"]:
            data["languages"]["Minangkabau"]["vocabulary"] = {}

        data["languages"]["Minangkabau"]["vocabulary"][request.indonesia.lower()] = request.minang.lower()

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


class MapAudioResponse(BaseModel):
    text: str
    audio_base64: str
    speakers: Optional[str] = None
    status: Optional[str] = None
    cultural_fact: Optional[str] = None
    family: Optional[str] = None


class SpeakRequest(BaseModel):
    language: str
    text: str


class SpeakResponse(BaseModel):
    audio_base64: str


class PhrasebookResponse(BaseModel):
    language: str
    local_name: str
    country: str
    speakers: str
    status: str
    greetings: dict
    vocabulary: dict
    common_phrases: list


class QuizQuestionResponse(BaseModel):
    language: str
    question_key: str
    question_label: str
    correct_answer: str
    choices: List[str]
    total_keys: int = 0
    did_reset: bool = False

# ==============================
# HEALTH
# ==============================
@app.get("/health")
def health():
    return {"status": "ok"}

# ==============================
# PHRASEBOOK
# ==============================
@app.get("/phrasebook/{language}", response_model=PhrasebookResponse)
def get_phrasebook(language: str):
    try:
        kb = load_knowledge_base()
        # Try exact match first, then case-insensitive
        data = kb["languages"].get(language)
        if not data:
            for key, val in kb["languages"].items():
                if key.lower() == language.lower():
                    data = val
                    language = key
                    break
        if not data:
            raise HTTPException(status_code=404, detail=f"Language '{language}' not found in knowledge base")

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
# SPEAK (TTS only — no translation)
# ==============================
@app.post("/speak", response_model=SpeakResponse)
def speak(request: SpeakRequest):
    if not request.text:
        raise HTTPException(status_code=400, detail="text is required")
    try:
        gtts_lang = get_gtts_lang(request.language)
        tts = gTTS(text=request.text, lang=gtts_lang)
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        audio_base64 = base64.b64encode(audio_buffer.read()).decode("utf-8")
        return SpeakResponse(audio_base64=audio_base64)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==============================
# QUIZ
# ==============================

# Human-readable labels for greeting keys
GREETING_KEY_LABELS = {
    "hello": "Hello",
    "hello_informal": "Hello (Informal)",
    "hello_formal": "Hello (Formal)",
    "welcome": "Welcome",
    "good_morning": "Good Morning",
    "good_afternoon": "Good Afternoon",
    "good_evening": "Good Evening",
    "goodbye": "Goodbye",
    "thank_you": "Thank You",
    "you_are_welcome": "You're Welcome",
    "yes": "Yes",
    "no": "No",
    "please": "Please",
    "sorry": "Sorry",
    "how_are_you": "How Are You?",
}

@app.get("/quiz/question", response_model=QuizQuestionResponse)
def get_quiz_question(language: str, exclude: str = ""):
    try:
        kb = load_knowledge_base()
        languages = kb["languages"]

        # Find the target language (case-insensitive)
        lang_data = None
        matched_key = language
        for key, val in languages.items():
            if key.lower() == language.lower():
                lang_data = val
                matched_key = key
                break

        if not lang_data:
            raise HTTPException(status_code=404, detail=f"Language '{language}' not found")

        greetings = lang_data.get("greetings", {})
        if not greetings:
            raise HTTPException(status_code=404, detail=f"No greetings found for '{language}'")

        # Pick a random greeting key that has a non-empty value
        all_valid_keys = [k for k, v in greetings.items() if v and v.strip()]
        if not all_valid_keys:
            raise HTTPException(status_code=404, detail="No valid greeting keys found")

        # Exclude already-asked keys; if all exhausted, reset (start over)
        excluded_set = set(k.strip() for k in exclude.split(",") if k.strip())
        valid_keys = [k for k in all_valid_keys if k not in excluded_set]
        did_reset = False
        if not valid_keys:
            valid_keys = all_valid_keys   # all asked — reset the cycle
            did_reset = True

        question_key = random.choice(valid_keys)
        correct_answer = greetings[question_key].strip()
        question_label = GREETING_KEY_LABELS.get(question_key, question_key.replace("_", " ").title())

        # Gather wrong answers from OTHER languages using the same key
        wrong_pool = []
        for other_lang, other_data in languages.items():
            if other_lang == matched_key:
                continue
            other_greetings = other_data.get("greetings", {})
            # Try the same key first, then any other greeting key
            candidate = other_greetings.get(question_key) or (
                random.choice(list(other_greetings.values())) if other_greetings else None
            )
            if candidate and candidate.strip() and candidate.strip() != correct_answer:
                wrong_pool.append(candidate.strip())

        # Deduplicate and pick 3 wrong answers
        wrong_pool = list(dict.fromkeys(wrong_pool))  # preserve order, remove dupes
        random.shuffle(wrong_pool)
        wrong_choices = wrong_pool[:3]

        # Pad with generic fillers if not enough wrong answers
        fillers = ["Sabai dee", "Sawubona", "Namaste", "Mabuhay", "Salamat"]
        for f in fillers:
            if len(wrong_choices) >= 3:
                break
            if f != correct_answer and f not in wrong_choices:
                wrong_choices.append(f)

        # Build final shuffled choices
        choices = wrong_choices[:3] + [correct_answer]
        random.shuffle(choices)

        return QuizQuestionResponse(
            language=matched_key,
            question_key=question_key,
            question_label=question_label,
            correct_answer=correct_answer,
            choices=choices,
            total_keys=len(all_valid_keys),
            did_reset=did_reset,
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
        # For languages whose native script is incompatible with the TTS engine,
        # request romanized (Latin) output so the TTS can actually pronounce it.
        needs_romanize = request.language in ROMANIZE_LANGS
        script_instruction = (
            "Write the greeting using ONLY romanized Latin characters (no native script). "
            if needs_romanize else ""
        )

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
                        + script_instruction +
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

# ==============================
# CHAT
# ==============================
@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):

    if not request.messages:
        raise HTTPException(status_code=400, detail="messages is required")

    MAX_HISTORY = 10  # Keep last 10 messages (5 exchanges) to avoid token limit
    raw_messages = [message.model_dump() for message in request.messages]
    trimmed_messages = raw_messages[-MAX_HISTORY:] if len(raw_messages) > MAX_HISTORY else raw_messages
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