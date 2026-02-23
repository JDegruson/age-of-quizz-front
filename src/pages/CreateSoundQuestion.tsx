import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CIVILIZATIONS, { CIVILIZATIONS_MAP } from "../data/civilizations";
import { BUILDING_OPTIONS } from "../data/buildings";
import { createQuestion, uploadAudio } from "../services/api";
import { useUser } from "../components/Context/UserContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CreateSoundQuestion() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [civilization, setCivilization] = useState("NONE");
  const [building, setBuilding] = useState("NONE");
  const [audioFile, setAudioFile] = useState<File | null>(null);
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
    if (!audioFile) {
      toast.error("Le fichier audio est requis", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    const nonEmptyAnswers = answers.filter((a) => a.trim());
    if (nonEmptyAnswers.length < 4) {
      toast.error("Les 4 réponses sont requises", {
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

    try {
      setLoading(true);

      // Upload de l'audio d'abord
      const serverAudioPath = await uploadAudio(audioFile, user?.jwt);

      // Créer la question avec le chemin de l'audio
      const payload = {
        theme: "UNIT_STATS", // Les questions audio sont généralement sur les unités
        civilisation:
          civilization === "NONE" ? "NONE" : CIVILIZATIONS_MAP[civilization],
        building: building || "NONE",
        libelle: "A quoi correspond ce son",
        fileUrl: serverAudioPath, // Le chemin retourné par le serveur
        type: "SOUND",
        answers: answers
          .map((value, index) => ({
            value: value.trim(),
            correct: correctIndices.includes(index),
          }))
          .filter((a) => a.value),
      };

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
      setCivilization("NONE");
      setBuilding("NONE");
      setAudioFile(null);
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
        style={{ maxWidth: "800px", marginTop: "30px", marginBottom: "50px" }}
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
          <h2 className="text-center mb-4 fw-bold">
            Créer une question — Identification de son
          </h2>

          <form onSubmit={(e) => e.preventDefault()}>
            <div className="mb-4">
              <label className="form-label">Civilisation</label>
              <select
                value={civilization}
                onChange={(e) => setCivilization(e.target.value)}
                className="form-select"
              >
                <option value="NONE">Aucune civilisation</option>
                {CIVILIZATIONS.map((civ) => (
                  <option key={civ} value={civ}>
                    {civ}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="form-label">Bâtiment</label>
              <select
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="form-select"
              >
                {BUILDING_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="form-label">Fichier audio</label>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                className="form-control"
              />
              {audioFile && (
                <small className="text-muted mt-1">
                  Fichier sélectionné : {audioFile.name}
                </small>
              )}
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
                disabled={loading}
                className="btn btn-gold btn-lg px-5 rounded-pill shadow"
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                    Upload en cours...
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
