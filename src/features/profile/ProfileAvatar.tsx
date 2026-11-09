import React, { useEffect, useState } from "react";
import styles from "./UserProfile.module.css";
import { getAvatarUrl } from "../../utils/avatars";

interface ProfileAvatarProps {
  avatar?: string | null;
  pseudo: string;
  /** Diameter in px (default 110). */
  size?: number;
}

/** Avatar image, falling back to the pseudo's initial when it can't load. */
const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  avatar,
  pseudo,
  size = 110,
}) => {
  const [failed, setFailed] = useState(false);
  const url = getAvatarUrl(avatar);

  useEffect(() => {
    setFailed(false);
  }, [avatar]);

  const sizeStyle = { width: size, height: size };

  if (!url || failed) {
    return (
      <div
        className={styles.avatarInitial}
        style={{ ...sizeStyle, fontSize: size * 0.42 }}
        aria-hidden="true"
      >
        {(pseudo || "?").charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={`Avatar de ${pseudo}`}
      className={`rounded-circle ${styles.avatar}`}
      style={sizeStyle}
      onError={() => setFailed(true)}
    />
  );
};

export default ProfileAvatar;
