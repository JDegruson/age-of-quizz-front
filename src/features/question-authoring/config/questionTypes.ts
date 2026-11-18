/**
 * Declarative description of the 4 question-creation forms
 * (CreateMultipleChoice / CreateTrueFalse / CreateImageQuestion /
 * CreateSoundQuestion). These pages used to be 4 separate, ~90% identical
 * files; CreateQuestionPage now renders all of them from one of these
 * configs.
 *
 * Every field differing between the original pages is captured here,
 * *including* a couple of inconsistencies the original code had (see the
 * comments below) — this refactor doesn't silently change behaviour.
 */

export type ThemeFieldConfig =
  | { visible: true; options: string[] }
  | { visible: false; fixedValue: string };

export type TitleFieldConfig =
  | {
      mode: "input";
      label: string;
      placeholder: string;
      requiredMessage: string;
    }
  | { mode: "fixed"; value: string };

export interface MediaFieldConfig {
  kind: "image" | "audio";
  label: string;
  missingMessage: string;
}

export type AnswersFieldConfig =
  | {
      mode: "list";
      initialCount: number;
      /** Minimum number of non-empty answers (partial fill allowed above this). */
      minAnswers?: number;
      /** Exact number of non-empty answers required (no partial fill). */
      exactAnswers?: number;
      tooFewMessage: string;
      requireCorrectSelection: boolean;
      noCorrectMessage: string;
    }
  | { mode: "true-false" };

export interface QuestionTypeConfig {
  type: "MULTIPLE" | "TRUE_FALSE" | "IMAGE" | "SOUND";
  heading: string;
  savingLabel: string;
  theme: ThemeFieldConfig;
  title: TitleFieldConfig;
  explicationPlaceholder: string;
  media?: MediaFieldConfig;
  answers: AnswersFieldConfig;
  /** Whether a successful submit clears the explication field. */
  resetExplication: boolean;
  /** Whether a successful submit resets the theme back to its default. */
  resetTheme: boolean;
}

const THEME_OPTIONS = ["TECH_TREE", "UNIT_STATS", "CULTURE", "SHORTCUTS"];

const NO_CORRECT_ANSWER_MESSAGE =
  "Au moins une bonne réponse doit être sélectionnée";

export const multipleChoiceConfig: QuestionTypeConfig = {
  type: "MULTIPLE",
  heading: "Créer une question — QCM",
  savingLabel: "Enregistrement...",
  theme: { visible: true, options: THEME_OPTIONS },
  title: {
    mode: "input",
    label: "Titre",
    placeholder: "Qu'est ce qui est petit et marron ?",
    requiredMessage: "Le titre est requis",
  },
  explicationPlaceholder: "Explication optionnelle pour les bonnes réponses",
  answers: {
    mode: "list",
    initialCount: 4,
    minAnswers: 2,
    tooFewMessage: "Au moins 2 réponses sont requises",
    requireCorrectSelection: true,
    noCorrectMessage: NO_CORRECT_ANSWER_MESSAGE,
  },
  resetExplication: true,
  resetTheme: false,
};

export const trueFalseConfig: QuestionTypeConfig = {
  type: "TRUE_FALSE",
  heading: "Créer une question — Vrai / Faux",
  savingLabel: "Enregistrement...",
  theme: { visible: true, options: THEME_OPTIONS },
  title: {
    mode: "input",
    label: "Question",
    placeholder: "Entrez votre question...",
    requiredMessage: "La question est requise",
  },
  explicationPlaceholder: "Explication optionnelle",
  answers: { mode: "true-false" },
  resetExplication: true,
  resetTheme: false,
};

export const imageQuestionConfig: QuestionTypeConfig = {
  type: "IMAGE",
  heading: "Créer une question — Identification d'image",
  savingLabel: "Upload en cours...",
  theme: { visible: true, options: THEME_OPTIONS },
  title: { mode: "fixed", value: "A quoi correspond cette image" },
  explicationPlaceholder: "Explication optionnelle...",
  media: {
    kind: "image",
    label: "Image",
    missingMessage: "L'image est requise",
  },
  answers: {
    mode: "list",
    initialCount: 4,
    exactAnswers: 4,
    tooFewMessage: "Les 4 réponses sont requises",
    requireCorrectSelection: true,
    noCorrectMessage: NO_CORRECT_ANSWER_MESSAGE,
  },
  resetExplication: true,
  resetTheme: false,
};

export const soundQuestionConfig: QuestionTypeConfig = {
  type: "SOUND",
  heading: "Créer une question — Identification de son",
  savingLabel: "Upload en cours...",
  theme: { visible: true, options: THEME_OPTIONS },
  title: { mode: "fixed", value: "A quoi correspond ce son" },
  explicationPlaceholder: "Explication optionnelle...",
  media: {
    kind: "audio",
    label: "Fichier audio",
    missingMessage: "Le fichier audio est requis",
  },
  answers: {
    mode: "list",
    initialCount: 4,
    exactAnswers: 4,
    tooFewMessage: "Les 4 réponses sont requises",
    requireCorrectSelection: true,
    noCorrectMessage: NO_CORRECT_ANSWER_MESSAGE,
  },
  resetExplication: true,
  resetTheme: false,
};
