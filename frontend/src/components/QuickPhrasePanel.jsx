import { useMemo, useState } from "react";

export default function QuickPhrasePanel({
  languageOptions,
  onTranslate,
  onPlayAudio,
}) {
  const [sourceLanguage, setSourceLanguage] = useState("Indonesia");
  const [targetLanguage, setTargetLanguage] = useState("Malay");
  const [customText, setCustomText] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateNote, setTemplateNote] = useState("");
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const hasTemplates = savedTemplates.length > 0;

  const quickSummary = useMemo(() => {
    if (!hasTemplates) return "Add your own phrase templates for faster one-tap translation.";
    return `${savedTemplates.length} saved template${savedTemplates.length > 1 ? "s" : ""} ready to use.`;
  }, [hasTemplates, savedTemplates.length]);

  const runTranslation = async (text) => {
    const phrase = text.trim();
    if (!phrase || loading) return;

    setLoading(true);
    setError(null);

    try {
      const data = await onTranslate(sourceLanguage, targetLanguage, phrase);
      setResult({ source: phrase, translation: data.translation });
      if (data.audio_base64) {
        onPlayAudio(data.audio_base64);
      }
    } catch (err) {
      setError("Could not translate this phrase right now.");
    } finally {
      setLoading(false);
    }
  };

  const swapLanguages = () => {
    const nextSource = targetLanguage;
    setTargetLanguage(sourceLanguage);
    setSourceLanguage(nextSource);
  };

  const addTemplate = () => {
    const phrase = customText.trim();
    const name = templateName.trim();
    const note = templateNote.trim();

    if (!phrase || !name || loading) return;

    setSavedTemplates((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name,
        text: phrase,
        note,
      },
    ]);
    setTemplateName("");
    setTemplateNote("");
    setCustomText("");
  };

  return (
    <section className="panel quick-panel">
      <div className="panel-header">
        <div className="panel-header-row">
          <div>
            <h2>Quick Speak</h2>
            <p>Pick a source language, choose a target language, then tap one template for instant voice output.</p>
          </div>
        </div>
      </div>

      <div className="quick-controls">
        <div className="quick-select-group">
          <label htmlFor="quick-source">Source</label>
          <select
            id="quick-source"
            value={sourceLanguage}
            onChange={(event) => setSourceLanguage(event.target.value)}
          >
            {languageOptions.map((language) => (
              <option key={language} value={language}>{language}</option>
            ))}
          </select>
        </div>

        <button className="quick-swap" type="button" onClick={swapLanguages} aria-label="Swap languages">
          Swap
        </button>

        <div className="quick-select-group">
          <label htmlFor="quick-target">Target</label>
          <select
            id="quick-target"
            value={targetLanguage}
            onChange={(event) => setTargetLanguage(event.target.value)}
          >
            {languageOptions.map((language) => (
              <option key={language} value={language}>{language}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="quick-template-area">
        <div className="quick-template-area-head">
          <div>
            <label>Saved templates</label>
            <p>{quickSummary}</p>
          </div>
        </div>

        {hasTemplates ? (
          <div className="quick-template-grid">
            {savedTemplates.map((template) => (
              <button
                key={template.id}
                className="quick-template-card"
                type="button"
                onClick={() => runTranslation(template.text)}
                disabled={loading}
              >
                <span className="quick-template-title">{template.name}</span>
                <span className="quick-template-text">{template.text}</span>
                {template.note && <span className="quick-template-note">{template.note}</span>}
              </button>
            ))}
          </div>
        ) : (
          <div className="quick-empty-state">
            No saved templates yet.
          </div>
        )}
      </div>

      <div className="quick-custom">
        <label htmlFor="quick-template-name">Add template</label>
        <input
          id="quick-template-name"
          value={templateName}
          onChange={(event) => setTemplateName(event.target.value)}
          placeholder='Template name, e.g. "Toilet"'
        />
        <input
          id="quick-template-note"
          value={templateNote}
          onChange={(event) => setTemplateNote(event.target.value)}
          placeholder="Optional note"
        />
        <textarea
          id="quick-custom-text"
          value={customText}
          onChange={(event) => setCustomText(event.target.value)}
          placeholder='Phrase text, e.g. "Dimana toilet terdekat"'
          rows={3}
        />
        <div className="quick-actions quick-actions-split">
          <button
            className="quick-secondary-btn"
            type="button"
            onClick={() => runTranslation(customText)}
            disabled={loading || !customText.trim()}
          >
            Preview Translate
          </button>
          <button
            className="quick-primary-btn"
            type="button"
            onClick={addTemplate}
            disabled={loading || !templateName.trim() || !customText.trim()}
          >
            Add Template
          </button>
        </div>
      </div>

      {error && <div className="quick-error">{error}</div>}

      {result && (
        <div className="quick-result">
          <div className="quick-result-source">
            <span>Source</span>
            <p>{result.source}</p>
          </div>
          <div className="quick-result-translation">
            <span>Output</span>
            <p>{result.translation}</p>
          </div>
        </div>
      )}

      <div className="quick-footnote">
        Create a template once, then tap it any time for one-click translation and playback.
      </div>
    </section>
  );
}