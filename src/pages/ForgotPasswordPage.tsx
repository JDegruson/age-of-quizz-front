import React, { useState } from "react";
import axios from "axios";
import BACKEND_URL from "../config";

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await axios.post(`${BACKEND_URL}/users/forgot-password`, { email });
      setMessage("Si un compte existe, un email a été envoyé.");
    } catch (err: any) {
      setError("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container d-flex justify-content-center align-items-center"
      style={{ minHeight: "80vh" }}
    >
      <div className="card p-4" style={{ maxWidth: 400, width: "100%" }}>
        <h2 className="mb-4 text-center">Mot de passe oublié</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email" className="form-label">
            Adresse email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="form-control mb-3"
            placeholder="Votre adresse email"
            autoComplete="email"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn btn-bg-theme w-100 mt-2"
            style={{ fontSize: 18 }}
          >
            {loading ? "Envoi..." : "Envoyer"}
          </button>
        </form>
        {message && (
          <div className="alert alert-success mt-3 text-center">{message}</div>
        )}
        {error && (
          <div className="alert alert-danger mt-3 text-center">{error}</div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
