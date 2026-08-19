import React, { useState } from "react";
import axios from "axios";
import BACKEND_URL from "../../config";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";

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
    } catch {
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
      <Card shadow={false} style={{ maxWidth: 400, width: "100%" }}>
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
          <Button
            type="submit"
            disabled={loading}
            className="w-100 mt-2"
            style={{ fontSize: 18 }}
          >
            {loading ? "Envoi..." : "Envoyer"}
          </Button>
        </form>
        {message && (
          <Alert variant="success" className="mt-3 text-center">
            {message}
          </Alert>
        )}
        {error && <Alert className="mt-3 text-center">{error}</Alert>}
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
