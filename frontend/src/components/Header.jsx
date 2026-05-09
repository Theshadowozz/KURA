export default function Header({ theme, onToggleTheme, onNavigate }) {
  return (
    <header className="hero">
      <div className="hero-top">
        <div className="pill-row">
          <button type="button" className="brand-link" onClick={() => onNavigate?.("home")}>Kura AI</button>

          <nav className="main-nav" aria-label="Main navigation">
            <button type="button" className="nav-item" onClick={() => onNavigate?.("home")}>Home</button>
            <button type="button" className="nav-item" onClick={() => onNavigate?.("dictionary")}>Dictionary</button>
            <button type="button" className="nav-item" onClick={() => onNavigate?.("quick-access")}>Quick Speak</button>
            <button type="button" className="nav-item" onClick={() => onNavigate?.("talk")}>Two-Way</button>
            <button type="button" className="nav-item" onClick={() => onNavigate?.("map")}>SEA Map</button>
            <button type="button" className="nav-item" onClick={() => onNavigate?.("quiz")}>Quiz</button>
          </nav>

          <button
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
          >
            <span className="theme-toggle-icon" />
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
