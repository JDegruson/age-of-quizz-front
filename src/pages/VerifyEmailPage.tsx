import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { BACKEND_URL } from "../config";

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Token manquant ou invalide.");
      return;
    }

    fetch(
      `${BACKEND_URL}/users/verify-email?token=${encodeURIComponent(token)}`,
      { method: "GET" },
    )
      .then(async (res) => {
        if (res.ok) {
          setStatus("success");
          setMessage("Votre adresse email a bien été vérifiée !");
        } else {
          const text = await res.text();
          setStatus("error");
          setMessage(
            text ||
              "Le lien est invalide ou a expiré. Veuillez vous réinscrire.",
          );
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Une erreur est survenue. Veuillez réessayer plus tard.");
      });
  }, [searchParams]);

  return (
    <div
      className="container d-flex justify-content-center align-items-center"
      style={{ minHeight: "80vh" }}
    >
      <div
        className="card shadow-lg p-5 text-center"
        style={{ maxWidth: "500px", width: "100%" }}
      >
        {status === "loading" && (
          <>
            <div
              className="spinner-border text-primary mx-auto mb-4"
              role="status"
            >
              <span className="visually-hidden">Vérification en cours...</span>
            </div>
            <p className="lead">Vérification de votre email en cours...</p>
          </>
        )}

        {status === "success" && (
          <>
            <i
              className="bi bi-check-circle-fill text-success mb-3"
              style={{ fontSize: "3rem" }}
            ></i>
            <h4 className="mb-3">Email vérifié !</h4>
            <p className="text-muted mb-4">{message}</p>
            <Link to="/login" className="btn btn-primary rounded-pill px-4">
              Se connecter
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <i
              className="bi bi-x-circle-fill text-danger mb-3"
              style={{ fontSize: "3rem" }}
            ></i>
            <h4 className="mb-3">Vérification échouée</h4>
            <p className="text-muted mb-4">{message}</p>
            <Link
              to="/register"
              className="btn btn-outline-primary rounded-pill px-4"
            >
              Retour à l'inscription
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
