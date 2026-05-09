import { useState, useRef, useEffect } from "react";
import Header from "./components/Header";
import Tabs from "./components/Tabs";
import QuickPhrasePanel from "./components/QuickPhrasePanel";
import DictionaryPanel from "./components/DictionaryPanel";
import ChatPanel from "./components/ChatPanel";
import TalkPanel from "./components/TalkPanel";
import MapPanel from "./components/MapPanel";
import QuizPanel from "./components/QuizPanel";
import { renderMarkdown } from "./utils/markdown";
import {
  chatHandler,
  mapHandler,
  quizHandler,
  talkHandler,
  dictionaryHandler,
} from "./handlers";
import { playBase64Audio } from "./lib";
import {
  tabs,
  QUIZ_LANGUAGES,
  QUIZ_COUNTRIES,
  DICTIONARY_LANGUAGES,
  COUNTRY_FLAGS,
  seaCountries,
  languageOptions,
  SEA_NATIONAL_LANGUAGES,
} from "./utils/constants";

export default function App() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark",
  );
  const [themeRevealVisible, setThemeRevealVisible] = useState(false);
  const [themeRevealKey, setThemeRevealKey] = useState(0);
  const themeRemoveTimeoutRef = useRef(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [featureSidebarOpen, setFeatureSidebarOpen] = useState(false);
  const [featureRailOpen, setFeatureRailOpen] = useState(false);

  const toggleTheme = (event) => {
    const next = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;

    const target = event?.currentTarget;
    if (target?.getBoundingClientRect) {
      const rect = target.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      root.style.setProperty("--theme-x", `${x}px`);
      root.style.setProperty("--theme-y", `${y}px`);
    } else {
      root.style.setProperty("--theme-x", `${window.innerWidth / 2}px`);
      root.style.setProperty("--theme-y", `${window.innerHeight / 2}px`);
    }

    root.style.setProperty(
      "--theme-transition-bg",
      next === "dark" ? "#001a4d" : "#e8eef8",
    );

    // Apply theme immediately so the UI stays visible during the reveal.
    setTheme(next);
    localStorage.setItem("theme", next);

    // Start overlay animation from the toggle position.
    setThemeRevealKey((value) => value + 1);
    setThemeRevealVisible(true);

    // Remove overlay after animation completes
    const ANIM_MS = 1250;
    if (themeRemoveTimeoutRef.current) clearTimeout(themeRemoveTimeoutRef.current);
    themeRemoveTimeoutRef.current = setTimeout(() => {
      setThemeRevealVisible(false);
    }, ANIM_MS);
  };
  const [activeTab, setActiveTab] = useState("dictionary");
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

  useEffect(() => () => {
    if (themeRemoveTimeoutRef.current) clearTimeout(themeRemoveTimeoutRef.current);
  }, []);

  const [talkLangLeft, setTalkLangLeft] = useState("Indonesia");
  const [talkLangRight, setTalkLangRight] = useState("English");
  const [talkConvo, setTalkConvo] = useState([]);
  const [talkInputLeft, setTalkInputLeft] = useState("");
  const [talkInputRight, setTalkInputRight] = useState("");
  const [talkLoading, setTalkLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const clearTalk = () => {
    setTalkConvo([]);
  };

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

  const handleQuickTranslate = async (sourceLanguage, targetLanguage, text) => {
    return talkHandler.translateAndSpeak(sourceLanguage, targetLanguage, text);
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
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        setRecordingSide(null);
        setRecordingMode(null);
        await handleProcessVoice(audioBlob, side, mode);
      };

      mediaRecorder.start();
      setRecordingSide(side);
      setRecordingMode(mode);
    } catch (err) {
      alert("Microphone access denied or unavailable.");
    }
  };

  const handleProcessVoice = async (audioBlob, side, mode) => {
    setTalkLoading(true);
    const inputLang = side === "left" ? talkLangLeft : talkLangRight;
    const outputLang = side === "left" ? talkLangRight : talkLangLeft;

    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    formData.append("input_language", inputLang);
    formData.append("output_language", outputLang);
    formData.append("mode", mode);

    try {
      const data = await talkHandler.processVoice(formData);
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
    if (mapAudioRef.current) {
      mapAudioRef.current.pause();
      mapAudioRef.current = null;
    }
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
      const data = await mapHandler.fetchMapAudio(randomLang, abortController.signal);
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
    } catch (err) {
      if (err?.code !== "ERR_CANCELED" && err?.name !== "AbortError") {
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

  const [quizLang, setQuizLang] = useState(QUIZ_LANGUAGES[0].name);
  const [quizCountry, setQuizCountry] = useState(QUIZ_COUNTRIES[0]?.code || "id");
  const [quizQuestion, setQuizQuestion] = useState(null);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizRevealed, setQuizRevealed] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizStreak, setQuizStreak] = useState(0);
  const [quizTotal, setQuizTotal] = useState(0);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizMascot, setQuizMascot] = useState("idle");
  const [quizAskedKeys, setQuizAskedKeys] = useState([]);
  const [quizTotalKeys, setQuizTotalKeys] = useState(0);
  const [quizDidReset, setQuizDidReset] = useState(false);
  const quizLoadedRef = useRef(false);

  const fetchQuizQuestion = async (lang, askedKeys = []) => {
    setQuizLoading(true);
    setQuizQuestion(null);
    setQuizSelected(null);
    setQuizRevealed(false);
    setQuizMascot("idle");
    setQuizDidReset(false);
    try {
      const data = await quizHandler.loadQuizQuestion(lang, askedKeys);
      setQuizQuestion(data);
      setQuizTotalKeys(data.total_keys || 0);
      if (data.did_reset) {
        setQuizAskedKeys([data.question_key]);
        setQuizDidReset(true);
      } else {
        setQuizAskedKeys((prev) => [...prev, data.question_key]);
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
        quizHandler.speakAnswer(quizLang, quizQuestion.correct_answer)
          .then((d) => {
            if (d.audio_base64) {
              playAudio(d.audio_base64);
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

  const handleQuizCountryChange = (countryCode) => {
    setQuizCountry(countryCode);
    // Get first language of this country
    const country = QUIZ_COUNTRIES.find((c) => c.code === countryCode);
    const firstLang = country?.languages[0]?.name || QUIZ_LANGUAGES[0].name;
    setQuizLang(firstLang);
    setQuizScore(0);
    setQuizStreak(0);
    setQuizTotal(0);
    setQuizAskedKeys([]);
    setQuizTotalKeys(0);
    setQuizDidReset(false);
    fetchQuizQuestion(firstLang, []);
  };

  useEffect(() => {
    if (activeTab === "quiz" && !quizLoadedRef.current) {
      quizLoadedRef.current = true;
      const firstCountry = QUIZ_COUNTRIES[0];
      const firstLang = firstCountry?.languages[0]?.name || QUIZ_LANGUAGES[0].name;
      setQuizCountry(firstCountry?.code || "id");
      setQuizLang(firstLang);
      fetchQuizQuestion(firstLang, []);
    }
  }, [activeTab]);

  const [selectedDictLang, setSelectedDictLang] = useState(null);
  const [dictData, setDictData] = useState(null);
  const [dictLoading, setDictLoading] = useState(false);
  const [dictError, setDictError] = useState(null);
  const dictCacheRef = useRef({});
  const dictLoadRequestRef = useRef(null);

  const loadDictionary = async (lang) => {
    // If already cached, use it and don't refetch
    if (dictCacheRef.current[lang]) {
      setDictData(dictCacheRef.current[lang]);
      setDictError(null);
      setDictLoading(false);
      return;
    }

    // Avoid duplicate concurrent requests for the same language
    if (dictLoadRequestRef.current === lang && dictLoading) return;

    dictLoadRequestRef.current = lang;
    setDictLoading(true);
    setDictError(null);
    try {
      const data = await dictionaryHandler.getDictionary(lang);
      // If another request was started after this one, ignore this result
      if (dictLoadRequestRef.current !== lang) return;
      dictCacheRef.current[lang] = data;
      setDictData(data);
      setDictError(null);
    } catch (e) {
      if (dictLoadRequestRef.current !== lang) return;
      setDictError("Could not load dictionary. Please try again.");
    } finally {
      if (dictLoadRequestRef.current === lang) {
        setDictLoading(false);
        dictLoadRequestRef.current = null;
      }
    }
  };

  const handleDictLangChange = (lang) => {
    // Ignore clicks when loading or when same language selected
    if (lang === selectedDictLang) return;
    if (dictLoading) return;
    setSelectedDictLang(lang);
    loadDictionary(lang);
  };

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
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setChatInput("");
    setChatLoading(true);

    try {
      let accumulated = "";
      await chatHandler.streamChatHandler(
        nextMessages,
        (chunk) => {
          accumulated += chunk;
          setMessages([
            ...nextMessages,
            { role: "assistant", content: accumulated },
          ]);
        },
        (err) => {
          setMessages([
            ...nextMessages,
            { role: "assistant", content: `Error: ${err}` },
          ]);
        },
      );
    } catch (error) {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: error.message || "Could not connect to server." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleTalkSend = async (side) => {
    if (!side) return;
    const text = side === "left" ? talkInputLeft : talkInputRight;
    if (!text.trim() || talkLoading) return;
    const inputLang = side === "left" ? talkLangLeft : talkLangRight;
    const outputLang = side === "left" ? talkLangRight : talkLangLeft;
    setTalkLoading(true);
    if (side === "left") setTalkInputLeft("");
    else setTalkInputRight("");
    try {
      const data = await talkHandler.translateAndSpeak(
        inputLang,
        outputLang,
        text.trim(),
      );
      setTalkConvo((prev) => [
        ...prev,
        {
          side,
          original: text.trim(),
          translation: data.translation,
          audio: data.audio_base64,
        },
      ]);
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
    playBase64Audio(base64);
  };

  return (
    <div className={`app ${theme}`}>
      {themeRevealVisible && (
        <div
          key={themeRevealKey}
          className="theme-reveal-overlay"
          aria-hidden="true"
        />
      )}
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className="app-shell">
        <main className="main-stage">
          <QuickPhrasePanel
            languageOptions={SEA_NATIONAL_LANGUAGES}
            onTranslate={handleQuickTranslate}
            onPlayAudio={playAudio}
          />
        </main>

        <button
          className={`feature-launcher ${featureRailOpen ? "open" : ""}`}
          type="button"
          onClick={() => setFeatureRailOpen((value) => !value)}
          aria-label="Open feature menu"
        >
          <span className="feature-launcher-line" aria-hidden="true" />
          <span className="feature-launcher-dot" aria-hidden="true" />
        </button>

        {featureRailOpen && (
          <div className="feature-launcher-menu" role="menu" aria-label="Feature menu">
            <button
              type="button"
              className="feature-launcher-item"
              onClick={() => {
                setActiveTab("dictionary");
                setFeatureSidebarOpen(true);
                setFeatureRailOpen(false);
              }}
            >
              Dictionary
            </button>
            <button
              type="button"
              className="feature-launcher-item"
              onClick={() => {
                setActiveTab("talk");
                setFeatureSidebarOpen(true);
                setFeatureRailOpen(false);
              }}
            >
              Two-Way Communication
            </button>
            <button
              type="button"
              className="feature-launcher-item"
              onClick={() => {
                setActiveTab("map");
                setFeatureSidebarOpen(true);
                setFeatureRailOpen(false);
              }}
            >
              SEA Map
            </button>
            <button
              type="button"
              className="feature-launcher-item"
              onClick={() => {
                setActiveTab("quiz");
                setFeatureSidebarOpen(true);
                setFeatureRailOpen(false);
              }}
            >
              Quiz
            </button>
          </div>
        )}

        {featureSidebarOpen && (
          <div className="feature-sidebar-overlay" role="dialog" aria-modal="true" aria-label="Feature sidebar">
            <button
              className="feature-sidebar-backdrop"
              type="button"
              aria-label="Close feature sidebar"
              onClick={() => setFeatureSidebarOpen(false)}
            />
            <aside className="feature-sidebar">
              <div className="feature-sidebar-head">
                <div>
                  <p className="feature-rail-label">Side features</p>
                  <h2>Dictionary, voice, map, quiz</h2>
                </div>
                <button className="feature-sidebar-close" type="button" onClick={() => setFeatureSidebarOpen(false)}>
                  Close
                </button>
              </div>

              <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

              <div className="feature-sidebar-body">
                {activeTab === "dictionary" && (
                  <DictionaryPanel
                    selectedDictLang={selectedDictLang}
                    dictData={dictData}
                    dictLoading={dictLoading}
                    dictError={dictError}
                    onDictLangChange={handleDictLangChange}
                    onLoadDictionary={loadDictionary}
                  />
                )}

                {activeTab === "talk" && (
                  <TalkPanel
                    talkConvo={talkConvo}
                    talkLoading={talkLoading}
                    talkLangLeft={talkLangLeft}
                    talkLangRight={talkLangRight}
                    talkInputLeft={talkInputLeft}
                    talkInputRight={talkInputRight}
                    onTalkLangLeftChange={(event) => setTalkLangLeft(event.target.value)}
                    onTalkLangRightChange={(event) => setTalkLangRight(event.target.value)}
                    onTalkInputLeftChange={(event) => setTalkInputLeft(event.target.value)}
                    onTalkInputRightChange={(event) => setTalkInputRight(event.target.value)}
                    onTalkSend={handleTalkSend}
                    onSwapLangs={swapTalkLangs}
                    onClearConvo={clearTalk}
                    recordingSide={recordingSide}
                    onStartRecording={startRecording}
                    copiedIndex={copiedIndex}
                    onCopyTranslation={handleCopyTranslation}
                    onPlayAudio={playAudio}
                    talkBottomRef={talkBottomRef}
                    languageOptions={languageOptions}
                  />
                )}

                {activeTab === "map" && (
                  <MapPanel
                    seaCountries={seaCountries}
                    selectedCountry={selectedCountry}
                    mapResult={mapResult}
                    mapPlaying={mapPlaying}
                    exploredIds={exploredIds}
                    onMapClick={handleMapClick}
                    onReplayMapAudio={replayMapAudio}
                    countryFlags={COUNTRY_FLAGS}
                  />
                )}

                {activeTab === "quiz" && (
                  <QuizPanel
                    quizCountry={quizCountry}
                    quizLang={quizLang}
                    quizQuestion={quizQuestion}
                    quizSelected={quizSelected}
                    quizRevealed={quizRevealed}
                    quizScore={quizScore}
                    quizStreak={quizStreak}
                    quizTotal={quizTotal}
                    quizLoading={quizLoading}
                    quizAskedKeys={quizAskedKeys}
                    quizTotalKeys={quizTotalKeys}
                    quizDidReset={quizDidReset}
                    quizMascot={quizMascot}
                    onQuizCountryChange={handleQuizCountryChange}
                    onQuizLangChange={handleQuizLangChange}
                    onQuizAnswer={handleQuizAnswer}
                    onQuizNext={handleQuizNext}
                  />
                )}
              </div>
            </aside>
          </div>
        )}
      </div>

      <button
        className="chat-fab"
        type="button"
        onClick={() => setChatOpen(true)}
        aria-label="Open chatbot"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="chat-fab-icon">
          <path d="M7 10.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm7 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm-8.5 4.5c1.2 2.2 3.4 3.5 6.5 3.5s5.3-1.3 6.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <rect x="5" y="6" width="14" height="10" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M12 3.5v2.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="12" cy="3.1" r="1.1" fill="currentColor"/>
        </svg>
      </button>

      {chatOpen && (
        <div className="chat-overlay" role="dialog" aria-modal="true" aria-label="Chatbot">
          <button className="chat-backdrop" type="button" aria-label="Close chatbot" onClick={() => setChatOpen(false)} />
          <div className="chat-drawer">
            <div className="chat-drawer-top">
              <div>
                <p className="feature-rail-label">Chatbot</p>
                <h2>Ask about translations</h2>
              </div>
              <button className="chat-close-btn" type="button" onClick={() => setChatOpen(false)}>
                Close
              </button>
            </div>
            <ChatPanel
              messages={messages}
              chatLoading={chatLoading}
              chatInput={chatInput}
              onChatInputChange={(event) => setChatInput(event.target.value)}
              onChatSend={sendChat}
              isOverLimit={isOverLimit}
              isNearLimit={isNearLimit}
              charsLeft={charsLeft}
              onClearChat={clearChat}
              chatBottomRef={chatBottomRef}
              renderMarkdown={renderMarkdown}
            />
          </div>
        </div>
      )}

      <footer className="footer">
        <p>© 2026 Kura AI. Built for Hackathon.</p>
      </footer>
    </div>
  );
}
