export default function HomePage({ onFeatureClick }) {

  const features = [
    {
      id: "quick-access",
      title: "Quick Speak",
      description: "Instant translation with voice output for everyday phrases.",
      note: "Free",
    },
    {
      id: "dictionary",
      title: "Dictionary",
      description: "Browse regional vocabulary with English meanings.",
      note: "Reference",
    },
    {
      id: "talk",
      title: "Two-Way",
      description: "Translate both sides of a conversation in real time.",
      note: "Available",
    },
    {
      id: "map",
      title: "SEA Map",
      description: "Explore Southeast Asian languages by country.",
      note: "Available",
    },
    {
      id: "quiz",
      title: "Quiz",
      description: "Practice and test your language knowledge.",
      note: "Available",
    },  ];

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Clean language tools for Southeast Asia
            </h1>
            <p className="hero-subtitle">
              Translate instantly, speak naturally, and move between features from the top navigation.
            </p>
            <div className="hero-ctas">
              <button
                className="cta-primary"
                type="button"
                onClick={() => onFeatureClick("quick-access")}
              >
                Try Quick Speak
              </button>
              <button
                className="cta-secondary"
                type="button"
                onClick={() => onFeatureClick("dictionary")}
              >
                Open Dictionary
              </button>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-panel-card">
              <p className="hero-panel-label">Home</p>
              <h2>Choose a feature</h2>
              <p>
                Use the navigation above to open Quick Speak, Dictionary, Two-Way, SEA Map, or Quiz as the main screen.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="section-header">
          <h2>Main features</h2>
          <p>Everything opens as a full page, not a floating panel.</p>
        </div>

        <div className="features-grid">
          {features.map((feature) => (
            <button
              key={feature.id}
              type="button"
              className="feature-card"
              onClick={() => onFeatureClick(feature.id)}
            >
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <span className="feature-card-note">{feature.note}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
