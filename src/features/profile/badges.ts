import type { UserStats } from "../../types/userStats";
import { QUESTION_THEME_OPTIONS } from "../../utils/questionLabels";

export interface Badge {
  id: string;
  name: string;
  description: string;
  /** Bootstrap icon class. */
  icon: string;
  /** Current value and target: unlocked when current >= target. */
  current: number;
  target: number;
}

/**
 * Badges derived from the public stats: nothing is stored, so a badge
 * unlocks as soon as the stat reaches its target.
 */
export const computeBadges = (stats: UserStats): Badge[] => {
  const { overview, multiplayer, dailyRiddle, author } = stats;
  const answeredThemes = stats.byTheme.filter((t) => t.answered > 0).length;

  return [
    {
      id: "first-steps",
      name: "Premiers pas",
      description: "Répondre à 10 questions",
      icon: "bi-flag-fill",
      current: overview.questionsAnswered,
      target: 10,
    },
    {
      id: "centurion",
      name: "Centurion",
      description: "Répondre à 100 questions",
      icon: "bi-shield-fill",
      current: overview.questionsAnswered,
      target: 100,
    },
    {
      id: "scholar",
      name: "Érudit",
      description: "Répondre à 1 000 questions",
      icon: "bi-book-fill",
      current: overview.questionsAnswered,
      target: 1000,
    },
    {
      id: "sharpshooter",
      name: "Fine gâchette",
      description: "500 bonnes réponses",
      icon: "bi-bullseye",
      current: overview.correctAnswers,
      target: 500,
    },
    {
      id: "all-rounder",
      name: "Touche-à-tout",
      description: "Répondre à des questions de tous les thèmes",
      icon: "bi-grid-3x3-gap-fill",
      current: answeredThemes,
      target: QUESTION_THEME_OPTIONS.length,
    },
    {
      id: "first-win",
      name: "Première victoire",
      description: "Gagner une partie multijoueur",
      icon: "bi-trophy-fill",
      current: multiplayer.wins,
      target: 1,
    },
    {
      id: "conqueror",
      name: "Conquérant",
      description: "Gagner 10 parties multijoueur",
      icon: "bi-award-fill",
      current: multiplayer.wins,
      target: 10,
    },
    {
      id: "flawless",
      name: "Sans faute",
      description: "Une partie multijoueur sans aucune erreur",
      icon: "bi-stars",
      current: multiplayer.perfectGames,
      target: 1,
    },
    {
      id: "riddle-week",
      name: "Assidu",
      description: "Trouver l'énigme du jour 7 jours de suite",
      icon: "bi-calendar-check-fill",
      current: dailyRiddle?.maxStreak ?? 0,
      target: 7,
    },
    {
      id: "riddle-month",
      name: "Oracle",
      description: "Trouver l'énigme du jour 30 jours de suite",
      icon: "bi-eye-fill",
      current: dailyRiddle?.maxStreak ?? 0,
      target: 30,
    },
    {
      id: "first-draft",
      name: "Plume",
      description: "Proposer une première question",
      icon: "bi-feather",
      current: author?.created ?? 0,
      target: 1,
    },
    {
      id: "author",
      name: "Chroniqueur",
      description: "Avoir une question validée",
      icon: "bi-pencil-fill",
      current: author?.validated ?? 0,
      target: 1,
    },
    {
      id: "historian",
      name: "Historien",
      description: "Avoir 25 questions validées",
      icon: "bi-journal-richtext",
      current: author?.validated ?? 0,
      target: 25,
    },
    {
      id: "archivist",
      name: "Grand archiviste",
      description: "Avoir 100 questions validées",
      icon: "bi-archive-fill",
      current: author?.validated ?? 0,
      target: 100,
    },
    {
      id: "encyclopedist",
      name: "Encyclopédiste",
      description: "Avoir une question validée dans chaque thème",
      icon: "bi-collection-fill",
      current: author?.validatedThemes ?? 0,
      target: QUESTION_THEME_OPTIONS.length,
    },
    {
      id: "ambassador",
      name: "Ambassadeur",
      description: "Avoir des questions validées sur 10 civilisations",
      icon: "bi-globe2",
      current: author?.validatedCivilisations ?? 0,
      target: 10,
    },
    {
      id: "illustrator",
      name: "Illustrateur",
      description: "Avoir 5 questions image ou son validées",
      icon: "bi-palette-fill",
      current: author?.validatedMedia ?? 0,
      target: 5,
    },
    {
      id: "well-read",
      name: "Auteur lu",
      description: "Tes questions ont reçu 100 réponses d'autres joueurs",
      icon: "bi-people-fill",
      current: author?.timesAnswered ?? 0,
      target: 100,
    },
    {
      id: "best-seller",
      name: "Best-seller",
      description: "Tes questions ont reçu 1 000 réponses d'autres joueurs",
      icon: "bi-fire",
      current: author?.timesAnswered ?? 0,
      target: 1000,
    },
  ];
};

export const isUnlocked = (badge: Badge) => badge.current >= badge.target;
