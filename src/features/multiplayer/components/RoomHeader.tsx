import React, { useEffect, useState } from "react";
import Button from "../../../components/ui/Button";
import styles from "../MultiplayerRoom.module.css";

interface RoomHeaderProps {
  roomCode: string;
}

type Copied = "code" | "link" | null;

const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

/** Room code in big letters, with buttons to share it. */
const RoomHeader: React.FC<RoomHeaderProps> = ({ roomCode }) => {
  const [copied, setCopied] = useState<Copied>(null);
  const inviteLink = `${window.location.origin}/join-room?code=${encodeURIComponent(roomCode)}`;

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(null), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async (kind: "code" | "link") => {
    if (await copyText(kind === "code" ? roomCode : inviteLink)) {
      setCopied(kind);
    }
  };

  return (
    <div className={styles.roomHeader}>
      <div className={styles.roomCodeLabel}>Code de la salle</div>
      <div className={styles.roomCode}>{roomCode}</div>
      <div className={styles.copyButtons}>
        <Button
          type="button"
          variant="outline-theme"
          className="btn-sm"
          onClick={() => copy("code")}
        >
          <i
            className={`bi ${copied === "code" ? "bi-check-lg" : "bi-clipboard"} me-1`}
            aria-hidden="true"
          ></i>
          {copied === "code" ? "Code copié" : "Copier le code"}
        </Button>
        <Button
          type="button"
          variant="outline-theme"
          className="btn-sm"
          onClick={() => copy("link")}
        >
          <i
            className={`bi ${copied === "link" ? "bi-check-lg" : "bi-link-45deg"} me-1`}
            aria-hidden="true"
          ></i>
          {copied === "link" ? "Lien copié" : "Copier le lien d'invitation"}
        </Button>
      </div>
      <p className={`${styles.muted} mt-2 mb-0`}>
        Partage le code ou le lien pour que tes amis te rejoignent.
      </p>
    </div>
  );
};

export default RoomHeader;
