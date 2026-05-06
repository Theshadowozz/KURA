import { useState, useRef, useEffect } from "react";

function renderMarkdown(text) {
  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Bullet list
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      elements.push(
        <ul key={i} className="md-list">
          {items.map((item, j) => (
            <li key={j}>{parseLine(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      elements.push(
        <ol key={i} className="md-list">
          {items.map((item, j) => (
            <li key={j}>{parseLine(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      elements.push(<br key={i} />);
      i++;
      continue;
    }

    // Normal paragraph
    elements.push(<p key={i}>{parseLine(line)}</p>);
    i++;
  }

  return elements;
}

function parseLine(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const tabs = [
  { id: "chat", label: "Language Chatbot" },
  { id: "talk", label: "Two-Way Communication" },
  { id: "map", label: "SEA Map" },
  { id: "quiz", label: "Quiz" },
];

const QUIZ_LANGUAGES = [
  { name: "Minangkabau", flag: "🇮🇩" },
  { name: "Jawa",        flag: "🇮🇩" },
  { name: "Sunda",       flag: "🇮🇩" },
  { name: "Shan",        flag: "🇲🇲" },
  { name: "Karen",       flag: "🇲🇲" },
  { name: "Lao",         flag: "🇱🇦" },
  { name: "Hmong",       flag: "🇱🇦" },
  { name: "Lanna",       flag: "🇹🇭" },
  { name: "Isan",        flag: "🇹🇭" },
  { name: "Tay",         flag: "🇻🇳" },
  { name: "Cham",        flag: "🇻🇳" },
  { name: "Khmer Krom",  flag: "🇻🇳" },
  { name: "Cebuano",     flag: "🇵🇭" },
  { name: "Ilocano",     flag: "🇵🇭" },
  { name: "Iban",        flag: "🇲🇾" },
  { name: "Kadazan-Dusun", flag: "🇲🇾" },
  { name: "Teochew",     flag: "🇸🇬" },
  { name: "Hokkien",     flag: "🇸🇬" },
  { name: "Dusun",       flag: "🇧🇳" },
  { name: "Tutong",      flag: "🇧🇳" },
  { name: "Tetum",       flag: "🇹🇱" },
  { name: "Mambae",      flag: "🇹🇱" },
];

const COUNTRY_FLAGS = {
  "Myanmar":     "🇲🇲",
  "Laos":        "🇱🇦",
  "Thailand":    "🇹🇭",
  "Vietnam":     "🇻🇳",
  "Philippines": "🇵🇭",
  "Malaysia":    "🇲🇾",
  "Singapore":   "🇸🇬",
  "Brunei":      "🇧🇳",
  "Indonesia":   "🇮🇩",
  "Timor Leste": "🇹🇱",
};

const MAP_COUNTRIES = {
  myanmar: {
    elements: [
      { type: "path", d: "M142,28 C148,32 155,38 160,48 C165,58 168,70 166,82 C164,94 158,106 152,118 C146,130 140,142 138,154 C136,166 138,178 142,186 C146,194 152,198 155,202 C158,206 155,210 148,212 C141,214 134,214 128,210 C122,206 118,198 114,188 C110,178 108,166 110,154 C112,142 118,130 124,118 C130,106 136,94 140,82 C144,70 146,58 145,48 C144,38 142,32 142,28Z", fill: "#4A90D9", opacity: 0.85 }
    ],
    label: { x: 138, y: 127 }
  },
  thailand: {
    elements: [
      { type: "path", d: "M190,60 C196,64 202,72 206,84 C210,96 212,110 210,124 C208,138 202,152 198,166 C194,180 192,194 196,204 C200,214 208,220 214,228 C220,236 224,246 222,252 C220,258 214,260 208,256 C202,252 196,244 192,234 C188,224 186,212 186,200 C186,188 188,176 192,164 C196,152 202,140 206,128 C210,116 212,104 210,94 C208,84 202,76 196,70 C190,64 186,60 190,60Z", fill: "#98D458", opacity: 0.85 }
    ],
    label: { x: 202, y: 168 }
  },
  laos: {
    elements: [
      { type: "path", d: "M218,48 C224,52 232,60 236,72 C240,84 240,98 236,110 C232,122 224,130 218,134 C212,138 208,138 206,134 C204,130 204,122 208,114 C212,106 218,98 222,88 C226,78 226,68 222,60 C218,52 214,48 218,48Z", fill: "#5BC0BE", opacity: 0.85 }
    ],
    label: { x: 225, y: 95 }
  },
  vietnam: {
    elements: [
      { type: "path", d: "M248,42 C252,48 258,58 262,72 C266,86 268,102 266,118 C264,134 258,150 252,164 C246,178 240,190 238,200 C236,210 238,218 244,222 C250,226 258,226 266,222 C274,218 282,210 286,200 C290,190 290,178 286,168 C282,158 274,150 268,144 C262,138 258,134 256,128 C254,122 254,114 256,106 C258,98 262,90 264,82 C266,74 264,66 260,58 C256,50 250,44 248,42Z", fill: "#58C4A7", opacity: 0.85 }
    ],
    label: { x: 271, y: 148 }
  },
  cambodia: {
    elements: [
      { type: "path", d: "M214,136 C220,138 228,142 234,150 C240,158 244,168 242,176 C240,184 234,190 226,192 C218,194 208,192 202,186 C196,180 194,170 196,162 C198,154 204,148 210,142 C214,138 214,136 214,136Z", fill: "#F0D264", opacity: 0.85 }
    ],
    label: { x: 220, y: 170 }
  },
  philippines: {
    elements: [
      { type: "path", d: "M398,72 C402,78 408,88 412,100 C416,112 418,126 416,138 C414,150 408,160 402,166 C396,172 390,174 386,170 C382,166 380,158 382,148 C384,138 390,128 394,116 C398,104 400,92 398,82 C396,76 396,72 398,72Z", fill: "#6ECBA0", opacity: 0.85 },
      { type: "path", d: "M420,96 C424,102 428,112 430,124 C432,136 430,148 426,158 C422,168 416,174 410,176 C404,178 400,174 400,166 C400,158 404,148 408,138 C412,128 416,118 418,108 C420,100 420,96 420,96Z", fill: "#6ECBA0", opacity: 0.75 },
      { type: "path", d: "M378,108 C382,114 386,122 388,132 C390,142 388,152 384,158 C380,164 374,166 370,162 C366,158 366,150 368,140 C370,130 374,120 378,112Z", fill: "#6ECBA0", opacity: 0.7 }
    ],
    label: { x: 400, y: 130 }
  },
  malaysia_p: {
    elements: [
      { type: "path", d: "M200,214 C204,220 208,230 210,244 C212,258 212,274 208,286 C204,298 198,306 192,308 C186,310 180,306 178,298 C176,290 178,278 182,266 C186,254 192,242 196,232 C200,224 200,218 200,214Z", fill: "#F5A623", opacity: 0.85 },
      { type: "path", d: "M330,230 C340,226 352,224 366,228 C380,232 394,240 404,252 C414,264 420,278 418,290 C416,302 408,310 396,312 C384,314 370,310 358,302 C346,294 338,282 334,270 C330,258 328,246 328,238 C328,232 330,230 330,230Z", fill: "#F5A623", opacity: 0.75 }
    ],
    label: { x: 374, y: 268 }
  },
  singapore: {
    elements: [
      { type: "circle", cx: 212, cy: 310, r: 7, fill: "#FF6B9D", opacity: 0.9 }
    ],
    label: { x: 232, y: 322 }
  },
  brunei: {
    elements: [
      { type: "path", d: "M348,230 C352,228 356,230 358,234 C360,238 358,244 354,246 C350,248 346,246 344,242 C342,238 344,232 348,230Z", fill: "#D070E0", opacity: 0.85 }
    ],
    label: { x: 363, y: 228 }
  },
  indonesia: {
    elements: [
      { type: "path", d: "M142,250 C148,258 156,270 164,286 C172,302 180,322 184,340 C188,358 188,374 184,388 C180,402 172,414 162,420 C152,426 140,426 132,418 C124,410 120,396 122,380 C124,364 130,346 138,330 C146,314 156,300 162,288 C168,276 168,268 162,262 C156,256 148,252 142,250Z", fill: "#F78DA7", opacity: 0.8 },
      { type: "path", d: "M238,380 C248,376 262,374 278,378 C294,382 312,390 328,394 C344,398 358,398 368,394 C378,390 384,382 386,376 C388,370 386,366 380,364 C374,362 364,362 354,366 C344,370 334,376 322,378 C310,380 296,378 282,372 C268,366 254,358 244,354 C234,350 228,350 226,354 C224,358 226,366 232,374 C236,378 238,380 238,380Z", fill: "#F78DA7", opacity: 0.8 },
      { type: "path", d: "M290,280 C298,274 310,270 324,272 C338,274 352,280 362,290 C372,300 378,314 376,326 C374,338 366,346 354,348 C342,350 328,346 316,338 C304,330 296,318 292,306 C288,294 288,284 290,280Z", fill: "#F78DA7", opacity: 0.75 },
      { type: "path", d: "M382,290 C386,286 392,284 398,288 C404,292 408,300 410,310 C412,320 410,332 406,340 C402,348 396,352 390,350 C384,348 380,340 378,330 C376,320 378,308 380,298Z", fill: "#F78DA7", opacity: 0.75 },
      { type: "path", d: "M394,320 C400,318 406,322 410,330 C414,338 414,348 410,354 C406,360 400,362 394,358 C388,354 386,346 388,338 C390,330 392,324 394,320Z", fill: "#F78DA7", opacity: 0.7 },
      { type: "path", d: "M488,280 C498,276 512,278 526,286 C540,294 554,308 562,322 C570,336 572,350 566,360 C560,370 548,374 536,372 C524,370 512,362 502,350 C492,338 486,322 484,308 C482,294 484,284 488,280Z", fill: "#F78DA7", opacity: 0.75 },
      { type: "ellipse", cx: 370, cy: 380, rx: 8, ry: 5, fill: "#F78DA7", opacity: 0.7 },
      { type: "ellipse", cx: 390, cy: 384, rx: 12, ry: 5, fill: "#F78DA7", opacity: 0.7 },
      { type: "ellipse", cx: 418, cy: 388, rx: 14, ry: 5, fill: "#F78DA7", opacity: 0.65 },
      { type: "ellipse", cx: 448, cy: 384, rx: 10, ry: 5, fill: "#F78DA7", opacity: 0.65 },
      { type: "ellipse", cx: 450, cy: 340, rx: 8, ry: 12, fill: "#F78DA7", opacity: 0.65 },
      { type: "ellipse", cx: 468, cy: 330, rx: 8, ry: 10, fill: "#F78DA7", opacity: 0.6 }
    ],
    label: { x: 310, y: 358 }
  },
  timor: {
    elements: [
      { type: "path", d: "M432,390 C438,386 446,386 452,390 C458,394 460,400 456,404 C452,408 444,408 438,404 C432,400 430,394 432,390Z", fill: "#3D4DB7", opacity: 0.85 }
    ],
    label: { x: 444, y: 418 }
  }
};

const seaCountries = [
  // Myanmar
  { id: "shan",         name: "Shan",          country: "Myanmar",      top: 22, left: 19, languages: ["Shan"] },
  { id: "karen",        name: "Karen",          country: "Myanmar",      top: 30, left: 16, languages: ["Karen"] },
  // Laos
  { id: "lao",          name: "Lao",            country: "Laos",         top: 30, left: 26, languages: ["Lao"] },
  { id: "hmong",        name: "Hmong",          country: "Laos",         top: 38, left: 33, languages: ["Hmong"] },
  // Thailand
  { id: "lanna",        name: "Lanna",          country: "Thailand",     top: 35, left: 22, languages: ["Lanna"] },
  { id: "isan",         name: "Isan",           country: "Thailand",     top: 40, left: 25, languages: ["Isan"] },
  // Cambodia
  { id: "khmer",        name: "Khmer",          country: "Cambodia",     top: 45, left: 32, languages: ["Khmer"] },
  { id: "kuy",          name: "Kuy",            country: "Cambodia",     top: 43, left: 28, languages: ["Kuy"] },
  // Vietnam
  { id: "tay",          name: "Tay",            country: "Vietnam",      top: 25, left: 30, languages: ["Tay"] },
  { id: "cham",         name: "Cham",           country: "Vietnam",      top: 43, left: 36, languages: ["Cham"] },
  { id: "khmer_krom",   name: "Khmer Krom",     country: "Vietnam",      top: 48, left: 33, languages: ["Khmer Krom"] },
  // Philippines
  { id: "ilocano",      name: "Ilocano",        country: "Philippines",  top: 35, left: 58, languages: ["Ilocano"] },
  { id: "cebuano",      name: "Cebuano",        country: "Philippines",  top: 46, left: 58, languages: ["Cebuano"] },
  // Malaysia
  { id: "iban",         name: "Iban",           country: "Malaysia",     top: 63, left: 26, languages: ["Iban"] },
  { id: "kadazandusun", name: "Kadazan-Dusun",  country: "Malaysia",     top: 59, left: 23, languages: ["Kadazan-Dusun"] },
  // Singapore
  { id: "teochew",      name: "Teochew",        country: "Singapore",    top: 66, left: 28, languages: ["Teochew"] },
  { id: "hokkien",      name: "Hokkien",        country: "Singapore",    top: 68, left: 30, languages: ["Hokkien"] },
  // Brunei
  { id: "dusun",        name: "Dusun",          country: "Brunei",       top: 60, left: 45, languages: ["Dusun"] },
  { id: "tutong",       name: "Tutong",         country: "Brunei",       top: 62, left: 47, languages: ["Tutong"] },
  // Indonesia
  { id: "minangkabau",  name: "Minangkabau",    country: "Indonesia",    top: 72, left: 23, languages: ["Minangkabau"] },
  { id: "sunda",        name: "Sunda",          country: "Indonesia",    top: 82, left: 33, languages: ["Sunda"] },
  { id: "jawa",         name: "Javanese",       country: "Indonesia",    top: 84, left: 38, languages: ["Jawa"] },
  // Timor Leste
  { id: "tetum",        name: "Tetum",          country: "Timor Leste",  top: 89, left: 63, languages: ["Tetum"] },
  { id: "mambae",       name: "Mambae",         country: "Timor Leste",  top: 87, left: 66, languages: ["Mambae"] },
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

function TurtleShellLogo({ size = 22 }) {
  return (
    <svg
      viewBox="0 0 28 24"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="turtle-logo"
    >
      {/* Outer shell rim */}
      <ellipse
        cx="14" cy="12" rx="12.5" ry="10"
        stroke="currentColor" strokeWidth="1.6"
        fill="currentColor" fillOpacity="0.18"
      />
      {/* Central vertebral hexagon */}
      <path
        d="M14 6.5 L17.8 8.5 L17.8 12.5 L14 14.5 L10.2 12.5 L10.2 8.5 Z"
        stroke="currentColor" strokeWidth="1.3"
        fill="currentColor" fillOpacity="0.35"
      />
      {/* Scute dividers: hex vertices → shell rim */}
      <line x1="14"   y1="6.5"  x2="14"   y2="2"    stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="17.8" y1="8.5"  x2="23"   y2="6"    stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="17.8" y1="12.5" x2="23"   y2="15.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="14"   y1="14.5" x2="14"   y2="19.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="10.2" y1="12.5" x2="5"    y2="15.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="10.2" y1="8.5"  x2="5"    y2="6"    stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  );
}

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
      content: "Hello! I'm a SEA language assistant. Ask me anything about translations or local expressions.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const INITIAL_MESSAGE = {
    role: "assistant",
    content: "Hello! I'm a SEA language assistant. Ask me anything about translations or local expressions.",
  };

  const clearChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setChatInput("");
  };
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  const [talkLangLeft, setTalkLangLeft] = useState("Indonesia");
  const [talkLangRight, setTalkLangRight] = useState("English");
  const [talkConvo, setTalkConvo] = useState([]);
  const [talkInputLeft, setTalkInputLeft] = useState("");
  const [talkInputRight, setTalkInputRight] = useState("");
  const [talkLoading, setTalkLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const talkBottomRef = useRef(null);

  useEffect(() => {
    talkBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [talkConvo, talkLoading]);

  const handleCopyTranslation = (text, index) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

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
      alert("Microphone access denied or unavailable.");
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
          translation: "Could not connect to server.",
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
  const [exploredIds, setExploredIds] = useState(new Set());
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
    setExploredIds((prev) => new Set([...prev, country.id]));
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
        setMapResult({
          lang: randomLang,
          text: data.text,
          audio: data.audio_base64 || null,
          speakers: data.speakers || null,
          status: data.status || null,
          cultural_fact: data.cultural_fact || null,
          family: data.family || null,
        });
        const audio = new Audio(`data:audio/mp3;base64,${data.audio_base64}`);
        mapAudioRef.current = audio;
        audio.play();
        audio.onended = () => {
          mapAudioRef.current = null;
        };
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setMapResult({ lang: randomLang, text: "Failed to load audio." });
      }
    } finally {
      if (!abortController.signal.aborted) {
        setMapPlaying(false);
      }
    }
  };

  const replayMapAudio = () => {
    if (!mapResult?.audio) return;
    if (mapAudioRef.current) {
      mapAudioRef.current.pause();
      mapAudioRef.current = null;
    }
    const audio = new Audio(`data:audio/mp3;base64,${mapResult.audio}`);
    mapAudioRef.current = audio;
    audio.play();
    audio.onended = () => { mapAudioRef.current = null; };
  };

  // ── Quiz state ──────────────────────────────────
  const [quizLang, setQuizLang]         = useState(QUIZ_LANGUAGES[0].name);
  const [quizQuestion, setQuizQuestion] = useState(null);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizRevealed, setQuizRevealed] = useState(false);
  const [quizScore, setQuizScore]       = useState(0);
  const [quizStreak, setQuizStreak]     = useState(0);
  const [quizTotal, setQuizTotal]       = useState(0);
  const [quizLoading, setQuizLoading]   = useState(false);
  const [quizMascot, setQuizMascot]     = useState("idle");
  const [quizAskedKeys, setQuizAskedKeys] = useState([]);   // keys already shown this cycle
  const [quizTotalKeys, setQuizTotalKeys] = useState(0);    // total available keys for current lang
  const [quizDidReset, setQuizDidReset]   = useState(false);// backend signalled a cycle reset
  const quizLoadedRef = useRef(false);

  const fetchQuizQuestion = async (lang, askedKeys = []) => {
    setQuizLoading(true);
    setQuizQuestion(null);
    setQuizSelected(null);
    setQuizRevealed(false);
    setQuizMascot("idle");
    setQuizDidReset(false);
    try {
      const excludeParam = askedKeys.length
        ? `&exclude=${encodeURIComponent(askedKeys.join(","))}`
        : "";
      const res = await fetch(
        `${API_BASE}/quiz/question?language=${encodeURIComponent(lang)}${excludeParam}`
      );
      const data = await res.json();
      if (res.ok) {
        setQuizQuestion(data);
        setQuizTotalKeys(data.total_keys || 0);
        if (data.did_reset) {
          // All questions cycled — backend reset; clear tracking and notify
          setQuizAskedKeys([data.question_key]);
          setQuizDidReset(true);
        } else {
          setQuizAskedKeys((prev) => [...prev, data.question_key]);
        }
      }
    } catch {
      // silently fail
    } finally {
      setQuizLoading(false);
    }
  };

  const handleQuizAnswer = (choice) => {
    if (quizRevealed) return;
    setQuizSelected(choice);
    setQuizRevealed(true);
    setQuizTotal((t) => t + 1);
    if (choice === quizQuestion.correct_answer) {
      setQuizScore((s) => s + 1);
      setQuizStreak((s) => s + 1);
      setQuizMascot("correct");
      fetch(`${API_BASE}/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: quizLang, text: quizQuestion.correct_answer }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.audio_base64) {
            const audio = new Audio(`data:audio/mp3;base64,${d.audio_base64}`);
            audio.play();
          }
        })
        .catch(() => {});
    } else {
      setQuizStreak(0);
      setQuizMascot("wrong");
    }
  };

  const handleQuizNext = () => {
    fetchQuizQuestion(quizLang, quizDidReset ? [] : quizAskedKeys);
  };

  const handleQuizLangChange = (lang) => {
    setQuizLang(lang);
    setQuizScore(0);
    setQuizStreak(0);
    setQuizTotal(0);
    setQuizAskedKeys([]);
    setQuizTotalKeys(0);
    setQuizDidReset(false);
    fetchQuizQuestion(lang, []);
  };

  // Auto-load first question when Quiz tab opened
  useEffect(() => {
    if (activeTab === "quiz" && !quizLoadedRef.current) {
      quizLoadedRef.current = true;
      fetchQuizQuestion(QUIZ_LANGUAGES[0].name, []);
    }
  }, [activeTab]);

  const MAX_CHAT_CHARS = 500;
  const charsLeft = MAX_CHAT_CHARS - chatInput.length;
  const isOverLimit = chatInput.length > MAX_CHAT_CHARS;
  const isNearLimit = charsLeft <= 50 && !isOverLimit;

  const sendChat = async () => {
    if (!chatInput.trim() || isOverLimit) return;
    const nextMessages = [
      ...messages,
      { role: "user", content: chatInput.trim() },
    ];
    // Add empty assistant bubble immediately — we'll stream into it
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!response.ok) {
        const data = await response.json();
        setMessages([
          ...nextMessages,
          { role: "assistant", content: data.detail || "An error occurred." },
        ]);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.content) {
              accumulated += parsed.content;
              setMessages([
                ...nextMessages,
                { role: "assistant", content: accumulated },
              ]);
            }
            if (parsed.error) {
              setMessages([
                ...nextMessages,
                { role: "assistant", content: `Error: ${parsed.error}` },
              ]);
            }
          } catch {
            // ignore malformed SSE lines
          }
        }
      }
    } catch (error) {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "Could not connect to server." },
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
          translation: "Could not connect to server.",
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
            <div className="pill">
              <img src="/logo/logo.png" alt="Kura AI logo" className="app-logo" />
              Kura AI
            </div>
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
          <h1>
            AI-Powered Language Tools for <span>SEA</span>
          </h1>
          <p className="subtitle">
            Language chatbot, two-way AI voice communication, and a regional language map.
          </p>
        </div>
        <div className="hero-card">
          <div className="hero-stat">
            <span>22</span>
            <p>Regional Languages</p>
          </div>
          <div className="hero-stat">
            <span>3</span>
            <p>Main Features</p>
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
              <div className="panel-header-row">
                <div>
                  <h2>Language Chatbot</h2>
                  <p>Understand meanings, translate, and learn local expressions.</p>
                </div>
                <button
                  className="btn-new-chat"
                  onClick={clearChat}
                  disabled={chatLoading}
                  title="Start a new conversation"
                >
                  + New Chat
                </button>
              </div>
            </div>
            <div className="chat-box">
              <div className="chat-messages">
                {messages.map((message, index) => {
                  const isLastMsg = index === messages.length - 1;
                  const isStreamingThis = chatLoading && isLastMsg && message.role === "assistant";
                  return (
                    <div
                      key={`${message.role}-${index}`}
                      className={`bubble ${message.role}${isStreamingThis ? " streaming" : ""}`}
                    >
                      {message.role === "assistant"
                        ? message.content
                          ? renderMarkdown(message.content)
                          : null
                        : message.content}
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>
              <div className="chat-input-wrapper">
                <div className="chat-input">
                  <input
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !chatLoading && !isOverLimit) sendChat();
                    }}
                    placeholder="Ask about translations, meanings, or example sentences..."
                    className={isOverLimit ? "input-over-limit" : ""}
                  />
                  <button onClick={sendChat} disabled={chatLoading || isOverLimit}>
                    Send
                  </button>
                </div>
                <div className={`char-counter ${isOverLimit ? "over" : isNearLimit ? "near" : ""}`}>
                  {isOverLimit
                    ? `${Math.abs(charsLeft)} characters over limit`
                    : `${charsLeft} characters remaining`}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "talk" && (
          <section className="panel talk-panel">
            {talkConvo.length > 0 && (
              <div className="convo-clear-bar">
                <button
                  className="btn-new-chat"
                  onClick={() => setTalkConvo([])}
                  disabled={talkLoading}
                  title="Clear conversation"
                >
                  🗑 Clear
                </button>
              </div>
            )}
            <div className="convo-messages">
              {talkConvo.length === 0 && (
                <div className="convo-empty">
                  Start a conversation by typing below
                </div>
              )}
              {talkConvo.map((msg, i) => (
                <div key={i} className={`convo-row ${msg.side}`}>
                  <div className={`convo-bubble ${msg.side}`}>
                    <p className="convo-original">{msg.original}</p>
                    <div className="convo-divider" />
                    <p className="convo-translation">{msg.translation}</p>
                    <div className="convo-play-row">
                      <button
                        className={`convo-copy ${copiedIndex === i ? 'copied' : ''}`}
                        onClick={() => handleCopyTranslation(msg.translation, i)}
                        aria-label="Copy translation"
                        title="Copy translation"
                      >
                        {copiedIndex === i ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                          </svg>
                        )}
                      </button>
                      {msg.audio && (
                        <button
                          className="convo-play"
                          onClick={() => playAudio(msg.audio)}
                          aria-label="Play"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {talkLoading && (
                <div className="convo-row left">
                  <div className="convo-bubble left">
                    <p className="convo-original">Translating...</p>
                  </div>
                </div>
              )}
              <div ref={talkBottomRef} />
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
              {/* Left input section */}
              <div className="convo-input-section">
                <span className="convo-input-label">{talkLangLeft}</span>
                <div className="convo-input-group left">
                  <input
                    placeholder={`Type in ${talkLangLeft}...`}
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
                    title="Send Text"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                  <button
                    className={`convo-mic ${recordingSide === 'left' ? 'recording' : ''}`}
                    onClick={() => startRecording("left", "voice")}
                    disabled={talkLoading || (recordingSide && recordingSide !== 'left')}
                    title="Voice to Voice"
                  >
                    🎤
                  </button>
                </div>
              </div>

              {/* Right input section */}
              <div className="convo-input-section">
                <span className="convo-input-label">{talkLangRight}</span>
                <div className="convo-input-group right">
                  <input
                    placeholder={`Type in ${talkLangRight}...`}
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
                    title="Send Text"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                  <button
                    className={`convo-mic ${recordingSide === 'right' ? 'recording' : ''}`}
                    onClick={() => startRecording("right", "voice")}
                    disabled={talkLoading || (recordingSide && recordingSide !== 'right')}
                    title="Voice to Voice"
                  >
                    🎤
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "map" && (
          <section className="panel">
            <div className="panel-header">
              <div className="map-header-row">
                <div>
                  <h2>🗺️ SEA Regional Language Map</h2>
                  <p>
                    Click a language dot on the map to hear a greeting in that regional language.
                  </p>
                </div>
                <div className="map-progress-box">
                  <div className="map-progress-label">
                    Explored
                  </div>
                  <div className="map-progress-count">
                    <span className="map-progress-current">{exploredIds.size}</span>
                    <span className="map-progress-total"> / {seaCountries.length}</span>
                  </div>
                  <div className="map-progress-bar-track">
                    <div
                      className="map-progress-bar-fill"
                      style={{ width: `${(exploredIds.size / seaCountries.length) * 100}%` }}
                    />
                  </div>
                  {exploredIds.size === seaCountries.length && (
                    <div className="map-progress-complete">🎉 All explored!</div>
                  )}
                </div>
              </div>
            </div>
            <div className="map-container">
              <div className="map-legend">
                <span className="map-legend-item safe">
                  <span className="map-legend-dot" />Safe
                </span>
                <span className="map-legend-item warn">
                  <span className="map-legend-dot" />Vulnerable
                </span>
                <span className="map-legend-item danger">
                  <span className="map-legend-dot" />Endangered
                </span>
              </div>
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
                    className={`map-dot-btn ${selectedCountry?.id === c.id ? "active" : ""} ${exploredIds.has(c.id) && selectedCountry?.id !== c.id ? "explored" : ""}`}
                    style={{ top: `${c.top}%`, left: `${c.left}%` }}
                    onClick={() => handleMapClick(c)}
                    aria-label={c.name}
                  >
                    <span className="map-dot-pulse" />
                    <span className="map-dot-core" />
                    <span className="map-dot-label">{c.name}</span>
                  </button>
                ))}
              </div>

              <div className="map-info-bar">
                {!selectedCountry && !mapPlaying && (
                  <p className="map-hint">
                    Click a language dot on the map to hear a regional greeting
                  </p>
                )}
                {mapPlaying && (
                  <div className="map-playing">
                    <span className="map-playing-icon">🔊</span>
                    <p>
                      Loading audio from <strong>{selectedCountry?.name}</strong>
                      {selectedCountry?.country && <span className="map-playing-country"> · {selectedCountry.country}</span>}
                      ...
                    </p>
                  </div>
                )}
                {selectedCountry && mapResult && !mapPlaying && (
                  <div className="map-result-card">
                    {/* Header row: name + status badge */}
                    <div className="map-result-top">
                      <div>
                        <h3>{selectedCountry.name}</h3>
                        {selectedCountry.country && (
                          <p className="map-result-country">
                            {COUNTRY_FLAGS[selectedCountry.country] && (
                              <span className="map-country-flag">{COUNTRY_FLAGS[selectedCountry.country]}</span>
                            )}
                            {selectedCountry.country}
                          </p>
                        )}
                      </div>
                      {mapResult.status && (
                        <span className={`map-status-badge ${
                          mapResult.status.toLowerCase().includes("endanger") ? "danger" :
                          mapResult.status.toLowerCase().includes("vulnerab") ? "warn" :
                          mapResult.status.toLowerCase().includes("critical") ? "danger" : "safe"
                        }`}>
                          {mapResult.status}
                        </span>
                      )}
                    </div>

                    {/* Meta row: speakers + language family */}
                    {(mapResult.speakers || mapResult.family) && (
                      <div className="map-result-meta">
                        {mapResult.speakers && (
                          <span className="map-meta-chip">👥 {mapResult.speakers}</span>
                        )}
                        {mapResult.family && (
                          <span className="map-meta-chip">🌐 {mapResult.family.split("—")[0].trim()}</span>
                        )}
                      </div>
                    )}

                    {/* Greeting audio text */}
                    <div className="map-result-greeting">
                      <div className="map-greeting-header">
                        <span className="map-greeting-label">Greeting</span>
                        {mapResult.audio && (
                          <button
                            className="map-replay-btn"
                            onClick={replayMapAudio}
                            title="Replay greeting"
                            aria-label="Replay greeting audio"
                          >
                            🔊 Replay
                          </button>
                        )}
                      </div>
                      <p className="map-result-text">"{mapResult.text}"</p>
                    </div>

                    {/* Cultural fact */}
                    {mapResult.cultural_fact && (
                      <div className="map-cultural-fact">
                        <span className="map-cultural-icon">💡</span>
                        <p>{mapResult.cultural_fact}</p>
                      </div>
                    )}

                    <p className="map-result-hint">
                      Click another language dot to explore
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === "quiz" && (
          <section className="panel quiz-panel">
            <div className="panel-header">
              <h2> Language Quiz</h2>
              <p>Test your knowledge of SEA regional greetings. Pick the correct answer!</p>
            </div>

            {/* Language selector */}
            <div className="quiz-lang-scroll">
              {QUIZ_LANGUAGES.map((l) => (
                <button
                  key={l.name}
                  className={`quiz-lang-pill ${quizLang === l.name ? "active" : ""}`}
                  onClick={() => handleQuizLangChange(l.name)}
                  disabled={quizLoading}
                >
                  {l.flag} {l.name}
                </button>
              ))}
            </div>

            {/* Score bar */}
            <div className="quiz-score-bar">
              <div className="quiz-score-item">
                <span className="quiz-score-value">{quizScore}</span>
                <span className="quiz-score-label">Correct</span>
              </div>
              <div className="quiz-score-item">
                <span className="quiz-score-value quiz-streak">
                  {quizStreak > 0 ? `🔥 ${quizStreak}` : quizStreak}
                </span>
                <span className="quiz-score-label">Streak</span>
              </div>
              <div className="quiz-score-item">
                <span className="quiz-score-value">{quizTotal}</span>
                <span className="quiz-score-label">Answered</span>
              </div>
              {quizTotal > 0 && (
                <div className="quiz-score-item">
                  <span className="quiz-score-value">
                    {Math.round((quizScore / quizTotal) * 100)}%
                  </span>
                  <span className="quiz-score-label">Accuracy</span>
                </div>
              )}
              {quizTotalKeys > 0 && (
                <div className="quiz-score-item quiz-progress-item">
                  <span className="quiz-score-value quiz-progress-value">
                    {quizAskedKeys.length}<span className="quiz-progress-sep">/{quizTotalKeys}</span>
                  </span>
                  <span className="quiz-score-label">Questions</span>
                </div>
              )}
            </div>

            {/* Cycle-reset notification */}
            {quizDidReset && (
              <div className="quiz-reset-notice">
                🔁 All questions completed — starting a new round!
              </div>
            )}

            {/* Mascot */}
            <div className={`quiz-mascot ${quizMascot}`}>
              <div className="quiz-mascot-body">
                <div className="quiz-mascot-face">
                  <img src="/logo/logo.png" alt="Kura AI logo" className="quiz-mascot-logo" />
                </div>
                <div className="quiz-mascot-name">Kura</div>
              </div>
              {quizMascot === "correct" && (
                <div className="quiz-mascot-bubble correct">
                  ✅ Correct! Well done!
                </div>
              )}
              {quizMascot === "wrong" && quizQuestion && (
                <div className="quiz-mascot-bubble wrong">
                  ❌ The answer is: <strong>{quizQuestion.correct_answer}</strong>
                </div>
              )}
              {quizMascot === "idle" && quizQuestion && (
                <div className="quiz-mascot-bubble idle">
                  How do you say <strong>"{quizQuestion.question_label}"</strong> in {quizQuestion.language}?
                </div>
              )}
            </div>

            {/* Loading */}
            {quizLoading && (
              <div className="quiz-loading">
                <div className="pb-spinner" />
                <span>Loading question...</span>
              </div>
            )}

            {/* Choices */}
            {!quizLoading && quizQuestion && (
              <div className="quiz-choices">
                {quizQuestion.choices.map((choice, i) => {
                  let state = "default";
                  if (quizRevealed) {
                    if (choice === quizQuestion.correct_answer) state = "correct";
                    else if (choice === quizSelected)           state = "wrong";
                    else                                        state = "dim";
                  }
                  return (
                    <button
                      key={i}
                      className={`quiz-choice ${state}`}
                      onClick={() => handleQuizAnswer(choice)}
                      disabled={quizRevealed}
                    >
                      <span className="quiz-choice-letter">
                        {["A", "B", "C", "D"][i]}
                      </span>
                      <span className="quiz-choice-text">{choice}</span>
                      {state === "correct" && <span className="quiz-choice-icon">✅</span>}
                      {state === "wrong"   && <span className="quiz-choice-icon">❌</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Next button */}
            {quizRevealed && (
              <div className="quiz-next-row">
                <button className="quiz-next-btn" onClick={handleQuizNext}>
                  Next Question →
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="footer">
        <p>© 2026 Kura AI. Built for Hackathon.</p>
      </footer>
    </div>
  );
}
