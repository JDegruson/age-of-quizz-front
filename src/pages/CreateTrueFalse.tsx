import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CIVILIZATIONS, { CIVILIZATIONS_MAP } from "../data/civilizations";
import { BUILDING_OPTIONS } from "../data/buildings";
import { createQuestion } from "../services/api";
import { useUser } from "../components/Context/UserContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CreateTrueFalse() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState("TECH_TREE");
  const [civilization, setCivilization] = useState("NONE");
  const [building, setBuilding] = useState("NONE");
  const [answer, setAnswer] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    // Validation
    if (!title.trim()) {
      toast.error("La question est requise", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    const payload = {
      theme: theme,
      civilisation:
        civilization === "NONE" ? "NONE" : CIVILIZATIONS_MAP[civilization],
      building: building || "NONE",
      libelle: title,
      type: "TRUE_FALSE",
      answers: [
        {
          value: "Vrai",
          correct: answer === true,
        },
        {
          value: "Faux",
          correct: answer === false,
        },
      ],
    };

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
      setCivilization("NONE");
      setBuilding("NONE");
      setAnswer(true);
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
            Créer une question — Vrai / Faux
          </h2>

          <form onSubmit={(e) => e.preventDefault()}>
            <div className="mb-4">
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
              <label className="form-label">Question</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-control"
                placeholder="Entrez votre question..."
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Réponse</label>
              <select
                value={answer.toString()}
                onChange={(e) => setAnswer(e.target.value === "true")}
                className="form-select"
              >
                <option value="true">Vrai</option>
                <option value="false">Faux</option>
              </select>
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
