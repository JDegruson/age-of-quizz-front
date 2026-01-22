import React, { useEffect, useState } from "react";
import styles from "./UserProfile.module.css";
import { UserProfile } from "./interfaces";
import { useUser } from "../Context/UserContext";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../../config";

interface UserProfileProps {
  idUser: number;
  isConnectedUser: boolean;
}

const UserProfileComponent: React.FC<UserProfileProps> = ({
  idUser,
  isConnectedUser,
}) => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(() => {
    const getUser = async () => {
      try {
        const jwt = user?.jwt;
        const response = await fetch(`${BACKEND_URL}/users/profile/${idUser}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });
        if (!response.ok) {
          throw new Error(
            `Erreur ${response.status}: ${await response.text()}`
          );
        }

        const data = await response.json();
        setUserProfile(data);
      } catch (err: any) {
        setError("Profil utilisateur non trouvé");
        console.log(err.message);
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, [idUser]);

  const openChatBox = async () => {
    if (!user || !userProfile) return;
    try {
      const jwt = user?.jwt;
      const sender = user.userProfile;
      const receiver = userProfile;
      const response = await fetch(`${BACKEND_URL}/chats/get-or-create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          sender,
          receiver,
        }),
      });
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${await response.text()}`);
      }
      navigate("/messagerie");
    } catch (err: any) {
      setError("Impossible d'envoyer un message à cet utilisateur");
      console.log(err.message);
    }
  };
  if (loading)
    return <p className="text-center bg-theme p-2 rounded">Chargement...</p>;
  if (error)
    return (
      <p className="text-center bg-theme p-2 rounded text-danger">{error}</p>
    );
  if (!userProfile)
    return (
      <p className="text-center bg-theme p-2 rounded">
        Utilisateur introuvable.
      </p>
    );

  return (
    <>
      <div className="row align-items-center mb-4 bg-theme rounded color-theme m-0">
        <div className="col-2 text-start">
          {/* (Facultatif) un bouton à gauche */}
        </div>

        <div className="col-8 text-center">
          <h1 className="m-0">{userProfile.pseudo}</h1>
        </div>

        <div className="col-2 text-end">
          {!isConnectedUser && (
            <button
              className="btn btn-color-theme-no-hover"
              title="Envoyer un message"
              onClick={openChatBox}
            >
              <i className="bi bi-chat-fill"></i>
            </button>
          )}
        </div>
      </div>
      <div className={`row align-items-center m-0`}>
        <div className="col-12 text-center mb-4">
          <img
            src={`/Avatar/${userProfile.avatar}`}
            alt={`Avatar de ${userProfile.pseudo}`}
            className={`img-fluid rounded-circle ${styles.avatar}`}
          />
        </div>
        <div className={`col-md-12 p-2 mb-4 rounded bg-theme`}>
          <div className="row text-center">
            <div className="col-4">
              <strong>Pseudo DoL :</strong> {userProfile.pseudo}
            </div>
            <div className="col-4">
              <strong>Pseudo LoL :</strong> {userProfile.pseudo}
            </div>
            <div className="col-4">
              <strong>Pseudo Discord :</strong> {userProfile.pseudoDiscord}
            </div>
          </div>
        </div>
      </div>

      <div className={`p-3 rounded bg-theme mb-3`}>
        <h5 className="mb-2">Bio</h5>
        <p className="mb-0">{userProfile.bio}</p>
      </div>
    </>
  );
};

export default UserProfileComponent;
