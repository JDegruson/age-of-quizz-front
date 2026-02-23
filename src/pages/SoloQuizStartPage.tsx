import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import BACKEND_URL from "../config";
import { BUILDING_OPTIONS } from "../data/buildings";
import { CIVILIZATIONS, CIVILIZATIONS_LABELS } from "../data/civilizations";

const THEME_OPTIONS = [
  { value: "TECH_TREE", label: "Arbre des technologies" },
  { value: "IMAGE", label: "Image" },
  { value: "UNIT_STATS", label: "Statistiques des unités" },
  { value: "SOUND", label: "Son" },
];

const CIVILIZATION_OPTIONS = [
  { value: "NONE", label: "Aucune civilisation" },
  { value: "ARMENIANS", label: "Arméniens" },
  { value: "AZTECS", label: "Aztèques" },
  { value: "BENGALIS", label: "Bengalis" },
  { value: "BERBERS", label: "Berbères" },
  { value: "BOHEMIANS", label: "Bohémiens" },
  { value: "BRITONS", label: "Britanniques" },
  { value: "BULGARIANS", label: "Bulgares" },
  { value: "BURGUNDIANS", label: "Bourguignons" },
  { value: "BURMESE", label: "Birmans" },
  { value: "BYZANTINES", label: "Byzantins" },
  { value: "CELTS", label: "Celtes" },
  { value: "CHINESE", label: "Chinois" },
  { value: "CUMANS", label: "Coumans" },
  { value: "DRAVIDIANS", label: "Dravidiens" },
  { value: "ETHIOPIANS", label: "Éthiopiens" },
  { value: "FRANKS", label: "Francs" },
  { value: "GEORGIANS", label: "Géorgiens" },
  { value: "GOTHS", label: "Goths" },
  { value: "GURJARAS", label: "Gurjaras" },
  { value: "HINDUSTANIS", label: "Hindoustanis" },
  { value: "HUNS", label: "Huns" },
  { value: "INCAS", label: "Incas" },
  { value: "ITALIANS", label: "Italiens" },
  { value: "JAPANESE", label: "Japonais" },
  { value: "JURCHENS", label: "Jurchens" },
  { value: "KHITANS", label: "Khitans" },
  { value: "KHMER", label: "Khmer" },
  { value: "KOREANS", label: "Coréens" },
  { value: "LITHUANIANS", label: "Lituaniens" },
  { value: "MAGYARS", label: "Magyars" },
  { value: "MALAY", label: "Malais" },
  { value: "MALIANS", label: "Maliens" },
  { value: "MAYANS", label: "Mayas" },
  { value: "MONGOLS", label: "Mongols" },
  { value: "PERSIANS", label: "Perses" },
  { value: "POLES", label: "Polonais" },
  { value: "PORTUGUESE", label: "Portugais" },
  { value: "ROMANS", label: "Romains" },
  { value: "SARACENS", label: "Sarrasins" },
  { value: "SHU", label: "Shu" },
  { value: "SICILIANS", label: "Siciliens" },
  { value: "SLAVS", label: "Slaves" },
  { value: "SPANISH", label: "Espagnols" },
  { value: "TATARS", label: "Tatars" },
  { value: "TEUTONS", label: "Teutons" },
  { value: "TURKS", label: "Turcs" },
  { value: "VIETNAMESE", label: "Viêtnamiens" },
  { value: "VIKINGS", label: "Vikings" },
  { value: "WEI", label: "Wei" },
  { value: "WU", label: "Wu" },
];

const BUILDING_OPTIONS_ENUM = [
  { value: "NONE", label: "Aucun bâtiment" },
  { value: "TOWN_CENTER", label: "Forum" },
  { value: "MARKET", label: "Marché" },
  { value: "LUMBER_CAMP", label: "Camp de bûcherons" },
  { value: "MINING_CAMP", label: "Camp de mineurs" },
  { value: "DOCK", label: "Port" },
  { value: "BLACKSMITH", label: "Forge" },
  { value: "UNIVERSITY", label: "Université" },
  { value: "BARRACKS", label: "Casernes" },
  { value: "ARCHERY_RANGE", label: "Camp de tir à l'arc" },
  { value: "STABLE", label: "Écurie" },
  { value: "SIEGE_WORKSHOP", label: "Atelier de siège" },
  { value: "MONASTERY", label: "Monastère" },
  { value: "CASTLE", label: "Château" },
  { value: "TOWER", label: "Tour de guet" },
  { value: "MILL", label: "Moulin" },
];

type FilterQuestionDTO = {
  building?: string;
  civilisation?: string;
  theme?: string;
  numberOfQuestions: number;
};

const SoloQuizStartPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterQuestionDTO>({
    numberOfQuestions: 20,
  });
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customNumber, setCustomNumber] = useState<number | null>(null);
  const [numberMode, setNumberMode] = useState<
    "short" | "medium" | "long" | "custom"
  >("short");
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFilter({ ...filter, [e.target.name]: e.target.value });
  };

  const handleNumberMode = (mode: "short" | "medium" | "long" | "custom") => {
    setNumberMode(mode);
    let numberOfQuestions = 20;
    if (mode === "short") numberOfQuestions = 20;
    if (mode === "medium") numberOfQuestions = 40;
    if (mode === "long") numberOfQuestions = 60;
    if (mode === "custom" && customNumber) numberOfQuestions = customNumber;
    setFilter((f) => ({ ...f, numberOfQuestions }));
  };

  const handleCustomNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, Math.min(100, Number(e.target.value)));
    setCustomNumber(value);
    setFilter((f) => ({ ...f, numberOfQuestions: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setQuestions([]);
    try {
      const res = await axios.post(`${BACKEND_URL}/questions/quizz`, filter);
      // Navigate to /quiz with questions in state
      navigate("/quiz", { state: { questions: res.data } });
    } catch (err) {
      setError("Erreur lors de la récupération des questions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container d-flex justify-content-center align-items-center"
      style={{ minHeight: "80vh" }}
    >
      <div className="card p-4" style={{ maxWidth: 540, width: "100%" }}>
        <h2 className="mb-4 text-center">Lancer un quizz solo</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Bâtiment :</label>
            <select
              name="building"
              value={filter.building || "NONE"}
              onChange={handleChange}
              className="form-select"
            >
              {BUILDING_OPTIONS_ENUM.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">Civilisation :</label>
            <select
              name="civilisation"
              value={filter.civilisation || "NONE"}
              onChange={handleChange}
              className="form-select"
            >
              {CIVILIZATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">Thème :</label>
            <select
              name="theme"
              value={filter.theme || "TECH_TREE"}
              onChange={handleChange}
              className="form-select"
            >
              {THEME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">Nombre de questions :</label>
            <div className="d-flex gap-2 flex-wrap">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => handleNumberMode("short")}
                  className={`btn ${numberMode === "short" ? "btn-bg-theme" : "btn-outline-gold"}`}
                  style={{
                    minWidth: 130,
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Courte (20)
                </button>
                <button
                  type="button"
                  onClick={() => handleNumberMode("medium")}
                  className={`btn ${numberMode === "medium" ? "btn-bg-theme" : "btn-outline-gold"}`}
                  style={{
                    minWidth: 130,
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Moyenne (40)
                </button>
                <button
                  type="button"
                  onClick={() => handleNumberMode("long")}
                  className={`btn ${numberMode === "long" ? "btn-bg-theme" : "btn-outline-gold"}`}
                  style={{
                    minWidth: 130,
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Longue (60)
                </button>
                <button
                  type="button"
                  onClick={() => handleNumberMode("custom")}
                  className={`btn ${numberMode === "custom" ? "btn-bg-theme" : "btn-outline-gold"}`}
                  style={{
                    minWidth: 130,
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Personnalisé
                </button>
                {numberMode === "custom" && (
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={customNumber ?? filter.numberOfQuestions}
                    onChange={handleCustomNumber}
                    className="form-control ms-2"
                    style={{ width: 80, height: 44 }}
                  />
                )}
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-bg-theme w-100 mt-2"
            style={{ fontSize: 18 }}
          >
            {loading ? "Chargement..." : "Lancer le quizz"}
          </button>
        </form>
        {error && (
          <div className="alert alert-danger mt-3 text-center">{error}</div>
        )}
      </div>
    </div>
  );
};

export default SoloQuizStartPage;
