import React, { useEffect, useState } from "react";
import Logo from "../components/Logo";
import LinkButton from "../components/ui/LinkButton";
import { fetchAdventCalendar } from "../services/adventApi";
import styles from "./Home.module.css";

/** Bannière du calendrier de l'avent, seulement pendant l'event. */
const AdventBanner: React.FC = () => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchAdventCalendar()
      .then((calendar) => !cancelled && setActive(calendar.active))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!active) return null;

  return (
    <section className={styles.advent}>
      <i className={`bi bi-gift-fill ${styles.adventIcon}`} aria-hidden="true"></i>
      <div className={styles.adventText}>
        <h2 className={styles.adventTitle}>Calendrier de l'avent</h2>
        <p className="mb-0">
          Une question spéciale de Noël à débloquer chaque jour !
        </p>
      </div>
      <LinkButton to="/advent" className="rounded-pill">
        <i className="bi bi-stars me-2" aria-hidden="true"></i>
        Ouvrir une case
      </LinkButton>
    </section>
  );
};

const Home: React.FC = () => {
  return (
    <div className="container mt-4 mb-5" style={{ maxWidth: 960 }}>
      <div className={styles.hero}>
        <Logo size="large" />
        <p className={styles.tagline}>
          Testez vos connaissances sur Age of Empires 2
        </p>
      </div>

      <AdventBanner />

      <div className={styles.modes}>
        <section className={styles.mode}>
          <i className={`bi bi-person-fill ${styles.modeIcon}`} aria-hidden="true"></i>
          <h2 className={styles.modeTitle}>Solo</h2>
          <p className={styles.modeText}>
            Choisis ton thème, ta civilisation et le nombre de questions.
          </p>
          <div className={styles.modeActions}>
            <LinkButton to="/quizz/solo" className="btn-lg rounded-pill">
              <i className="bi bi-play-fill me-2" aria-hidden="true"></i>
              Jouer en solo
            </LinkButton>
          </div>
        </section>

        <section className={styles.mode}>
          <i className={`bi bi-people-fill ${styles.modeIcon}`} aria-hidden="true"></i>
          <h2 className={styles.modeTitle}>Multijoueur</h2>
          <p className={styles.modeText}>
            Affronte tes amis en temps réel dans une salle privée.
          </p>
          <div className={styles.modeActions}>
            <LinkButton to="/create-room" className="btn-lg rounded-pill">
              <i className="bi bi-plus-lg me-2" aria-hidden="true"></i>
              Créer une salle
            </LinkButton>
            <LinkButton
              to="/join-room"
              variant="outline-theme"
              className="rounded-pill"
            >
              <i className="bi bi-box-arrow-in-right me-2" aria-hidden="true"></i>
              Rejoindre une salle
            </LinkButton>
          </div>
        </section>

        <section className={styles.mode}>
          <i className={`bi bi-question-diamond-fill ${styles.modeIcon}`} aria-hidden="true"></i>
          <h2 className={styles.modeTitle}>Énigme du jour</h2>
          <p className={styles.modeText}>
            Une civilisation ou une unité à deviner chaque jour, avec des indices.
          </p>
          <div className={styles.modeActions}>
            <LinkButton to="/daily-riddle" className="btn-lg rounded-pill">
              <i className="bi bi-lightbulb-fill me-2" aria-hidden="true"></i>
              Résoudre l'énigme
            </LinkButton>
          </div>
        </section>
      </div>

      <div className={styles.secondary}>
        <LinkButton to="/leaderboard" variant="outline-theme" className="rounded-pill">
          <i className="bi bi-trophy-fill me-2" aria-hidden="true"></i>
          Voir le classement
        </LinkButton>
      </div>
    </div>
  );
};

export default Home;
