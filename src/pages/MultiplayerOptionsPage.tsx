// Ajout d'une page intermédiaire pour choisir entre créer ou rejoindre une salle
import React from "react";
import { useNavigate } from "react-router-dom";

const MultiplayerOptionsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container" style={{ maxWidth: 700, marginTop: 50 }}>
      <div className="card p-4 shadow-lg">
        <h2 className="mb-3 text-center">Jouer à plusieurs</h2>
        <p className="text-center" style={{ color: "#9ca3af" }}>
          Choisissez une option pour continuer.
        </p>

        <div className="d-flex flex-column gap-3">
          <button
            className="btn btn-bg-theme"
            onClick={() => navigate("/create-room")}
          >
            Créer une salle
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate("/join-room")}
          >
            Rejoindre une salle
          </button>
        </div>

        <button
          className="btn btn-link mt-3"
          style={{ color: "#e5e7eb" }}
          onClick={() => navigate("/")}
        >
          Retour au menu principal
        </button>
      </div>
    </div>
  );
};

export default MultiplayerOptionsPage;
