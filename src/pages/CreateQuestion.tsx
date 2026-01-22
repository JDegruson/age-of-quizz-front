import React from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function CreateQuestion() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();

  if (!type) {
    // fallback: if user hit this route directly, send to chooser
    navigate("/create-question");
    return null;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Créer une question — {type}</h2>

      {type === "multiple" && (
        <div>
          <p>Formulaire QCM (titre, 4 réponses, index de la bonne réponse)</p>
          {/* ...ajoutez votre formulaire QCM ici */}
        </div>
      )}

      {type === "truefalse" && (
        <div>
          <p>Formulaire Vrai / Faux (question, vrai ou faux)</p>
          {/* ...formulaire V/F */}
        </div>
      )}

      {type === "sound" && (
        <div>
          <p>Formulaire Identification de son (audio avec réponse)</p>
          {/* ...formulaire compléter */}
        </div>
      )}

      {type === "image" && (
        <div>
          <p>Formulaire Identification d'image (upload + options)</p>
          {/* ...formulaire image */}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <button onClick={() => navigate("/create-question")}>Retour</button>
      </div>
    </div>
  );
}
