import React from "react";
import { isExactMatch, computePoints, type QuizResult } from "../utils/scoring";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";

interface SoloRecapViewProps {
  results: QuizResult[];
  answerTimers: number[];
  score: number;
  points: number;
  onBackHome: () => void;
}

const SoloRecapView: React.FC<SoloRecapViewProps> = ({
  results,
  answerTimers,
  score,
  points,
  onBackHome,
}) => {
  return (
    <div className="container page-md mt-5">
      <Card shadow={false}>
        <h2 className="mb-4 text-center">Récapitulatif final</h2>
        <table className="table table-dark table-striped">
          <thead>
            <tr>
              <th>#</th>
              <th>Question</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, idx) => {
              const questionIsCorrect = isExactMatch(r.selected, r.correct);
              const savedTime = answerTimers[idx] || 0;
              const pts = computePoints(questionIsCorrect, savedTime);
              return (
                <tr key={r.questionId}>
                  <td>{idx + 1}</td>
                  <td>{r.intitule}</td>
                  <td style={{ color: pts > 0 ? "#4ade80" : "#f87171" }}>
                    {pts}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div
          className="text-center mt-4 p-3"
          style={{ backgroundColor: "#1a1a1a", borderRadius: 8 }}
        >
          <h3>
            Score : {score} / {results.length}
          </h3>
          <h4 style={{ marginTop: 10, color: "#4ade80", fontSize: 24 }}>
            Points totaux : {points}
          </h4>
        </div>
        <Button className="w-100 mt-4" onClick={onBackHome}>
          Retour accueil
        </Button>
      </Card>
    </div>
  );
};

export default SoloRecapView;
