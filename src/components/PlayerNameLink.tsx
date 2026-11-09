import React from "react";
import { Link } from "react-router-dom";
import { formatPlayerName } from "../utils/playerLabel";

interface PlayerNameLinkProps {
  player: { userId: number; username: string; userProfileId?: number | null };
}

/**
 * Player name linking to their public profile (guests have none). Opens in
 * a new tab: leaving the lobby or the recap would drop the game.
 */
const PlayerNameLink: React.FC<PlayerNameLinkProps> = ({ player }) => {
  const label = formatPlayerName(player);
  if (!player.userProfileId) {
    return <>{label}</>;
  }
  return (
    <Link
      to={`/profile/${player.userProfileId}`}
      target="_blank"
      rel="noopener"
      title={`Voir le profil de ${player.username}`}
      style={{ color: "inherit" }}
    >
      {label}
    </Link>
  );
};

export default PlayerNameLink;
