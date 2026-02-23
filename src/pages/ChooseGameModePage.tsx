import React from "react";
import { useNavigate } from "react-router-dom";

const ChooseGameModePage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="container" style={{ maxWidth: 600, marginTop: 60 }}>
      <div className="card shadow-lg p-5 d-flex flex-column align-items-center">
        <h2 className="fw-bold mb-3 text-center" style={{ color: "#FFD700" }}>
          Mode de jeu
        </h2>
        <p className="mb-4 text-center" style={{ color: "#e0e0e0" }}>
          Choisissez si vous souhaitez jouer seul ou à plusieurs.
        </p>
        <div
          className="d-flex flex-column gap-4 w-100"
          style={{ maxWidth: 400 }}
        >
          <button
            className="btn btn-bg-theme fs-5 py-3 rounded-3 shadow-sm"
            onClick={() => navigate("/quizz/solo")}
            style={{ fontWeight: 600 }}
          >
            Jouer en solo
          </button>
          <button
            className="btn btn-outline-gold fs-5 py-3 rounded-3 shadow-sm"
            onClick={() => {}}
            style={{ fontWeight: 600 }}
            disabled
            title="Bientôt disponible"
          >
            Jouer à plusieurs{" "}
            <span style={{ fontSize: 14, color: "#ce7c02", marginLeft: 8 }}>
              (bientôt)
            </span>
          </button>
        </div>
        <div className="text-center mt-4">
          <button
            onClick={() => navigate("/")}
            className="btn btn-link"
            style={{ color: "#e0e0e0" }}
          >
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChooseGameModePage;
