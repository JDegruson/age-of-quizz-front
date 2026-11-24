import React from "react";
import { Link } from "react-router-dom";
import type { AdventLeaderboardEntry } from "../../../types/advent";
import styles from "../AdventCalendar.module.css";

const TOP = 10;
const MEDALS = ["🥇", "🥈", "🥉"];

interface AdventLeaderboardProps {
  entries: AdventLeaderboardEntry[];
  totalDays: number;
}

/** Top 10, plus la ligne du joueur connecté s'il est plus loin. */
const AdventLeaderboard: React.FC<AdventLeaderboardProps> = ({
  entries,
  totalDays,
}) => {
  const top = entries.slice(0, TOP);
  const me = entries.find((e) => e.me);
  const rows = me && !top.includes(me) ? [...top, me] : top;

  return (
    <section className={styles.board} aria-labelledby="advent-board-title">
      <h2 id="advent-board-title" className={styles.boardTitle}>
        <i className="bi bi-trophy-fill me-2" aria-hidden="true"></i>
        Classement de l'avent
      </h2>
      {rows.length === 0 ? (
        <p className={styles.boardEmpty}>
          Personne n'a encore ouvert de case. À toi de jouer !
        </p>
      ) : (
        <ol className={styles.boardList}>
          {rows.map((entry, i) => (
            <li
              key={entry.userId}
              className={`${styles.boardRow} ${entry.me ? styles.boardMe : ""} ${
                i === TOP ? styles.boardGap : ""
              }`}
            >
              <span className={styles.boardRank}>
                {MEDALS[entry.rank - 1] ?? `${entry.rank}.`}
              </span>
              <span className={styles.boardName}>
                {entry.userProfileId ? (
                  <Link to={`/profile/${entry.userProfileId}`}>
                    {entry.username}
                  </Link>
                ) : (
                  entry.username
                )}
              </span>
              <span
                className={styles.boardJokers}
                title={`${entry.jokersUsed} joker${
                  entry.jokersUsed > 1 ? "s" : ""
                } utilisé${entry.jokersUsed > 1 ? "s" : ""}`}
                aria-label={`${entry.jokersUsed} joker${
                  entry.jokersUsed > 1 ? "s" : ""
                } utilisé${entry.jokersUsed > 1 ? "s" : ""}`}
              >
                {entry.jokersUsed > 0 && (
                  <>
                    <i className="bi bi-magic me-1" aria-hidden="true"></i>
                    {entry.jokersUsed}
                  </>
                )}
              </span>
              <span
                className={styles.boardScore}
                title={`${entry.answeredCount} case(s) ouverte(s)`}
              >
                {entry.score}
                <small>/{totalDays}</small>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

export default AdventLeaderboard;
