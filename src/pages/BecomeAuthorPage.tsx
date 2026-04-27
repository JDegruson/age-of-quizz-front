import React from "react";

const BecomeAuthorPage: React.FC = () => {
  return (
    <div className="container" style={{ maxWidth: "800px", marginTop: "80px" }}>
      <div className="card shadow-lg p-5">
        <h1 className="text-center mb-4">
          <i className="bi bi-pencil-square me-2"></i>
          Devenir auteur
        </h1>

        <p className="lead text-center mb-5" style={{ color: "#b0b0b0" }}>
          Envie de contribuer à Age of Quizz et d'enrichir la base de questions
          pour toute la communauté ?
        </p>

        <div className="mb-4">
          <h4>
            <i className="bi bi-question-circle me-2 text-warning"></i>
            Pourquoi devenir auteur ?
          </h4>
          <ul className="mt-3" style={{ lineHeight: "2" }}>
            <li>
              Partage ta passion pour <strong>Age of Empires 2</strong> en
              créant des questions originales.
            </li>
            <li>
              Aide à faire grandir la communauté en proposant des questions sur
              les civilisations, les bâtiments, l'histoire et les mécaniques du
              jeu.
            </li>
            <li>
              Rejoins une équipe de passionnés qui construisent ensemble le
              meilleur quiz sur AoE2.
            </li>
            <li>
              Accède à des outils dédiés pour créer des questions à choix
              multiples, vrai/faux, sonores et visuelles.
            </li>
          </ul>
        </div>

        <div className="mb-5">
          <h4>
            <i className="bi bi-arrow-right-circle me-2 text-warning"></i>
            Comment devenir auteur ?
          </h4>
          <ol className="mt-3" style={{ lineHeight: "2" }}>
            <li>
              Rejoins notre serveur <strong>Discord</strong> via le lien
              ci-dessous.
            </li>
            <li>
              Présente-toi dans le canal dédié et exprime ta motivation à
              devenir auteur.
            </li>
            <li>
              Un administrateur t'attribuera le rôle <strong>Auteur</strong> et
              tu pourras commencer à créer des questions.
            </li>
          </ol>
        </div>

        <div className="text-center">
          <a
            href="https://discord.gg/bdHGsTD5Dg"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-lg btn-primary rounded-pill px-5 py-3 shadow"
          >
            <i className="bi bi-discord me-2"></i>
            Rejoindre le Discord
          </a>
        </div>
      </div>
    </div>
  );
};

export default BecomeAuthorPage;
