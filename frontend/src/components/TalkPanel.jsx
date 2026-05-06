export default function TalkPanel({
  talkConvo,
  talkLoading,
  talkLangLeft,
  talkLangRight,
  talkInputLeft,
  talkInputRight,
  onTalkLangLeftChange,
  onTalkLangRightChange,
  onTalkInputLeftChange,
  onTalkInputRightChange,
  onTalkSend,
  onSwapLangs,
  onClearConvo,
  recordingSide,
  onStartRecording,
  copiedIndex,
  onCopyTranslation,
  onPlayAudio,
  talkBottomRef,
  languageOptions,
}) {
  return (
    <section className="panel talk-panel">
      {talkConvo.length > 0 && (
        <div className="convo-clear-bar">
          <button
            className="btn-new-chat"
            onClick={onClearConvo}
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
                  className={`convo-copy ${copiedIndex === i ? "copied" : ""}`}
                  onClick={() => onCopyTranslation(msg.translation, i)}
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
                    onClick={() => onPlayAudio(msg.audio)}
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
          onChange={onTalkLangLeftChange}
        >
          {languageOptions.map((language) => (
            <option key={language} value={language}>
              {language}
            </option>
          ))}
        </select>
        <button
          className="convo-swap"
          onClick={onSwapLangs}
          aria-label="Swap"
        >
          ⇄
        </button>
        <select
          value={talkLangRight}
          onChange={onTalkLangRightChange}
        >
          {languageOptions.map((language) => (
            <option key={language} value={language}>
              {language}
            </option>
          ))}
        </select>
      </div>

      <div className="convo-inputs">
        <div className="convo-input-section">
          <span className="convo-input-label">{talkLangLeft}</span>
          <div className="convo-input-group left">
            <input
              placeholder={`Type in ${talkLangLeft}...`}
              value={talkInputLeft}
              onChange={onTalkInputLeftChange}
              onKeyDown={(event) => {
                if (event.key === "Enter") onTalkSend("left");
              }}
              disabled={recordingSide === "left"}
            />
            <button
              className="convo-send left"
              onClick={() => onTalkSend("left")}
              disabled={talkLoading || recordingSide === "left"}
              title="Send Text"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
            <button
              className={`convo-mic ${recordingSide === "left" ? "recording" : ""}`}
              onClick={() => onStartRecording("left", "voice")}
              disabled={talkLoading || (recordingSide && recordingSide !== "left")}
              title="Voice to Voice"
            >
              🎤
            </button>
          </div>
        </div>

        <div className="convo-input-section">
          <span className="convo-input-label">{talkLangRight}</span>
          <div className="convo-input-group right">
            <input
              placeholder={`Type in ${talkLangRight}...`}
              value={talkInputRight}
              onChange={onTalkInputRightChange}
              onKeyDown={(event) => {
                if (event.key === "Enter") onTalkSend("right");
              }}
              disabled={recordingSide === "right"}
            />
            <button
              className="convo-send right"
              onClick={() => onTalkSend("right")}
              disabled={talkLoading || recordingSide === "right"}
              title="Send Text"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
            <button
              className={`convo-mic ${recordingSide === "right" ? "recording" : ""}`}
              onClick={() => onStartRecording("right", "voice")}
              disabled={talkLoading || (recordingSide && recordingSide !== "right")}
              title="Voice to Voice"
            >
              🎤
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
