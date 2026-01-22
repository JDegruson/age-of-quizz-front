import { useLocation, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { useUser } from "../components/Context/UserContext";
import { BACKEND_URL } from "../config";

const ResetPasswordPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setNewToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [validated, setValidated] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { user, setUser } = useUser();
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user]);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenFromURL = params.get("token") || "";
    setNewToken(tokenFromURL);
  }, [location]);

  const handleSubmit = async () => {
    const invalids: string[] = [];

    if (!newPassword.trim() || newPassword.length < 6) {
      invalids.push("newPassword");
    }
    if (!confirmPassword.trim() || confirmPassword !== newPassword) {
      invalids.push("confirmPassword");
    }

    if (invalids.length > 0) {
      setInvalidFields(invalids);
      setError(
        "Le mot de passe doit faire au moins 6 caractères et être confirmé correctement."
      );
      return;
    }

    setInvalidFields([]);
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/users/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPassword, token }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${await response.text()}`);
      }
      setValidated(true);
    } catch (err: any) {
      setError("Token invalide");
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <p className="text-center bg-theme p-2 rounded text-danger">
        Le lien de réinitialisation est invalide, merci de faire une nouvelle
        demande.
      </p>
    );
  }

  const renderPasswordField = (
    id: string,
    label: string,
    value: string,
    setValue: React.Dispatch<React.SetStateAction<string>>,
    isInvalid: boolean,
    show: boolean,
    setShow: React.Dispatch<React.SetStateAction<boolean>>,
    placeholder?: string
  ) => (
    <div className="mb-3 position-relative">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <input
        id={id}
        type={show ? "text" : "password"}
        className={`form-control ${isInvalid ? "is-invalid" : ""}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
      />
      <button
        type="button"
        className="btn btn-sm btn-outline-color-theme position-absolute border border-0"
        style={{ top: "50%", right: "10px" }}
        onClick={() => setShow(!show)}
        tabIndex={-1}
      >
        <i className={`bi ${show ? "bi-eye-slash" : "bi-eye"}`} />
      </button>
    </div>
  );
  if (error && error === "Invalid token")
    return (
      <p className="text-center bg-theme p-2 rounded text-danger">
        Le lien de réinitialisation est invalide, merci de faire une nouvelle
        demande.
      </p>
    );
  if (validated)
    return (
      <p className="text-center bg-theme p-2 rounded text-success">
        Votre mot de passe a bien été modifié. Vous pouvez désormais{" "}
        <a href="/login">vous connecter.</a>
      </p>
    );
  return (
    <div className="bg-theme p-2 rounded">
      <h1 className="text-center">Modifier mon mot de passe</h1>
      <div className="row">
        <div className="col-12 col-md-6 col-lg-4 m-auto p-3">
          <form className="mt-3">
            {error && <div className="alert alert-danger mt-3">{error}</div>}

            {renderPasswordField(
              "newPassword",
              "Nouveau mot de passe",
              newPassword,
              setNewPassword,
              invalidFields.includes("newPassword"),
              showNewPassword,
              setShowNewPassword,
              "Nouveau mot de passe"
            )}

            <div className="mb-4">
              {renderPasswordField(
                "confirmPassword",
                "Confirmer le nouveau mot de passe",
                confirmPassword,
                setConfirmPassword,
                invalidFields.includes("confirmPassword"),
                showConfirmPassword,
                setShowConfirmPassword,
                "Répéter le mot de passe"
              )}
              {invalidFields.includes("confirmPassword") && (
                <div className="invalid-feedback d-block">
                  Les mots de passe ne correspondent pas.
                </div>
              )}
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-bg-theme"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Mise à jour..." : "Valider"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
