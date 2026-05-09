# 🐢 KURA AI — "Suara Leluhur" (Voice of the Ancestors)

## ASEAN AI Hackathon Finals: Digital Cultural Preservation Platform

**Judge's Guide to the **Suara Leluhur** Feature**

---

## 🎯 MISSION STATEMENT

Transform KURA AI from a simple language chatbot into **a living ASEAN cultural memory engine** powered by AI.

Every recorded elder voice becomes **living knowledge** that:
- ✅ Preserves endangered language traditions  
- ✅ Enriches all AI features automatically
- ✅ Creates a digital heritage archive
- ✅ Empowers indigenous communities

---

## 🚀 QUICK START: Demo Flow for Judges

### Prerequisites
- Backend: Python with FastAPI running
- Frontend: React + Vite running on http://localhost:5173
- API Base: http://localhost:8000

### **STEP 1: Navigate to "Suara Leluhur" Tab**
- Click the **"Suara Leluhur"** tab in the top navigation
- This is the flagship feature: a cultural voice recording interface

### **STEP 2: Record an Elder's Voice**
1. Click **"Start recording"** button
2. Speak a short phrase in ANY Southeast Asian language
   - Example Minangkabau: *"Alam takambang jadi guru"* (The unfolding world teaches)
   - Example Iban: *"Selamat datang"* (Welcome)
   - Example Khmer: *"សូស្វាគមន៍"* (Suvasde - Welcome)
3. Click **"Stop"** to finish
4. Audio preview appears automatically

### **STEP 3: Fill Metadata**
- **Language**: Select the regional language (e.g., Minangkabau, Iban, Khmer)
- **Country**: Indicate origin country
- **Speaker role**: Elder / Teacher / Storyteller / Parent / Community Member
- **Category**: Folklore / Prayer / Song / Advice / Oral History / Proverb
- **Optional**: Speaker name, age, village/location

### **STEP 4: Preserve the Voice**
- Click **"Preserve this voice"** button
- System will:
  1. Transcribe audio using Groq Whisper
  2. Run AI cultural classification
  3. Generate translations (English + Indonesian)
  4. Extract keywords & cultural phrases
  5. Create cultural summary
  6. Save to heritage archive

### **STEP 5: Witness Archive Creation**
- New card appears showing:
  - Original transcript
  - English translation
  - Indonesian translation
  - AI-generated cultural summary
  - Audio player for replay

### **STEP 6: See Statistics Update**
- "Voices Preserved Today" section updates automatically
- Shows total recordings, languages archived, daily contributions

---

## 🔗 SYSTEM-WIDE INTEGRATION: "Living Knowledge"

### **Feature 1: Chatbot Enrichment**
Navigate to **"Language Chatbot"** tab
- Ask: *"Tell me about Minangkabau"*
- The chatbot will reference archive memories naturally
- Example: "As documented in recent elder recordings, the phrase..."
- **Result**: Responses feel grounded in real community knowledge

**Technical**: Archive context is injected into the system prompt via `build_archive_context_for_chat()`

### **Feature 2: Dictionary Growth**
Navigate to **"Dictionary"** tab
- Select a language with archive entries (e.g., Minangkabau)
- The dictionary now includes community-sourced vocabulary
- Each entry shows: word, meaning, example, cultural source

**Technical**: Archive extracts important phrases and keywords → Dictionary entries

### **Feature 3: Dynamic Quiz Questions**
Navigate to **"Quiz"** tab
- Quiz questions are now dynamically generated from archive recordings
- Question types:
  - "What does this phrase mean?"
  - "What is the cultural significance of this tradition?"
  - "How would you classify this recording?"

**Technical**: Archive recordings generate contextual quiz content

### **Feature 4: Language Map Enhancement**
Navigate to **"SEA Map"** tab
- Click on language dots
- Notice new badge: **"🎙️ X voices preserved in Suara Leluhur"**
- Map shows which languages have community contributions
- Demonstrates preservation activity across ASEAN

**Technical**: Map loads `archive/voice-counts` endpoint

### **Feature 5: Two-Way Communication**
Navigate to **"Two-Way Communication"** tab
- Translations now prioritize culturally authentic phrasing
- References preserved community vocabulary

---

## 📊 ARCHITECTURE: "Living Memory Engine"

### Backend Layer
```
POST /archive/submit
├─ Audio upload + metadata
├─ Groq Whisper transcription
├─ AI cultural classification (LLM)
├─ Structured JSON extraction
├─ Fallback validation (no empty fields)
└─ Persist to archive_memory.json

GET /archive/list
GET /archive/stats
GET /archive/voice-counts
GET /archive/featured/{language}
GET /archive/dictionary/{language}
GET /archive/quiz-questions/{language}
```

### AI Classification Pipeline
1. **Transcription**: Groq Whisper (large-v3) with language hints
2. **Cultural Analysis**: LLM classifies recording into 14 categories
3. **Extraction**: Structured JSON output guaranteed (with fallbacks)
4. **Metadata**: Keywords, phrases, cultural significance, emotional tone

### Fallback Safety
- If classification fails → defaults to `"oral_history"`
- If translation empty → uses placeholder text
- If summary missing → generates default value
- **Result**: System NEVER produces empty metadata

### Storage
- Lightweight JSON-based storage: `archive_memory.json`
- Contains: entries array with full metadata + base64-encoded audio
- Migration-ready: Easy to swap to PostgreSQL/MongoDB later

---

## 🎙️ TECHNICAL HIGHLIGHTS

### Key Features
✅ **Real-time recording** with timer + waveform visualization  
✅ **AI cultural classification** with 14+ categories  
✅ **Automatic translation** (English + Indonesian)  
✅ **Keyword extraction** for search & discovery  
✅ **Phrase pooling** for dictionary/quiz systems  
✅ **Emotional tone analysis** for cultural context  
✅ **Preservation value scoring** for prioritization  
✅ **System-wide integration** across all 6 features  
✅ **Fallback safety** — no empty metadata ever  
✅ **Responsive design** compatible with dark/light mode  

### AI Services Used
- **Groq Whisper large-v3**: Speech-to-text with language awareness
- **OpenRouter (Trinity model)**: Cultural classification & translation
- **SEA-LION**: Regional language refinement (optional)
- **gTTS**: Voice synthesis for playback

---

## 💡 CULTURAL IMPACT: Why This Matters

### Problem
- 24 Southeast Asian regional languages are **endangered**
- Oral traditions are disappearing as elders age
- Limited documentation of living speech
- Communities lack tools to preserve heritage

### Solution
**Suara Leluhur** enables:
- ✅ **Grassroots preservation**: Any community member can record
- ✅ **Digital archive**: Permanent record in the cloud
- ✅ **AI enhancement**: Automatic classification & translation
- ✅ **Knowledge multiplier**: One recording improves entire platform
- ✅ **Community empowerment**: Democratized language documentation
- ✅ **Educational use**: Preserved voices teach future generations

### Hackathon Theme
**"The Role of AI in ASEAN Social Impact"**

This feature directly demonstrates:
- AI serving social good (language preservation)
- Technology enabling indigenous communities
- Practical impact on cultural heritage
- Scalable platform for regional adoption

---

## 🧪 TESTING CHECKLIST: Verify All Systems

### Test 1: Record & Archive
- [ ] Record audio successfully
- [ ] Fill metadata
- [ ] Submit and see response
- [ ] Audio player works
- [ ] Stats update

### Test 2: Chatbot Integration
- [ ] Chatbot references archive memories
- [ ] Responses feel community-grounded
- [ ] Language context is detected

### Test 3: Dictionary Integration
- [ ] Archive-sourced vocabulary appears
- [ ] Entries show cultural notes
- [ ] Search includes archive terms

### Test 4: Quiz Generation
- [ ] Quiz questions mention archive sources
- [ ] Phrase meaning questions work
- [ ] Cultural context questions appear

### Test 5: Map Enhancement
- [ ] Voice count badges appear
- [ ] Language activity is visible
- [ ] Numbers update when new entries added

### Test 6: Metadata Quality
- [ ] Translations are present
- [ ] Cultural summary is non-empty
- [ ] Keywords extracted
- [ ] Fallbacks work (try recording in low-resource language)

---

## 🎬 RECOMMENDED DEMO SCRIPT (5 minutes)

### Intro (30 sec)
"Today we're unveiling **Suara Leluhur** — Voice of the Ancestors. This transforms KURA AI from a chatbot into a **living ASEAN cultural memory engine**."

### Record (60 sec)
1. Navigate to Suara Leluhur tab
2. Hit record button
3. Speak a phrase (use example: "Alam takambang jadi guru" in Minang)
4. Fill metadata
5. Click preserve

### Show Impact (90 sec)
1. Switch to Chatbot → ask about the language
2. Switch to Map → show voice count badge
3. Switch to Quiz → show archive-sourced questions
4. Return to Archive → show statistics

### Conclude (60 sec)
"Every recorded voice becomes knowledge. One elder recording:
- Preserves endangered tradition ✅
- Teaches the chatbot ✅
- Grows the dictionary ✅
- Creates quiz content ✅
- Shows on the map ✅

This is AI for cultural preservation."

---

## 📈 EXPECTED OUTCOMES

### For Judges
- See immediate impact: recording → system-wide integration
- Understand architecture: clean, modular, scalable
- Recognize mission: real ASEAN social impact

### For Communities
- Easy tool to preserve languages
- Permanent archive with translations
- Platform improves over time
- No technical expertise needed

### For the Platform
- More data = better AI responses
- Growing knowledge base
- Authentic community-sourced content
- Foundation for future features

---

## 🚀 FUTURE EXTENSIONS (Beyond Hackathon)

With archive foundation in place, future features could include:
- AI-generated storytelling based on elder wisdom
- Pronunciation learning from real recordings
- Community validation & rating system
- Language risk prediction analytics
- Cultural timeline visualization
- Elder voice recommendation engine
- Folklore generation for youth education
- Research data export for linguists

---

## 📞 QUICK TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| Microphone not working | Allow browser permission, test in Chrome/Firefox |
| Recording stuck | Try different language, check audio format |
| Translation empty | This is handled by fallback — system still works |
| Archive not appearing on map | Refresh page to reload voice counts |
| Chat doesn't reference archive | May not have matching language — try generic question |

---

## 🏆 JUDGING CRITERIA: Why We'll Win

| Criteria | Our Solution |
|----------|--------------|
| **Social Impact** | Preserves endangered ASEAN languages (direct impact) |
| **AI Innovation** | Cultural classification pipeline + system integration |
| **Hackathon Readiness** | Works within 6-10 hours, uses existing APIs efficiently |
| **Scalability** | JSON storage (migration-ready), modular architecture |
| **User Experience** | Intuitive recording interface, clear results |
| **Cultural Respect** | Centers indigenous voices, not automation |
| **Demo Quality** | Clear narrative: record → integration → impact |

---

## 📋 FILE STRUCTURE

```
backend/
├── main.py                          # FastAPI endpoints
├── archive_engine.py               # Cultural memory engine
├── sea_languages_knowledge.json    # Knowledge base
└── suara_leluhur_archive.json     # Archive storage

frontend/src/
├── components/ArchivePanel.jsx     # Recording interface
├── handlers/archive/index.js       # API bridge
├── api.jsx                          # Archive endpoints
└── App.jsx                          # Integration point
```

---

## 🎤 THE KURA PROMISE

> Every preserved voice is a culture remembered.
> Every elder story becomes timeless knowledge.
> Every regional language gains a digital sanctuary.

**Suara Leluhur is KURA AI keeping ancestral voices alive.**

---

**Built for the ASEAN AI Hackathon Finals 2026**  
*By a team passionate about indigenous language preservation*

🐢 *KURA: Carrier of cultural wisdom, guardian of heritage*
