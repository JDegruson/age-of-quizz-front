import React, { useState } from "react";
import Button from "../../../components/ui/Button";
import type {
  DailyRiddleEntry,
  DailyRiddleEntryRequest,
  DailyRiddleHint,
  DailyRiddleTargetType,
} from "../../../types/dailyRiddle";

export const MAX_HINTS = 6;

interface RiddleEntryEditorProps {
  /** Absent = création d'une nouvelle énigme. */
  entry?: DailyRiddleEntry;
  saving: boolean;
  onSave: (request: DailyRiddleEntryRequest) => void;
  onCancel: () => void;
}

const RiddleEntryEditor: React.FC<RiddleEntryEditorProps> = ({
  entry,
  saving,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(entry?.name ?? "");
  const [type, setType] = useState<DailyRiddleTargetType>(
    entry?.type ?? "CIVILIZATION",
  );
  const [active, setActive] = useState(entry?.active ?? true);
  const [hints, setHints] = useState<DailyRiddleHint[]>(
    entry?.hints.length ? entry.hints : [{ label: "", text: "" }],
  );

  const updateHint = (index: number, patch: Partial<DailyRiddleHint>) =>
    setHints((prev) =>
      prev.map((h, i) => (i === index ? { ...h, ...patch } : h)),
    );

  const moveHint = (index: number, delta: number) =>
    setHints((prev) => {
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(index + delta, 0, moved);
      return next;
    });

  const isValid =
    name.trim() !== "" &&
    hints.length > 0 &&
    hints.every((h) => h.label.trim() && h.text.trim());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) onSave({ name: name.trim(), type, active, hints });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <label className="form-label">Réponse</label>
          <input
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!!entry}
            maxLength={255}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Type</label>
          <select
            className="form-select"
            value={type}
            onChange={(e) => setType(e.target.value as DailyRiddleTargetType)}
            disabled={!!entry}
          >
            <option value="CIVILIZATION">Civilisation</option>
            <option value="UNIT">Unité</option>
          </select>
        </div>
        <div className="col-md-3 d-flex align-items-end">
          <div className="form-check">
            <input
              id="riddle-active"
              type="checkbox"
              className="form-check-input"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <label htmlFor="riddle-active" className="form-check-label">
              Peut être tirée au sort
            </label>
          </div>
        </div>
      </div>

      <p className="text-secondary small mb-2">
        Indices du plus vague au plus précis : le premier est visible
        d'emblée, les suivants se débloquent à chaque erreur. Pense à masquer
        la réponse avec « ??? ».
      </p>

      {hints.map((hint, i) => (
        <div key={i} className="d-flex gap-2 mb-2 align-items-start">
          <span className="pt-2 text-secondary" style={{ minWidth: 20 }}>
            {i + 1}.
          </span>
          <input
            className="form-control"
            style={{ maxWidth: 200 }}
            placeholder="Libellé"
            value={hint.label}
            maxLength={100}
            onChange={(e) => updateHint(i, { label: e.target.value })}
          />
          <textarea
            className="form-control"
            rows={2}
            placeholder="Texte de l'indice"
            value={hint.text}
            maxLength={1000}
            onChange={(e) => updateHint(i, { text: e.target.value })}
          />
          <div className="d-flex flex-column gap-1">
            <Button
              type="button"
              variant="outline-secondary"
              className="btn-sm"
              disabled={i === 0}
              onClick={() => moveHint(i, -1)}
              title="Monter"
            >
              <i className="bi bi-arrow-up"></i>
            </Button>
            <Button
              type="button"
              variant="outline-secondary"
              className="btn-sm"
              disabled={i === hints.length - 1}
              onClick={() => moveHint(i, 1)}
              title="Descendre"
            >
              <i className="bi bi-arrow-down"></i>
            </Button>
          </div>
          <Button
            type="button"
            variant="outline-secondary"
            className="btn-sm"
            disabled={hints.length === 1}
            onClick={() => setHints((prev) => prev.filter((_, j) => j !== i))}
            title="Supprimer"
          >
            <i className="bi bi-trash"></i>
          </Button>
        </div>
      ))}

      <div className="d-flex gap-2 mt-3">
        <Button
          type="button"
          variant="outline-theme"
          disabled={hints.length >= MAX_HINTS}
          onClick={() => setHints((prev) => [...prev, { label: "", text: "" }])}
        >
          + Ajouter un indice
        </Button>
        <div className="ms-auto d-flex gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" loading={saving} disabled={!isValid}>
            Enregistrer
          </Button>
        </div>
      </div>
    </form>
  );
};

export default RiddleEntryEditor;
