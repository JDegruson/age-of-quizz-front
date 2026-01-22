import React, { useState } from "react";

const QuestionForm: React.FC = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !answer) {
      setError("Les deux champs sont requis.");
      return;
    }
    setError("");
    // Logic to handle question submission goes here
    console.log("Question soumise:", { question, answer });
    // Reset form fields
    setQuestion("");
    setAnswer("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="question">Question :</label>
        <input
          type="text"
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="answer">Réponse :</label>
        <input
          type="text"
          id="answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button type="submit">Soumettre la question</button>
    </form>
  );
};

export default QuestionForm;
