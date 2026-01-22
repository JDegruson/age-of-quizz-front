import React from "react";
import { useNavigate } from "react-router-dom";

const TYPES = [
  { id: "multiple", label: "QCM (Choix multiples)" },
  { id: "truefalse", label: "Vrai / Faux" },
  { id: "sound", label: "Identification de son" },
  { id: "image", label: "Identification d'image" },
];

export default function ChooseQuestionType() {
  const navigate = useNavigate();

  function go(type: string) {
    navigate(`/create-question/${type}`);
  }

  return (
    <div className="container" style={{ maxWidth: "900px", marginTop: "50px" }}>
      <div className="card shadow-lg p-5">
        <h2 className="text-center mb-2 fw-bold">
          Choisir le type de question
        </h2>
        <p className="text-center mb-5" style={{ color: "#ffffff" }}>
          Sélectionnez le format de votre question
        </p>

        <div className="row g-4">
          {TYPES.map((t) => (
            <div key={t.id} className="col-md-6">
              <button
                onClick={() => go(t.id)}
                className="btn btn-outline-gold w-100 py-4 rounded-3 shadow-sm"
                style={{ fontSize: "1.1rem", fontWeight: "500" }}
              >
                <i className="bi bi-card-checklist me-2"></i>
                {t.label}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center mt-4">
          <button
            onClick={() => navigate("/")}
            className="btn btn-link"
            style={{ color: "#ffffff" }}
          >
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
}
