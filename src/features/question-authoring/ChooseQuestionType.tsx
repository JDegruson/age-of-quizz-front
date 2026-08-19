import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { useRequireRole } from "../../hooks/useRequireRole";

export default function ChooseQuestionType() {
  const navigate = useNavigate();

  const { hasRequiredRole: isAuthor, isAuthLoading } = useRequireRole([
    "AUTHOR",
    "ADMIN",
  ]);

  if (isAuthLoading) {
    return null;
  }
  if (!isAuthor) {
    return null;
  }

  return (
    <div className="container page-md mt-5">
      <Card padding="lg" className="d-flex flex-column align-items-center">
        <h2 className="fw-bold mb-3 text-center">Création de question</h2>
        <p className="mb-4 text-center">
          Choisissez le type de question à créer.
        </p>
        <div
          className="d-flex flex-column gap-4 w-100"
          style={{ maxWidth: 400 }}
        >
          <Button
            variant="outline-theme"
            className="fs-5 py-3 rounded-3 shadow-sm"
            onClick={() => navigate("/create-question/multiple")}
          >
            QCM (choix multiple)
          </Button>
          <Button
            variant="outline-theme"
            className="fs-5 py-3 rounded-3 shadow-sm"
            onClick={() => navigate("/create-question/truefalse")}
          >
            Vrai / Faux
          </Button>
          <Button
            variant="outline-theme"
            className="fs-5 py-3 rounded-3 shadow-sm"
            onClick={() => navigate("/create-question/image")}
          >
            Question image
          </Button>
          <Button
            variant="outline-theme"
            className="fs-5 py-3 rounded-3 shadow-sm"
            onClick={() => navigate("/create-question/sound")}
          >
            Question audio
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
}
