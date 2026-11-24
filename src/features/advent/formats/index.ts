import type React from "react";
import type { AdventDay } from "../../../types/advent";
import ChoiceAnswer from "./ChoiceAnswer";
import TextAnswer from "./TextAnswer";
import OrderAnswer from "./OrderAnswer";
import MatchAnswer from "./MatchAnswer";
import QuizAnswer from "./QuizAnswer";
import NumbersAnswer from "./NumbersAnswer";
import GridAnswer from "./GridAnswer";

export interface AnswerFormatProps {
  day: AdventDay;
  submitting: boolean;
  /** Un seul essai : n'appeler qu'une fois la réponse confirmée par le joueur. */
  onSubmit: (answer: string) => void;
  /** Ouvre une image en grand. */
  onZoom: (url: string) => void;
}

/**
 * Un composant de saisie par format de question (AdventQuestion.Format côté
 * back). Nouveau format = une entrée ici + la fabrique correspondante dans
 * AdventQuestion.java.
 */
export const ANSWER_FORMATS: Record<string, React.FC<AnswerFormatProps>> = {
  CHOICE: ChoiceAnswer,
  TEXT: TextAnswer,
  ORDER: OrderAnswer,
  MATCH: MatchAnswer,
  QUIZ: QuizAnswer,
  NUMBERS: NumbersAnswer,
  // Mêmes cases à cocher que le quiz, toujours en choix multiple
  SELECT: QuizAnswer,
  GRID: GridAnswer,
  // Réponse libre ; l'image (dézoomée à chaque erreur) est affichée par la fenêtre
  ZOOM: TextAnswer,
};
