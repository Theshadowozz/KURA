export default function Header({ theme, onToggleTheme }) {
  return (
    <header className="hero">
      <div>
        <div className="pill-row">
          <div className="pill">
            <img src="/logo/logo.png" alt="Kura AI logo" className="app-logo" />
            Kura AI
          </div>
          <button
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
          >
            <span className="theme-toggle-icon" aria-hidden="true" />
          </button>
        </div>
        <h1>Fast language templates for real-world use</h1>
        <p className="subtitle">
          Choose a source sentence, switch the output language, and play the translation in one tap.
        </p>
      </div>
    </header>
  );
}
