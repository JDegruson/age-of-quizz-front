import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useUser } from "../components/Context/UserContext";
import { BACKEND_URL } from "../config";

const AskMailpage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, setUser } = useUser();
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      await axios.post(
        `${BACKEND_URL}/users/forgot-password`,
        {
          email,
        }
      );
      setStatusMessage(
        "Un email de réinitialisation a été envoyé si l'adresse existe dans notre base."
      );
    } catch (error) {
      setErrorMessage("Une erreur est survenue. Veuillez réessayer plus tard.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center">
      <div className="col-12 col-md-8 col-lg-6">
        <div className="login-container p-5 text-center rounded">
          <h1 className="mb-4">Réinitialiser le mot de passe</h1>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input
                type="email"
                placeholder="Adresse e-mail"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {statusMessage && (
              <div className="alert alert-success">{statusMessage}</div>
            )}
            {errorMessage && (
              <div className="alert alert-danger">{errorMessage}</div>
            )}
            <button
              type="submit"
              className="btn btn-bg-theme w-100"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Envoi en cours..." : "Envoyer le lien"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AskMailpage;
