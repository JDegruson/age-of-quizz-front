import React, { useEffect, useState } from "react";
import styles from "./UserProfile.module.css";
import { useUser } from "../Context/UserContext";
import { BACKEND_URL } from "../../config";
interface UpdateUserProfileProps {
  idUser: number;
  onCancel: () => void;
  onUpdate: () => void;
}

const UpdateUserProfile: React.FC<UpdateUserProfileProps> = ({
  idUser,
  onCancel,
  onUpdate,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [pseudoDoL, setPseudoDoL] = useState("");
  const [pseudoLoL, setPseudoLoL] = useState("");
  const [pseudoDiscord, setPseudoDiscord] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [email, setEmail] = useState("");

  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [availableAvatars, setAvailableAvatars] = useState<string[]>([]);

  const { user, setUser } = useUser();

  useEffect(() => {
    const getUser = async () => {
      try {
        const jwt = user?.jwt;
        const response = await fetch(`${BACKEND_URL}/users/current`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            `Erreur ${response.status}: ${await response.text()}`,
          );
        }

        const data = await response.json();
        setPseudoDoL(data.userProfile.pseudoDoL);
        setPseudoLoL(data.userProfile.pseudoLoL);
        setPseudoDiscord(data.userProfile.pseudoDiscord);
        setBio(data.userProfile.bio);
        setAvatar(data.userProfile.avatar);
        setEmail(data.email);
      } catch (err: any) {
        setError("Utilisateur introuvable");
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, [idUser]);

  useEffect(() => {
    // Liste manuelle, à adapter si besoin
    setAvailableAvatars([
      "avatar1.jpg",
      "avatar2.jpg",
      "avatar3.jpg",
      "avatar4.jpg",
      "avatar5.jpg",
    ]);
  }, []);

  const handleSubmit = async () => {
    if (!user) return;

    const updatedUser = {
      ...user,
      email: email.trim(),
      userProfile: {
        ...user.userProfile,
        pseudoDoL: pseudoDoL.trim(),
        pseudoLoL: pseudoLoL?.trim(),
        pseudoDiscord: pseudoDiscord?.trim(),
        bio: bio?.trim(),
        avatar,
      },
    };

    try {
      const jwt = user?.jwt;
      const response = await fetch(`${BACKEND_URL}/users/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(updatedUser),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${await response.text()}`);
      }
      onUpdate();
      setUser(updatedUser);
    } catch (err: any) {
      const message = err.message || err.toString();
      if (message.includes("UserWithSamePseudoExistException")) {
        setError("Ce pseudo DoL est déjà utilisé.");
      } else if (message.includes("email")) {
        setError("Cette adresse mail est déjà utilisée.");
      } else {
        setError("Une erreur est survenue.");
      }
    }
  };

  if (loading)
    return <p className="text-center bg-theme p-2 rounded">Chargement...</p>;
  if (!user)
    return (
      <p className="text-center bg-theme p-2 rounded">
        Utilisateur introuvable.
      </p>
    );

  return (
    <div className="bg-theme p-2 rounded">
      <h1 className="text-center">Modifier mon profil</h1>
      <div className="row">
        <div className="col-12 col-md-6 col-lg-4 m-auto p-3">
          <form className="mt-3">
            {error && <div className="alert alert-danger mt-3">{error}</div>}
            <div className="text-center">
              <div
                className={`mb-4 ${styles.avatarContainer}`}
                onClick={() => setShowAvatarPicker(true)}
              >
                <img
                  src={`/Avatar/${avatar}`}
                  alt={`Avatar de ${pseudoDoL}`}
                  className={`img-fluid rounded-circle ${styles.avatar}`}
                  style={{ cursor: "pointer" }}
                />
                <div className={`p-1 w-75 rounded small ${styles.overlayText}`}>
                  Changer mon avatar
                </div>
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor="pseudoDoL" className="form-label">
                Pseudo DoL
              </label>
              <input
                id="pseudoDoL"
                type="text"
                className="form-control"
                value={pseudoDoL}
                onChange={(e) => setPseudoDoL(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="pseudoLoL" className="form-label">
                Pseudo LoL
              </label>
              <input
                id="pseudoLoL"
                type="text"
                className="form-control"
                value={pseudoLoL}
                onChange={(e) => setPseudoLoL(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="pseudoDiscord" className="form-label">
                Pseudo Discord
              </label>
              <input
                id="pseudoDiscord"
                type="text"
                className="form-control"
                value={pseudoDiscord}
                onChange={(e) => setPseudoDiscord(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="bio" className="form-label">
                Bio
              </label>
              <textarea
                id="bio"
                className="form-control"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-color-theme"
                onClick={onCancel}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-bg-theme"
                onClick={handleSubmit}
              >
                Mettre à jour
              </button>
            </div>
          </form>
        </div>
      </div>

      {showAvatarPicker && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setShowAvatarPicker(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()} // éviter la fermeture au clic interne
          >
            <h5 className="text-center mb-4">Choisir un avatar</h5>
            <div className="d-flex flex-wrap gap-2 justify-content-center">
              {availableAvatars.map((img) => (
                <img
                  key={img}
                  src={`/Avatar/${img}`}
                  alt={img}
                  className={`${styles.avatarOption}`}
                  style={{ width: "80px", height: "80px", cursor: "pointer" }}
                  onClick={() => {
                    setAvatar(img);
                    setShowAvatarPicker(false);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateUserProfile;
