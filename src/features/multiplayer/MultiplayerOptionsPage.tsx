// Ajout d'une page intermédiaire pour choisir entre créer ou rejoindre une salle
import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

const MultiplayerOptionsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container page-md mt-5">
      <Card>
        <h2 className="mb-3 text-center">Jouer à plusieurs</h2>
        <p className="text-center" style={{ color: "#9ca3af" }}>
          Choisissez une option pour continuer.
        </p>
        <div className="d-flex flex-column gap-3">
          <Button onClick={() => navigate("/create-room")}>
            Créer une salle
          </Button>
          <Button
            variant="outline-secondary"
            onClick={() => navigate("/join-room")}
          >
            Rejoindre une salle
          </Button>
        </div>
        <Button
          variant="link"
          className="mt-3"
          style={{ color: "#e5e7eb" }}
          onClick={() => navigate("/")}
        >
          Retour au menu principal
        </Button>
      </Card>
    </div>
  );
};

export default MultiplayerOptionsPage;
