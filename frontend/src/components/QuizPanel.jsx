import { QUIZ_LANGUAGES, QUIZ_COUNTRIES } from "../utils/constants";

export default function QuizPanel({
  quizCountry,
  quizLang,
  quizQuestion,
  quizSelected,
  quizRevealed,
  quizScore,
  quizStreak,
  quizTotal,
  quizLoading,
  quizAskedKeys,
  quizTotalKeys,
  quizDidReset,
  quizMascot,
  onQuizCountryChange,
  onQuizLangChange,
  onQuizAnswer,
  onQuizNext,
}) {
  const currentCountry = QUIZ_COUNTRIES.find((c) => c.code === quizCountry);
  const countriesWithLangs = QUIZ_COUNTRIES.filter((c) => c.languages.length > 0);
  return (
    <section className="panel quiz-panel">
      <div className="panel-header">
        <h2>Language Quiz</h2>
        <p>Test your knowledge of SEA regional greetings. Pick the correct answer!</p>
      </div>

      <div className="quiz-lang-scroll">
        <div className="quiz-country-tabs">
          {countriesWithLangs.map((country) => (
            <button
              key={country.code}
              className={`quiz-country-tab ${quizCountry === country.code ? "active" : ""}`}
              onClick={() => onQuizCountryChange(country.code)}
              disabled={quizLoading}
              title={country.name}
            >
              {country.flag} {country.name}
            </button>
          ))}
        </div>

        {currentCountry && (
          <div className="quiz-lang-buttons">
            {currentCountry.languages.map((lang) => (
              <button
                key={lang.name}
                className={`quiz-lang-pill ${quizLang === lang.name ? "active" : ""}`}
                onClick={() => onQuizLangChange(lang.name)}
                disabled={quizLoading}
              >
                {lang.flag} {lang.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="quiz-score-bar">
        <div className="quiz-score-item">
          <span className="quiz-score-value">{quizScore}</span>
          <span className="quiz-score-label">Correct</span>
        </div>
        <div className="quiz-score-item">
          <span className="quiz-score-value quiz-streak">
            {quizStreak > 0 ? `🔥 ${quizStreak}` : quizStreak}
          </span>
          <span className="quiz-score-label">Streak</span>
        </div>
        <div className="quiz-score-item">
          <span className="quiz-score-value">{quizTotal}</span>
          <span className="quiz-score-label">Answered</span>
        </div>
        {quizTotal > 0 && (
          <div className="quiz-score-item">
            <span className="quiz-score-value">
              {Math.round((quizScore / quizTotal) * 100)}%
            </span>
            <span className="quiz-score-label">Accuracy</span>
          </div>
        )}
        {quizTotalKeys > 0 && (
          <div className="quiz-score-item quiz-progress-item">
            <span className="quiz-score-value quiz-progress-value">
              {quizAskedKeys.length}
              <span className="quiz-progress-sep">/{quizTotalKeys}</span>
            </span>
            <span className="quiz-score-label">Questions</span>
          </div>
        )}
      </div>

      {quizDidReset && (
        <div className="quiz-reset-notice">🔁 All questions completed — starting a new round!</div>
      )}

      <div className={`quiz-mascot ${quizMascot}`}>
        <div className="quiz-mascot-body">
          <div className="quiz-mascot-face">
            <img src="/logo/logo.png" alt="Kura AI logo" className="quiz-mascot-logo" />
          </div>
          <div className="quiz-mascot-name">Kura</div>
        </div>
        {quizMascot === "correct" && (
          <div className="quiz-mascot-bubble correct">✅ Correct! Well done!</div>
        )}
        {quizMascot === "wrong" && quizQuestion && (
          <div className="quiz-mascot-bubble wrong">
            ❌ The answer is: <strong>{quizQuestion.correct_answer}</strong>
          </div>
        )}
        {quizMascot === "idle" && quizQuestion && (
          <div className="quiz-mascot-bubble idle">
            How do you say <strong>"{quizQuestion.question_label}"</strong> in {quizQuestion.language}?
          </div>
        )}
      </div>

      {quizLoading && (
        <div className="quiz-loading">
          <div className="pb-spinner" />
          <span>Loading question...</span>
        </div>
      )}

      {!quizLoading && quizQuestion && (
        <div className="quiz-choices">
          {quizQuestion.choices.map((choice, i) => {
            let state = "default";
            if (quizRevealed) {
              if (choice === quizQuestion.correct_answer) state = "correct";
              else if (choice === quizSelected) state = "wrong";
              else state = "dim";
            }
            return (
              <button
                key={i}
                className={`quiz-choice ${state}`}
                onClick={() => onQuizAnswer(choice)}
                disabled={quizRevealed}
              >
                <span className="quiz-choice-letter">{["A", "B", "C", "D"][i]}</span>
                <span className="quiz-choice-text">{choice}</span>
                {state === "correct" && <span className="quiz-choice-icon">✅</span>}
                {state === "wrong" && <span className="quiz-choice-icon">❌</span>}
              </button>
            );
          })}
        </div>
      )}

      {quizRevealed && (
        <div className="quiz-next-row">
          <button className="quiz-next-btn" onClick={onQuizNext}>
            Next Question →
          </button>
        </div>
      )}
    </section>
  );
}
