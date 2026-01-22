import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createQuestion } from "../services/api";
import { useUser } from "../components/Context/UserContext";
import CIVILIZATIONS, { CIVILIZATIONS_MAP } from "../data/civilizations";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CreateMultipleChoice() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState("TECH_TREE");
  const [civilization, setCivilization] = useState("");
  const [answers, setAnswers] = useState(["", "", "", ""]);
  const [correctIndices, setCorrectIndices] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  function setAnswerAt(index: number, value: string) {
    const copy = [...answers];
    copy[index] = value;
    setAnswers(copy);
  }

  function toggleCorrect(index: number) {
    setCorrectIndices((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
      return [...prev, index];
    });
  }

  async function handleSave() {
    // Validation
    if (!title.trim()) {
      toast.error("Le titre est requis", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    const nonEmptyAnswers = answers.filter((a) => a.trim());
    if (nonEmptyAnswers.length < 2) {
      toast.error("Au moins 2 réponses sont requises", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (correctIndices.length === 0) {
      toast.error("Au moins une bonne réponse doit être sélectionnée", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    // Format attendu par le backend
    const payload = {
      theme: theme,
      civilisation: civilization ? CIVILIZATIONS_MAP[civilization] : null,
      libelle: title,
      type: "MULTIPLE",
      answers: answers
        .map((value, index) => ({
          value: value.trim(),
          correct: correctIndices.includes(index),
        }))
        .filter((a) => a.value), // Exclure les réponses vides
    };

    console.log("Payload envoyé au backend:", JSON.stringify(payload, null, 2));

    try {
      setLoading(true);
      await createQuestion(payload, user?.jwt);
      toast.success("Question créée avec succès !", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setLoading(false);
      // Réinitialiser le formulaire
      setTitle("");
      setCivilization("");
      setAnswers(["", "", "", ""]);
      setCorrectIndices([]);
      // Optionnel : redirection après un délai
      setTimeout(() => {
        navigate("/create-question");
      }, 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de la création", {
        position: "top-right",
        autoClose: 3000,
      });
      setLoading(false);
    }
  }

  return (
    <>
      <ToastContainer />
      <div
        className="container"
        style={{ maxWidth: "1000px", marginTop: "30px", marginBottom: "50px" }}
      >
        <div className="card shadow-lg p-4" style={{ position: "relative" }}>
          <button
            onClick={() => navigate("/create-question")}
            className="btn btn-outline-secondary btn-sm"
            style={{
              position: "absolute",
              top: "20px",
              left: "20px",
              zIndex: 10,
            }}
            title="Retour"
          >
            <i className="bi bi-arrow-left"></i>
          </button>
          <h2 className="text-center mb-4 fw-bold">Créer une question — QCM</h2>

          <form onSubmit={(e) => e.preventDefault()}>
            <div className="mb-3">
              <label className="form-label">Thème</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="form-select"
              >
                <option value="TECH_TREE">Arbre des technologies</option>
                <option value="UNIT_STATS">Statistiques des unités</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Civilisation</label>
              <select
                value={civilization}
                onChange={(e) => setCivilization(e.target.value)}
                className="form-select"
              >
                <option value="">Sélectionnez une civilisation</option>
                {CIVILIZATIONS.map((civ) => (
                  <option key={civ} value={civ}>
                    {civ}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Titre</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-control"
                placeholder="Qu'est ce qui est petit et marron ?"
              />
            </div>

            <h5 className="mt-4 mb-3">Réponses (cochez les bonnes réponses)</h5>
            {answers.map((ans, i) => {
              const isCorrect = correctIndices.includes(i);
              return (
                <div
                  key={i}
                  className={`card mb-3 ${isCorrect ? "border-success" : ""}`}
                  style={{
                    padding: "15px",
                    backgroundColor: isCorrect ? "#1e4d2b" : "#2d2d2d",
                  }}
                >
                  <div className="row align-items-center">
                    <div className="col-md-8">
                      <label className="form-label fw-semibold">
                        Réponse {i + 1}
                      </label>
                      <input
                        type="text"
                        value={ans}
                        onChange={(e) => setAnswerAt(i, e.target.value)}
                        className="form-control form-control-lg"
                        placeholder={`Réponse ${i + 1}`}
                      />
                    </div>

                    <div className="col-md-4 text-center">
                      <button
                        type="button"
                        aria-pressed={isCorrect}
                        onClick={() => toggleCorrect(i)}
                        className={`btn btn-lg w-100 ${
                          isCorrect ? "btn-gold" : "btn-outline-secondary"
                        }`}
                        style={{
                          fontWeight: "600",
                        }}
                      >
                        <span style={{ fontSize: 18 }}>
                          {isCorrect ? "✓" : "○"}
                        </span>{" "}
                        {isCorrect ? "Bonne réponse" : "Marquer comme correcte"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="d-flex gap-3 justify-content-center mt-4">
              <button
                type="button"
                onClick={handleSave}
                className="btn btn-gold btn-lg px-5 rounded-pill shadow"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    Enregistrer
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate("/create-question")}
                className="btn btn-outline-secondary btn-lg px-4 rounded-pill"
                disabled={loading}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Retour
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
