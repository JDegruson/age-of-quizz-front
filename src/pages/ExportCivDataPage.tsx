import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUser } from "../components/Context/UserContext";
import { useAuth } from "../components/Context/AuthContext";
import { exportCivJsonToCsv } from "../services/api";

const extractCivName = (jsonString: string): string | null => {
  try {
    const data = JSON.parse(jsonString);

    // Cherche le nom de la civ dans les clés communes (priorité haute)
    const nameKeys = [
      "name",
      "libelle",
      "civilisation",
      "civ",
      "civilization",
      "title",
      "label",
      "nom",
    ];

    for (const key of nameKeys) {
      if (data[key]) {
        const value = String(data[key]).trim();
        if (value.length > 0) {
          return value.replace(/[^a-zA-Z0-9_\-]/g, "_").toUpperCase();
        }
      }
    }

    // Si le JSON est un tableau, prendre le premier objet
    if (Array.isArray(data) && data.length > 0) {
      const firstItem = data[0];
      for (const key of nameKeys) {
        if (firstItem[key]) {
          const value = String(firstItem[key]).trim();
          if (value.length > 0) {
            return value.replace(/[^a-zA-Z0-9_\-]/g, "_").toUpperCase();
          }
        }
      }
    }

    // Fallback: chercher la première clé string non-vide
    if (typeof data === "object" && data !== null && !Array.isArray(data)) {
      for (const key in data) {
        const value = data[key];
        if (typeof value === "string" && value.trim().length > 0) {
          return value
            .trim()
            .replace(/[^a-zA-Z0-9_\-]/g, "_")
            .toUpperCase();
        }
      }
    }

    return null;
  } catch {
    return null;
  }
};

const extractFilename = (contentDisposition?: string) => {
  if (!contentDisposition) return "CIV_DESCRIPTION.csv";

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const basicMatch = contentDisposition.match(/filename="?([^\";]+)"?/i);
  if (basicMatch?.[1]) {
    return basicMatch[1];
  }

  return "CIV_DESCRIPTION.csv";
};

const ExportCivDataPage: React.FC = () => {
  const [jsonInput, setJsonInput] = useState<string>("{");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { user } = useUser();
  const { isAuthenticated, isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const hasReviewerRole = user?.roles?.some(
    (role) => role.name === "REVIEWER" || role.name === "ADMIN",
  );

  useEffect(() => {
    if (!isAuthLoading) {
      if (!isAuthenticated) {
        navigate("/login", {
          state: {
            message: "Connecte-toi pour accéder à l'export JSON vers Excel.",
          },
        });
      } else if (!hasReviewerRole) {
        navigate("/");
      }
    }
  }, [isAuthLoading, isAuthenticated, hasReviewerRole, navigate]);

  const handleExport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.jwt) return;

    setError(null);
    setSuccess(null);

    try {
      JSON.parse(jsonInput);
    } catch {
      setError("Le JSON n'est pas valide.");
      return;
    }

    try {
      setIsSubmitting(true);
      const { blob } = await exportCivJsonToCsv(jsonInput, user.jwt);

      // Extraire le nom de la civ depuis le JSON
      const civName = extractCivName(jsonInput);
      const fileName = civName ? `CIV_${civName}.csv` : "CIV_DESCRIPTION.csv";

      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);

      setSuccess("Export terminé. Le téléchargement a démarré.");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setError("Accès refusé: rôle reviewer/admin requis.");
      } else {
        setError("Erreur lors de l'export. Vérifie le JSON et réessaie.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div style={{ textAlign: "center", padding: "50px", color: "#e5e7eb" }}>
        <p>Chargement...</p>
      </div>
    );
  }

  if (!hasReviewerRole) {
    return null;
  }

  return (
    <div className="container" style={{ maxWidth: "900px" }}>
      <div className="card bg-dark text-light border-secondary">
        <div className="card-body">
          <h2 className="card-title mb-3">Export JSON vers Excel (CSV)</h2>
          <p className="text-secondary mb-4">
            Colle le JSON à envoyer sur l'API puis clique sur Exporter pour
            télécharger le fichier.
          </p>

          <form onSubmit={handleExport}>
            <div className="mb-3">
              <label htmlFor="civ-json" className="form-label">
                JSON
              </label>
              <textarea
                id="civ-json"
                className="form-control"
                rows={16}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{"example": "value"}'
                style={{ backgroundColor: "#1f2937", color: "#f9fafb" }}
              />
              {jsonInput && jsonInput !== "{" && (
                <small className="text-muted d-block mt-2">
                  Nom extrait du JSON:{" "}
                  <strong>{extractCivName(jsonInput) || "Aucun trouvé"}</strong>
                </small>
              )}
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Export en cours..." : "Exporter et télécharger"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExportCivDataPage;
