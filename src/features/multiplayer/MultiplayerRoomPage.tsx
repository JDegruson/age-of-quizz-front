import React from "react";
import { useMultiplayerRoom } from "./hooks/useMultiplayerRoom";
import PseudoField from "./components/PseudoField";
import RoomCodeField from "./components/RoomCodeField";
import RoomStatusPanel from "./components/RoomStatusPanel";
import LobbyPlayersTable from "./components/LobbyPlayersTable";
import RoomActionButtons from "./components/RoomActionButtons";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";

interface MultiplayerRoomPageProps {
  mode: "create" | "join";
}

const MultiplayerRoomPage: React.FC<MultiplayerRoomPageProps> = ({ mode }) => {
  const {
    roomCode,
    setRoomCode,
    pseudo,
    setPseudo,
    isAnonymous,
    trimmedPseudo,
    status,
    isConnecting,
    isConnected,
    connectedRoomCode,
    lobbyPlayers,
    countdown,
    isReady,
    isStartingGame,
    lastEventType,
    error,
    isHost,
    canStartAsHost,
    allPlayersReady,
    canStartGame,
    currentUserLabel,
    disconnect,
    handleReady,
    handleStartGame,
    handleConnect,
    handleCreateRoom,
    navigate,
  } = useMultiplayerRoom(mode);

  const connectDisabled = isAnonymous && !trimmedPseudo;

  return (
    <div className="container page-md mt-5">
      <Card>
        <h2 className="mb-3 text-center">Multiplayer room</h2>
        <p className="text-center" style={{ color: "#9ca3af" }}>
          Join a room to receive live game events.
        </p>

        {isAnonymous && (
          <PseudoField
            value={pseudo}
            onChange={setPseudo}
            disabled={isConnecting || isConnected}
          />
        )}

        <RoomCodeField
          value={roomCode}
          onChange={setRoomCode}
          disabled={isConnecting || isConnected}
        />

        {error && (
          <Alert className="py-2" role="alert">
            {error}
          </Alert>
        )}

        <RoomStatusPanel
          status={status}
          lastEventType={lastEventType}
          currentUserLabel={currentUserLabel}
          isHost={isHost}
          countdown={countdown}
          connectedRoomCode={connectedRoomCode}
        />

        <LobbyPlayersTable players={lobbyPlayers} />

        <RoomActionButtons
          onConnect={() => handleConnect()}
          onDisconnect={disconnect}
          onReady={handleReady}
          onStartGame={handleStartGame}
          onCreateRoom={handleCreateRoom}
          isConnecting={isConnecting}
          isConnected={isConnected}
          isReady={isReady}
          isStartingGame={isStartingGame}
          canStartGame={canStartGame}
          canStartAsHost={canStartAsHost}
          allPlayersReady={allPlayersReady}
          connectDisabled={connectDisabled}
        />

        <Button
          variant="link"
          className="mt-3"
          style={{ color: "#e5e7eb" }}
          onClick={() => navigate("/play")}
        >
          Back to game mode
        </Button>
      </Card>
    </div>
  );
};

export default MultiplayerRoomPage;
