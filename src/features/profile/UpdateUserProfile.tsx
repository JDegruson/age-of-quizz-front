import React, { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import { BACKEND_URL } from "../../config";
import ProfileAvatar from "./ProfileAvatar";
import styles from "./UserProfile.module.css";
import { AVAILABLE_AVATARS, getAvatarUrl } from "../../utils/avatars";

interface UpdateUserProfileProps {
  onCancel: () => void;
  onUpdate: () => void;
}

const UpdateUserProfile: React.FC<UpdateUserProfileProps> = ({
  onCancel,
  onUpdate,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [pseudo, setPseudo] = useState("");
  const [pseudoDiscord, setPseudoDiscord] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [email, setEmail] = useState("");

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
        setPseudo(data.userProfile.pseudo ?? "");
        setPseudoDiscord(data.userProfile.pseudoDiscord ?? "");
        setBio(data.userProfile.bio ?? "");
        setAvatar(data.userProfile.avatar ?? "");
        setEmail(data.email ?? "");
      } catch (err: any) {
        setError("Utilisateur introuvable");
      } finally {
        setLoading(false);
      }
    };
    getUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (!user) return;
    if (!pseudo.trim()) {
      setError("Le pseudo ne peut pas être vide.");
      return;
    }

    const updatedUser = {
      ...user,
      email: email.trim(),
      userProfile: {
        ...user.userProfile,
        pseudo: pseudo.trim(),
        pseudoDiscord: pseudoDiscord.trim(),
        bio: bio.trim(),
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
        setError("Ce pseudo est déjà utilisé.");
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
          <form className="mt-3" onSubmit={(e) => e.preventDefault()}>
            {error && <div className="alert alert-danger mt-3">{error}</div>}
            <div className="d-flex justify-content-center mb-3">
              <ProfileAvatar avatar={avatar} pseudo={pseudo} />
            </div>
            {AVAILABLE_AVATARS.length > 0 && (
              <fieldset className="mb-4">
                <legend className="form-label fs-6">Avatar</legend>
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  {AVAILABLE_AVATARS.map((file) => (
                    <button
                      key={file}
                      type="button"
                      className={`${styles.avatarOption} ${
                        file === avatar ? styles.avatarOptionSelected : ""
                      }`}
                      aria-pressed={file === avatar}
                      title={file}
                      onClick={() => setAvatar(file)}
                    >
                      <img src={getAvatarUrl(file) ?? undefined} alt="" />
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
            <div className="mb-3">
              <label htmlFor="pseudo" className="form-label">
                Pseudo
              </label>
              <input
                id="pseudo"
                type="text"
                className="form-control"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
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
    </div>
  );
};

export default UpdateUserProfile;
