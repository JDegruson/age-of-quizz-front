import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Alert from "../../components/ui/Alert";
import Spinner from "../../components/ui/Spinner";
import LinkButton from "../../components/ui/LinkButton";
import AdventDoor from "./components/AdventDoor";
import AdventDayModal from "./components/AdventDayModal";
import AdventLeaderboard from "./components/AdventLeaderboard";
import Snowfall from "./components/Snowfall";
import { adventErrorMessage, useAdventCalendar } from "./hooks/useAdventCalendar";
import { resetAdventPreview } from "../../services/adventApi";
import Button from "../../components/ui/Button";
import styles from "./AdventCalendar.module.css";

/** Ordre d'affichage des cases, mélangé comme sur un vrai calendrier. */
const LAYOUT = [
  13, 7, 21, 2, 18, 10, 4, 24, 15, 9, 1, 20, 6, 12, 23, 3, 17, 11, 19, 5, 14,
  22, 8, 16,
];
/** Cases plus grandes que les autres. */
const BIG_DAYS = new Set([24, 1, 12]);

const dateLabel = (iso: string, offsetDays = 0) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + offsetDays)).toLocaleDateString(
    "fr-FR",
    { day: "numeric", month: "long", timeZone: "UTC" },
  );
};

const AdventCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { calendar, leaderboard, loading, error, jwt, reload } =
    useAdventCalendar();
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleResetPreview = async () => {
    if (!jwt || !window.confirm("Effacer toutes tes réponses de test ?")) return;
    setResetting(true);
    setResetError(null);
    try {
      await resetAdventPreview(jwt);
      await reload();
    } catch (e) {
      setResetError(adventErrorMessage(e, "Impossible d'effacer tes réponses."));
    } finally {
      setResetting(false);
    }
  };

  if (loading && !calendar) {
    return (
      <div className="text-center mt-5">
        <Spinner />
      </div>
    );
  }

  if (!calendar) {
    return (
      <div className="container page-md mt-5">
        <Alert>{error ?? "Le calendrier est indisponible."}</Alert>
      </div>
    );
  }

  if (!calendar.active) {
    const upcoming = calendar.today < calendar.startDate;
    return (
      <div className={styles.page}>
        <Snowfall />
        <div className={styles.closed}>
          <i className={`bi bi-gift ${styles.closedIcon}`} aria-hidden="true"></i>
          <h1 className={styles.title}>Calendrier de l'avent</h1>
          <p className={styles.subtitle}>
            {upcoming
              ? `Patience ! La première case s'ouvre le ${dateLabel(calendar.startDate)}.`
              : "Le calendrier est refermé pour cette année. Merci d'avoir joué, à l'année prochaine !"}
          </p>
          <LinkButton to="/" className="rounded-pill">
            Retour à l'accueil
          </LinkButton>
        </div>
      </div>
    );
  }

  const byDay = new Map(calendar.days.map((d) => [d.day, d]));
  // Case du jour (aucune après la dernière, pendant la période de rattrapage).
  const todayIndex =
    Math.round(
      (Date.parse(calendar.today) - Date.parse(calendar.startDate)) / 86400000,
    ) + 1;
  const isLoggedIn = !!jwt;

  const handleOpen = (day: number) => {
    if (!isLoggedIn) {
      navigate("/login", {
        state: {
          message: "Connecte-toi pour ouvrir les cases du calendrier de l'avent.",
          from: location.pathname,
        },
      });
      return;
    }
    setOpenDay(day);
  };

  return (
    <div className={styles.page}>
      <Snowfall />
      <div className={styles.garland} aria-hidden="true">
        {Array.from({ length: 18 }, (_, i) => (
          <span key={i} className={styles.bulb} />
        ))}
      </div>

      <header className={styles.header}>
        <h1 className={styles.title}>
          <i className="bi bi-tree-fill me-2" aria-hidden="true"></i>
          Calendrier de l'avent
        </h1>
        <p className={styles.subtitle}>
          Une question spéciale chaque jour jusqu'au {dateLabel(calendar.startDate, calendar.totalDays - 1)}.
          Un seul essai par case (sauf mention contraire dans la question), et
          tu peux rattraper les jours manqués.
        </p>
        <p className={styles.credits}>
          <i className="bi bi-heart-fill me-1" aria-hidden="true"></i>
          Questions préparées avec l'aide de <strong>Drasah</strong>. Merci !
        </p>
        {calendar.preview && (
          <div className={styles.preview} role="note">
            <p className="mb-2">
              <i className="bi bi-tools me-2" aria-hidden="true"></i>
              <strong>Mode test admin</strong> : toutes les cases sont ouvertes,
              même avant le début de l'event. Tes réponses ne comptent pas au
              classement.
            </p>
            <Button
              variant="outline-light"
              className="btn-sm rounded-pill"
              onClick={handleResetPreview}
              loading={resetting}
              loadingLabel="Effacement..."
            >
              Effacer mes réponses de test
            </Button>
            {resetError && <p className="mt-2 mb-0">{resetError}</p>}
          </div>
        )}
        {isLoggedIn && calendar.score !== null ? (
          <p className={styles.score}>
            <i className="bi bi-star-fill me-2" aria-hidden="true"></i>
            {calendar.score} bonne{calendar.score > 1 ? "s" : ""} réponse
            {calendar.score > 1 ? "s" : ""} · {calendar.answeredCount}/
            {calendar.unlockedDays} case{calendar.unlockedDays > 1 ? "s" : ""}{" "}
            ouverte{(calendar.answeredCount ?? 0) > 1 ? "s" : ""}
          </p>
        ) : null}
        {isLoggedIn && calendar.jokers ? (
          <p className={styles.jokers}>
            <span className={styles.jokerCount}>
              <i className="bi bi-magic me-2" aria-hidden="true"></i>
              {calendar.jokers.available} joker
              {calendar.jokers.available > 1 ? "s" : ""}
            </span>
            <span>
              Prochain joker dans {calendar.jokers.nextJokerIn} question
              {calendar.jokers.nextJokerIn > 1 ? "s" : ""} de{" "}
              <Link to="/quizz/solo">quiz</Link> (1 joker toutes les{" "}
              {calendar.jokers.questionsPerJoker} questions jouées). Un joker
              permet de rejouer une case ratée.
            </span>
          </p>
        ) : null}
        {!isLoggedIn && (
          <p className={styles.score}>
            <i className="bi bi-person-fill me-2" aria-hidden="true"></i>
            Connecte-toi pour ouvrir les cases et entrer au classement.
          </p>
        )}
      </header>

      {error && <Alert className="mx-auto" style={{ maxWidth: 640 }}>{error}</Alert>}

      <div className={styles.layout}>
        <div className={styles.grid}>
          {LAYOUT.filter((day) => day <= calendar.totalDays).map((day) => {
            const summary = byDay.get(day);
            if (!summary) return null;
            return (
              <AdventDoor
                key={day}
                summary={summary}
                big={BIG_DAYS.has(day)}
                isToday={day === todayIndex}
                unlockLabel={dateLabel(calendar.startDate, day - 1)}
                onOpen={handleOpen}
              />
            );
          })}
        </div>

        <AdventLeaderboard
          entries={leaderboard}
          totalDays={calendar.totalDays}
        />
      </div>

      {openDay !== null && jwt && (
        <AdventDayModal
          dayNumber={openDay}
          jwt={jwt}
          jokers={calendar.jokers}
          onClose={() => setOpenDay(null)}
          onAnswered={reload}
        />
      )}
    </div>
  );
};

export default AdventCalendarPage;
