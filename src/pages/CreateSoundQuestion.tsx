import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CIVILIZATIONS, { CIVILIZATIONS_MAP } from "../data/civilizations";
import { createQuestion, uploadAudio } from "../services/api";
import { useUser } from "../components/Context/UserContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CreateSoundQuestion() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [civilization, setCivilization] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    // Validation
    if (!audioFile) {
      toast.error("Le fichier audio est requis", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (!answer.trim()) {
      toast.error("La réponse est requise", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      setLoading(true);

      // Upload de l'audio d'abord
      const uploadPath = "questions/audio";
      const serverAudioPath = await uploadAudio(
        audioFile,
        uploadPath,
        user?.jwt,
      );

      // Créer la question avec le chemin de l'audio
      const payload = {
        theme: "UNIT_STATS", // Les questions audio sont généralement sur les unités
        civilisation: civilization ? CIVILIZATIONS_MAP[civilization] : null,
        libelle: "A quoi correspond ce son",
        fileUrl: serverAudioPath, // Le chemin retourné par le serveur
        type: "SOUND",
        answers: [
          {
            value: answer.trim(),
            correct: true,
          },
        ],
      };

      console.log(
        "Payload envoyé au backend:",
        JSON.stringify(payload, null, 2),
      );

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
      setCivilization("");
      setAudioFile(null);
      setAnswer("");

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
                <option value="">Sélectionnez une civilisation</option>
                {CIVILIZATIONS.map((civ) => (
                  <option key={civ} value={civ}>
                    {civ}
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

            <div className="mb-4">
              <label className="form-label">Réponse</label>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="form-control"
                placeholder="Exemple: Trébuchet, Cavalier, etc."
              />
            </div>

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
