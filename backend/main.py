import base64
import io
import os
import json
import uuid
import tempfile
import random
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import requests

# Cultural Memory Engine — shared knowledge layer for all KURA features
import archive_engine

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
SEA_REGIONAL_LANGUAGES = {"minang", "minangkabau", "jawa", "sunda", "iban", "kadazan-dusun", "dusun", "tetum"}

LANGUAGE_ALIASES = {
    "Minang": "Minangkabau",
}

def refine_sea_language(text: str, source_language: str = "", target_language: str = "") -> str:
    """
    Refine regional SEA language text using SEA-LION.
    Falls back safely if API fails.
    """

    if not hf_token or not text.strip():
        return text

    try:
        API_URL = "https://api-inference.huggingface.co/models/aisingapore/sea-lion-7b-instruct"

        headers = {
            "Authorization": f"Bearer {hf_token}",
            "Content-Type": "application/json",
        }

        prompt = f"""
                You are SEA-LION, an ASEAN cultural language assistant.

                Your task:
                - Refine the regional Southeast Asian language transcription.
                - Preserve original meaning.
                - Preserve cultural tone.
                - Do NOT translate to English.
                - Clean unclear speech artifacts.
                - Return ONLY the refined text.

                Text:
                {text}
                """

        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 80,
                "temperature": 0.2,
                "return_full_text": False
            }
        }

        res = requests.post(
            API_URL,
            headers=headers,
            json=payload,
            timeout=20
        )

        if res.status_code != 200:
            print("SEA-LION HTTP ERROR:", res.text)
            return text

        result = res.json()

        if isinstance(result, dict) and result.get("error"):
            print("SEA-LION MODEL ERROR:", result["error"])
            return text

        if isinstance(result, list) and len(result) > 0:
            generated = result[0].get("generated_text", "").strip()

            if generated:
                return generated

        return text

    except Exception as e:
        print("SEA-LION REFINE ERROR:", e)
        return text

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
    "Kuy": "km",

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

WHISPER_LANG_MAP = {
    "Indonesia": "id",
    "English": "en",
    "Mandarin": "zh",
    "Thai": "th",
    "Vietnamese": "vi",
    "Malay": "ms",
    "Tagalog": "tl",
    "Khmer": "km",
    "Minangkabau": "id",
    "Minang": "id",
    "Jawa": "id",
    "Sunda": "id",
    "Shan": "en",
    "Karen": "en",
    "Lao": "lo",
    "Hmong": "en",
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
    "Teochew": "zh",
    "Hokkien": "zh",
    "Tetum": "pt",
    "Mambae": "pt",
}

# Languages where the native script is incompatible with the assigned TTS engine.
# For these, the map_audio prompt will request romanized (Latin) output so the
# TTS engine can actually pronounce the text.
ROMANIZE_LANGS = {"Karen", "Shan", "Hmong"}

# SEA Map voice overrides for languages that sound better with a syllable-based
# TTS voice than with English spelling.
MAP_TTS_LANG_OVERRIDES = {
    "Karen": "ms",
    "Shan": "ms",
}

def get_gtts_lang(language_name: str) -> str:
    """Return gTTS language code for a given language name. Defaults to 'id'."""
    return LANG_CODE_MAP.get(language_name, "id")

def get_whisper_lang(language_name: str) -> Optional[str]:
    """Return Whisper language code for a given language name."""
    return WHISPER_LANG_MAP.get(language_name)

def normalize_language_name(language_name: str) -> str:
    """Normalize aliases to canonical language names when possible."""
    return LANGUAGE_ALIASES.get(language_name, language_name)

def get_language_data(language_name: str):
    """Return (key, data) for a language name or alias in the knowledge base."""
    kb = load_knowledge_base()
    alias_key = LANGUAGE_ALIASES.get(language_name)
    if alias_key and alias_key in kb["languages"]:
        return alias_key, kb["languages"][alias_key]
    for key, val in kb["languages"].items():
        if key.lower() == language_name.lower():
            return key, val
    return None, None

def build_minang_glossary() -> str:
    """Build a small Minangkabau glossary snippet to guide translation."""
    key, data = get_language_data("Minangkabau")
    if not data:
        return ""
    greetings = data.get("greetings", {})
    vocab = data.get("vocabulary", {})
    greeting_lines = [f"{k}: {v}" for k, v in list(greetings.items())[:6]]
    vocab_lines = [f"{k}: {v}" for k, v in list(vocab.items())[:10]]
    parts = []
    if greeting_lines:
        parts.append("Greetings: " + "; ".join(greeting_lines))
    if vocab_lines:
        parts.append("Vocabulary: " + "; ".join(vocab_lines))
    return "\n".join(parts)

def build_minang_transcription_prompt() -> str:
    """Build a short prompt to bias Whisper toward Minangkabau vocabulary."""
    key, data = get_language_data("Minangkabau")
    if not data:
        return ""
    greetings = data.get("greetings", {})
    vocab = data.get("vocabulary", {})
    phrases = data.get("common_phrases", [])
    tokens = []
    tokens.extend(list(greetings.values())[:4])
    tokens.extend(list(vocab.values())[:8])
    tokens.extend([p.split("—")[0].strip() for p in phrases[:3]])
    return ", ".join([t for t in tokens if t])

# ==============================
# KNOWLEDGE BASE LOADER
# ==============================
def load_knowledge_base():
    with open("sea_languages_knowledge.json", "r", encoding="utf-8") as f:
        return json.load(f)

def load_dictionary():
    # Prefer a folder-based dictionary (one JSON file per language) if present.
    dict_dir = "dictionary"
    result = {}
    if os.path.isdir(dict_dir):
        for fname in os.listdir(dict_dir):
            if not fname.lower().endswith(".json"):
                continue
            path = os.path.join(dict_dir, fname)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    key = os.path.splitext(fname)[0]
                    result[key] = data
            except Exception:
                # skip malformed files but continue loading others
                continue
        return result
    # Fallback: legacy single-file dictionary
    try:
        with open("sea_languages_dictionary.json", "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

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

    # Detect relevant languages from conversation
    extra_context = ""
    archive_context = ""
    if user_messages:
        combined_query = " ".join(
            m.get("content", "") for m in user_messages if m.get("role") == "user"
        )
        lang_data = get_relevant_language_data(combined_query)
        if lang_data:
            extra_context = f"\n\nDetailed language data for mentioned languages:\n{lang_data}"
        # Inject relevant elder archive memories as cultural grounding
        archive_mem = archive_engine.build_archive_context_for_chat(combined_query)
        if archive_mem:
            archive_context = f"\n\n{archive_mem}"

    return f"""You are Kura, an AI assistant specialised in Southeast Asian (SEA) regional language preservation.
You are community-trained: you have access to real oral recordings and cultural memories contributed
by indigenous elders and community members across ASEAN.

You have knowledge of 24 regional languages across 11 ASEAN countries.

## Available Languages Index:
{language_index}
{extra_context}{archive_context}

## Your Role:
- Answer questions about SEA regional languages: greetings, vocabulary, phrases, grammar, culture, and preservation status.
- Provide translations between languages when asked.
- Share cultural context and stories behind language traditions — including insights from the elder archive above.
- Reference preserved proverbs, folklore, and oral traditions naturally in your answers when relevant.
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
# ARCHIVE STORAGE
# ==============================
ARCHIVE_DB_PATH = "suara_leluhur_archive.json"

def ensure_archive_storage():
    if not os.path.exists(ARCHIVE_DB_PATH):
        with open(ARCHIVE_DB_PATH, "w", encoding="utf-8") as f:
            json.dump({"archive": []}, f, indent=2, ensure_ascii=False)

def load_archive_storage():
    ensure_archive_storage()
    with open(ARCHIVE_DB_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def save_archive_storage(data):
    with open(ARCHIVE_DB_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def get_preservation_status(language_name: str) -> str:
    if language_name.lower() in SEA_REGIONAL_LANGUAGES:
        return "Endangered heritage voice"
    return "Preserved cultural memory"

def parse_archive_response(content: str) -> dict:
    try:
        return json.loads(content)
    except Exception:
        result = {}
        lines = [line.strip() for line in content.splitlines() if line.strip()]
        for line in lines:
            if line.lower().startswith("english_translation"):
                result["english_translation"] = line.split(":", 1)[1].strip()
            elif line.lower().startswith("indonesian_translation"):
                result["indonesian_translation"] = line.split(":", 1)[1].strip()
            elif line.lower().startswith("cultural_summary"):
                result["summary"] = line.split(":", 1)[1].strip()
        return result

@app.post("/archive/submit")
def submit_archive(
    audio: UploadFile = File(...),
    language: str = Form(...),
    country: str = Form(...),
    speaker_role: str = Form(...),
    category: str = Form(...),
    speaker_name: Optional[str] = Form(None),
    speaker_age: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
):
    if not groq_api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured")

    temp_audio_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
            temp_audio.write(audio.file.read())
            temp_audio_path = temp_audio.name

        with open(temp_audio_path, "rb") as file:
            normalized_language = normalize_language_name(language)
            whisper_language = get_whisper_lang(normalized_language)
            transcription_kwargs = {
                "file": (audio.filename, file.read()),
                "model": "whisper-large-v3",
                "response_format": "json",
            }
            if whisper_language:
                transcription_kwargs["language"] = whisper_language
            transcription = groq_client.audio.transcriptions.create(**transcription_kwargs)

        original_text = transcription.text.strip()
        if not original_text:
            raise HTTPException(status_code=400, detail="Could not transcribe audio")

        if normalized_language.lower() in SEA_REGIONAL_LANGUAGES:
            original_text = refine_sea_language(original_text)

        prompt = (
            "You are Kura, a cultural preservation assistant. "
            "Translate the transcription below into English and Indonesian, and create a warm, human-centered cultural summary. "
            "Return only valid JSON with keys: english_translation, indonesian_translation, cultural_summary."
        )

        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": prompt},
                {
                    "role": "user",
                    "content": (
                        f"Language: {language}\n"
                        f"Country: {country}\n"
                        f"Speaker role: {speaker_role}\n"
                        f"Category: {category}\n"
                        f"Transcript: {original_text}"
                    ),
                },
            ],
            temperature=0.4,
            max_tokens=1024,
        )

        ai_output = response.choices[0].message.content.strip()
        parsed = parse_archive_response(ai_output)
        english_translation = parsed.get("english_translation", "")
        indonesian_translation = parsed.get("indonesian_translation", "")
        cultural_summary = parsed.get("cultural_summary", "")

        audio.file.seek(0)
        audio_bytes = audio.file.read() if hasattr(audio.file, "read") else b""
        if not audio_bytes and temp_audio_path and os.path.exists(temp_audio_path):
            with open(temp_audio_path, "rb") as f:
                audio_bytes = f.read()

        audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")

        db = load_archive_storage()
        entry = {
            "id": uuid.uuid4().hex,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "language": language,
            "country": country,
            "speaker_role": speaker_role,
            "category": category,
            "speaker_name": speaker_name or "",
            "speaker_age": speaker_age or "",
            "location": location or "",
            "original_text": original_text,
            "english_translation": english_translation,
            "indonesian_translation": indonesian_translation,
            "summary": cultural_summary,
            "audio_base64": audio_base64,
            "audio_mime": audio.content_type or "audio/webm",
            "preservation_status": get_preservation_status(language),
            "language_badge": language,
        }
        db["archive"].insert(0, entry)
        save_archive_storage(db)

        stats = {
            "total_entries": len(db["archive"]),
            "languages_archived": len({item["language"] for item in db["archive"]}),
            "total_today": sum(
                1
                for item in db["archive"]
                if item.get("timestamp", "").startswith(datetime.utcnow().date().isoformat())
            ),
        }

        return {"entry": entry, "stats": stats}
    except HTTPException:
        raise
    except Exception as e:
        print("ARCHIVE ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_audio_path and os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)

@app.get("/archive/list")
def archive_list():
    try:
        db = load_archive_storage()
        return {"entries": db.get("archive", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/archive/stats")
def archive_stats():
    try:
        db = load_archive_storage()
        archive_items = db.get("archive", [])
        return {
            "total_entries": len(archive_items),
            "languages_archived": len({item.get("language") for item in archive_items}),
            "total_today": sum(
                1
                for item in archive_items
                if item.get("timestamp", "").startswith(datetime.utcnow().date().isoformat())
            ),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
# DICTIONARY
# ==============================
class DictionaryEntryResponse(BaseModel):
    word: str
    pronunciation: str
    english: str
    category: str
    example: str
    example_english: str


class DictionaryResponse(BaseModel):
    language: str
    local_name: str
    entries: List[DictionaryEntryResponse]


@app.get("/dictionary/{language}", response_model=DictionaryResponse)
def get_dictionary(language: str):
    try:
        dictionary = load_dictionary()
        # Try exact match first, then case-insensitive
        data = dictionary.get(language)
        if not data:
            for key, val in dictionary.items():
                if key.lower() == language.lower():
                    data = val
                    language = key
                    break
        if not data:
            raise HTTPException(status_code=404, detail=f"Dictionary for '{language}' not found")

        entries = [DictionaryEntryResponse(**entry) for entry in data.get("entries", [])]
        return DictionaryResponse(
            language=language,
            local_name=data.get("local_name", language),
            entries=entries,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/dictionary")
def list_dictionaries():
    try:
        dictionary = load_dictionary()
        available = list(dictionary.keys())
        return {"available_languages": available, "count": len(available)}
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

        # Gather wrong answers from the SAME language but different greeting keys
        wrong_pool = []
        for other_key, other_value in greetings.items():
            # Skip the correct answer key and empty values
            if other_key == question_key or not other_value or not other_value.strip():
                continue
            candidate = other_value.strip()
            if candidate != correct_answer:
                wrong_pool.append(candidate)

        # Deduplicate and pick 3 wrong answers
        wrong_pool = list(dict.fromkeys(wrong_pool))  # preserve order, remove dupes
        random.shuffle(wrong_pool)
        wrong_choices = wrong_pool[:3]

        # Pad with generic fillers if not enough wrong answers from same language
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
        # Load curated greeting from knowledge base (not LLM generation)
        kb = load_knowledge_base()
        lang_data = None
        matched_key = None
        for key, val in kb["languages"].items():
            if key.lower() == request.language.lower():
                lang_data = val
                matched_key = key
                break

        if not lang_data:
            raise HTTPException(status_code=404, detail=f"Language '{request.language}' not found in knowledge base")

        # Get greetings from KB
        greetings = lang_data.get("greetings", {})
        if not greetings:
            raise HTTPException(status_code=404, detail=f"No greetings found for '{request.language}'")

        # Pick a random greeting value from the curated greetings dict
        valid_greetings = [v for v in greetings.values() if v and v.strip()]
        if not valid_greetings:
            raise HTTPException(status_code=404, detail="No valid greetings available")

        greeting_text = random.choice(valid_greetings).strip()

        # Convert greeting to audio using the correct language code.
        # Use a Malay voice for Karen/Shan so romanized text is read more naturally.
        gtts_lang = MAP_TTS_LANG_OVERRIDES.get(matched_key or request.language, get_gtts_lang(request.language))
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
            temperature=0.7,
            max_tokens=1024
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
                stream=True,
                max_tokens=1024
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
        minang_glossary = ""
        if request.output_language.lower() in {"minang", "minangkabau"}:
            minang_glossary = build_minang_glossary()

        system_content = (
            "You are Kura, a professional translator specialising in Southeast Asian languages, "
            "including regional and minority languages. "
            "Translate the given text accurately and naturally. "
            "Return ONLY the translated text - no explanations, no notes, no alternatives."
        )
        if minang_glossary:
            system_content += "\nUse this Minangkabau glossary as guidance:\n" + minang_glossary

        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": system_content
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
            temperature=0.3,
            max_tokens=1024
        )

        translation = response.choices[0].message.content.strip()

        if request.output_language.lower() in SEA_REGIONAL_LANGUAGES:
            translation = refine_sea_language(translation, request.input_language, request.output_language)

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
            normalized_input = normalize_language_name(input_language)
            whisper_language = get_whisper_lang(normalized_input)
            transcription_kwargs = {
                "file": (audio.filename, file.read()),
                "model": "whisper-large-v3",
                "response_format": "json",
            }
            if whisper_language:
                transcription_kwargs["language"] = whisper_language
            if normalized_input.lower() == "minangkabau":
                minang_prompt = build_minang_transcription_prompt()
                if minang_prompt:
                    transcription_kwargs["prompt"] = minang_prompt
            transcription = groq_client.audio.transcriptions.create(**transcription_kwargs)
        
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
            temperature=0.3,
            max_tokens=1024
        )

        translation = response.choices[0].message.content.strip()

        # Refine dengan SEA-LION jika output adalah bahasa daerah
        if output_language.lower() in SEA_REGIONAL_LANGUAGES:
            translation = refine_sea_language(translation, input_language, output_language)

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


# ============================================================
# ARCHIVE — SUARA LELUHUR (Cultural Memory Engine)
# ============================================================

class ArchiveSubmitResponse(BaseModel):
    entry: Dict[str, Any]
    stats: Dict[str, Any]


class ArchiveListResponse(BaseModel):
    entries: List[Dict[str, Any]]
    total: int


class ArchiveStatsResponse(BaseModel):
    total_entries: int
    languages_archived: int
    total_today: int


class ArchiveVoiceCountsResponse(BaseModel):
    counts: Dict[str, int]


def _run_ai_classification(
    transcript: str,
    language: str,
    country: str,
    speaker_role: str,
    category: str,
) -> Dict[str, Any]:
    """
    Call the LLM to classify and extract cultural metadata from a transcript.
    Returns a validated dict — always non-empty due to fallbacks.
    """
    prompt = archive_engine.build_classification_prompt(
        transcript=transcript,
        language=language,
        country=country,
        speaker_role=speaker_role,
        category=category,
    )
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": "You are a cultural anthropologist AI. Return ONLY valid JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=1024,
        )
        raw = response.choices[0].message.content.strip()
        # Strip markdown fences if present
        if raw.startswith("```"):
            parts = raw.split("```")
            raw = parts[1] if len(parts) > 1 else raw
            if raw.startswith("json"):
                raw = raw[4:]
        ai_result = json.loads(raw)
    except Exception as e:
        print("AI CLASSIFICATION ERROR:", e)
        ai_result = {}
    return archive_engine.validate_and_apply_fallbacks(ai_result)


@app.post("/archive/submit", response_model=ArchiveSubmitResponse)
async def archive_submit(
    audio: UploadFile = File(...),
    language: str = Form(...),
    country: str = Form(...),
    speaker_role: str = Form(default="Elder"),
    category: str = Form(default="Oral History"),
    speaker_name: str = Form(default=""),
    speaker_age: str = Form(default=""),
    location: str = Form(default=""),
):
    """
    Submit an elder voice recording.
    Pipeline:
      1. Read audio bytes
      2. Transcribe with Groq Whisper large-v3
      3. AI cultural classification & metadata extraction
      4. Persist to archive_memory.json (with audio as base64)
      5. Return enriched entry — now feeds ALL other KURA features
    """
    if not groq_api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured.")

    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Audio file is empty.")

    temp_path = None
    try:
        # Step 1: Persist audio temporarily for Whisper
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            tmp.write(audio_bytes)
            temp_path = tmp.name

        # Step 2: Transcribe
        whisper_lang = get_whisper_lang(language)
        with open(temp_path, "rb") as af:
            transcription_kwargs: Dict[str, Any] = {
                "file": (audio.filename or "recording.webm", af.read()),
                "model": "whisper-large-v3",
                "response_format": "json",
            }
            if whisper_lang:
                transcription_kwargs["language"] = whisper_lang
        transcription = groq_client.audio.transcriptions.create(**transcription_kwargs)
        transcript = transcription.text.strip()
        if not transcript:
            transcript = "[Audio could not be transcribed — preserved as cultural recording]"

        # Step 3: AI Cultural Classification
        ai_meta = _run_ai_classification(
            transcript=transcript,
            language=language,
            country=country,
            speaker_role=speaker_role,
            category=category,
        )

        # Step 4: Encode audio as base64
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

        # Step 5: Build + persist entry
        entry: Dict[str, Any] = {
            "language": language,
            "country": country,
            "speaker_role": speaker_role,
            "category": category,
            "speaker_name": speaker_name or None,
            "speaker_age": speaker_age or None,
            "location": location or None,
            "original_text": transcript,
            "english_translation": ai_meta.get("english_translation", ""),
            "indonesian_translation": ai_meta.get("indonesian_translation", ""),
            "cultural_summary": ai_meta.get("cultural_summary", ""),
            "summary": ai_meta.get("cultural_summary", ""),  # alias for frontend
            "detected_category": ai_meta.get("detected_category", "oral_history"),
            "extracted_keywords": ai_meta.get("keywords", []),
            "extracted_phrases": ai_meta.get("important_phrases", []),
            "cultural_significance": ai_meta.get("cultural_significance", ""),
            "emotional_tone": ai_meta.get("emotional_tone", ""),
            "preservation_value": ai_meta.get("preservation_value", ""),
            "audio_base64": audio_b64,
            "audio_mime": audio.content_type or "audio/webm",
        }

        saved_entry = archive_engine.add_entry(entry)
        stats = archive_engine.get_stats()
        return ArchiveSubmitResponse(entry=saved_entry, stats=stats)

    except HTTPException:
        raise
    except Exception as error:
        print("ARCHIVE SUBMIT ERROR:", error)
        raise HTTPException(status_code=500, detail=str(error))
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


@app.get("/archive/list", response_model=ArchiveListResponse)
def archive_list(
    language: Optional[str] = None,
    limit: int = 50,
):
    """Return archive entries, optionally filtered by language."""
    entries = (
        archive_engine.get_entries_for_language(language)
        if language
        else archive_engine.get_all_entries()
    )
    return ArchiveListResponse(entries=entries[:limit], total=len(entries))


@app.get("/archive/stats", response_model=ArchiveStatsResponse)
def archive_stats():
    """Return archive statistics for the Suara Leluhur panel."""
    s = archive_engine.get_stats()
    return ArchiveStatsResponse(**s)


@app.get("/archive/voice-counts", response_model=ArchiveVoiceCountsResponse)
def archive_voice_counts():
    """
    Per-language voice counts for the SEA Language Map.
    e.g. {"Minangkabau": 5, "Iban": 2}
    """
    counts = archive_engine.get_language_voice_counts()
    return ArchiveVoiceCountsResponse(counts=counts)


@app.get("/archive/featured/{language}")
def archive_featured(language: str):
    """
    Most culturally significant entry for a language.
    Used by the SEA Map to surface a featured elder story.
    """
    entry = archive_engine.get_featured_entry_for_language(language)
    if not entry:
        raise HTTPException(status_code=404, detail=f"No archive entries for '{language}'")
    return entry


@app.get("/archive/dictionary/{language}")
def archive_dictionary_entries(language: str):
    """
    Archive-derived vocabulary and phrase entries for a language.
    Merged into the Dictionary panel to show community-sourced words.
    """
    entries = archive_engine.extract_dictionary_entries_from_archive(language)
    return {"language": language, "entries": entries, "total": len(entries)}


@app.get("/archive/quiz-questions/{language}")
def archive_quiz_questions(language: str):
    """
    Dynamically generated quiz questions from archived elder recordings.
    Allows the quiz to grow as the community contributes more recordings.
    """
    questions = archive_engine.generate_quiz_questions_from_archive(language)
    return {"language": language, "questions": questions, "total": len(questions)}
