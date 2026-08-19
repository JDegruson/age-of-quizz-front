import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const ChooseGameModePage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="container page-md mt-5">
      <Card padding="lg" className="d-flex flex-column align-items-center">
        <h2 className="fw-bold mb-3 text-center">Mode de jeu</h2>
        <p className="mb-4 text-center">
          Choisissez si vous souhaitez jouer seul ou à plusieurs.
        </p>
        <div className="d-flex flex-column gap-4 w-100">
          <Button
            className="fs-5 py-3 rounded-3 shadow-sm"
            onClick={() => navigate("/quizz/solo")}
          >
            Jouer en solo
          </Button>
          <Button
            variant="outline-theme"
            className="fs-5 py-3 rounded-3 shadow-sm"
            onClick={() => navigate("/quizz/multiplayer")}
            title="Mode multijoueur"
          >
            Jouer à plusieurs
          </Button>
        </div>
        <div className="text-center mt-4">
          <Button
            variant="link"
            onClick={() => navigate("/")}
            style={{ color: "#e0e0e0" }}
          >
            ← Retour à l'accueil
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ChooseGameModePage;
