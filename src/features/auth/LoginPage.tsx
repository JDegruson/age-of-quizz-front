import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { User } from "../../types/user";
import { useAuth } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";
import { BACKEND_URL } from "../../config";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import { extractBackendMessage } from "./utils/backendError";
import AuthCardLayout from "../../components/AuthCardLayout";

const buildLoginError = (message: string, status?: number) => {
  const normalizedMessage =
    message || "Une erreur est survenue lors de la connexion.";
  const shouldShowForgotPassword =
    status === 401 ||
    /mot de passe|password|identifiant|utilisateur|credentials/i.test(
      normalizedMessage,
    );

  if (!shouldShowForgotPassword) {
    return normalizedMessage;
  }

  return (
    <>
      {normalizedMessage}
      <br />
      <a href="/ask-mail" className="text-decoration-underline">
        Mot de passe oublié ?
      </a>
    </>
  );
};

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();
  const redirectMessage = location.state?.message || null;
  const [error, setError] = useState<React.ReactNode>(null);
  const { login } = useAuth(); // ✅ Utilisation du contexte
  const { user, setUser } = useUser();
  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const credentials = { username, password };

    try {
      const response = await axios.post(`${BACKEND_URL}/login`, credentials, {
        headers: { "Content-Type": "application/json" },
      });

      const user: User = response.data;
      const jwt = response.headers.authorization;

      if (!jwt) {
        throw new Error("Authorization header is missing");
      }

      user.jwt = jwt;
      setUser(user);

      login(); // ✅ Met à jour l'état global
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const backendMessage = extractBackendMessage(error.response?.data);
        setError(buildLoginError(backendMessage, error.response?.status));
        return;
      }

      setError("Une erreur est survenue lors de la connexion.");
    }
  };
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user]);
  return (
    <AuthCardLayout title="Connexion">
      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label htmlFor="username" className="form-label">
            Nom d'utilisateur
          </label>
          <input
            type="text"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nom d'utilisateur"
            className="form-control"
            id="username"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="form-label">
            Mot de passe
          </label>
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="form-control"
            id="password"
          />
        </div>
        {redirectMessage && (
          <Alert variant="info" className="mt-3">
            {redirectMessage}
          </Alert>
        )}
        {error && (
          <Alert variant="danger" className="mt-3">
            {error}
          </Alert>
        )}
        <Button id="loggingButton" type="submit">
          Connexion
        </Button>
      </form>
    </AuthCardLayout>
  );
};

export default LoginPage;
