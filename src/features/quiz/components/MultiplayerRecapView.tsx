import React from "react";
import type { GameRecapPayload } from "../../../types/multiplayer";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import { formatPlayerName } from "../../../utils/playerLabel";

interface MultiplayerRecapViewProps {
  recap: GameRecapPayload;
  currentUser: { id?: number; username?: string } | null | undefined;
  openQuestionIndex: number | null;
  onToggleQuestion: (index: number) => void;
  onRequestRematch: () => void;
  isRequestingRematch: boolean;
  rematchFeedback: string | null;
  onBackHome: () => void;
}

const MultiplayerRecapView: React.FC<MultiplayerRecapViewProps> = ({
  recap,
  currentUser,
  openQuestionIndex,
  onToggleQuestion,
  onRequestRematch,
  isRequestingRematch,
  rematchFeedback,
  onBackHome,
}) => {
  const sortedPlayers = [...(recap.results?.playerResults || [])]
    .sort((a, b) => a.rank - b.rank)
    .map((player) => ({
      ...player,
      isCurrentUser:
        player.userId === currentUser?.id ||
        player.username === currentUser?.username,
    }));
  const playersByUsername = new Map(
    sortedPlayers.map((player) => [player.username, player]),
  );
  const playersByUserId = new Map(
    sortedPlayers.map((player) => [String(player.userId), player]),
  );

  const getPlayerLabel = (playerKey: string) => {
    const byUsername = playersByUsername.get(playerKey);
    if (byUsername) {
      return formatPlayerName(byUsername);
    }

    const byUserId = playersByUserId.get(playerKey);
    if (byUserId) {
      return formatPlayerName(byUserId);
    }

    return playerKey;
  };

  const myPlayer = sortedPlayers.find((player) => player.isCurrentUser);

  return (
    <div className="container page-xl mt-5">
      <Card shadow={false}>
        <h2 className="mb-2 text-center">Recap multijoueur</h2>
        <div className="text-center mb-4" style={{ color: "#9ca3af" }}>
          Session {recap.session.gameSessionId} | {recap.session.questionCount}{" "}
          questions | {recap.session.totalDuration}s
        </div>

        {myPlayer && (
          <div
            className="mb-4 p-3"
            style={{
              border: "1px solid #374151",
              borderRadius: 8,
              backgroundColor: "#111827",
            }}
          >
            <strong>Votre resultat:</strong> rang #{myPlayer.rank} | score{" "}
            {myPlayer.score}/{myPlayer.totalQuestions} | {myPlayer.points}{" "}
            points
          </div>
        )}

        <h4 className="mb-3">Classement final</h4>
        <div className="table-responsive mb-4">
          <table className="table table-dark table-striped align-middle">
            <thead>
              <tr>
                <th>Rang</th>
                <th>Joueur</th>
                <th>Score</th>
                <th>Points</th>
                <th>Precision</th>
                <th>Temps total</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player) => (
                <tr
                  key={`${player.username}-${player.userId}`}
                  style={{
                    backgroundColor: player.isCurrentUser
                      ? "#1f2937"
                      : undefined,
                  }}
                >
                  <td>{player.rank}</td>
                  <td>{formatPlayerName(player)}</td>
                  <td>
                    {player.correctAnswers}/{player.totalQuestions}
                  </td>
                  <td>{player.points}</td>
                  <td>{player.accuracy.toFixed(1)}%</td>
                  <td>{player.totalTimeSeconds}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4 className="mb-3">Details par question</h4>
        <div className="accordion" id="recapQuestions">
          {(recap.questions || []).map((question, idx) => (
            <div className="accordion-item" key={question.questionId}>
              <h2 className="accordion-header" id={`heading-${idx}`}>
                <button
                  className={`accordion-button${
                    openQuestionIndex === idx ? "" : " collapsed"
                  }`}
                  type="button"
                  onClick={() => onToggleQuestion(idx)}
                  aria-expanded={openQuestionIndex === idx}
                  aria-controls={`collapse-${idx}`}
                >
                  Q{idx + 1}. {question.questionText}
                </button>
              </h2>
              <div
                id={`collapse-${idx}`}
                className={`accordion-collapse collapse${
                  openQuestionIndex === idx ? " show" : ""
                }`}
                aria-labelledby={`heading-${idx}`}
                data-bs-parent="#recapQuestions"
                style={{
                  display: openQuestionIndex === idx ? "block" : "none",
                }}
              >
                <div className="accordion-body">
                  <div className="table-responsive">
                    <table className="table table-sm table-striped">
                      <thead>
                        <tr>
                          <th>Joueur</th>
                          <th>Choix</th>
                          <th>Bonnes reponses</th>
                          <th>Resultat</th>
                          <th>Temps</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(question.playerResponses || {}).map(
                          ([playerKey, response]) => (
                            <tr key={playerKey}>
                              <td>{getPlayerLabel(playerKey)}</td>
                              <td>
                                {(response.selected || []).join(", ") || "-"}
                              </td>
                              <td>
                                {(response.correct || []).join(", ") || "-"}
                              </td>
                              <td
                                style={{
                                  color: response.isCorrect
                                    ? "#22c55e"
                                    : "#ef4444",
                                  fontWeight: 600,
                                }}
                              >
                                {response.isCorrect ? "Correct" : "Incorrect"}
                              </td>
                              <td>{response.timeSeconds}s</td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {recap.allowRematch && (
          <div
            className="mt-4 p-3"
            style={{ backgroundColor: "#1f2937", borderRadius: 8 }}
          >
            <div className="mb-2">
              Rematch available ({recap.rematchExpireIn || 0}s)
            </div>
            <Button
              variant="outline-theme"
              onClick={onRequestRematch}
              disabled={isRequestingRematch}
            >
              {isRequestingRematch ? "Sending..." : "Request rematch"}
            </Button>
            {rematchFeedback && (
              <div className="mt-2" style={{ color: "#d1d5db" }}>
                {rematchFeedback}
              </div>
            )}
          </div>
        )}

        <Button className="w-100 mt-4" onClick={onBackHome}>
          Retour accueil
        </Button>
      </Card>
    </div>
  );
};

export default MultiplayerRecapView;
