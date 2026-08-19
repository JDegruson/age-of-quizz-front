import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import BACKEND_URL from "../../config";

import { BUILDING_OPTIONS } from "../../data/buildings";
import { CIVILIZATIONS, CIVILIZATIONS_MAP } from "../../data/civilizations";
import {
  QUESTION_THEME_OPTIONS,
  getThemeLabel,
} from "../../utils/questionLabels";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";

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
      <Card shadow={false} style={{ maxWidth: 540, width: "100%" }}>
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
              {BUILDING_OPTIONS.map((option) => (
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
              <option value="NONE">Aucune civilisation</option>
              {CIVILIZATIONS.map((label) => (
                <option key={label} value={CIVILIZATIONS_MAP[label]}>
                  {label}
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
              {QUESTION_THEME_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {getThemeLabel(value)}
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
                <Button
                  type="button"
                  onClick={() => handleNumberMode("short")}
                  variant={numberMode === "short" ? "theme" : "outline-theme"}
                  style={{
                    minWidth: 130,
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Courte (20)
                </Button>
                <Button
                  type="button"
                  onClick={() => handleNumberMode("medium")}
                  variant={numberMode === "medium" ? "theme" : "outline-theme"}
                  style={{
                    minWidth: 130,
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Moyenne (40)
                </Button>
                <Button
                  type="button"
                  onClick={() => handleNumberMode("long")}
                  variant={numberMode === "long" ? "theme" : "outline-theme"}
                  style={{
                    minWidth: 130,
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Longue (60)
                </Button>
                <Button
                  type="button"
                  onClick={() => handleNumberMode("custom")}
                  variant={numberMode === "custom" ? "theme" : "outline-theme"}
                  style={{
                    minWidth: 130,
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Personnalisé
                </Button>
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
          <Button
            type="submit"
            disabled={loading}
            className="w-100 mt-2"
            style={{ fontSize: 18 }}
          >
            {loading ? "Chargement..." : "Lancer le quizz"}
          </Button>
        </form>
        {error && <Alert className="mt-3 text-center">{error}</Alert>}
      </Card>
    </div>
  );
};

export default SoloQuizStartPage;
