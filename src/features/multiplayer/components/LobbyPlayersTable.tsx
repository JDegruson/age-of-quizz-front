import React from "react";
import type { LobbyPlayer } from "../../../types/multiplayer";
import { formatPlayerName } from "../../../utils/playerLabel";
interface LobbyPlayersTableProps {
  players: LobbyPlayer[];
}

const LobbyPlayersTable: React.FC<LobbyPlayersTableProps> = ({ players }) => {
  return (
    <div className="mb-3">
      <h5 className="mb-2">Lobby players</h5>
      <div className="table-responsive">
        <table className="table table-dark table-striped table-sm align-middle mb-0">
          <thead>
            <tr>
              <th>User</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {players.length === 0 ? (
              <tr>
                <td colSpan={2} style={{ color: "#9ca3af" }}>
                  Waiting for player list...
                </td>
              </tr>
            ) : (
              players.map((player) => (
                <tr key={`${player.userId}-${player.username}`}>
                  <td>{formatPlayerName(player)}</td>
                  <td style={{ color: player.ready ? "#22c55e" : "#f59e0b" }}>
                    {player.ready ? "Ready" : "Not ready"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LobbyPlayersTable;
