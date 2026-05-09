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
        <h1>
          AI-Powered Language Tools for <span>SEA</span>
        </h1>
        <p className="subtitle">
          Language chatbot, two-way AI voice communication, and a regional language map.
        </p>
      </div>
      <div className="hero-card">
        <div className="hero-stat">
          <span>24</span>
          <p>Regional Languages</p>
        </div>
        <div className="hero-stat">
          <span>5</span>
          <p>Main Features</p>
        </div>
      </div>
    </header>
  );
}
