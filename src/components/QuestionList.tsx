import React from "react";
import { Question } from "../types";

interface QuestionListProps {
  questions: Question[];
}

const QuestionList: React.FC<QuestionListProps> = ({ questions }) => {
  return (
    <div>
      <h2>Questions du quiz</h2>
      <ul>
        {questions.map((question, index) => (
          <li key={index}>
            <strong>{question.questionText}</strong>
            <p>Réponse : {question.answer}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default QuestionList;
