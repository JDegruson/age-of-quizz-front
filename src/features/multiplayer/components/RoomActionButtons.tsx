import React from "react";
import Button from "../../../components/ui/Button";

interface RoomActionButtonsProps {
  onConnect: () => void;
  onDisconnect: () => void;
  onReady: () => void;
  onStartGame: () => void;
  onCreateRoom: () => void;
  isConnecting: boolean;
  isConnected: boolean;
  isReady: boolean;
  isStartingGame: boolean;
  canStartGame: boolean;
  canStartAsHost: boolean;
  allPlayersReady: boolean;
  connectDisabled: boolean;
}

const RoomActionButtons: React.FC<RoomActionButtonsProps> = ({
  onConnect,
  onDisconnect,
  onReady,
  onStartGame,
  onCreateRoom,
  isConnecting,
  isConnected,
  isReady,
  isStartingGame,
  canStartGame,
  canStartAsHost,
  allPlayersReady,
  connectDisabled,
}) => {
  return (
    <>
      <div className="d-flex gap-2">
        <Button
          variant="theme"
          className="flex-grow-1"
          onClick={onConnect}
          disabled={isConnecting || isConnected || connectDisabled}
        >
          {isConnecting ? "Connecting..." : "Connect"}
        </Button>
        <Button
          variant="outline-secondary"
          onClick={onDisconnect}
          disabled={!isConnected}
        >
          Disconnect
        </Button>
        <Button
          variant="outline-theme"
          onClick={onReady}
          disabled={!isConnected || isReady}
        >
          {isReady ? "Ready sent" : "Ready"}
        </Button>
        <Button
          variant="success"
          onClick={onStartGame}
          disabled={!canStartGame}
        >
          {isStartingGame ? "Lancement..." : "Lancer la partie"}
        </Button>
        <Button
          variant="outline-primary"
          onClick={onCreateRoom}
          disabled={isConnecting || isConnected || connectDisabled}
        >
          Créer une salle
        </Button>
      </div>

      {isConnected && !allPlayersReady && (
        <div className="mt-2" style={{ color: "#f59e0b" }}>
          Tous les joueurs présents doivent être ready pour lancer la partie.
        </div>
      )}
      {isConnected && !canStartAsHost && (
        <div className="mt-1" style={{ color: "#9ca3af" }}>
          Seul l'hôte peut lancer la partie.
        </div>
      )}
    </>
  );
};

export default RoomActionButtons;
