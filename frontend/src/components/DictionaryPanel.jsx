import { useState, useEffect, useRef } from "react";
import { DICTIONARY_LANGUAGES, QUIZ_COUNTRIES } from "../utils/constants";
import { dictionaryHandler } from "../handlers";

export default function DictionaryPanel({
  selectedDictLang,
  dictData,
  dictLoading,
  dictError,
  onDictLangChange,
  onLoadDictionary,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;
  const scrollYRef = useRef(0);
  const paginationRef = useRef(null);
  const isInitialRenderRef = useRef(true);

  const [availableLangs, setAvailableLangs] = useState([]);
  const [activeCountry, setActiveCountry] = useState(null);

  useEffect(() => {
    // Fetch available dictionaries from backend once when panel mounts
    let mounted = true;
    (async () => {
      try {
        const list = await dictionaryHandler.listDictionaries();
        if (!mounted) return;
        // list.available_languages is expected from backend
        if (list && list.available_languages) {
          // Exclude Vietnamese per user request
          const filtered = list.available_languages.filter((n) => n !== "Vietnamese");
          setAvailableLangs(filtered);
        }
      } catch (e) {
        // fallback to constants if backend not available
        setAvailableLangs(DICTIONARY_LANGUAGES.map((l) => l.name).filter((n) => n !== "Vietnamese"));
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!availableLangs || availableLangs.length === 0) return;
    // Pick first country that has any available language
    for (const c of QUIZ_COUNTRIES) {
      const names = c.languages.map((l) => l.name);
      if (names.some((n) => availableLangs.includes(n))) {
        setActiveCountry(c.code);
        return;
      }
    }
    // fallback to first country
    setActiveCountry(QUIZ_COUNTRIES[0]?.code || null);
  }, [availableLangs]);

  const getFilteredSortedEntries = () => {
    if (!dictData?.entries) return [];
    const q = searchQuery.trim().toLowerCase();
    const filtered = dictData.entries.filter((entry) => {
      if (!entry || !entry.word) return false;
      if (!q) return true;
      return (
        entry.word.toLowerCase().includes(q) ||
        (entry.english || "").toLowerCase().includes(q)
      );
    });
    // Sort A-Z by the original word
    filtered.sort((a, b) => a.word.localeCompare(b.word, undefined, { sensitivity: 'base' }));
    return filtered;
  };

  const entriesList = getFilteredSortedEntries();
  const totalPages = Math.max(1, Math.ceil(entriesList.length / PAGE_SIZE));
  const paginatedEntries = entriesList.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const saveScrollPosition = () => {
    scrollYRef.current = window.scrollY;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDictLang, searchQuery, dictData?.language]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (scrollYRef.current > 0) {
      window.scrollTo({ top: scrollYRef.current, behavior: "auto" });
    }
  }, [currentPage]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setTimeout(() => {
      if (paginationRef.current) {
        paginationRef.current.scrollIntoView({
          block: "center",
          inline: "nearest",
          behavior: "smooth",
        });
      }
    }, 0);
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div className="panel-header-row">
            <div>
              <h2>Dictionary</h2>
              <p>Browse vocabulary from SEA languages (native text → English).</p>
            </div>
          </div>
      </div>

      <div className="dict-country-tabs">
        {QUIZ_COUNTRIES.map((c) => (
          <button
            key={c.code}
            className={`dict-country-tab ${activeCountry === c.code ? "active" : ""}`}
            onClick={() => setActiveCountry(c.code)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="dict-lang-selector">
        {activeCountry && (() => {
          const country = QUIZ_COUNTRIES.find((c) => c.code === activeCountry);
          if (!country) return null;
          const langNames = country.languages.map((l) => l.name).filter((n) => availableLangs.includes(n));
          if (langNames.length === 0) return <div className="dict-no-langs">No dictionary available for this country.</div>;
          return langNames.map((langName) => (
            <button
              key={langName}
              className={`dict-lang-btn ${selectedDictLang === langName ? "active" : ""}`}
              onClick={() => {
                if (dictLoading) return;
                if (selectedDictLang === langName) return;
                onDictLangChange(langName);
              }}
              disabled={dictLoading || selectedDictLang === langName}
            >
              {langName}
            </button>
          ));
        })()}
      </div>

      <div className="dict-search-bar">
        <input
          type="text"
          placeholder="Search by word or English translation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="dict-search-input"
        />
        {searchQuery && (
          <button
            className="dict-search-clear"
            onClick={() => setSearchQuery("")}
          >
            Clear
          </button>
        )}
      </div>

      {dictLoading && (
        <div className="dict-loading">
          <div className="pb-spinner" />
          <span>Loading dictionary...</span>
        </div>
      )}

      {dictError && (
        <div className="dict-error">
          <p>{dictError}</p>
        </div>
      )}

      {!dictLoading && !dictError && dictData && (
        <div className="dict-content">
          {entriesList.length === 0 ? (
            <div className="dict-empty">
              <p>No entries match your search.</p>
            </div>
          ) : (
            <>
              <div className="dict-list">
                {paginatedEntries.map((entry, idx) => (
                <div key={idx} className="dict-entry simple">
                  <div className="dict-entry-row">
                    <div className="dict-entry-word">
                      <div className="dict-word-main">{entry.word}</div>
                      {entry.pronunciation && (
                        <div className="dict-word-pronunciation">{entry.pronunciation}</div>
                      )}
                    </div>
                    <div className="dict-entry-meaning">
                      <strong>{entry.english}</strong>
                      {entry.example && (
                        <div className="dict-entry-example">{entry.example}</div>
                      )}
                      {entry.example_english && (
                        <div className="dict-entry-example-english">{entry.example_english}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              </div>

              <div className="dict-pagination" ref={paginationRef}>
                <button
                  className="dict-pagination-btn"
                  onClick={() => {
                    saveScrollPosition();
                    setCurrentPage((page) => Math.max(1, page - 1));
                  }}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>

                <span className="dict-pagination-info">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  className="dict-pagination-btn"
                  onClick={() => {
                    saveScrollPosition();
                    setCurrentPage((page) => Math.min(totalPages, page + 1));
                  }}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
