// src/utils/playerLabel.ts
export function formatPlayerName(player: {
  userId: number;
  username: string;
}): string {
  return player.userId < 0 ? `${player.username} (anonyme)` : player.username;
}
