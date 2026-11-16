import React from "react";
import { Link } from "react-router-dom";
import { useMultiplayerRoom } from "./hooks/useMultiplayerRoom";
import PseudoField from "./components/PseudoField";
import RoomCodeField from "./components/RoomCodeField";
import RoomHeader from "./components/RoomHeader";
import LobbyPlayersTable from "./components/LobbyPlayersTable";
import RoomSettingsPanel from "./components/RoomSettingsPanel";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import Spinner from "../../components/ui/Spinner";
import styles from "./MultiplayerRoom.module.css";

interface MultiplayerRoomPageProps {
  mode: "create" | "join";
}

/**
 * Two steps: an entry form (create or join a room), then the lobby where
 * players get ready and the host tunes the options and starts the game.
 */
const MultiplayerRoomPage: React.FC<MultiplayerRoomPageProps> = ({ mode }) => {
  const {
    roomCode,
    setRoomCode,
    pseudo,
    setPseudo,
    isAnonymous,
    trimmedPseudo,
    isUserLoading,
    isConnecting,
    isConnected,
    connectedRoomCode,
    lobbyPlayers,
    countdown,
    isStartingGame,
    error,
    isHost,
    canStartAsHost,
    allPlayersReady,
    canStartGame,
    selfLobbyPlayer,
    selfReady,
    isSendingReady,
    roomSettings,
    isSavingSettings,
    handleReady,
    handleLeave,
    handleStartGame,
    handleUpdateSettings,
    handleConnect,
    handleCreateRoom,
    navigate,
  } = useMultiplayerRoom(mode);

  const errorAlert = error && (
    <Alert className="py-2" role="alert">
      {error}
    </Alert>
  );

  // ---- Lobby -------------------------------------------------------------
  if (isConnected && connectedRoomCode) {
    const readyCount = lobbyPlayers.filter((p) => p.ready).length;

    return (
      <div className="container page-md page-fit mt-5">
        <Card>
          <h1 className={styles.title}>Salon de la partie</h1>
          <p className={styles.subtitle}>
            {canStartAsHost
              ? "Tu es l'hôte : règle les options, puis lance la partie quand tout le monde est prêt."
              : "Mets-toi prêt et attends que l'hôte lance la partie."}
          </p>

          <RoomHeader roomCode={connectedRoomCode} />

          {countdown !== null && countdown > 0 && (
            <div className={styles.countdown} role="status">
              <i className="bi bi-alarm me-2" aria-hidden="true"></i>
              La partie commence dans {countdown} s
            </div>
          )}

          {errorAlert}

          <LobbyPlayersTable players={lobbyPlayers} self={selfLobbyPlayer} />

          <RoomSettingsPanel
            settings={roomSettings}
            editable={isHost}
            isSaving={isSavingSettings}
            onChange={handleUpdateSettings}
          />

          <div className={styles.actions}>
            {selfReady ? (
              <div className="text-center">
                <p className={styles.hint} style={{ color: "#22c55e" }}>
                  <i className="bi bi-check-circle-fill me-1" aria-hidden="true"></i>
                  Tu es prêt !
                </p>
                <Button
                  type="button"
                  variant="link"
                  className="btn-sm"
                  style={{ color: "#9ca3af" }}
                  onClick={() => handleReady(false)}
                  disabled={isSendingReady || isStartingGame}
                >
                  Finalement, je ne suis pas prêt
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant={canStartAsHost ? "outline-theme" : "theme"}
                className="btn-lg rounded-pill"
                onClick={() => handleReady(true)}
                disabled={isSendingReady}
              >
                <i className="bi bi-hand-thumbs-up-fill me-2" aria-hidden="true"></i>
                Je suis prêt
              </Button>
            )}

            {canStartAsHost ? (
              <>
                <Button
                  type="button"
                  variant="success"
                  className="btn-lg rounded-pill"
                  onClick={handleStartGame}
                  disabled={!canStartGame}
                >
                  <i className="bi bi-play-fill me-1" aria-hidden="true"></i>
                  {isStartingGame ? "Lancement..." : "Lancer la partie"}
                </Button>
                {!allPlayersReady && (
                  <p className={styles.hint}>
                    En attente que tout le monde soit prêt
                    {lobbyPlayers.length > 0 &&
                      ` (${readyCount} / ${lobbyPlayers.length})`}
                    .
                  </p>
                )}
              </>
            ) : (
              <div className={styles.hint}>
                <Spinner size="sm" className="me-2" label="En attente" />
                En attente du lancement par l'hôte...
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <Button
              type="button"
              variant="outline-secondary"
              onClick={async () => {
                await handleLeave();
                navigate("/");
              }}
            >
              <i className="bi bi-box-arrow-left me-1" aria-hidden="true"></i>
              Quitter la salle
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ---- Entry form (create / join) ------------------------------------------
  const isCreate = mode === "create";
  const missingPseudo = isAnonymous && !trimmedPseudo;
  // Création automatique en cours : rien à saisir
  const isAutoCreating = isCreate && (isUserLoading || isConnecting);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreate) {
      handleCreateRoom();
    } else {
      handleConnect();
    }
  };

  return (
    <div className="container page-md page-fit mt-5">
      <Card>
        <h1 className={styles.title}>
          {isCreate ? "Créer une partie" : "Rejoindre une partie"}
        </h1>
        <p className={styles.subtitle}>
          {isCreate
            ? "Crée une salle, puis invite tes amis avec son code."
            : "Entre le code de la salle que l'hôte t'a donné."}
        </p>

        {isAutoCreating ? (
          <div className={styles.loading} role="status">
            <Spinner />
            Création de la salle...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {isAnonymous && (
              <PseudoField
                value={pseudo}
                onChange={setPseudo}
                disabled={isConnecting}
                autoFocus={missingPseudo}
              />
            )}

            {!isCreate && (
              <RoomCodeField
                value={roomCode}
                onChange={setRoomCode}
                disabled={isConnecting}
                autoFocus={!missingPseudo && !roomCode}
              />
            )}

            {errorAlert}

            <Button
              type="submit"
              className="w-100 btn-lg rounded-pill"
              disabled={
                isConnecting || missingPseudo || (!isCreate && !roomCode.trim())
              }
            >
              {isConnecting ? (
                isCreate ? "Création..." : "Connexion..."
              ) : (
                <>
                  <i
                    className={`bi ${isCreate ? "bi-plus-lg" : "bi-box-arrow-in-right"} me-2`}
                    aria-hidden="true"
                  ></i>
                  {isCreate ? "Créer la salle" : "Rejoindre la salle"}
                </>
              )}
            </Button>
          </form>
        )}

        <div className={styles.footer}>
          <Button
            variant="link"
            className="px-0"
            style={{ color: "#e5e7eb" }}
            onClick={() => navigate("/")}
          >
            ← Retour à l'accueil
          </Button>
          <Link
            to={isCreate ? "/join-room" : "/create-room"}
            className="btn btn-link px-0"
            style={{ color: "#ffd700" }}
          >
            {isCreate ? "Tu as un code ? Rejoindre une partie" : "Créer ma propre partie"}
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default MultiplayerRoomPage;
