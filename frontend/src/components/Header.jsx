const pageCopy = {
  home: {
    title: "Clean language tools for Southeast Asia",
    subtitle: "Translate, explore, and practice regional languages from one simple workspace.",
  },
  "quick-access": {
    title: "Quick Speak for everyday phrases",
    subtitle: "Type a phrase, choose a target language, and hear the translation instantly.",
  },
  dictionary: {
    title: "Regional dictionary and word reference",
    subtitle: "Browse vocabulary, meanings, pronunciations, categories, and example sentences by language.",
  },
  talk: {
    title: "Two-way conversation translator",
    subtitle: "Translate both sides of a live conversation with text, voice input, and audio playback.",
  },
  map: {
    title: "Southeast Asia language map",
    subtitle: "Explore regional languages by place and listen to greetings from across the region.",
  },
  quiz: {
    title: "Practice with language quizzes",
    subtitle: "Pick a country and language, answer vocabulary questions, and track your progress.",
  },
};

const navItems = [
  { id: "home", label: "Home" },
  { id: "dictionary", label: "Dictionary" },
  { id: "quick-access", label: "Quick Speak" },
  { id: "talk", label: "Two-Way" },
  { id: "map", label: "SEA Map" },
  { id: "quiz", label: "Quiz" },
];

export default function Header({ theme, currentView = "home", onToggleTheme, onNavigate }) {
  const copy = pageCopy[currentView] || pageCopy.home;

  return (
    <header className="hero">
      <div className="hero-top">
        <div className="pill-row">
          <button type="button" className="brand-link" onClick={() => onNavigate?.("home")}>Kura AI</button>

          <nav className="main-nav" aria-label="Main navigation">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${currentView === item.id ? "active" : ""}`}
                onClick={() => onNavigate?.(item.id)}
                aria-current={currentView === item.id ? "page" : undefined}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <button
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
          >
            <span className="theme-toggle-icon" />
          </button>
        </div>
        <h1>{copy.title}</h1>
        <p className="subtitle">
          {copy.subtitle}
        </p>
      </div>
    </header>
  );
}
