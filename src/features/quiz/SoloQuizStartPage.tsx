import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import BACKEND_URL from "../../config";

import { BUILDING_LABELS, BUILDING_OPTIONS } from "../../data/buildings";
import { getCivilisationLabel } from "../../data/civilizations";
import CivilisationSelect from "../../components/CivilisationSelect";
import {
  QUESTION_THEME_OPTIONS,
  getThemeLabel,
} from "../../utils/questionLabels";
import { useQuestionAuthors } from "../../hooks/useQuestionAuthors";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import styles from "./SoloQuizStartPage.module.css";

const TECH_TREE_THEME = "TECH_TREE";
const ANY_CIVILISATION = [{ value: "", label: "Toutes les civilisations" }];
const QUESTION_COUNTS = [10, 20, 40, 60];
const MIN_QUESTIONS = 1;
const MAX_QUESTIONS = 100;
const QUICK_GAME_QUESTIONS = 20;
const STORAGE_KEY = "solo_quiz_settings";

const THEME_ICONS: Record<string, string> = {
  TECH_TREE: "bi-diagram-3",
  IMAGE: "bi-image",
  UNIT_STATS: "bi-bar-chart",
  SOUND: "bi-volume-up",
  CULTURE: "bi-book",
  SHORTCUTS: "bi-keyboard",
  CAMPAIGN: "bi-flag",
};

interface SoloSettings {
  numberOfQuestions: number;
  unlimitedTime: boolean;
  /** null = tous les thèmes / toutes les civs / tous les bâtiments. */
  theme: string | null;
  civilisation: string | null;
  building: string | null;
  authorUsername: string | null;
  excludeTechTree: boolean;
}

const DEFAULT_SETTINGS: SoloSettings = {
  numberOfQuestions: QUICK_GAME_QUESTIONS,
  unlimitedTime: false,
  theme: null,
  civilisation: null,
  building: null,
  authorUsername: null,
  excludeTechTree: false,
};

const clampCount = (value: number) =>
  Math.max(MIN_QUESTIONS, Math.min(MAX_QUESTIONS, Math.round(value)));

const hasSavedSettings = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
};

/** Last settings used, so a player doesn't redo their choices every time. */
const loadSettings = (): SoloSettings => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const saveSettings = (settings: SoloSettings) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage unavailable (private mode...): settings just won't be remembered
  }
};

const Chip: React.FC<{
  selected: boolean;
  onClick: () => void;
  icon?: string;
  children: React.ReactNode;
}> = ({ selected, onClick, icon, children }) => (
  <button
    type="button"
    className={`${styles.chip} ${selected ? styles.chipSelected : ""}`}
    aria-pressed={selected}
    onClick={onClick}
  >
    {icon && !selected && <i className={`bi ${icon}`} aria-hidden="true"></i>}
    {children}
  </button>
);

const describe = (s: SoloSettings) => {
  const parts = [
    `${s.numberOfQuestions} question${s.numberOfQuestions > 1 ? "s" : ""}`,
    s.unlimitedTime ? "temps illimité" : "15 s par question",
    s.theme ? getThemeLabel(s.theme) : "tous les thèmes",
  ];
  if (s.civilisation) parts.push(getCivilisationLabel(s.civilisation));
  if (s.building) parts.push(BUILDING_LABELS[s.building] || s.building);
  if (s.authorUsername) parts.push(`par ${s.authorUsername}`);
  if (s.excludeTechTree) parts.push("sans arbre des technologies");
  return parts.join(" · ");
};

const SoloQuizStartPage: React.FC = () => {
  const navigate = useNavigate();
  // Deux écrans : le choix du mode, puis la personnalisation (?mode=custom,
  // pour que le retour du navigateur ramène au choix).
  const [searchParams, setSearchParams] = useSearchParams();
  const isCustom = searchParams.get("mode") === "custom";
  const [settings, setSettings] = useState<SoloSettings>(loadSettings);
  const [hasSaved] = useState(hasSavedSettings);
  const authors = useQuestionAuthors();
  const [countDraft, setCountDraft] = useState(
    String(settings.numberOfQuestions),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (patch: Partial<SoloSettings>) =>
    setSettings((s) => ({ ...s, ...patch }));

  const setCount = (value: number) => {
    const next = clampCount(value);
    update({ numberOfQuestions: next });
    setCountDraft(String(next));
  };

  const commitCountDraft = () => {
    const parsed = Number(countDraft);
    if (countDraft.trim() === "" || !Number.isFinite(parsed)) {
      setCountDraft(String(settings.numberOfQuestions));
      return;
    }
    setCount(parsed);
  };

  const toggleExcludeTechTree = (checked: boolean) =>
    update({
      excludeTechTree: checked,
      // Thème choisi et thème exclu ne peuvent pas être le même.
      theme: checked && settings.theme === TECH_TREE_THEME ? null : settings.theme,
    });

  const start = async (chosen: SoloSettings) => {
    setLoading(true);
    setError("");
    try {
      // Pas de filtre = champ absent : le back filtre sinon sur la valeur
      // exacte (ex. civilisation "NONE" = questions sans civilisation).
      const res = await axios.post(`${BACKEND_URL}/questions/quizz`, {
        numberOfQuestions: chosen.numberOfQuestions,
        theme: chosen.theme ?? undefined,
        civilisation: chosen.civilisation ?? undefined,
        building: chosen.building ?? undefined,
        authorUsername: chosen.authorUsername ?? undefined,
        excludedThemes: chosen.excludeTechTree ? [TECH_TREE_THEME] : undefined,
      });
      navigate("/quiz", {
        state: { questions: res.data, unlimitedTime: chosen.unlimitedTime },
      });
    } catch (err) {
      setError("Impossible de récupérer les questions. Réessaie dans un instant.");
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(settings);
    start(settings);
  };

  const hasFilters =
    settings.theme !== null ||
    settings.civilisation !== null ||
    settings.building !== null ||
    settings.authorUsername !== null ||
    settings.excludeTechTree;

  return (
    <div className="container page-fit mt-4">
      <Card className={styles.page}>
        {!isCustom ? (
          <>
            <h1 className={styles.title}>Quizz solo</h1>
            <p className={styles.subtitle}>Comment veux-tu jouer ?</p>

            <div className={styles.modes}>
              <div className={`${styles.modeCard} ${styles.modeQuick}`}>
                <i
                  className={`bi bi-lightning-charge-fill ${styles.modeIcon}`}
                  aria-hidden="true"
                ></i>
                <h2 className={styles.modeTitle}>Partie rapide</h2>
                <p className={styles.modeText}>
                  {QUICK_GAME_QUESTIONS} questions au hasard sur tous les
                  thèmes, 15 secondes chacune.
                </p>
                <Button
                  type="button"
                  disabled={loading}
                  className="w-100 rounded-pill"
                  onClick={() => start(DEFAULT_SETTINGS)}
                >
                  {loading ? (
                    "Chargement..."
                  ) : (
                    <>
                      <i className="bi bi-play-fill me-1" aria-hidden="true"></i>
                      Jouer
                    </>
                  )}
                </Button>
              </div>

              <div className={styles.modeCard}>
                <i
                  className={`bi bi-sliders ${styles.modeIcon}`}
                  aria-hidden="true"
                ></i>
                <h2 className={styles.modeTitle}>Quizz personnalisé</h2>
                <p className={styles.modeText}>
                  Choisis le nombre de questions, le temps, le thème, la
                  civilisation, le bâtiment ou l'auteur.
                </p>
                {hasSaved && (
                  <p className={styles.modeLast}>
                    Derniers réglages : {describe(settings)}
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline-theme"
                  disabled={loading}
                  className="w-100 rounded-pill"
                  onClick={() => setSearchParams({ mode: "custom" })}
                >
                  <i className="bi bi-gear me-1" aria-hidden="true"></i>
                  Personnaliser
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              className={styles.back}
              onClick={() => setSearchParams({})}
            >
              <i className="bi bi-arrow-left" aria-hidden="true"></i>
              Retour
            </button>
            <h1 className={styles.title}>Quizz personnalisé</h1>
            <p className={styles.subtitle}>
              Compose ta partie, tes réglages sont mémorisés pour la prochaine
              fois.
            </p>

            <form onSubmit={handleSubmit}>
              <fieldset className={styles.group}>
                <legend className={styles.legend}>
                  <i className="bi bi-list-ol" aria-hidden="true"></i>
                  Nombre de questions
                </legend>
                <div className={styles.chips}>
                  {QUESTION_COUNTS.map((count) => (
                    <Chip
                      key={count}
                      selected={settings.numberOfQuestions === count}
                      onClick={() => setCount(count)}
                    >
                      {count}
                    </Chip>
                  ))}
                  <div className={styles.stepper}>
                    <button
                      type="button"
                      aria-label="Une question de moins"
                      disabled={settings.numberOfQuestions <= MIN_QUESTIONS}
                      onClick={() => setCount(settings.numberOfQuestions - 1)}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={MIN_QUESTIONS}
                      max={MAX_QUESTIONS}
                      aria-label="Nombre de questions"
                      value={countDraft}
                      onChange={(e) => setCountDraft(e.target.value)}
                      onBlur={commitCountDraft}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          commitCountDraft();
                        }
                      }}
                    />
                    <button
                      type="button"
                      aria-label="Une question de plus"
                      disabled={settings.numberOfQuestions >= MAX_QUESTIONS}
                      onClick={() => setCount(settings.numberOfQuestions + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </fieldset>

              <fieldset className={styles.group}>
                <legend className={styles.legend}>
                  <i className="bi bi-stopwatch" aria-hidden="true"></i>
                  Temps par question
                </legend>
                <div className={styles.chips}>
                  <Chip
                    selected={!settings.unlimitedTime}
                    onClick={() => update({ unlimitedTime: false })}
                    icon="bi-hourglass-split"
                  >
                    15 secondes
                  </Chip>
                  <Chip
                    selected={settings.unlimitedTime}
                    onClick={() => update({ unlimitedTime: true })}
                    icon="bi-infinity"
                  >
                    Illimité
                  </Chip>
                </div>
                {settings.unlimitedTime && (
                  <p className={styles.hint}>
                    Prends ton temps : plus tu réponds vite, plus tu marques de
                    points.
                  </p>
                )}
              </fieldset>

              <fieldset className={styles.group}>
                <legend className={styles.legend}>
                  <i className="bi bi-tags" aria-hidden="true"></i>
                  Thème
                </legend>
                <div className={styles.chips}>
                  <Chip
                    selected={settings.theme === null}
                    onClick={() => update({ theme: null })}
                    icon="bi-shuffle"
                  >
                    Tous
                  </Chip>
                  {QUESTION_THEME_OPTIONS.filter(
                    (value) =>
                      !(settings.excludeTechTree && value === TECH_TREE_THEME),
                  ).map((value) => (
                    <Chip
                      key={value}
                      selected={settings.theme === value}
                      onClick={() => update({ theme: value })}
                      icon={THEME_ICONS[value]}
                    >
                      {getThemeLabel(value)}
                    </Chip>
                  ))}
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    role="switch"
                    className="form-check-input m-0"
                    checked={settings.excludeTechTree}
                    onChange={(e) => toggleExcludeTechTree(e.target.checked)}
                  />
                  Exclure les questions sur l'arbre des technologies
                </label>
              </fieldset>

              <fieldset className={styles.group}>
                <legend className={styles.legend}>
                  <i className="bi bi-funnel" aria-hidden="true"></i>
                  Filtres
                  <span className={styles.chipSmall}>(facultatifs)</span>
                </legend>
                <div className={styles.filters}>
                  <div>
                    <label htmlFor="solo-civilisation" className="form-label">
                      Civilisation
                    </label>
                    <CivilisationSelect
                      id="solo-civilisation"
                      value={settings.civilisation ?? ""}
                      onChange={(value) => update({ civilisation: value || null })}
                      extraOptions={ANY_CIVILISATION}
                    />
                  </div>
                  <div>
                    <label htmlFor="solo-building" className="form-label">
                      Bâtiment
                    </label>
                    <select
                      id="solo-building"
                      className="form-select"
                      value={settings.building ?? ""}
                      onChange={(e) => update({ building: e.target.value || null })}
                    >
                      <option value="">Tous les bâtiments</option>
                      {BUILDING_OPTIONS.filter((o) => o.value !== "NONE").map(
                        (option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="solo-author" className="form-label">
                      Auteur
                    </label>
                    <select
                      id="solo-author"
                      className="form-select"
                      value={settings.authorUsername ?? ""}
                      onChange={(e) =>
                        update({ authorUsername: e.target.value || null })
                      }
                    >
                      <option value="">Tous les auteurs</option>
                      {/* Auteur mémorisé qui n'a plus de question validée */}
                      {settings.authorUsername &&
                        !authors.includes(settings.authorUsername) && (
                          <option value={settings.authorUsername}>
                            {settings.authorUsername}
                          </option>
                        )}
                      {authors.map((author) => (
                        <option key={author} value={author}>
                          {author}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {hasFilters && (
                  <p className={styles.hint}>
                    S'il n'y a pas assez de questions correspondantes, la partie est
                    complétée avec des questions au hasard.
                  </p>
                )}
              </fieldset>

              <div className={styles.summary}>
                <p className={styles.summaryText} aria-live="polite">
                  {describe(settings)}
                </p>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-100 btn-lg rounded-pill"
                >
                  {loading ? (
                    "Chargement..."
                  ) : (
                    <>
                      <i className="bi bi-play-fill me-1" aria-hidden="true"></i>
                      Lancer le quizz
                    </>
                  )}
                </Button>
                {hasFilters && (
                  <button
                    type="button"
                    className={styles.reset}
                    onClick={() =>
                      update({
                        theme: null,
                        civilisation: null,
                        building: null,
                        authorUsername: null,
                        excludeTechTree: false,
                      })
                    }
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            </form>
          </>
        )}

        {error && <Alert className="mt-3 text-center">{error}</Alert>}
      </Card>
    </div>
  );
};

export default SoloQuizStartPage;
