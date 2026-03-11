import { useState, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const tabs = [
  { id: "chat", label: "Chatbot Bahasa" },
  { id: "talk", label: "Komunikasi 2 Arah" },
  { id: "map", label: "Peta SEA" },
];

const seaCountries = [
  {
    id: "myanmar",
    name: "Myanmar",
    top: 25,
    left: 15,
    languages: ["Shan", "Karen"],
  },
  { id: "laos", name: "Laos", top: 30, left: 27, languages: ["Lao", "Hmong"] },
  {
    id: "thailand",
    name: "Thailand",
    top: 38,
    left: 25,
    languages: ["Isan", "Lanna"],
  },
  {
    id: "vietnam",
    name: "Vietnam",
    top: 44,
    left: 36,
    languages: ["Tay", "Khmer Krom"],
  },
  {
    id: "cambodia",
    name: "Kamboja",
    top: 45,
    left: 30,
    languages: ["Khmer", "Cham"],
  },
  {
    id: "philippines",
    name: "Filipina",
    top: 39,
    left: 57,
    languages: ["Cebuano", "Ilocano"],
  },
  {
    id: "malaysia_p",
    name: "Malaysia",
    top: 61,
    left: 25,
    languages: ["Iban", "Kadazan-Dusun"],
  },
  {
    id: "singapore",
    name: "Singapura",
    top: 67,
    left: 29,
    languages: ["Teochew", "Hokkien"],
  },
  {
    id: "brunei",
    name: "Brunei",
    top: 61,
    left: 46,
    languages: ["Dusun", "Tutong"],
  },
  {
    id: "indonesia",
    name: "Indonesia",
    top: 84,
    left: 35,
    languages: ["Jawa", "Sunda"],
  },
  {
    id: "timor",
    name: "Timor Leste",
    top: 88,
    left: 65,
    languages: ["Tetum", "Mambae"],
  },
];

const languageOptions = [
  "Indonesia",
  "English",
  "Mandarin",
  "Thai",
  "Vietnamese",
  "Malay",
  "Tagalog",
  "Khmer",
  "Minang",
  "Jawa",
  "Sunda",
  "Shan",
  "Karen",
  "Lao",
  "Hmong",
  "Isan",
  "Lanna",
  "Tay",
  "Khmer Krom",
  "Cham",
  "Cebuano",
  "Ilocano",
  "Iban",
  "Kadazan-Dusun",
  "Teochew",
  "Hokkien",
  "Dusun",
  "Tutong",
  "Tetum",
  "Mambae"
];

export default function App() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark",
  );
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
  };
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Halo! Aku asisten bahasa SEA. Tanyakan apa saja soal terjemahan atau ungkapan.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [talkLangLeft, setTalkLangLeft] = useState("Indonesia");
  const [talkLangRight, setTalkLangRight] = useState("English");
  const [talkConvo, setTalkConvo] = useState([]);
  const [talkInputLeft, setTalkInputLeft] = useState("");
  const [talkInputRight, setTalkInputRight] = useState("");
  const [talkLoading, setTalkLoading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [recordingSide, setRecordingSide] = useState(null);
  const [recordingMode, setRecordingMode] = useState(null);

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const startRecording = async (side, mode) => {
    if (recordingSide) {
      stopRecording();
      if (recordingSide === side && recordingMode === mode) return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        setRecordingSide(null);
        setRecordingMode(null);
        await processVoice(audioBlob, side, mode);
      };

      mediaRecorder.start();
      setRecordingSide(side);
      setRecordingMode(mode);
    } catch (err) {
      alert("Akses mikrofon ditolak atau tidak tersedia.");
    }
  };

  const processVoice = async (audioBlob, side, mode) => {
    setTalkLoading(true);
    const inputLang = side === "left" ? talkLangLeft : talkLangRight;
    const outputLang = side === "left" ? talkLangRight : talkLangLeft;

    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    formData.append("input_language", inputLang);
    formData.append("output_language", outputLang);
    formData.append("mode", mode);

    try {
      const response = await fetch(`${API_BASE}/process-voice`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setTalkConvo((prev) => [
          ...prev,
          {
            side,
            original: data.original_text,
            translation: data.translation,
            audio: data.audio_base64,
          },
        ]);
        if (mode === "voice" && data.audio_base64) {
          playAudio(data.audio_base64);
        }
      } else {
        setTalkConvo((prev) => [
          ...prev,
          {
            side,
            original: "Audio",
            translation: data.error || data.detail || "Error",
            audio: null,
          },
        ]);
      }
    } catch (e) {
      setTalkConvo((prev) => [
        ...prev,
        {
          side,
          original: "Audio",
          translation: "Tidak bisa terhubung.",
          audio: null,
        },
      ]);
    } finally {
      setTalkLoading(false);
    }
  };

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [mapPlaying, setMapPlaying] = useState(false);
  const [mapResult, setMapResult] = useState(null);
  const mapAudioRef = useRef(null);
  const mapAbortRef = useRef(null);

  const handleMapClick = async (country) => {
    // Stop any currently playing audio
    if (mapAudioRef.current) {
      mapAudioRef.current.pause();
      mapAudioRef.current = null;
    }
    // Abort any in-flight fetch
    if (mapAbortRef.current) {
      mapAbortRef.current.abort();
    }
    const abortController = new AbortController();
    mapAbortRef.current = abortController;

    setSelectedCountry(country);
    setMapResult(null);
    setMapPlaying(true);
    const randomLang =
      country.languages[Math.floor(Math.random() * country.languages.length)];
    try {
      const response = await fetch(`${API_BASE}/map-audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: randomLang }),
        signal: abortController.signal,
      });
      const data = await response.json();
      if (response.ok) {
        setMapResult({ lang: randomLang, text: data.text });
        const audio = new Audio(`data:audio/mp3;base64,${data.audio_base64}`);
        mapAudioRef.current = audio;
        audio.play();
        audio.onended = () => {
          mapAudioRef.current = null;
        };
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setMapResult({ lang: randomLang, text: "Gagal memuat audio." });
      }
    } finally {
      if (!abortController.signal.aborted) {
        setMapPlaying(false);
      }
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const nextMessages = [
      ...messages,
      { role: "user", content: chatInput.trim() },
    ];
    setMessages(nextMessages);
    setChatInput("");
    setChatLoading(true);
    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessages([
          ...nextMessages,
          { role: "assistant", content: data.reply },
        ]);
      } else {
        setMessages([
          ...nextMessages,
          {
            role: "assistant",
            content: data.error || data.detail || "Terjadi kesalahan.",
          },
        ]);
      }
    } catch (error) {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "Tidak bisa terhubung ke server." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleTalkSend = async (side) => {
    const text = side === "left" ? talkInputLeft : talkInputRight;
    if (!text.trim() || talkLoading) return;
    const inputLang = side === "left" ? talkLangLeft : talkLangRight;
    const outputLang = side === "left" ? talkLangRight : talkLangLeft;
    setTalkLoading(true);
    if (side === "left") setTalkInputLeft("");
    else setTalkInputRight("");
    try {
      const response = await fetch(`${API_BASE}/translate-speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input_language: inputLang,
          output_language: outputLang,
          text: text.trim(),
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setTalkConvo((prev) => [
          ...prev,
          {
            side,
            original: text.trim(),
            translation: data.translation,
            audio: data.audio_base64,
          },
        ]);
      } else {
        setTalkConvo((prev) => [
          ...prev,
          {
            side,
            original: text.trim(),
            translation: data.error || data.detail || "Error",
            audio: null,
          },
        ]);
      }
    } catch {
      setTalkConvo((prev) => [
        ...prev,
        {
          side,
          original: text.trim(),
          translation: "Tidak bisa terhubung.",
          audio: null,
        },
      ]);
    } finally {
      setTalkLoading(false);
    }
  };

  const swapTalkLangs = () => {
    setTalkLangLeft(talkLangRight);
    setTalkLangRight(talkLangLeft);
  };

  const playAudio = (base64) => {
    if (!base64) return;
    const audio = new Audio(`data:audio/mp3;base64,${base64}`);
    audio.play();
  };

  return (
    <div className={`app ${theme}`}>
      <header className="hero">
        <div>
          <div className="pill-row">
            <p className="pill">Kura AI</p>
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
          <h1>
            Tools bahasa berbasis AI untuk kawasan <span>SEA</span>
          </h1>
          <p className="subtitle">
            Chatbot bahasa, komunikasi dua arah dengan suara AI, dan peta bahasa
            daerah.
          </p>
        </div>
        <div className="hero-card">
          <div className="hero-stat">
            <span>11</span>
            <p>Negara SEA</p>
          </div>
          <div className="hero-stat">
            <span>3</span>
            <p>Fitur utama</p>
          </div>
        </div>
      </header>

      <nav className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="content">
        {activeTab === "chat" && (
          <section className="panel">
            <div className="panel-header">
              <h2>Chatbot Bahasa</h2>
              <p>Pahami makna, terjemahkan, dan belajar ungkapan lokal.</p>
            </div>
            <div className="chat-box">
              <div className="chat-messages">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`bubble ${message.role}`}
                  >
                    {message.content}
                  </div>
                ))}
                {chatLoading && (
                  <div className="bubble assistant">Sedang mengetik...</div>
                )}
              </div>
              <div className="chat-input">
                <input
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !chatLoading) sendChat();
                  }}
                  placeholder="Tanyakan terjemahan, makna, atau contoh kalimat..."
                />
                <button onClick={sendChat} disabled={chatLoading}>
                  Kirim
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === "talk" && (
          <section className="panel talk-panel">
            <div className="convo-messages">
              {talkConvo.length === 0 && (
                <div className="convo-empty">
                  Mulai percakapan dengan mengetik di bawah
                </div>
              )}
              {talkConvo.map((msg, i) => (
                <div key={i} className={`convo-row ${msg.side}`}>
                  <div className={`convo-bubble ${msg.side}`}>
                    <p className="convo-original">{msg.original}</p>
                    <div className="convo-divider" />
                    <p className="convo-translation">{msg.translation}</p>
                  </div>
                  {msg.audio && (
                    <button
                      className="convo-play"
                      onClick={() => playAudio(msg.audio)}
                      aria-label="Play"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              {talkLoading && (
                <div className="convo-row left">
                  <div className="convo-bubble left">
                    <p className="convo-original">Menerjemahkan...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="convo-lang-bar">
              <select
                value={talkLangLeft}
                onChange={(e) => setTalkLangLeft(e.target.value)}
              >
                {languageOptions.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              <button
                className="convo-swap"
                onClick={swapTalkLangs}
                aria-label="Swap"
              >
                ⇄
              </button>
              <select
                value={talkLangRight}
                onChange={(e) => setTalkLangRight(e.target.value)}
              >
                {languageOptions.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="convo-inputs">
              <div className="convo-input-group left">
                <input
                  placeholder={`Ketik dalam ${talkLangLeft}...`}
                  value={talkInputLeft}
                  onChange={(e) => setTalkInputLeft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleTalkSend("left");
                  }}
                  disabled={recordingSide === 'left'}
                />
                <button
                  className="convo-send left"
                  onClick={() => handleTalkSend("left")}
                  disabled={talkLoading || recordingSide === 'left'}
                  title="Kirim Teks"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
                <div className="voice-buttons">
                  <button
                    className={`convo-mic ${recordingSide === 'left' && recordingMode === 'text' ? 'recording' : ''}`}
                    onClick={() => startRecording("left", "text")}
                    disabled={talkLoading || (recordingSide && recordingSide !== 'left')}
                    title="Voice to Text"
                  >
                    🎤 T
                  </button>
                  <button
                    className={`convo-mic ${recordingSide === 'left' && recordingMode === 'voice' ? 'recording' : ''}`}
                    onClick={() => startRecording("left", "voice")}
                    disabled={talkLoading || (recordingSide && recordingSide !== 'left')}
                    title="Voice to Voice"
                  >
                    🎤 V
                  </button>
                </div>
              </div>
              <div className="convo-input-group right">
                <input
                  placeholder={`Ketik dalam ${talkLangRight}...`}
                  value={talkInputRight}
                  onChange={(e) => setTalkInputRight(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleTalkSend("right");
                  }}
                  disabled={recordingSide === 'right'}
                />
                <button
                  className="convo-send right"
                  onClick={() => handleTalkSend("right")}
                  disabled={talkLoading || recordingSide === 'right'}
                  title="Kirim Teks"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
                <div className="voice-buttons">
                  <button
                    className={`convo-mic ${recordingSide === 'right' && recordingMode === 'text' ? 'recording' : ''}`}
                    onClick={() => startRecording("right", "text")}
                    disabled={talkLoading || (recordingSide && recordingSide !== 'right')}
                    title="Voice to Text"
                  >
                    🎤 T
                  </button>
                  <button
                    className={`convo-mic ${recordingSide === 'right' && recordingMode === 'voice' ? 'recording' : ''}`}
                    onClick={() => startRecording("right", "voice")}
                    disabled={talkLoading || (recordingSide && recordingSide !== 'right')}
                    title="Voice to Voice"
                  >
                    🎤 V
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "map" && (
          <section className="panel">
            <div className="panel-header">
              <h2>🗺️ Peta Bahasa Daerah SEA</h2>
              <p>
                Klik titik negara pada peta untuk mendengar sapaan dalam bahasa
                daerah.
              </p>
            </div>
            <div className="map-container">
              <div className="map-image-wrapper">
                <img
                  src="/image.png"
                  alt="Southeast Asia Map"
                  className="map-image"
                  draggable={false}
                />
                {seaCountries.map((c) => (
                  <button
                    key={c.id}
                    className={`map-dot-btn ${selectedCountry?.id === c.id ? "active" : ""}`}
                    style={{ top: `${c.top}%`, left: `${c.left}%` }}
                    onClick={() => handleMapClick(c)}
                    aria-label={c.name}
                  >
                    <span className="map-dot-ring" />
                    <span className="map-dot-core" />
                    <span className="map-dot-label">{c.name}</span>
                  </button>
                ))}
              </div>

              <div className="map-info-bar">
                {!selectedCountry && !mapPlaying && (
                  <p className="map-hint">
                    Klik titik negara di peta untuk mendengar sapaan daerah
                  </p>
                )}
                {mapPlaying && (
                  <div className="map-playing">
                    <span className="map-playing-icon">🔊</span>
                    <p>
                      Memuat suara dari <strong>{selectedCountry?.name}</strong>
                      ...
                    </p>
                  </div>
                )}
                {selectedCountry && mapResult && !mapPlaying && (
                  <div className="map-result-card">
                    <div className="map-result-top">
                      <h3>{selectedCountry.name}</h3>
                      <span className="map-result-lang">{mapResult.lang}</span>
                    </div>
                    <p className="map-result-text">"{mapResult.text}"</p>
                    <p className="map-result-hint">
                      Klik lagi untuk dengar bahasa daerah lainnya
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>© 2026 Kura AI. Dibuat untuk Hackathon.</p>
      </footer>
    </div>
  );
}
