import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../components/UserProfile/interfaces";
import { BACKEND_URL } from "../config";

const extractBackendMessage = (payload: unknown): string => {
  if (typeof payload === "string") {
    return payload.trim();
  }

  if (payload && typeof payload === "object") {
    const errorPayload = payload as Record<string, unknown>;
    const candidateKeys = ["message", "error", "details"] as const;

    for (const key of candidateKeys) {
      const value = errorPayload[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  }

  return "";
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User>({
    id: 0,
    name: "",
    surname: "",
    username: "",
    password: "",
    email: "",
    enabled: true,
    roles: [],
    userProfile: {
      id: 0,
      bio: "",
      avatar: "",
      pseudo: "",
      pseudoDiscord: "",
    },
    jwt: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [pseudoError, setPseudoError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    const profileFields = ["pseudo", "pseudoDiscord", "bio", "avatar"];

    if (profileFields.includes(name)) {
      setUser({
        ...user,
        userProfile: {
          ...user.userProfile,
          [name]: value,
        },
      });
    } else {
      setUser({
        ...user,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUsernameError(null);
    setPseudoError(null);
    setPasswordError(false);
    setEmailError(null);
    setConfirmError(false);
    setError(null);

    if (user.password.length < 6) {
      setPasswordError(true);
      return;
    }
    if (confirmPassword !== user.password) {
      setConfirmError(true);
      return;
    }

    try {
      setIsLoading(true);
      const cleanedUser = trimUserFields(user);

      const response = await fetch(`${BACKEND_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedUser),
      });
      if (!response.ok) {
        const rawMessage = await response.text();
        const backendMessage = extractBackendMessage(rawMessage);

        if (backendMessage.includes("UserWithSamePseudoExistException")) {
          setPseudoError("Ce pseudo Age of Quizz est déjà utilisé.");
        } else if (
          backendMessage.includes("UserWithSameUsernameExistException")
        ) {
          setUsernameError("Cet identifiant est déjà utilisé.");
        } else if (/email/i.test(backendMessage)) {
          setEmailError(
            backendMessage || "Cette adresse mail est déjà utilisée.",
          );
        } else {
          setError(
            backendMessage || "Une erreur est survenue lors de l'inscription.",
          );
        }

        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      alert("Inscription réussie !");
      navigate("/login");
    } catch (error: any) {
      setIsLoading(false);
      const message = error.message || error.toString();
      if (message.includes("UserWithSamePseudoExistException")) {
        setPseudoError("Ce pseudo Age of Quizz est déjà utilisé.");
        setUsernameError(null);
        setEmailError(null);
      } else if (message.includes("UserWithSameUsernameExistException")) {
        setUsernameError("Cet identifiant est déjà utilisé.");
        setPseudoError(null);
        setEmailError(null);
      } else if (message.includes("email")) {
        setUsernameError(null);
        setPseudoError(null);
        setEmailError(message);
      } else {
        setError(message || "Une erreur est survenue lors de l'inscription.");
        setPseudoError(null);
      }
    }
  };

  const trimUserFields = (user: any) => {
    return {
      ...user,
      username: user.username?.trim(),
      email: user.email?.trim(),
      userProfile: {
        ...user.userProfile,
        pseudo: user.userProfile?.pseudo?.trim(),
      },
    };
  };
  return (
    <div
      className="container d-flex justify-content-center align-items-center"
      style={{ minHeight: "80vh" }}
    >
      <div
        className="col-12 col-md-6 col-lg-4 p-2 rounded"
        style={{ backgroundColor: "#2d2d2d" }}
      >
        <div
          className="register-container p-3 text-center rounded"
          style={{ backgroundColor: "#2d2d2d" }}
        >
          <h1 className="mb-4" style={{ color: "#f0f0f0" }}>
            Inscription
          </h1>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="username" className="form-label">
                Nom d'utilisateur
              </label>
              <input
                type="text"
                name="username"
                value={user.username}
                placeholder="Nom d'utilisateur"
                onChange={handleChange}
                required
                className={`form-control ${usernameError ? "is-invalid" : ""}`}
                id="username"
              />
              {usernameError && (
                <div className="alert alert-danger mt-3">{usernameError}</div>
              )}
            </div>
            <div className="mb-4">
              <label htmlFor="pseudo" className="form-label">
                Pseudo Age of Quizz
              </label>
              <input
                type="text"
                name="pseudo"
                value={user.userProfile.pseudo}
                placeholder="Pseudo Age of Quizz"
                onChange={handleChange}
                required
                className={`form-control ${pseudoError ? "is-invalid" : ""}`}
                id="pseudo"
              />
              {pseudoError && (
                <div className="alert alert-danger mt-3">{pseudoError}</div>
              )}
            </div>
            <div className="mb-4 position-relative">
              <label htmlFor="password" className="form-label">
                Mot de passe
              </label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={user.password}
                placeholder="Mot de passe"
                onChange={handleChange}
                required
                className="form-control"
                id="password"
              />
              <button
                type="button"
                className="btn btn-sm btn-outline-color-theme position-absolute border border-0"
                style={{ top: "50%", right: "10px" }}
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
              >
                <i
                  className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                />
              </button>
              {passwordError && (
                <div className="alert alert-danger mt-3">
                  Le mot de passe doit contenir au moins 6 caractères.
                </div>
              )}
            </div>
            <div className="mb-4 position-relative">
              <label htmlFor="confirmPassword" className="form-label">
                Confirmer le mot de passe
              </label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={confirmPassword}
                placeholder="Répétez le mot de passe"
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`form-control ${confirmError ? "is-invalid" : ""}`}
                id="confirmPassword"
              />
              <button
                type="button"
                className="btn btn-sm btn-outline-color-theme position-absolute border border-0"
                style={{ top: "50%", right: "10px" }}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                tabIndex={-1}
              >
                <i
                  className={`bi ${
                    showConfirmPassword ? "bi-eye-slash" : "bi-eye"
                  }`}
                />
              </button>
              {confirmError && (
                <div className="alert alert-danger mt-3">
                  Les mots de passe ne correspondent pas.
                </div>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="form-label">
                Adresse email
              </label>
              <input
                type="email"
                name="email"
                value={user.email}
                placeholder="Adresse email"
                onChange={handleChange}
                required
                className={`form-control ${emailError ? "is-invalid" : ""}`}
                id="email"
              />
              {emailError && (
                <div className="alert alert-danger mt-3">{emailError}</div>
              )}
            </div>
            {error && <div className="alert alert-danger mt-3">{error}</div>}
            <button
              type="submit"
              className="btn btn-bg-theme"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Inscription en cours...
                </>
              ) : (
                "S'inscrire"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
