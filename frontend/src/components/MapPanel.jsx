export default function MapPanel({
  seaCountries,
  selectedCountry,
  mapResult,
  mapPlaying,
  exploredIds,
  onMapClick,
  onReplayMapAudio,
  countryFlags,
  voiceCounts = {},
}) {
  return (
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
          {seaCountries.map((country) => (
            <button
              key={country.id}
              className={`map-dot-btn ${selectedCountry?.id === country.id ? "active" : ""} ${exploredIds.has(country.id) && selectedCountry?.id !== country.id ? "explored" : ""}`}
              style={{ top: `${country.top}%`, left: `${country.left}%` }}
              onClick={() => onMapClick(country)}
              aria-label={country.name}
            >
              <span className="map-dot-pulse" />
              <span className="map-dot-core" />
              <span className="map-dot-label">{country.name}</span>
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
                {selectedCountry?.country && (
                  <span className="map-playing-country"> · {selectedCountry.country}</span>
                )}
                ...
              </p>
            </div>
          )}
          {selectedCountry && mapResult && !mapPlaying && (
            <div className="map-result-card">
              <div className="map-result-top">
                <div>
                  <h3>{selectedCountry.name}</h3>
                  {selectedCountry.country && (
                    <p className="map-result-country">
                      {countryFlags[selectedCountry.country] && (
                        <span className="map-country-flag">{countryFlags[selectedCountry.country]}</span>
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

              <div className="map-result-greeting">
                <div className="map-greeting-header">
                  <span className="map-greeting-label">Greeting</span>
                  {mapResult.audio && (
                    <button
                      className="map-replay-btn"
                      onClick={onReplayMapAudio}
                      title="Replay greeting"
                      aria-label="Replay greeting audio"
                    >
                      🔊 Replay
                    </button>
                  )}
                </div>
                <p className="map-result-text">"{mapResult.text}"</p>
              </div>

              {mapResult.cultural_fact && (
                <div className="map-cultural-fact">
                  <span className="map-cultural-icon">💡</span>
                  <p>{mapResult.cultural_fact}</p>
                </div>
              )}

              {/* Archive voice count badge */}
              {voiceCounts[selectedCountry?.name] > 0 && (
                <div className="map-archive-badge">
                  <span>🎙️</span>
                  <span>
                    {voiceCounts[selectedCountry.name]} voice
                    {voiceCounts[selectedCountry.name] !== 1 ? "s" : ""} preserved
                    in Suara Leluhur
                  </span>
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
  );
}
