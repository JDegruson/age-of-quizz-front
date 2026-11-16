import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./LeaderboardPage.module.css";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import ProfileAvatar from "../profile/ProfileAvatar";
import { useUser } from "../../context/UserContext";
import { fetchLeaderboard } from "../../services/userProfileApi";
import type { Leaderboard, LeaderboardEntry } from "../../types/leaderboard";

type Category =
  | "accuracy"
  | "questionsAnswered"
  | "multiplayerWins"
  | "dailyRiddleStreak"
  | "questionsCreated";

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

const CATEGORIES: {
  id: Category;
  label: string;
  description: (board: Leaderboard) => string;
  formatValue: (entry: LeaderboardEntry) => string;
  formatSample: (entry: LeaderboardEntry) => string;
}[] = [
  {
    id: "accuracy",
    label: "Précision",
    description: (board) =>
      `Pourcentage de bonnes réponses, à partir de ${board.minQuestionsForAccuracy} questions répondues.`,
    formatValue: (e) => `${Math.round(e.value)} %`,
    formatSample: (e) => plural(e.sampleSize, "question"),
  },
  {
    id: "questionsAnswered",
    label: "Questions",
    description: () => "Nombre de questions répondues, solo et multijoueur.",
    formatValue: (e) => e.value.toLocaleString("fr-FR"),
    formatSample: () => "",
  },
  {
    id: "multiplayerWins",
    label: "Victoires",
    description: () =>
      "Parties multijoueur gagnées (les parties jouées seul ne comptent pas).",
    formatValue: (e) => plural(e.value, "victoire"),
    formatSample: (e) => `sur ${plural(e.sampleSize, "partie")}`,
  },
  {
    id: "dailyRiddleStreak",
    label: "Énigme du jour",
    description: () => "Meilleure série d'énigmes du jour trouvées d'affilée.",
    formatValue: (e) => plural(e.value, "jour"),
    formatSample: (e) => `${plural(e.sampleSize, "énigme")} jouée${e.sampleSize > 1 ? "s" : ""}`,
  },
  {
    id: "questionsCreated",
    label: "Auteurs",
    description: () =>
      "Nombre de questions créées, quel que soit leur statut. À égalité, le plus de questions validées passe devant.",
    formatValue: (e) => `${plural(e.value, "question")} créée${e.value > 1 ? "s" : ""}`,
    formatSample: (e) => `${e.sampleSize} validée${e.sampleSize > 1 ? "s" : ""}`,
  },
];

const RANK_CLASS: Record<number, string> = {
  1: styles.rank1,
  2: styles.rank2,
  3: styles.rank3,
};

const LeaderboardPage: React.FC = () => {
  const { user } = useUser();
  const [board, setBoard] = useState<Leaderboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>("accuracy");

  useEffect(() => {
    fetchLeaderboard()
      .then(setBoard)
      .catch((err) => {
        console.error("Failed to load leaderboard", err);
        setError("Impossible de charger le classement.");
      });
  }, []);

  const current = CATEGORIES.find((c) => c.id === category)!;
  // "?? []" : un back pas encore à jour ne renvoie pas le classement auteurs.
  const entries = board ? (board[category] ?? []) : [];
  const ownProfileId = user?.userProfile?.id;

  return (
    <div className="container page-fit page-md mt-5">
      <Card>
        <h1 className={styles.title}>Classement</h1>

        <div className={styles.tabs} role="tablist">
          {CATEGORIES.map((c) => (
            <Button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={c.id === category}
              variant={c.id === category ? "theme" : "outline-theme"}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </Button>
          ))}
        </div>

        {error && <Alert>{error}</Alert>}
        {!board && !error && <p className={styles.empty}>Chargement...</p>}

        {board && (
          <>
            <p className={styles.description}>{current.description(board)}</p>
            {entries.length === 0 ? (
              <p className={styles.empty}>Personne n'est encore classé ici.</p>
            ) : (
              <ol className={styles.list}>
                {entries.map((entry) => {
                  const sample = current.formatSample(entry);
                  return (
                    <li
                      key={entry.userProfileId}
                      className={`${styles.row} ${
                        entry.userProfileId === ownProfileId ? styles.rowMe : ""
                      }`}
                    >
                      <span
                        className={`${styles.rank} ${RANK_CLASS[entry.rank] ?? ""}`}
                      >
                        {entry.rank}
                      </span>
                      <span className={styles.avatar}>
                        <ProfileAvatar
                          avatar={entry.avatar}
                          pseudo={entry.pseudo}
                          size={36}
                        />
                      </span>
                      <div className={styles.player}>
                        <Link
                          to={`/profile/${entry.userProfileId}`}
                          className={styles.pseudo}
                        >
                          {entry.pseudo}
                          {entry.userProfileId === ownProfileId && " (vous)"}
                        </Link>
                        {sample && <div className={styles.sample}>{sample}</div>}
                      </div>
                      <span className={styles.value}>
                        {current.formatValue(entry)}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
            <p className={styles.updated}>
              Mis à jour à{" "}
              {new Date(board.computedAt).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              · actualisé toutes les 5 minutes
            </p>
          </>
        )}
      </Card>
    </div>
  );
};

export default LeaderboardPage;
