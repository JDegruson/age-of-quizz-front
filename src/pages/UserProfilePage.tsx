import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import UserProfile from "../components/UserProfile/UserProfileComponent";
import UpdateUserProfile from "../components/UserProfile/UpdateUserProfile";
import EditPasswordForm from "../components/UserProfile/EditPasswordForm";

import { useUser } from "../components/Context/UserContext";

const ProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const [isConnectedUser, setIsConnectedUser] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isEditingPassword, setIsEditingPassword] = useState<boolean>(false);
  const { user } = useUser();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsConnectedUser(false);
    if (user !== null) {
      if (user.userProfile.id === Number(id)) {
        setIsConnectedUser(true);
      }
    }
  }, [user, id]);

  const handleEditClick = () => {
    setSuccessMessage("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setSuccessMessage("");
    setIsEditing(false);
  }
  const handleUpdateProfile = () => {
    setSuccessMessage("");
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
  }
  const handleUpdatePassword = () => {
    setIsEditingPassword(false);
    setSuccessMessage("Mot de passe mis à jour avec succès !");
  };

  return (
    <div className="container">
      {successMessage && (
        <div className="alert alert-success text-center">{successMessage}</div>
      )}
      <div className="row">
        <div className="col-12 mb-4">
          {id &&
            (isEditing ? (
              <UpdateUserProfile
                idUser={Number(id)}
                onCancel={handleCancelEdit}
                onUpdate={handleUpdateProfile}
              />
            ) : isEditingPassword ? (
              <EditPasswordForm
                onCancel={handleCancelEditPassword}
                onUpdate={handleUpdatePassword}
              />
            ) : (
              <UserProfile idUser={Number(id)} isConnectedUser={isConnectedUser} />
            ))}

          {isConnectedUser && !isEditing && !isEditingPassword && (
            <>
              <div className="btn btn-bg-theme mt-3 me-3" onClick={handleEditClick}>
                Modifier mon profil
              </div>
              <div className="btn btn-bg-theme mt-3" onClick={handleEditPasswordClick}>
                Modifier mon mot de passe
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
