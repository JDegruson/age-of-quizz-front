import React, { useState } from "react";
import { useUser } from "../Context/UserContext";
import { BACKEND_URL } from "../../config";

interface UpdateUserProfileProps {
  onCancel: () => void;
  onUpdate: () => void;
}

const EditPasswordForm: React.FC<UpdateUserProfileProps> = ({
  onCancel,
  onUpdate,
}) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { user } = useUser();

  const handleSubmit = async () => {
    if (!user) return;

    const invalids: string[] = [];

    if (!oldPassword.trim()) invalids.push("oldPassword");
    if (!newPassword.trim() || newPassword.length < 6) {
      invalids.push("newPassword");
    }
    if (
      !confirmPassword.trim() ||
      confirmPassword !== newPassword ||
      confirmPassword.length < 6
    ) {
      invalids.push("confirmPassword");
    }


    if (invalids.length > 0) {
      setInvalidFields(invalids);
      setError("Le mot de passe doit faire au moins 6 caractères et être confirmé correctement.");
      return;
    }

    setInvalidFields([]);
    setError(null);
    setLoading(true);

    try {
      const jwt = user.jwt;
      const response = await fetch(
        `${BACKEND_URL}/users/update-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify({ oldPassword, newPassword }),
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${await response.text()}`);
      }

      onUpdate();
    } catch (err: any) {
      const message = err.message || err.toString();
      if (message.includes("Ancien mot de passe incorrect")) {
        setError("L'ancien mot de passe est incorrect.");
        setInvalidFields(["oldPassword"]);
      } else {
        setError("Une erreur est survenue.");
      }
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <p className="text-center bg-theme p-2 rounded">
        Utilisateur introuvable.
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
      <label htmlFor={id} className="form-label">{label}</label>
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

  return (
    <div className="bg-theme p-2 rounded">
      <h1 className="text-center">Modifier mon mot de passe</h1>
      <div className="row">
        <div className="col-12 col-md-6 col-lg-4 m-auto p-3">
          <form className="mt-3">
            {error && <div className="alert alert-danger mt-3">{error}</div>}

            {renderPasswordField(
              "oldPassword",
              "Ancien mot de passe",
              oldPassword,
              setOldPassword,
              invalidFields.includes("oldPassword"),
              showOldPassword,
              setShowOldPassword,
              "Ancien mot de passe"
            )}

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
                className="btn btn-color-theme"
                onClick={onCancel}
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-bg-theme"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Mise à jour..." : "Mettre à jour"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPasswordForm;
