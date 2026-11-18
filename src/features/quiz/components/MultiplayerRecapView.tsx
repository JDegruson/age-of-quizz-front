import React, { useState } from "react";
import type {
  GameRecapPayload,
  QuestionResponse,
} from "../../../types/multiplayer";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import { formatPlayerName } from "../../../utils/playerLabel";
import PlayerNameLink from "../../../components/PlayerNameLink";
import QuestionMedia from "../../../components/QuestionMedia";
import ReportQuestionModal from "../../../components/ReportQuestionModal";
import styles from "./RecapView.module.css";

interface MultiplayerRecapViewProps {
  recap: GameRecapPayload;
  /** jwt présent = joueur connecté, qui peut signaler une question. */
  currentUser:
    | { id?: number; username?: string; jwt?: string }
    | null
    | undefined;
  openQuestionIndex: number | null;
  onToggleQuestion: (index: number) => void;
  onRequestRematch?: () => void;
  isRequestingRematch?: boolean;
  rematchFeedback?: string | null;
  onBackHome: () => void;
}

const cx = (...classes: (string | false | undefined)[]) =>
  classes.filter(Boolean).join(" ");

const RANK_CLASS: Record<number, string> = {
  1: styles.rank1,
  2: styles.rank2,
  3: styles.rank3,
};

/** Selected answers as chips, green when correct and red otherwise. */
const SelectedChips: React.FC<{ response: QuestionResponse }> = ({
  response,
}) => {
  const selected = response.selected || [];
  if (selected.length === 0) {
    return <span className={styles.chipEmpty}>Aucune réponse</span>;
  }
  return (
    <div className={styles.chips}>
      {selected.map((answer) => (
        <span
          key={answer}
          className={cx(
            styles.chip,
            (response.correct || []).includes(answer)
              ? styles.chipOk
              : styles.chipKo,
          )}
        >
          {answer}
        </span>
      ))}
    </div>
  );
};

/**
 * End-of-game recap (ranking + per-question details). Also used for solo
 * games, with a recap built client-side by buildSoloRecap.
 */
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
  const [reportingQuestion, setReportingQuestion] = useState<{
    id: number;
    text: string;
  } | null>(null);
  const [reportedIds, setReportedIds] = useState<Set<number>>(new Set());
  const jwt = currentUser?.jwt;

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

  const getPlayer = (playerKey: string) =>
    playersByUsername.get(playerKey) ?? playersByUserId.get(playerKey);

  const getPlayerLabel = (playerKey: string) => {
    const player = getPlayer(playerKey);
    return player ? formatPlayerName(player) : playerKey;
  };

  const myPlayer = sortedPlayers.find((player) => player.isCurrentUser);
  const isSolo = recap.session.gameMode === "SINGLEPLAYER";

  // In solo the only response is the player's; in multiplayer, look up the
  // current user's entry to flag each question as right/wrong in its header.
  const getMyResponse = (responses: Record<string, QuestionResponse>) => {
    const entries = Object.entries(responses || {});
    const mine = entries.find(
      ([playerKey]) => getPlayer(playerKey)?.isCurrentUser,
    );
    return (mine ?? (isSolo ? entries[0] : undefined))?.[1];
  };

  return (
    <div className="container page-xl mt-5 mb-5">
      <Card shadow={false}>
        <h2 className={styles.title}>
          {isSolo ? "Récapitulatif" : "Récapitulatif multijoueur"}
        </h2>
        <div className={styles.meta}>
          <span className={styles.metaChip}>
            {recap.session.questionCount} questions
          </span>
          <span className={styles.metaChip}>
            {recap.session.totalDuration}s de jeu
          </span>
          {!isSolo && (
            <span className={styles.metaChip}>
              {sortedPlayers.length} joueurs
            </span>
          )}
        </div>

        {myPlayer && (
          <div className={styles.hero}>
            {!isSolo && (
              <div className={styles.heroRank}>
                <span className={styles.heroRankLabel}>Rang</span>
                <span className={styles.heroRankValue}>#{myPlayer.rank}</span>
              </div>
            )}
            <div className={styles.stats}>
              <div className={styles.stat}>
                <div className={styles.statValue}>
                  {myPlayer.correctAnswers}/{myPlayer.totalQuestions}
                </div>
                <div className={styles.statLabel}>Bonnes réponses</div>
              </div>
              <div className={styles.stat}>
                <div className={cx(styles.statValue, styles.statValueAccent)}>
                  {myPlayer.points}
                </div>
                <div className={styles.statLabel}>Points</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>
                  {myPlayer.accuracy.toFixed(0)}%
                </div>
                <div className={styles.statLabel}>Précision</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>
                  {myPlayer.totalTimeSeconds}s
                </div>
                <div className={styles.statLabel}>Temps total</div>
              </div>
            </div>
          </div>
        )}

        {!isSolo && (
          <>
            <h4 className={styles.sectionTitle}>Classement final</h4>
            <div className={styles.ranking}>
              {sortedPlayers.map((player) => (
                <div
                  key={`${player.username}-${player.userId}`}
                  className={cx(
                    styles.rankRow,
                    player.isCurrentUser && styles.rankRowMe,
                  )}
                >
                  <span
                    className={cx(styles.rankBadge, RANK_CLASS[player.rank])}
                  >
                    {player.rank}
                  </span>
                  <div>
                    <div className={styles.playerName}>
                      <PlayerNameLink player={player} />
                      {player.isCurrentUser && " (vous)"}
                    </div>
                    <div className={styles.playerSub}>
                      {player.correctAnswers}/{player.totalQuestions} ·{" "}
                      {player.accuracy.toFixed(0)}% · {player.totalTimeSeconds}s
                    </div>
                  </div>
                  <div className={styles.playerPoints}>
                    {player.points}
                    <span className={styles.playerPointsUnit}>pts</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <h4 className={styles.sectionTitle}>Détails par question</h4>
        <div className={styles.questions}>
          {(recap.questions || []).map((question, idx) => {
            const isOpen = openQuestionIndex === idx;
            const myResponse = getMyResponse(question.playerResponses);
            const correctAnswers =
              Object.values(question.playerResponses || {})[0]?.correct || [];
            return (
              <div
                key={question.questionId}
                className={cx(styles.question, isOpen && styles.questionOpen)}
              >
                <button
                  type="button"
                  className={styles.questionHeader}
                  onClick={() => onToggleQuestion(idx)}
                  aria-expanded={isOpen}
                  aria-controls={`recap-question-${idx}`}
                >
                  <span className={styles.questionNumber}>Q{idx + 1}</span>
                  <span className={styles.questionText}>
                    {question.questionText}
                  </span>
                  {myResponse && (
                    <span
                      className={cx(
                        styles.verdict,
                        myResponse.isCorrect
                          ? styles.verdictOk
                          : styles.verdictKo,
                      )}
                      aria-label={myResponse.isCorrect ? "Correct" : "Incorrect"}
                    >
                      {myResponse.isCorrect ? "✓" : "✗"}
                    </span>
                  )}
                  <span
                    className={cx(styles.chevron, isOpen && styles.chevronOpen)}
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                </button>
                {isOpen && (
                  <div
                    id={`recap-question-${idx}`}
                    className={styles.questionBody}
                  >
                    {question.fileUrl && (
                      <div className={styles.questionMedia}>
                        <QuestionMedia
                          fileUrl={question.fileUrl}
                          type={question.questionType ?? undefined}
                        />
                      </div>
                    )}
                    <div className={styles.correctLine}>
                      Bonne(s) réponse(s) :{" "}
                      <strong style={{ color: "#4ade80" }}>
                        {correctAnswers.join(", ") || "-"}
                      </strong>
                    </div>
                    {Object.entries(question.playerResponses || {}).map(
                      ([playerKey, response]) => (
                        <div
                          key={playerKey}
                          className={cx(
                            styles.response,
                            response.isCorrect && styles.responseOk,
                          )}
                        >
                          <div className={styles.responseHead}>
                            <strong>
                              {isSolo
                                ? "Votre réponse"
                                : getPlayerLabel(playerKey)}
                            </strong>
                            <span className={styles.responseTime}>
                              {response.timeSeconds}s
                            </span>
                          </div>
                          <SelectedChips response={response} />
                        </div>
                      ),
                    )}
                    {question.explanation && (
                      <div className={styles.explanation}>
                        <div className={styles.explanationTitle}>
                          <i className="bi bi-lightbulb-fill me-2" aria-hidden="true"></i>
                          Explication
                        </div>
                        <p className="mb-0">{question.explanation}</p>
                      </div>
                    )}
                    {jwt && (
                      <div className={styles.reportLine}>
                        {reportedIds.has(question.questionId) ? (
                          <span className={styles.reported}>
                            <i className="bi bi-check2 me-1" aria-hidden="true"></i>
                            Signalement envoyé, merci !
                          </span>
                        ) : (
                          <button
                            type="button"
                            className={styles.reportButton}
                            onClick={() =>
                              setReportingQuestion({
                                id: question.questionId,
                                text: question.questionText,
                              })
                            }
                          >
                            <i className="bi bi-flag me-1" aria-hidden="true"></i>
                            Signaler un problème
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {recap.allowRematch && onRequestRematch && (
          <div className={styles.rematch}>
            <div className="mb-2">
              Revanche disponible ({recap.rematchExpireIn || 0}s)
            </div>
            <Button
              variant="outline-theme"
              onClick={onRequestRematch}
              disabled={isRequestingRematch}
            >
              {isRequestingRematch ? "Envoi..." : "Demander une revanche"}
            </Button>
            {rematchFeedback && (
              <div className={styles.rematchFeedback}>{rematchFeedback}</div>
            )}
          </div>
        )}

        <Button className="w-100 mt-4" onClick={onBackHome}>
          Retour accueil
        </Button>
      </Card>
      {reportingQuestion && jwt && (
        <ReportQuestionModal
          questionId={reportingQuestion.id}
          questionText={reportingQuestion.text}
          jwt={jwt}
          onClose={() => setReportingQuestion(null)}
          onReported={() => {
            setReportedIds((prev) => new Set(prev).add(reportingQuestion.id));
            setReportingQuestion(null);
          }}
        />
      )}
    </div>
  );
};

export default MultiplayerRecapView;
