"""
archive_engine.py — KURA AI Cultural Memory Engine
====================================================
Shared dynamic cultural memory layer that powers ALL KURA features.
Every archived elder recording becomes living knowledge usable by:
  - Language Chatbot (system context enrichment)
  - Dictionary (auto-extracted vocabulary/phrases)
  - Quiz System (dynamic questions from archive)
  - SEA Language Map (per-language voice counts)
  - Two-Way Communication (culturally authentic phrase memory)

Storage: archive_memory.json (lightweight JSON, migration-ready)
"""

import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

ARCHIVE_FILE = os.path.join(os.path.dirname(__file__), "archive_memory.json")

VALID_CATEGORIES = {
    "folklore", "prayer", "advice", "oral_history", "proverb",
    "song", "ritual", "poem", "lullaby", "chant", "greeting",
    "traditional_knowledge", "conversation", "unknown",
}

# ──────────────────────────────────────────────
# PERSISTENCE LAYER
# ──────────────────────────────────────────────

def _load_raw() -> Dict[str, Any]:
    """Load the full archive JSON from disk."""
    if not os.path.exists(ARCHIVE_FILE):
        return {"entries": [], "meta": {"version": "1.0"}}
    try:
        with open(ARCHIVE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {"entries": [], "meta": {"version": "1.0"}}


def _save_raw(data: Dict[str, Any]) -> None:
    """Persist the archive JSON to disk atomically."""
    tmp = ARCHIVE_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, ARCHIVE_FILE)


# ──────────────────────────────────────────────
# CRUD
# ──────────────────────────────────────────────

def get_all_entries() -> List[Dict[str, Any]]:
    """Return all archive entries, newest first."""
    data = _load_raw()
    return list(reversed(data.get("entries", [])))


def get_entries_for_language(language: str) -> List[Dict[str, Any]]:
    """Return all entries for a specific language (case-insensitive)."""
    return [
        e for e in get_all_entries()
        if e.get("language", "").lower() == language.lower()
    ]


def add_entry(entry: Dict[str, Any]) -> Dict[str, Any]:
    """Add a validated entry to the archive and return it with its assigned id."""
    data = _load_raw()
    if "id" not in entry:
        entry["id"] = str(uuid.uuid4())
    if "timestamp" not in entry:
        entry["timestamp"] = datetime.now(timezone.utc).isoformat()
    data["entries"].append(entry)
    _save_raw(data)
    return entry


# ──────────────────────────────────────────────
# STATS
# ──────────────────────────────────────────────

def get_stats() -> Dict[str, Any]:
    """Return archive statistics for the stats panel."""
    entries = get_all_entries()
    today = datetime.now(timezone.utc).date().isoformat()
    languages_seen = {e.get("language", "") for e in entries if e.get("language")}
    today_count = sum(
        1 for e in entries
        if e.get("timestamp", "")[:10] == today
    )
    return {
        "total_entries": len(entries),
        "languages_archived": len(languages_seen),
        "total_today": today_count,
    }


def get_language_voice_counts() -> Dict[str, int]:
    """
    Return a dict of {language: voice_count} for all languages in the archive.
    Used by the SEA Map to show preservation activity.
    """
    counts: Dict[str, int] = {}
    for e in get_all_entries():
        lang = e.get("language", "")
        if lang:
            counts[lang] = counts.get(lang, 0) + 1
    return counts


def get_featured_entry_for_language(language: str) -> Optional[Dict[str, Any]]:
    """
    Return the most culturally significant entry for a language
    (prefer proverb/folklore/oral_history categories).
    """
    entries = get_entries_for_language(language)
    if not entries:
        return None
    priority = ["proverb", "folklore", "oral_history", "traditional_knowledge", "song"]
    for cat in priority:
        for e in entries:
            if e.get("detected_category", "").lower() == cat:
                return e
    return entries[0]  # fallback: most recent


# ──────────────────────────────────────────────
# CHATBOT CONTEXT INJECTION
# ──────────────────────────────────────────────

def build_archive_context_for_chat(query: str, max_entries: int = 6) -> str:
    """
    Build a compact context block of relevant archive memories
    for injection into the chatbot system prompt.

    Relevance: language name or keywords mentioned in the user query.
    """
    entries = get_all_entries()
    if not entries:
        return ""

    query_lower = query.lower()
    scored: List[tuple] = []

    for e in entries:
        score = 0
        lang = e.get("language", "").lower()
        if lang and lang in query_lower:
            score += 3
        keywords = e.get("extracted_keywords", [])
        for kw in keywords:
            if kw.lower() in query_lower:
                score += 1
        phrases = e.get("extracted_phrases", [])
        for ph in phrases:
            if ph.lower() in query_lower:
                score += 1
        scored.append((score, e))

    # Sort by relevance, then recency (already newest-first)
    scored.sort(key=lambda x: x[0], reverse=True)
    top = [e for _, e in scored if _ > 0][:max_entries]

    # Fallback: grab a few recent entries even if not directly relevant
    if not top:
        top = entries[:3]

    if not top:
        return ""

    lines = ["## Community Archive Memories (Elder Voices):\n"]
    for e in top:
        lang = e.get("language", "Unknown")
        cat = e.get("detected_category", "oral_history")
        speaker = e.get("speaker_name") or "Anonymous elder"
        country = e.get("country", "")
        transcript = e.get("original_text", "")[:200]
        english = e.get("english_translation", "")[:200]
        summary = e.get("cultural_summary", "")[:150]
        significance = e.get("cultural_significance", "")[:120]
        phrases = e.get("extracted_phrases", [])[:3]

        block = (
            f"- [{lang} | {country} | {cat}] Recorded by {speaker}\n"
            f"  Original: {transcript}\n"
            f"  English: {english}\n"
        )
        if summary:
            block += f"  Cultural summary: {summary}\n"
        if significance:
            block += f"  Significance: {significance}\n"
        if phrases:
            block += f"  Key phrases: {', '.join(phrases)}\n"
        lines.append(block)

    return "\n".join(lines)


# ──────────────────────────────────────────────
# DICTIONARY SYNC
# ──────────────────────────────────────────────

def extract_dictionary_entries_from_archive(language: str) -> List[Dict[str, Any]]:
    """
    Pull archive-derived vocabulary/phrase entries for a given language.
    Returns entries compatible with DictionaryEntryResponse schema.
    """
    entries = get_entries_for_language(language)
    dict_entries = []
    seen_words: set = set()

    for e in entries:
        phrases = e.get("extracted_phrases", [])
        keywords = e.get("extracted_keywords", [])
        source_ref = f"Archive: {e.get('detected_category', 'oral_history')} ({e.get('speaker_name') or 'Anonymous'})"
        english = e.get("english_translation", "")
        summary = e.get("cultural_summary", "")

        for phrase in phrases:
            phrase = phrase.strip()
            if not phrase or phrase.lower() in seen_words:
                continue
            seen_words.add(phrase.lower())
            dict_entries.append({
                "word": phrase,
                "pronunciation": "",
                "english": english[:100] if english else "Preserved cultural expression",
                "category": e.get("detected_category", "oral_history"),
                "example": phrase,
                "example_english": english[:80] if english else "",
                "source": source_ref,
                "cultural_note": summary[:120] if summary else "",
            })

        for kw in keywords:
            kw = kw.strip()
            if not kw or kw.lower() in seen_words:
                continue
            seen_words.add(kw.lower())
            dict_entries.append({
                "word": kw,
                "pronunciation": "",
                "english": "",
                "category": "cultural_term",
                "example": kw,
                "example_english": "",
                "source": source_ref,
                "cultural_note": summary[:120] if summary else "",
            })

    return dict_entries


# ──────────────────────────────────────────────
# QUIZ GENERATION
# ──────────────────────────────────────────────

def generate_quiz_questions_from_archive(language: str) -> List[Dict[str, Any]]:
    """
    Dynamically generate quiz questions from archive entries for a language.
    Returns a list of question dicts ready for the quiz system.
    """
    entries = get_entries_for_language(language)
    questions = []

    for e in entries:
        cat = e.get("detected_category", "unknown")
        english = e.get("english_translation", "").strip()
        original = e.get("original_text", "").strip()
        significance = e.get("cultural_significance", "").strip()
        summary = e.get("cultural_summary", "").strip()
        phrases = e.get("extracted_phrases", [])

        # Question type 1: "What does this phrase mean?"
        for phrase in phrases[:2]:
            if phrase and english:
                questions.append({
                    "type": "phrase_meaning",
                    "language": language,
                    "question": f"What does '{phrase}' mean in {language}?",
                    "correct_answer": english[:80],
                    "source": cat,
                    "archive_entry_id": e.get("id"),
                })

        # Question type 2: Cultural context
        if cat in ("proverb", "folklore", "traditional_knowledge") and significance:
            questions.append({
                "type": "cultural_context",
                "language": language,
                "question": f"What is the cultural significance of this {language} {cat}?",
                "correct_answer": significance[:100],
                "source": cat,
                "archive_entry_id": e.get("id"),
            })

        # Question type 3: Category identification
        if original and cat != "unknown":
            questions.append({
                "type": "category_identify",
                "language": language,
                "question": f"How would you classify this {language} cultural recording?",
                "correct_answer": cat.replace("_", " ").title(),
                "original_excerpt": original[:80],
                "source": cat,
                "archive_entry_id": e.get("id"),
            })

    return questions


# ──────────────────────────────────────────────
# CATEGORY VALIDATION + FALLBACKS
# ──────────────────────────────────────────────

def validate_and_apply_fallbacks(ai_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate AI classification result and apply mandatory fallbacks
    so that no field is ever empty.
    """
    # Category fallback
    cat = ai_result.get("detected_category", "").lower().replace(" ", "_")
    if cat not in VALID_CATEGORIES:
        cat = "oral_history"
    ai_result["detected_category"] = cat

    # Summary fallback
    if not ai_result.get("cultural_summary", "").strip():
        ai_result["cultural_summary"] = (
            "Traditional cultural recording preserved through KURA AI."
        )

    # Significance fallback
    if not ai_result.get("cultural_significance", "").strip():
        ai_result["cultural_significance"] = (
            "This recording contributes to the preservation of regional cultural identity."
        )

    # Preservation value fallback
    if not ai_result.get("preservation_value", "").strip():
        ai_result["preservation_value"] = (
            "Valuable linguistic and cultural heritage artifact."
        )

    # Emotional tone fallback
    if not ai_result.get("emotional_tone", "").strip():
        ai_result["emotional_tone"] = "reflective"

    # Keyword list fallback
    if not isinstance(ai_result.get("keywords"), list):
        ai_result["keywords"] = []

    # Phrases list fallback
    if not isinstance(ai_result.get("important_phrases"), list):
        ai_result["important_phrases"] = []

    # Translation fallbacks
    if not ai_result.get("english_translation", "").strip():
        ai_result["english_translation"] = "Traditional cultural recording."
    if not ai_result.get("indonesian_translation", "").strip():
        ai_result["indonesian_translation"] = "Rekaman budaya tradisional."

    return ai_result


# ──────────────────────────────────────────────
# AI CLASSIFICATION PROMPT
# ──────────────────────────────────────────────

CLASSIFICATION_PROMPT = """\
You are an expert ASEAN cultural anthropologist and linguist.
Analyze the following transcribed audio from an indigenous SEA community member.

Your task: classify the recording and extract structured cultural metadata.

Respond ONLY with a single valid JSON object matching this schema exactly:

{{
  "detected_category": "<one of: folklore|prayer|advice|oral_history|proverb|song|ritual|poem|lullaby|chant|greeting|traditional_knowledge|conversation|unknown>",
  "english_translation": "<full English translation of the transcript>",
  "indonesian_translation": "<full Indonesian (Bahasa Indonesia) translation of the transcript>",
  "cultural_summary": "<2-3 sentence summary of the cultural meaning and context>",
  "keywords": ["<culturally significant word or term>", ...],
  "important_phrases": ["<notable phrase from the recording>", ...],
  "cultural_significance": "<why this recording matters for cultural preservation>",
  "emotional_tone": "<e.g. solemn|joyful|instructive|mournful|celebratory|reverent|warm>",
  "preservation_value": "<explanation of the linguistic and heritage value>"
}}

RULES:
- Return ONLY the JSON object. No explanation. No markdown fences.
- Never leave any field empty. Use best-effort values.
- If category is uncertain, use "oral_history".
- If translation is impossible, write: "Traditional cultural expression — exact translation requires native speaker validation."

Language: {language}
Country: {country}
Speaker role: {speaker_role}
Category hint from user: {category}

Transcript:
{transcript}
"""

def build_classification_prompt(
    transcript: str,
    language: str,
    country: str,
    speaker_role: str,
    category: str,
) -> str:
    return CLASSIFICATION_PROMPT.format(
        language=language,
        country=country,
        speaker_role=speaker_role,
        category=category,
        transcript=transcript,
    )
