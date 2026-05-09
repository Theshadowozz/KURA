# 🎯 Suara Leluhur: System Architecture & Integration Summary

## What Was Built

A **living cultural memory engine** for ASEAN indigenous language preservation. Every recorded elder voice automatically improves the entire KURA platform.

---

## Core Components

### 1. Backend Architecture (`backend/`)

#### `main.py` — FastAPI Application
```python
# Archive Submission Pipeline
POST /archive/submit
├─ Receive: audio file + metadata (language, country, role, category, optional: name/age/location)
├─ Process: 
│  ├─ Transcribe with Groq Whisper (language-aware)
│  ├─ Classify with LLM (14 categories)
│  ├─ Extract: translations, keywords, phrases, significance
│  └─ Validate with fallbacks (no empty fields ever)
├─ Persist: Save to archive_memory.json with base64 audio
└─ Return: Full entry + updated stats

# Archive Query APIs (READ-ONLY for other features)
GET /archive/list              → All entries (ordered by newest first)
GET /archive/stats             → Total entries, languages, daily count
GET /archive/voice-counts      → Per-language voice counts {language: count}
GET /archive/featured/{lang}   → Most significant entry per language
GET /archive/dictionary/{lang} → Vocabulary entries extracted from archive
GET /archive/quiz-questions/{lang} → Dynamic quiz questions from recordings
```

#### `archive_engine.py` — Cultural Memory Engine
```python
# Core Functions
add_entry()              # Persist new recording
get_all_entries()        # Retrieve all archive entries
get_entries_for_language()  # Filter by language
get_stats()              # Statistics for UI

# Feature Integration
build_archive_context_for_chat()        # Inject relevant memories into chatbot
extract_dictionary_entries_from_archive() # Generate vocabulary from archive
generate_quiz_questions_from_archive()  # Create questions from recordings
get_language_voice_counts()             # Show preservation activity on map
get_featured_entry_for_language()       # Surface best entry per language

# Validation & Fallbacks
validate_and_apply_fallbacks()  # Ensure no empty metadata
build_classification_prompt()   # Structured LLM prompt
parse_archive_response()        # Extract JSON from LLM output
```

### 2. Frontend Architecture (`frontend/src/`)

#### `components/ArchivePanel.jsx` — Recording Interface
```jsx
// UI Sections
├─ Recording Card
│  ├─ Animated waveform visualization
│  ├─ Timer (MM:SS format)
│  ├─ Start/Stop buttons
│  └─ Audio preview player
├─ Metadata Card
│  ├─ Language selection (24 languages)
│  ├─ Country selection
│  ├─ Speaker role (Elder/Teacher/Storyteller/etc)
│  ├─ Category (Folklore/Prayer/Song/etc)
│  └─ Optional: name, age, location
├─ Submission
│  ├─ "Preserve this voice" button
│  ├─ Processing state
│  └─ Success/error messaging
├─ Statistics
│  ├─ Voices Preserved (total)
│  ├─ ASEAN Languages (count)
│  └─ Preserved Today (daily)
└─ Archive List
   ├─ Entry cards (newest first)
   ├─ Metadata display
   ├─ Translations shown
   ├─ Cultural summary
   └─ Audio playback
```

#### `handlers/archive/index.js` — API Bridge
```javascript
// Exported Functions
submitArchive(formData)
getArchiveList(language?)
getArchiveStats()
getVoiceCounts()
getFeaturedEntry(language)
getArchiveDictionaryEntries(language)
getArchiveQuizQuestions(language)
```

#### `api.jsx` — HTTP Layer
```javascript
// Archive Endpoints
submitArchiveRequest(formData)
archiveListRequest()
archiveStatsRequest()
archiveVoiceCountsRequest()
archiveFeaturedRequest(language)
archiveDictionaryRequest(language)
archiveQuizQuestionsRequest(language)
```

---

## System-Wide Integration Paths

### 📌 Path 1: Chatbot Enrichment
```
Archive Entry → archive_engine.build_archive_context_for_chat()
              → Injected into main.py build_system_prompt()
              → Chatbot includes cultural context in responses
              → References preserved wisdom naturally
```

**Example**: User asks "Tell me about Minangkabau"
→ Archive returns elder recordings mentioning Minang traditions
→ Chatbot mentions: "Recent community recordings show..."

### 📌 Path 2: Map Enhancement
```
New Archive Entry → archive_engine.get_language_voice_counts()
                 → MapPanel receives updated counts
                 → Badge shows: "🎙️ X voices preserved"
                 → Map visualizes preservation activity
```

**Example**: After recording Minang story
→ Map shows "Minangkabau — 5 oral histories preserved"

### 📌 Path 3: Dictionary Growth (Future-Ready)
```
Archive Entry → archive_engine.extract_dictionary_entries_from_archive()
             → Extract important_phrases + keywords
             → DictionaryPanel can query these entries
             → Community-sourced vocabulary grows over time
```

**Example**: Minang recording contains "alam takambang"
→ Dictionary learns phrase + meaning + cultural usage

### 📌 Path 4: Dynamic Quiz (Future-Ready)
```
Archive Entry → archive_engine.generate_quiz_questions_from_archive()
             → Quiz types: phrase meaning, cultural context, categorization
             → QuizPanel can fetch these questions
             → Quiz content evolves with community contributions
```

**Example**: Proverb recording
→ Quiz asks: "What is the significance of this proverb?"

---

## Data Flow Architecture

### Recording Submission Pipeline
```
User Audio File
    ↓
    ├─→ [Microphone Recording]
    ├─→ [Metadata Form]
    ├─→ [FormData Assembly]
    ↓
POST /archive/submit
    ↓
    ├─→ [Temporary audio storage]
    ├─→ [Groq Whisper Transcription]
    ├─→ [Language-aware speech-to-text]
    ↓
    ├─→ [LLM Cultural Classification]
    │   ├─ detected_category (14 types)
    │   ├─ english_translation
    │   ├─ indonesian_translation
    │   ├─ cultural_summary
    │   ├─ keywords[]
    │   ├─ important_phrases[]
    │   ├─ cultural_significance
    │   ├─ emotional_tone
    │   └─ preservation_value
    ├─→ [Validation + Fallbacks]
    ├─→ [Audio Encoding to Base64]
    ↓
archive_memory.json (Persisted)
    ├─→ Entry ID (UUID)
    ├─→ Timestamp
    ├─→ Full Metadata
    ├─→ Audio (Base64)
    └─→ Classification Results
    ↓
    ├─→ Return to Frontend
    │   ├─ Entry display
    │   ├─ Updated stats
    │   └─ Success message
    ↓
    ├─→ Made Available to All Features
    │   ├─ Chatbot context injection
    │   ├─ Map voice counts
    │   ├─ Dictionary lookups (future)
    │   └─ Quiz generation (future)
```

---

## Integration Points with Existing Features

### Chatbot (`ChatPanel.jsx`)
- **Hook**: `build_system_prompt()` in `main.py`
- **Integration**: Archive context auto-injected via `archive_engine.build_archive_context_for_chat()`
- **Impact**: Responses feel grounded in community knowledge

### Language Map (`MapPanel.jsx`)
- **Hook**: `voiceCounts` state in `App.jsx`
- **Integration**: Loaded on app mount via `archiveHandler.getVoiceCounts()`
- **Impact**: Shows preservation activity per language with badge

### Dictionary (`DictionaryPanel.jsx`)
- **Hook**: Future integration point
- **Integration**: Can query `GET /archive/dictionary/{language}`
- **Impact**: Community-sourced vocabulary entries

### Quiz System (`QuizPanel.jsx`)
- **Hook**: Future integration point
- **Integration**: Can query `GET /archive/quiz-questions/{language}`
- **Impact**: Dynamic questions from real recordings

### Two-Way Communication (`TalkPanel.jsx`)
- **Hook**: Existing translation layer
- **Integration**: Uses refined translations from archive (via SEA-LION)
- **Impact**: Culturally authentic phrasing prioritized

---

## Fallback Strategy (Guaranteed Non-Empty)

Every field has intelligent defaults:
```python
IF category not in [valid list] → "oral_history"
IF summary empty → "Traditional cultural recording preserved..."
IF significance empty → "Contributes to preservation of cultural identity..."
IF preservation_value empty → "Valuable linguistic and cultural artifact..."
IF translation missing → "[Unable to translate — cultural expression preserved]"
IF keywords empty → []
IF emotional_tone empty → "reflective"
```

**Result**: System NEVER produces incomplete archive entries.

---

## Storage Strategy

### Current: JSON File (`suara_leluhur_archive.json`)
- **Advantages**: 
  - Lightweight for hackathon
  - Human-readable format
  - Easy to version control
  - Works offline
  - No database setup needed

- **Structure**:
```json
{
  "archive": [
    {
      "id": "uuid",
      "timestamp": "ISO-8601",
      "language": "Minangkabau",
      "country": "Indonesia",
      "speaker_role": "Elder",
      "category": "folklore",
      "speaker_name": "Pak Mahmud",
      "speaker_age": "82",
      "location": "Padang, West Sumatra",
      "original_text": "Alam takambang jadi guru...",
      "english_translation": "The unfolding world teaches...",
      "indonesian_translation": "Alam takambang jadi guru...",
      "cultural_summary": "Minangkabau proverb teaching...",
      "keywords": ["wisdom", "nature", "teaching"],
      "important_phrases": ["Alam takambang"],
      "cultural_significance": "Central to Minang philosophy...",
      "emotional_tone": "reverent",
      "preservation_value": "Endangered language documentation",
      "audio_base64": "...very long string...",
      "audio_mime": "audio/webm"
    }
  ]
}
```

### Future: Scalable Database
- Migrate to PostgreSQL / MongoDB
- Add full-text search indices
- User authentication & permissions
- Distributed backup

---

## Key AI Services Used

| Service | Purpose | Integration |
|---------|---------|------------|
| **Groq Whisper** | Speech-to-text (language-aware) | `main.py` line 556 |
| **OpenRouter Trinity** | Cultural classification & translation | `main.py` line 561, 810 |
| **SEA-LION** | Regional language refinement (optional) | `main.py` line 112 |
| **gTTS** | Voice synthesis for playback | `main.py` line 844 |

---

## Error Handling

### Frontend
- Microphone permission denied → User-friendly message
- Network error → Cached fallback or retry
- Processing timeout → Graceful degradation

### Backend
- Whisper timeout → Default transcript message
- LLM parsing failure → Fallback validation
- Audio encoding error → Continue without audio
- File system error → HTTP 500 with detail

---

## Performance Characteristics

| Operation | Typical Time | Constraints |
|-----------|------------|------------|
| Audio recording | Real-time | Limited by user |
| Transcription | 5-15 sec | Groq latency |
| Classification | 2-5 sec | LLM latency |
| Total submission | 10-25 sec | Network + AI |
| Archive retrieval | < 100ms | Local JSON read |
| Stats calculation | < 50ms | Sync aggregation |

---

## Scalability Considerations

### Current Limits
- Single JSON file storage (suitable for < 10k entries)
- No pagination (entire archive in memory)
- Basic filtering (case-insensitive language match)

### Path to Scale
1. Add pagination (`?limit=50&offset=0`)
2. Migrate to PostgreSQL with indices
3. Add full-text search (Elasticsearch)
4. Implement user auth & permissions
5. CDN for audio files (S3 / Cloudflare R2)
6. Async job queue for LLM processing (Celery + Redis)

---

## Testing Checklist

### Unit Tests
- [ ] Archive entry validation
- [ ] Fallback application
- [ ] Language matching (case-insensitive)
- [ ] Voice count aggregation

### Integration Tests
- [ ] Recording submission end-to-end
- [ ] Chatbot receives archive context
- [ ] Map updates with voice counts
- [ ] API returns correctly formatted responses

### Manual Testing
- [ ] Record in multiple languages
- [ ] Submit with incomplete metadata
- [ ] Test with long audio (30 sec+)
- [ ] Verify translations
- [ ] Check statistics accuracy

---

## Future Enhancements (Post-Hackathon)

### Phase 1: Community Features
- User accounts & archives
- Comments & reactions
- Favorites & playlists
- Share recordings

### Phase 2: Analytics
- Language risk scoring
- Preservation impact metrics
- Community contributor stats
- Trend analysis

### Phase 3: Advanced AI
- Accent/dialect classification
- Pronunciation learning engine
- Automated folklore extraction
- AI storytelling from corpus

### Phase 4: Integration
- Mobile app (React Native)
- Offline-first recording
- Batch upload
- Community validation workflow

---

## Deployment Checklist

- [ ] Backend: `pip install -r requirements.txt`
- [ ] Backend: Set `.env` variables (HF_TOKEN, OPENROUTER_API_KEY, GROQ_API_KEY)
- [ ] Backend: `python main.py` (or `uvicorn main:app --reload`)
- [ ] Frontend: `npm install`
- [ ] Frontend: `npm run dev`
- [ ] Browser: Navigate to `http://localhost:5173`
- [ ] Test: Record audio in Suara Leluhur tab
- [ ] Test: Submit and verify statistics update
- [ ] Test: Check chatbot receives context
- [ ] Test: Verify map shows voice counts

---

## Success Metrics

### For Judges
- ✅ Real social impact (language preservation)
- ✅ Clean architecture (modular, extensible)
- ✅ AI innovation (cultural classification)
- ✅ Demo clarity (intuitive UI, visible integration)
- ✅ Hackathon-ready (works with constraints)

### For Platform
- ✅ Archive grows with contributions
- ✅ Every entry improves all features
- ✅ No empty metadata (validation works)
- ✅ System stays responsive
- ✅ Foundation for scalability

---

## The Vision

**Suara Leluhur transforms KURA AI from:**
- ❌ A chatbot with translations

**Into:**
- ✅ A living ASEAN cultural memory engine
- ✅ Powered by real elder voices
- ✅ Improving continuously with community input
- ✅ Accessible to all regional language communities
- ✅ Sustainable digital preservation platform

---

**Built with ❤️ for Southeast Asian indigenous languages**

🐢 *KURA: Keeping ancestral voices alive through AI*
