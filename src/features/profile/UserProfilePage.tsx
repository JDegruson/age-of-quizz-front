import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import UserProfile from "./UserProfileComponent";
import UpdateUserProfile from "./UpdateUserProfile";
import EditPasswordForm from "./EditPasswordForm";

import { useUser } from "../../context/UserContext";

/**
 * /profile/:id shows any player's public profile; /profile shows the
 * logged-in user's own profile (with the edit buttons).
 */
const ProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isEditingPassword, setIsEditingPassword] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const ownProfileId = user?.userProfile?.id ?? null;
  const userProfileId = id ? Number(id) : ownProfileId;
  const isConnectedUser =
    ownProfileId !== null && userProfileId === ownProfileId;

  const handleEditClick = () => {
    setSuccessMessage("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setSuccessMessage("");
    setIsEditing(false);
  };
  const handleUpdateProfile = () => {
    setIsEditing(false);
    setSuccessMessage("Profil mis à jour avec succès !");
  };

  const handleEditPasswordClick = () => {
    setSuccessMessage("");
    setIsEditingPassword(true);
  };
  const handleCancelEditPassword = () => {
    setSuccessMessage("");
    setIsEditingPassword(false);
  };
  const handleUpdatePassword = () => {
    setIsEditingPassword(false);
    setSuccessMessage("Mot de passe mis à jour avec succès !");
  };

  if (userProfileId === null || Number.isNaN(userProfileId)) {
    return (
      <div className="container page-md mt-5">
        <p className="text-center bg-theme p-3 rounded">
          <Link to="/login">Connecte-toi</Link> pour voir ton profil.
        </p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {successMessage && (
        <div className="alert alert-success text-center">{successMessage}</div>
      )}

      {isConnectedUser && !isEditing && !isEditingPassword && (
        <div className="d-flex flex-wrap gap-2 justify-content-end mb-3">
          <button
            type="button"
            className="btn btn-bg-theme"
            onClick={handleEditClick}
          >
            Modifier mon profil
          </button>
          <button
            type="button"
            className="btn btn-bg-theme"
            onClick={handleEditPasswordClick}
          >
            Modifier mon mot de passe
          </button>
        </div>
      )}

      {isEditing ? (
        <UpdateUserProfile
          onCancel={handleCancelEdit}
          onUpdate={handleUpdateProfile}
        />
      ) : isEditingPassword ? (
        <EditPasswordForm
          onCancel={handleCancelEditPassword}
          onUpdate={handleUpdatePassword}
        />
      ) : (
        <UserProfile
          // Remount after an edit so the header reloads the saved values
          key={`${userProfileId}-${successMessage ?? ""}`}
          userProfileId={userProfileId}
        />
      )}
    </div>
  );
};

export default ProfilePage;
