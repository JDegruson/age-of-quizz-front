import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://ageofquizz.fr";
const SITE_NAME = "Age of Quizz";
const DEFAULT_TITLE = `${SITE_NAME} – Le quiz Age of Empires 2`;

/** Title per route (first match wins); unknown routes keep the default. */
const TITLES: [RegExp, string][] = [
  [/^\/$/, DEFAULT_TITLE],
  [/^\/quizz\/solo$/, "Quiz solo Age of Empires 2"],
  [/^\/quiz$/, "Partie en cours"],
  [/^\/(create|join)-room$/, "Quiz multijoueur entre amis"],
  [/^\/daily-riddle$/, "Énigme du jour Age of Empires 2"],
  [/^\/daily-riddle-admin$/, "Admin des énigmes"],
  [/^\/advent$/, "Calendrier de l'avent"],
  [/^\/leaderboard$/, "Classement des joueurs"],
  [/^\/profile(\/\d+)?$/, "Profil joueur"],
  [/^\/become-author$/, "Devenir auteur"],
  [/^\/create-question/, "Créer une question"],
  [/^\/review-questions$/, "Révision des questions"],
  [/^\/login$/, "Connexion"],
  [/^\/register$/, "Inscription"],
];

/**
 * Keeps the tab title and the canonical URL in sync with the current route,
 * so each page is listed under its own title by search engines.
 */
const PageMeta: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const match = TITLES.find(([pattern]) => pattern.test(pathname));
    const title = match ? match[1] : DEFAULT_TITLE;
    document.title = title === DEFAULT_TITLE ? title : `${title} | ${SITE_NAME}`;

    const canonical = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (canonical) {
      canonical.href = `${SITE_URL}${pathname === "/" ? "/" : pathname}`;
    }
  }, [pathname]);

  return null;
};

export default PageMeta;
