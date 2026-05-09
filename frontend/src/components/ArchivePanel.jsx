import { useEffect, useRef, useState } from "react";
import { archiveHandler } from "../handlers";
import { ARCHIVE_ROLES, ARCHIVE_CATEGORIES, languageOptions, COUNTRY_FLAGS } from "../utils/constants";

const countryOptions = Object.keys(COUNTRY_FLAGS);
const roleOptions = ARCHIVE_ROLES;
const categoryOptions = ARCHIVE_CATEGORIES;

function formatTimer(seconds) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${secs}`;
}

export default function ArchivePanel() {
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [archiveList, setArchiveList] = useState([]);
  const [stats, setStats] = useState({ total_entries: 0, languages_archived: 0, total_today: 0 });
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [meta, setMeta] = useState({
    language: "Minangkabau",
    country: "Indonesia",
    speaker_role: "Elder",
    category: "Folklore",
    speaker_name: "",
    speaker_age: "",
    location: "",
  });

  const recorderRef = useRef(null);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    loadArchive();
    return () => {
      stopRecording();
    };
  }, []);

  const loadArchive = async () => {
    try {
      const [archiveData, archiveStats] = await Promise.all([
        archiveHandler.getArchiveList(),
        archiveHandler.getArchiveStats(),
      ]);
      setArchiveList(archiveData.entries || archiveData || []);
      setStats(archiveStats);
    } catch (error) {
      console.error(error);
      setErrorMessage("Unable to load archive entries. Please try again.");
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage("Microphone access is unavailable in this browser.");
      return;
    }

    setErrorMessage("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      const chunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setRecording(false);
        clearInterval(timerRef.current);
        timerRef.current = null;
      };

      recorder.start();
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
      setErrorMessage("We could not start recording. Check microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleRecordToggle = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleMetaChange = (key, value) => {
    setMeta((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!audioBlob) {
      setErrorMessage("Please record a voice memory before submitting.");
      return;
    }
    if (!meta.language || !meta.country || !meta.speaker_role || !meta.category) {
      setErrorMessage("Please complete the core metadata fields.");
      return;
    }

    setErrorMessage("");
    setStatusMessage("Preserving your story...");
    setProcessing(true);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "suara_leluhur.webm");
      Object.entries(meta).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      const response = await archiveHandler.submitArchive(formData);
      if (response?.entry) {
        setArchiveList((prev) => [response.entry, ...prev]);
        setStats(response.stats || stats);
        setStatusMessage("This voice is now part of the Kura heritage archive.");
        setAudioBlob(null);
        setAudioUrl(null);
        setRecordingTime(0);
      } else {
        setErrorMessage("Server did not return an archive item.");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(error?.message || "Unable to preserve the voice. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const isReadyToSubmit = Boolean(audioBlob) && !processing;

  return (
    <section className="panel archive-panel">
      <div className="panel-header">
        <div className="panel-header-row">
          <div>
            <h2>Suara Leluhur</h2>
            <p>
              Record, preserve, and translate living stories from elders and community voices.
            </p>
          </div>
          <div className="archive-summary-pill">
            <span>Every preserved voice is a culture remembered.</span>
          </div>
        </div>
      </div>

      <div className="archive-grid">
        <div className="archive-card archive-recorder-card">
          <div className="archive-recorder-top">
            <div>
              <p className="archive-label">Voice Recording</p>
              <h3>Capture the ancestral story</h3>
            </div>
            <div className={`recording-indicator ${recording ? "active" : ""}`}>
              <span />
              <strong>{recording ? "Recording" : "Ready"}</strong>
            </div>
          </div>

          <div className="archive-recorder-body">
            <div className="archive-waveform" aria-hidden="true">
              <div className="archive-wave-bar" />
              <div className="archive-wave-bar" />
              <div className="archive-wave-bar" />
              <div className="archive-wave-bar" />
              <div className="archive-wave-bar" />
            </div>
            <div className="archive-timer">{formatTimer(recordingTime)}</div>
            <div className="archive-actions">
              <button
                className={`btn-record ${recording ? "recording" : ""}`}
                onClick={handleRecordToggle}
                type="button"
              >
                {recording ? "Stop" : "Start recording"}
              </button>
              {audioUrl && (
                <audio controls src={audioUrl} className="archive-audio-player" />
              )}
            </div>
          </div>
        </div>

        <div className="archive-card archive-meta-card">
          <div className="archive-card-header">
            <p className="archive-label">Metadata</p>
            <h3>Honor the storyteller</h3>
          </div>

          <div className="archive-form-grid">
            <label>
              Language
              <select
                value={meta.language}
                onChange={(event) => handleMetaChange("language", event.target.value)}
              >
                {languageOptions.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Country
              <select
                value={meta.country}
                onChange={(event) => handleMetaChange("country", event.target.value)}
              >
                {countryOptions.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Speaker role
              <select
                value={meta.speaker_role}
                onChange={(event) => handleMetaChange("speaker_role", event.target.value)}
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Category
              <select
                value={meta.category}
                onChange={(event) => handleMetaChange("category", event.target.value)}
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Speaker name
              <input
                type="text"
                placeholder="Optional"
                value={meta.speaker_name}
                onChange={(event) => handleMetaChange("speaker_name", event.target.value)}
              />
            </label>
            <label>
              Speaker age
              <input
                type="text"
                placeholder="Optional"
                value={meta.speaker_age}
                onChange={(event) => handleMetaChange("speaker_age", event.target.value)}
              />
            </label>
            <label className="archive-full-width">
              Village / location
              <input
                type="text"
                placeholder="Optional"
                value={meta.location}
                onChange={(event) => handleMetaChange("location", event.target.value)}
              />
            </label>
          </div>

          <div className="archive-submit-row">
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={!isReadyToSubmit || processing}
              type="button"
            >
              {processing ? "Preserving…" : "Preserve this voice"}
            </button>
            <span className="archive-submit-hint">
              The recording is saved locally in the Kura heritage archive.
            </span>
          </div>

          {errorMessage && <p className="archive-error">{errorMessage}</p>}
          {statusMessage && <p className="archive-status">{statusMessage}</p>}
        </div>
      </div>

      <div className="archive-stats-grid">
        <div className="archive-stat-card">
          <span>Voices Preserved</span>
          <strong>{stats.total_entries}</strong>
          <p>Stories entrusted to the archive.</p>
        </div>
        <div className="archive-stat-card">
          <span>ASEAN Languages</span>
          <strong>{stats.languages_archived}</strong>
          <p>Distinct tongue communities remembered.</p>
        </div>
        <div className="archive-stat-card">
          <span>Preserved Today</span>
          <strong>{stats.total_today}</strong>
          <p>New cultural memories saved today.</p>
        </div>
      </div>

      <div className="archive-list-section">
        <div className="panel-header-row">
          <div>
            <h3>Archive cards</h3>
            <p>Browse the newest voices preserved in the Kura memory vault.</p>
          </div>
        </div>

        {archiveList.length === 0 && (
          <div className="archive-empty-state">
            No voice recordings yet. Record your first cultural memory to bring it into the archive.
          </div>
        )}

        <div className="archive-cards">
          {archiveList.map((entry) => (
            <article key={entry.id} className="archive-entry-card">
              <div className="archive-entry-header">
                <div>
                  <p className="archive-badge">{entry.language}</p>
                  <h4>
                    {(entry.detected_category || entry.category || "oral_history")
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}{" "}
                    · {entry.country}
                  </h4>
                </div>
                <span className="archive-chip">{entry.speaker_role}</span>
              </div>

              {entry.audio_base64 && (
                <audio
                  controls
                  src={`data:${entry.audio_mime || "audio/webm"};base64,${entry.audio_base64}`}
                  className="archive-card-audio"
                />
              )}

              <div className="archive-meta-row">
                <small>{entry.speaker_name || "Anonymous storyteller"}</small>
                {entry.speaker_age && <small>Age: {entry.speaker_age}</small>}
                <small>{entry.location || "Unknown village"}</small>
                <small>{new Date(entry.timestamp).toLocaleString()}</small>
              </div>

              {entry.emotional_tone && (
                <div className="archive-tone-row">
                  <span className="archive-tone-badge">
                    🎭 {entry.emotional_tone.charAt(0).toUpperCase() + entry.emotional_tone.slice(1)}
                  </span>
                </div>
              )}

              <div className="archive-text-block">
                <strong>Original transcript</strong>
                <p>{entry.original_text}</p>
              </div>
              <div className="archive-text-block">
                <strong>English translation</strong>
                <p>{entry.english_translation}</p>
              </div>
              <div className="archive-text-block">
                <strong>Indonesian translation</strong>
                <p>{entry.indonesian_translation}</p>
              </div>

              {(entry.cultural_summary || entry.summary) && (
                <div className="archive-text-block archive-summary-block">
                  <strong>Cultural summary</strong>
                  <p>{entry.cultural_summary || entry.summary}</p>
                </div>
              )}

              {entry.cultural_significance && (
                <div className="archive-text-block archive-significance-block">
                  <strong>💎 Cultural significance</strong>
                  <p>{entry.cultural_significance}</p>
                </div>
              )}

              {entry.preservation_value && (
                <div className="archive-text-block archive-preservation-block">
                  <strong>🛡 Preservation value</strong>
                  <p>{entry.preservation_value}</p>
                </div>
              )}

              {entry.extracted_keywords && entry.extracted_keywords.length > 0 && (
                <div className="archive-keywords-row">
                  <strong>Keywords</strong>
                  <div className="archive-keyword-chips">
                    {entry.extracted_keywords.map((kw, i) => (
                      <span key={i} className="archive-keyword-chip">{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {entry.extracted_phrases && entry.extracted_phrases.length > 0 && (
                <div className="archive-keywords-row">
                  <strong>Preserved phrases</strong>
                  <div className="archive-keyword-chips">
                    {entry.extracted_phrases.map((ph, i) => (
                      <span key={i} className="archive-phrase-chip">"{ph}"</span>
                    ))}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
