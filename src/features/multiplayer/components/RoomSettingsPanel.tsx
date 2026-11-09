import React, { useEffect, useState } from "react";
import { VARIANT_CLASS } from "../../../components/ui/Button";
import { BUILDING_OPTIONS, BUILDING_LABELS } from "../../../data/buildings";
import {
  CIVILIZATIONS,
  CIVILIZATIONS_MAP,
  getCivilisationLabel,
} from "../../../data/civilizations";
import {
  QUESTION_THEME_OPTIONS,
  getThemeLabel,
} from "../../../utils/questionLabels";
import {
  ROOM_SETTINGS_LIMITS,
  type RoomSettings,
} from "../../../types/multiplayer";

const TECH_TREE_THEME = "TECH_TREE";
// Valeur des <select> pour "pas de filtre" (le back attend null).
const ANY = "";

const QUESTION_COUNT_PRESETS = [5, 10, 20, 30];
const DURATION_PRESETS = [10, 15, 20, 30];

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.round(value)));

interface RoomSettingsPanelProps {
  settings: RoomSettings;
  /** Only the host can edit; other players see the options read-only. */
  editable: boolean;
  isSaving: boolean;
  onChange: (settings: RoomSettings) => void;
}

/**
 * Numeric field with presets: keeps a local draft while typing and only
 * commits (clamped) on blur / Enter, so each keystroke doesn't hit the API.
 */
const NumberSetting: React.FC<{
  id: string;
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  presets: number[];
  disabled: boolean;
  onCommit: (value: number) => void;
}> = ({ id, label, unit, value, min, max, presets, disabled, onCommit }) => {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed) || draft.trim() === "") {
      setDraft(String(value));
      return;
    }
    const next = clamp(parsed, min, max);
    setDraft(String(next));
    if (next !== value) {
      onCommit(next);
    }
  };

  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <div className="d-flex gap-2 flex-wrap align-items-center">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            className={`btn btn-sm ${
              VARIANT_CLASS[value === preset ? "theme" : "outline-theme"]
            }`}
            disabled={disabled}
            onClick={() => onCommit(preset)}
          >
            {preset}
            {unit}
          </button>
        ))}
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          className="form-control form-control-sm"
          style={{ width: 80 }}
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
        />
      </div>
    </div>
  );
};

const RoomSettingsPanel: React.FC<RoomSettingsPanelProps> = ({
  settings,
  editable,
  isSaving,
  onChange,
}) => {
  const excludeTechTree = !!settings.excludedThemes?.includes(TECH_TREE_THEME);
  const update = (patch: Partial<RoomSettings>) =>
    onChange({ ...settings, ...patch });

  if (!editable) {
    const filters = [
      settings.theme && `Thème : ${getThemeLabel(settings.theme)}`,
      settings.civilisation &&
        `Civilisation : ${getCivilisationLabel(settings.civilisation)}`,
      settings.building &&
        `Bâtiment : ${BUILDING_LABELS[settings.building] || settings.building}`,
      excludeTechTree && "Sans arbre des technologies",
    ].filter(Boolean);

    return (
      <div
        className="mb-3 p-3"
        style={{ backgroundColor: "#111827", borderRadius: 8 }}
      >
        <h5 className="mb-2">Options de la partie</h5>
        <div>
          {settings.numberOfQuestions} questions ·{" "}
          {settings.questionDuration}s par question
        </div>
        <div style={{ color: "#9ca3af" }}>
          {filters.length > 0 ? filters.join(" · ") : "Toutes les questions"}
        </div>
        <small style={{ color: "#9ca3af" }}>
          Seul l'hôte peut modifier les options.
        </small>
      </div>
    );
  }

  const disabled = isSaving;

  return (
    <div
      className="mb-3 p-3"
      style={{ backgroundColor: "#111827", borderRadius: 8 }}
    >
      <h5 className="mb-3">Options de la partie</h5>

      <NumberSetting
        id="room-question-count"
        label="Nombre de questions"
        unit=""
        value={settings.numberOfQuestions}
        min={ROOM_SETTINGS_LIMITS.minQuestions}
        max={ROOM_SETTINGS_LIMITS.maxQuestions}
        presets={QUESTION_COUNT_PRESETS}
        disabled={disabled}
        onCommit={(numberOfQuestions) => update({ numberOfQuestions })}
      />

      <NumberSetting
        id="room-question-duration"
        label="Temps par question"
        unit="s"
        value={settings.questionDuration}
        min={ROOM_SETTINGS_LIMITS.minDuration}
        max={ROOM_SETTINGS_LIMITS.maxDuration}
        presets={DURATION_PRESETS}
        disabled={disabled}
        onCommit={(questionDuration) => update({ questionDuration })}
      />

      <div className="mb-3">
        <label htmlFor="room-theme" className="form-label">
          Thème
        </label>
        <select
          id="room-theme"
          className="form-select"
          value={settings.theme ?? ANY}
          disabled={disabled}
          onChange={(e) => update({ theme: e.target.value || null })}
        >
          <option value={ANY}>Tous les thèmes</option>
          {QUESTION_THEME_OPTIONS.filter(
            (value) => !(excludeTechTree && value === TECH_TREE_THEME),
          ).map((value) => (
            <option key={value} value={value}>
              {getThemeLabel(value)}
            </option>
          ))}
        </select>
        <div className="form-check mt-2">
          <input
            id="room-exclude-tech-tree"
            type="checkbox"
            className="form-check-input"
            checked={excludeTechTree}
            disabled={disabled}
            onChange={(e) =>
              update({
                excludedThemes: e.target.checked ? [TECH_TREE_THEME] : null,
                // Thème choisi et thème exclu ne peuvent pas être le même.
                theme:
                  e.target.checked && settings.theme === TECH_TREE_THEME
                    ? null
                    : settings.theme,
              })
            }
          />
          <label
            htmlFor="room-exclude-tech-tree"
            className="form-check-label"
          >
            Exclure les questions sur l'arbre des technologies
          </label>
        </div>
      </div>

      <div className="mb-3">
        <label htmlFor="room-civilisation" className="form-label">
          Civilisation
        </label>
        <select
          id="room-civilisation"
          className="form-select"
          value={settings.civilisation ?? ANY}
          disabled={disabled}
          onChange={(e) => update({ civilisation: e.target.value || null })}
        >
          <option value={ANY}>Toutes les civilisations</option>
          {CIVILIZATIONS.map((label) => (
            <option key={label} value={CIVILIZATIONS_MAP[label]}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-2">
        <label htmlFor="room-building" className="form-label">
          Bâtiment
        </label>
        <select
          id="room-building"
          className="form-select"
          value={settings.building ?? ANY}
          disabled={disabled}
          onChange={(e) => update({ building: e.target.value || null })}
        >
          <option value={ANY}>Tous les bâtiments</option>
          {BUILDING_OPTIONS.filter((option) => option.value !== "NONE").map(
            (option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ),
          )}
        </select>
      </div>

      <small style={{ color: "#9ca3af" }}>
        S'il n'y a pas assez de questions correspondant aux filtres, la partie
        est complétée avec des questions aléatoires.
      </small>
    </div>
  );
};

export default RoomSettingsPanel;
