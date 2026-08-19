import { useLocation, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { BACKEND_URL } from "../../config";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import PasswordField from "../../components/ui/PasswordField";

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
        "Le mot de passe doit faire au moins 6 caractères et être confirmé correctement.",
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

  if (error && error === "Token invalide")
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
            {error && <Alert className="mt-3">{error}</Alert>}

            <div className="mb-3 position-relative">
              <PasswordField
                id="newPassword"
                label="Nouveau mot de passe"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                visible={showNewPassword}
                onToggleVisibility={() => setShowNewPassword(!showNewPassword)}
                isInvalid={invalidFields.includes("newPassword")}
                placeholder="Nouveau mot de passe"
              />
            </div>

            <div className="mb-4">
              <div className="mb-3 position-relative">
                <PasswordField
                  id="confirmPassword"
                  label="Confirmer le nouveau mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  visible={showConfirmPassword}
                  onToggleVisibility={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  isInvalid={invalidFields.includes("confirmPassword")}
                  placeholder="Répéter le mot de passe"
                />
              </div>
              {invalidFields.includes("confirmPassword") && (
                <div className="invalid-feedback d-block">
                  Les mots de passe ne correspondent pas.
                </div>
              )}
            </div>

            <div className="d-flex gap-2">
              <Button type="button" onClick={handleSubmit} disabled={loading}>
                {loading ? "Mise à jour..." : "Valider"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
