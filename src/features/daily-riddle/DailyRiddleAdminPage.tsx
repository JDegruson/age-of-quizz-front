import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useUser } from "../../context/UserContext";
import { useRequireRole } from "../../hooks/useRequireRole";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import {
  createDailyRiddleEntry,
  fetchDailyRiddleEntries,
  importDailyRiddleTechTree,
  updateDailyRiddleEntry,
} from "../../services/dailyRiddleApi";
import type {
  DailyRiddleEntry,
  DailyRiddleEntryRequest,
  DailyRiddleImportResult,
  DailyRiddleTargetType,
} from "../../types/dailyRiddle";
import RiddleEntryEditor from "./components/RiddleEntryEditor";
import { normalizeGuess } from "./hooks/useDailyRiddle";

const TECH_TREE_DATA_URL =
  "https://github.com/SiegeEngineers/aoe2techtree/tree/master/data";

const TYPE_LABELS: Record<DailyRiddleTargetType, string> = {
  CIVILIZATION: "Civilisation",
  UNIT: "Unité",
};

const backendMessage = (err: unknown, fallback: string) =>
  axios.isAxiosError(err) && typeof err.response?.data === "string"
    ? err.response.data
    : fallback;

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR");

const DailyRiddleAdminPage: React.FC = () => {
  const { user } = useUser();
  const { hasRequiredRole, isAuthLoading } = useRequireRole(
    ["ADMIN"],
    { loginMessage: "Connecte-toi pour gérer l'énigme du jour." },
  );

  const [entries, setEntries] = useState<DailyRiddleEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"ALL" | DailyRiddleTargetType>(
    "ALL",
  );
  const [search, setSearch] = useState("");
  // null = fermé, "new" = création, sinon id de l'énigme éditée.
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [saving, setSaving] = useState(false);

  const [dataFile, setDataFile] = useState<File | null>(null);
  const [stringsFile, setStringsFile] = useState<File | null>(null);
  const [keepManualEdits, setKeepManualEdits] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] =
    useState<DailyRiddleImportResult | null>(null);

  const loadEntries = useCallback(async () => {
    if (!user?.jwt) return;
    setLoading(true);
    setError(null);
    try {
      setEntries(await fetchDailyRiddleEntries(user.jwt));
    } catch (err) {
      setError(backendMessage(err, "Impossible de charger les énigmes."));
    } finally {
      setLoading(false);
    }
  }, [user?.jwt]);

  useEffect(() => {
    if (hasRequiredRole) loadEntries();
  }, [hasRequiredRole, loadEntries]);

  const filtered = useMemo(() => {
    const query = normalizeGuess(search);
    return entries.filter(
      (e) =>
        (typeFilter === "ALL" || e.type === typeFilter) &&
        (!query || normalizeGuess(e.name).includes(query)),
    );
  }, [entries, typeFilter, search]);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataFile || !stringsFile || !user?.jwt) return;
    setImporting(true);
    setError(null);
    setImportResult(null);
    try {
      setImportResult(
        await importDailyRiddleTechTree(
          dataFile,
          stringsFile,
          keepManualEdits,
          user.jwt,
        ),
      );
      await loadEntries();
    } catch (err) {
      setError(
        backendMessage(err, "Échec de l'import. Vérifie les deux fichiers."),
      );
    } finally {
      setImporting(false);
    }
  };

  const handleSave = async (request: DailyRiddleEntryRequest) => {
    if (!user?.jwt || editing === null) return;
    setSaving(true);
    setError(null);
    try {
      const saved =
        editing === "new"
          ? await createDailyRiddleEntry(request, user.jwt)
          : await updateDailyRiddleEntry(editing, request, user.jwt);
      setEntries((prev) =>
        editing === "new"
          ? [...prev, saved]
          : prev.map((e) => (e.id === saved.id ? saved : e)),
      );
      setEditing(null);
    } catch (err) {
      setError(backendMessage(err, "Erreur lors de l'enregistrement."));
    } finally {
      setSaving(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="text-center mt-5">
        <Spinner />
      </div>
    );
  }

  if (!hasRequiredRole) {
    return null;
  }

  const civCount = entries.filter((e) => e.type === "CIVILIZATION").length;

  return (
    <div className="container page-xl mt-5 mb-5">
      <div className="card bg-dark text-light border-secondary mb-4">
        <div className="card-body">
          <h2 className="card-title mb-3">Énigme du jour — Import</h2>
          <p className="text-secondary">
            Télécharge <code>data.json</code> et{" "}
            <code>locales/fr/strings.json</code> depuis{" "}
            <a href={TECH_TREE_DATA_URL} target="_blank" rel="noreferrer">
              aoe2techtree
            </a>{" "}
            (après chaque patch du jeu), puis importe-les ici. Les énigmes
            existantes sont mises à jour, les nouvelles ajoutées, et tes
            énigmes personnalisées ne sont pas touchées.
          </p>
          <form onSubmit={handleImport}>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label">data.json</label>
                <input
                  type="file"
                  accept=".json,application/json"
                  className="form-control"
                  onChange={(e) => setDataFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">strings.json (FR)</label>
                <input
                  type="file"
                  accept=".json,application/json"
                  className="form-control"
                  onChange={(e) =>
                    setStringsFile(e.target.files?.[0] ?? null)
                  }
                />
              </div>
            </div>
            <div className="form-check mb-3">
              <input
                id="keep-manual-edits"
                type="checkbox"
                className="form-check-input"
                checked={keepManualEdits}
                onChange={(e) => setKeepManualEdits(e.target.checked)}
              />
              <label htmlFor="keep-manual-edits" className="form-check-label">
                Conserver les indices modifiés à la main
              </label>
            </div>
            <Button
              type="submit"
              loading={importing}
              loadingLabel="Import en cours..."
              disabled={!dataFile || !stringsFile}
            >
              Importer
            </Button>
          </form>

          {importResult && (
            <Alert variant="success" className="mt-3 mb-0">
              {importResult.civilizations} civilisations et{" "}
              {importResult.units} unités traitées : {importResult.created}{" "}
              créée(s), {importResult.updated} mise(s) à jour,{" "}
              {importResult.skipped} conservée(s) car modifiée(s) à la main.
              {importResult.warnings.length > 0 && (
                <ul className="mb-0 mt-2">
                  {importResult.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              )}
            </Alert>
          )}
        </div>
      </div>

      <div className="card bg-dark text-light border-secondary">
        <div className="card-body">
          <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
            <h2 className="card-title mb-0 me-auto">
              Énigmes ({civCount} civilisations, {entries.length - civCount}{" "}
              unités)
            </h2>
            <Button
              variant="theme"
              onClick={() => setEditing("new")}
              disabled={editing !== null}
            >
              + Nouvelle énigme
            </Button>
          </div>

          {error && <Alert>{error}</Alert>}

          {editing === "new" && (
            <div className="border border-secondary rounded p-3 mb-3">
              <RiddleEntryEditor
                saving={saving}
                onSave={handleSave}
                onCancel={() => setEditing(null)}
              />
            </div>
          )}

          <div className="d-flex flex-wrap gap-2 mb-3">
            <select
              className="form-select"
              style={{ maxWidth: 200 }}
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as typeof typeFilter)
              }
            >
              <option value="ALL">Tous les types</option>
              <option value="CIVILIZATION">Civilisations</option>
              <option value="UNIT">Unités</option>
            </select>
            <input
              className="form-control"
              style={{ maxWidth: 300 }}
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <Spinner />
          ) : (
            <div className="list-group">
              {filtered.map((entry) =>
                editing === entry.id ? (
                  <div
                    key={entry.id}
                    className="list-group-item bg-dark text-light border-secondary"
                  >
                    <RiddleEntryEditor
                      entry={entry}
                      saving={saving}
                      onSave={handleSave}
                      onCancel={() => setEditing(null)}
                    />
                  </div>
                ) : (
                  <button
                    key={entry.id}
                    type="button"
                    className="list-group-item list-group-item-action bg-dark text-light border-secondary d-flex flex-wrap gap-2 align-items-center"
                    onClick={() => setEditing(entry.id)}
                    disabled={editing !== null}
                  >
                    <span className="fw-semibold me-auto">{entry.name}</span>
                    <span className="badge bg-secondary">
                      {TYPE_LABELS[entry.type]}
                    </span>
                    {entry.manuallyEdited && (
                      <span className="badge bg-info text-dark">Modifiée</span>
                    )}
                    {!entry.active && (
                      <span className="badge bg-danger">Inactive</span>
                    )}
                    <small className="text-secondary">
                      {entry.hints.length} indice(s)
                      {entry.lastPlayedOn &&
                        ` · jouée le ${formatDate(entry.lastPlayedOn)}`}
                    </small>
                  </button>
                ),
              )}
              {filtered.length === 0 && (
                <p className="text-secondary mb-0">Aucune énigme.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyRiddleAdminPage;
