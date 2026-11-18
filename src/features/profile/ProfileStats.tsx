import React, { useEffect, useState } from "react";
import styles from "./ProfileStats.module.css";
import { fetchUserStats } from "../../services/userProfileApi";
import type { CategoryStat, UserStats } from "../../types/userStats";
import { getThemeLabel } from "../../utils/questionLabels";
import { getCivilisationLabel } from "../../data/civilizations";
import ProgressChart from "./ProgressChart";
import { computeBadges, isUnlocked } from "./badges";

/** Below this, a civilisation's accuracy is too noisy to call it a strength. */
const MIN_ANSWERS_FOR_RANKING = 3;
const CIVILISATIONS_SHOWN = 5;

const percent = (correct: number, total: number) =>
  total > 0 ? Math.round((correct / total) * 100) : 0;

const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const Tile: React.FC<{
  label: string;
  value: React.ReactNode;
  hint?: string;
}> = ({ label, value, hint }) => (
  <div className={styles.tile}>
    <div className={styles.tileValue}>{value}</div>
    {hint && <div className={styles.tileHint}>{hint}</div>}
    <div className={styles.tileLabel}>{label}</div>
  </div>
);

/** One horizontal bar per category: % of correct answers. */
const AccuracyBars: React.FC<{
  stats: CategoryStat[];
  getLabel: (key: string) => string;
  /** Hover text of a bar. */
  describe?: (stat: CategoryStat, label: string) => string;
}> = ({
  stats,
  getLabel,
  describe = (stat, label) =>
    `${label} : ${stat.correct} bonne(s) réponse(s) sur ${stat.answered}`,
}) => (
  <div className={styles.bars}>
    {stats.map((stat) => {
      const value = percent(stat.correct, stat.answered);
      const label = getLabel(stat.key);
      return (
        <div
          key={stat.key}
          className={styles.barRow}
          title={describe(stat, label)}
        >
          <span className={styles.barLabel}>{label}</span>
          <div
            className={styles.barTrack}
            role="meter"
            aria-label={`${label}, bonnes réponses`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={value}
          >
            <div className={styles.barFill} style={{ width: `${value}%` }} />
          </div>
          <span className={styles.barValue}>
            {value} %
            <span className={styles.barValueDetail}>
              {stat.correct}/{stat.answered}
            </span>
          </span>
        </div>
      );
    })}
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <section className={`p-3 rounded bg-theme ${styles.section}`}>
    <h2 className={styles.sectionTitle}>{title}</h2>
    {children}
  </section>
);

const CivilisationStats: React.FC<{ stats: CategoryStat[] }> = ({ stats }) => {
  const ranked = stats
    .filter((s) => s.answered >= MIN_ANSWERS_FOR_RANKING)
    .sort(
      (a, b) =>
        percent(b.correct, b.answered) - percent(a.correct, a.answered) ||
        b.answered - a.answered,
    );

  // Not enough data to split strengths / weaknesses: just list them all
  if (ranked.length < CIVILISATIONS_SHOWN * 2) {
    return <AccuracyBars stats={stats} getLabel={getCivilisationLabel} />;
  }

  return (
    <div className={styles.columns}>
      <div>
        <h3 className={styles.subTitle}>Points forts</h3>
        <AccuracyBars
          stats={ranked.slice(0, CIVILISATIONS_SHOWN)}
          getLabel={getCivilisationLabel}
        />
      </div>
      <div>
        <h3 className={styles.subTitle}>À travailler</h3>
        <AccuracyBars
          stats={ranked.slice(-CIVILISATIONS_SHOWN).reverse()}
          getLabel={getCivilisationLabel}
        />
      </div>
    </div>
  );
};

const BadgeList: React.FC<{ stats: UserStats }> = ({ stats }) => {
  const badges = computeBadges(stats);
  const unlockedCount = badges.filter(isUnlocked).length;
  return (
    <>
      <p className={styles.empty}>
        {unlockedCount} / {badges.length} débloqués
      </p>
      <div className={`${styles.badges} mt-2`}>
        {badges.map((badge) => {
          const unlocked = isUnlocked(badge);
          return (
            <div
              key={badge.id}
              className={`${styles.badge} ${unlocked ? styles.badgeUnlocked : ""}`}
              title={
                unlocked
                  ? `${badge.name} : débloqué`
                  : `${badge.name} : ${Math.min(badge.current, badge.target)} / ${badge.target}`
              }
            >
              <i
                className={`bi ${unlocked ? badge.icon : "bi-lock-fill"} ${styles.badgeIcon}`}
                aria-hidden="true"
              ></i>
              <span className={styles.badgeName}>{badge.name}</span>
              <span className={styles.badgeDescription}>
                {badge.description}
              </span>
              {!unlocked && (
                <div
                  className={styles.badgeProgress}
                  role="progressbar"
                  aria-label={`Progression ${badge.name}`}
                  aria-valuemin={0}
                  aria-valuemax={badge.target}
                  aria-valuenow={badge.current}
                >
                  <div
                    className={styles.badgeProgressFill}
                    style={{
                      width: `${percent(Math.min(badge.current, badge.target), badge.target)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

interface ProfileStatsProps {
  userProfileId: number;
  jwt?: string;
}

const ProfileStats: React.FC<ProfileStatsProps> = ({ userProfileId, jwt }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchUserStats(userProfileId, jwt)
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        console.error("Failed to load user stats", err);
        if (!cancelled) setError("Impossible de charger les statistiques.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userProfileId, jwt]);

  if (loading) {
    return (
      <p className="text-center bg-theme p-2 rounded">
        Chargement des statistiques...
      </p>
    );
  }
  if (error || !stats) {
    return (
      <p className="text-center bg-theme p-2 rounded text-danger">
        {error ?? "Statistiques indisponibles."}
      </p>
    );
  }

  const { overview, multiplayer, dailyRiddle, author, reviewer } = stats;
  const accuracy = percent(overview.correctAnswers, overview.questionsAnswered);

  return (
    <>
      <Section title="Vue d'ensemble">
        {overview.questionsAnswered === 0 ? (
          <p className={styles.empty}>Aucune question répondue pour le moment.</p>
        ) : (
          <div className={styles.tiles}>
            <Tile label="Questions répondues" value={overview.questionsAnswered} />
            <Tile
              label="Bonnes réponses"
              value={`${accuracy} %`}
              hint={`${overview.correctAnswers} / ${overview.questionsAnswered}`}
            />
            <Tile
              label="Temps de réponse moyen"
              value={`${overview.averageResponseTimeSeconds.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} s`}
            />
            <Tile label="Parties multijoueur" value={multiplayer.gamesPlayed} />
          </div>
        )}
      </Section>

      <Section title="Badges">
        <BadgeList stats={stats} />
      </Section>

      {stats.progress.some((week) => week.answered > 0) && (
        <Section title="Progression (12 dernières semaines)">
          <ProgressChart weeks={stats.progress} />
        </Section>
      )}

      {stats.byTheme.length > 0 && (
        <Section title="Par thème">
          <AccuracyBars stats={stats.byTheme} getLabel={getThemeLabel} />
        </Section>
      )}

      {stats.byCivilisation.length > 0 && (
        <Section title="Par civilisation">
          <CivilisationStats stats={stats.byCivilisation} />
        </Section>
      )}

      <Section title="Multijoueur">
        {multiplayer.gamesPlayed === 0 ? (
          <p className={styles.empty}>Aucune partie multijoueur jouée.</p>
        ) : (
          <>
            <div className={styles.tiles}>
              <Tile label="Parties" value={multiplayer.gamesPlayed} />
              <Tile
                label="Victoires"
                value={multiplayer.wins}
                hint={`${percent(multiplayer.wins, multiplayer.gamesPlayed)} % des parties`}
              />
              <Tile label="Podiums" value={multiplayer.podiums} />
              <Tile label="Meilleur score" value={`${multiplayer.bestPoints} pts`} />
              <Tile
                label="Précision moyenne"
                value={`${Math.round(multiplayer.averageAccuracy)} %`}
              />
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.games}>
                <caption className="visually-hidden">
                  Dernières parties multijoueur
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Classement</th>
                    <th scope="col">Points</th>
                    <th scope="col">Bonnes réponses</th>
                  </tr>
                </thead>
                <tbody>
                  {multiplayer.recentGames.map((game) => (
                    <tr key={game.gameSessionId}>
                      <td>{formatDate(game.playedAt)}</td>
                      <td
                        className={
                          game.rank === 1 && game.playerCount > 1
                            ? styles.rankWin
                            : undefined
                        }
                      >
                        {game.playerCount > 1
                          ? `${game.rank === 1 ? "1er" : `${game.rank}e`} / ${game.playerCount}`
                          : "Seul"}
                      </td>
                      <td>{game.points}</td>
                      <td>
                        {game.correctAnswers} / {game.totalQuestions}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Section>

      {dailyRiddle && (
        <Section title="Énigme du jour">
          <div className={styles.tiles}>
            <Tile label="Énigmes jouées" value={dailyRiddle.played} />
            <Tile
              label="Réussite"
              value={`${percent(dailyRiddle.won, dailyRiddle.played)} %`}
              hint={`${dailyRiddle.won} trouvée(s)`}
            />
            <Tile label="Série en cours" value={dailyRiddle.currentStreak} />
            <Tile label="Meilleure série" value={dailyRiddle.maxStreak} />
          </div>
          {dailyRiddle.won > 0 && (
            <div className="mt-3">
              <h3 className={styles.subTitle}>Trouvée en…</h3>
              <AccuracyBars
                stats={dailyRiddle.distribution.map((count, i) => ({
                  key: String(i + 1),
                  answered: dailyRiddle.won,
                  correct: count,
                }))}
                getLabel={(key) =>
                  `${key} tentative${key === "1" ? "" : "s"}`
                }
                describe={(stat, label) =>
                  `${stat.correct} énigme(s) trouvée(s) en ${label}`
                }
              />
            </div>
          )}
        </Section>
      )}

      {author && (
        <Section title="Auteur">
          <div className={styles.tiles}>
            <Tile label="Questions créées" value={author.created} />
            <Tile label="Validées" value={author.validated} />
            <Tile label="En relecture" value={author.inReview} />
            <Tile label="Refusées" value={author.rejected} />
          </div>
        </Section>
      )}

      {reviewer && (
        <Section title="Relecteur">
          <div className={styles.tiles}>
            <Tile
              label="Questions relues"
              value={reviewer.decisions}
              hint={`${reviewer.validated} validées · ${reviewer.rejected} rejetées`}
            />
            <Tile label="Questions corrigées" value={reviewer.modified} />
            <Tile label="Auteurs relus" value={reviewer.authorsHelped} />
          </div>
        </Section>
      )}
    </>
  );
};

export default ProfileStats;
