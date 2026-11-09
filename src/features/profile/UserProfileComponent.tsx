import React, { useEffect, useState } from "react";
import styles from "./UserProfile.module.css";
import type { UserProfile } from "../../types/user";
import { useUser } from "../../context/UserContext";
import { fetchUserProfile } from "../../services/userProfileApi";
import ProfileAvatar from "./ProfileAvatar";
import ProfileStats from "./ProfileStats";

interface UserProfileProps {
  userProfileId: number;
}

const UserProfileComponent: React.FC<UserProfileProps> = ({
  userProfileId,
}) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchUserProfile(userProfileId, user?.jwt)
      .then((data) => {
        if (!cancelled) setUserProfile(data);
      })
      .catch(() => {
        if (!cancelled) setError("Profil utilisateur non trouvé");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userProfileId, user?.jwt]);

  if (loading)
    return <p className="text-center bg-theme p-2 rounded">Chargement...</p>;
  if (error || !userProfile)
    return (
      <p className="text-center bg-theme p-2 rounded text-danger">
        {error ?? "Utilisateur introuvable."}
      </p>
    );

  return (
    <>
      <div className={`p-3 mb-4 rounded bg-theme ${styles.header}`}>
        <ProfileAvatar
          avatar={userProfile.avatar}
          pseudo={userProfile.pseudo}
        />
        <div className={styles.headerInfo}>
          <h1 className={styles.pseudo}>{userProfile.pseudo}</h1>
          {userProfile.pseudoDiscord && (
            <div className={styles.discord}>
              <i className="bi bi-discord me-1" aria-hidden="true"></i>
              {userProfile.pseudoDiscord}
            </div>
          )}
          {userProfile.bio && <p className={styles.bio}>{userProfile.bio}</p>}
        </div>
      </div>

      <ProfileStats userProfileId={userProfileId} jwt={user?.jwt} />
    </>
  );
};

export default UserProfileComponent;
