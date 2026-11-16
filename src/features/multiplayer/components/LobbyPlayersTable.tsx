import React from "react";
import { Link } from "react-router-dom";
import type { LobbyPlayer } from "../../../types/multiplayer";
import ProfileAvatar from "../../profile/ProfileAvatar";
import styles from "../MultiplayerRoom.module.css";

interface LobbyPlayersTableProps {
  players: LobbyPlayer[];
  self: LobbyPlayer | null;
}

const isSamePlayer = (a: LobbyPlayer, b: LobbyPlayer | null) =>
  !!b &&
  (a.participantKey !== null
    ? a.participantKey === b.participantKey
    : a.userId === b.userId && a.username === b.username);

/** Lobby players with host / guest / "you" tags and their ready state. */
const LobbyPlayersTable: React.FC<LobbyPlayersTableProps> = ({
  players,
  self,
}) => {
  const readyCount = players.filter((p) => p.ready).length;

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>
        <span>
          <i className="bi bi-people-fill me-2" aria-hidden="true"></i>
          Joueurs ({players.length})
        </span>
        {players.length > 0 && (
          <span className={styles.muted}>
            {readyCount} / {players.length} prêt{readyCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {players.length === 0 ? (
        <p className={`${styles.muted} mb-0`}>Chargement des joueurs...</p>
      ) : (
        <ul className={styles.players}>
          {players.map((player) => {
            const isMe = isSamePlayer(player, self);
            const isGuest = player.userId < 0;
            return (
              <li
                key={
                  player.participantKey ?? `${player.userId}-${player.username}`
                }
                className={`${styles.player} ${isMe ? styles.playerMe : ""}`}
              >
                <ProfileAvatar
                  avatar={player.avatar ?? null}
                  pseudo={player.username}
                  size={32}
                />
                <span className={styles.playerName}>
                  {player.userProfileId ? (
                    // Nouvel onglet : quitter la page ferait perdre la salle
                    <Link
                      to={`/profile/${player.userProfileId}`}
                      target="_blank"
                      rel="noopener"
                      title={`Voir le profil de ${player.username}`}
                      style={{ color: "inherit" }}
                    >
                      {player.username}
                    </Link>
                  ) : (
                    player.username
                  )}
                  {isMe && <span className={styles.tag}>toi</span>}
                  {player.isHost && (
                    <span className={`${styles.tag} ${styles.tagHost}`}>
                      <i className="bi bi-star-fill me-1" aria-hidden="true"></i>
                      Hôte
                    </span>
                  )}
                  {isGuest && <span className={styles.tag}>invité</span>}
                </span>
                {player.ready ? (
                  <span className={styles.ready}>
                    <i
                      className="bi bi-check-circle-fill me-1"
                      aria-hidden="true"
                    ></i>
                    Prêt
                  </span>
                ) : (
                  <span className={styles.notReady}>
                    <i
                      className="bi bi-hourglass-split me-1"
                      aria-hidden="true"
                    ></i>
                    Pas prêt
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default LobbyPlayersTable;
