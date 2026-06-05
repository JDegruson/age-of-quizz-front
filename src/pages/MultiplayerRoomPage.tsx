import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../components/Context/UserContext";
import { GameRoomSocket, isGameRecapEvent } from "../services/gameRoomSocket";
import type { GameEvent } from "../types/multiplayer";
import {
  createMultiplayerRoom,
  setMultiplayerPlayerReady,
  startMultiplayerRoom,
} from "../services/multiplayer";

const normalizeRoomCode = (value: string) => value.trim().toUpperCase();

type LobbyPlayer = {
  userId: number;
  username: string;
  ready: boolean;
  avatar?: string | null;
};

const normalizeLobbyPlayers = (rawPlayers: any[]): LobbyPlayer[] => {
  return (rawPlayers || []).map((player: any) => ({
    userId: Number(player.userId ?? -1),
    username: String(player.username || `anon_${player.userId ?? -1}`),
    ready: Boolean(player.ready),
    avatar: player.avatar || null,
  }));
};

const MultiplayerRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  const socketRef = useRef<GameRoomSocket | null>(null);
  const cleanupFnsRef = useRef<Array<() => void>>([]);
  const connectedRoomCodeRef = useRef<string>("");

  const [roomCode, setRoomCode] = useState("");
  const [status, setStatus] = useState("Disconnected");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedRoomCode, setConnectedRoomCode] = useState<string | null>(
    null,
  );
  const [lobbyPlayers, setLobbyPlayers] = useState<LobbyPlayer[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hostUserId, setHostUserId] = useState<number | null>(null);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [lastEventType, setLastEventType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const disconnect = () => {
    cleanupFnsRef.current.forEach((cleanup) => cleanup());
    cleanupFnsRef.current = [];
    socketRef.current?.disconnect();
    socketRef.current = null;
    connectedRoomCodeRef.current = "";
    setIsConnected(false);
    setConnectedRoomCode(null);
    setLobbyPlayers([]);
    setCountdown(null);
    setIsReady(false);
    setHostUserId(null);
    setIsStartingGame(false);
    setStatus("Déconnecté");
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const extractQuestionsFromEvent = (event: GameEvent<unknown>) => {
    const payload = event.data as any;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.questions)) return payload.questions;
    if (payload?.question) return [payload.question];
    return null;
  };

  const toUserIdOrNull = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const resolveHostUserId = (payload: any): number | null => {
    if (!payload || typeof payload !== "object") {
      return null;
    }

    const hostCandidate = payload?.room?.host ?? payload?.host;
    if (!hostCandidate || typeof hostCandidate !== "object") {
      return null;
    }

    return toUserIdOrNull(
      (hostCandidate as any).userId ?? (hostCandidate as any).id,
    );
  };

  const updateLobbyState = (payload: any) => {
    if (!payload || typeof payload !== "object") {
      return;
    }

    if (Array.isArray(payload.players)) {
      setLobbyPlayers(normalizeLobbyPlayers(payload.players));
    }

    if (typeof payload.countdownSeconds === "number") {
      setCountdown(payload.countdownSeconds);
    } else if (typeof payload.startIn === "number") {
      setCountdown(payload.startIn);
    }

    if (typeof payload.status === "string") {
      setStatus(`Statut de la salle : ${payload.status}`);
    }

    const nextHostUserId = resolveHostUserId(payload);
    if (nextHostUserId !== null) {
      setHostUserId(nextHostUserId);
    }
  };

  const handleRoomEvent = (event: GameEvent<unknown>) => {
    setLastEventType(event.type);
    updateLobbyState(event.data as any);

    if (isGameRecapEvent(event)) {
      navigate("/quiz", {
        state: { gameRecap: event, roomCode: connectedRoomCodeRef.current },
      });
      return;
    }

    if (event.type === "NEW_QUESTION") {
      const rawQuestions = extractQuestionsFromEvent(event);
      if (rawQuestions && rawQuestions.length > 0) {
        navigate("/quiz", {
          state: {
            questions: rawQuestions,
            roomCode: connectedRoomCodeRef.current,
          },
        });
      }
      return;
    }

    if (event.type === "SCORES_UPDATED") {
      setStatus("Scores mis à jour");
    }

    if (
      event.type === "ROOM_STATE" ||
      event.type === "PLAYER_JOINED" ||
      event.type === "PLAYER_LEFT" ||
      event.type === "PLAYER_READY" ||
      event.type === "COUNTDOWN_STARTED"
    ) {
      setStatus(`Événement reçu : ${event.type}`);
    }
  };

  const handleReady = async () => {
    const activeRoomCode = connectedRoomCodeRef.current;
    if (!activeRoomCode) {
      return;
    }

    try {
      setError(null);
      setStatus("Envoi du statut prêt...");
      await setMultiplayerPlayerReady(
        activeRoomCode,
        { ready: true },
        user?.jwt,
      );
      setIsReady(true);
      setStatus("Prêt envoyé");
    } catch (readyError) {
      console.error("Failed to set player ready", readyError);
      setError("Impossible d'envoyer le statut prêt.");
      setStatus("Erreur lors de l'envoi du ready");
    }
  };

  const currentUserId = toUserIdOrNull(user?.id);
  const isHost =
    currentUserId !== null &&
    hostUserId !== null &&
    currentUserId === hostUserId;
  const canAssumeHostWhenUnknown = isConnected && hostUserId === null;
  const canStartAsHost = isHost || canAssumeHostWhenUnknown;
  const hasPlayersInLobby = lobbyPlayers.length > 0;
  const selfLobbyPlayer =
    currentUserId === null
      ? null
      : lobbyPlayers.find((player) => player.userId === currentUserId) || null;
  const allPlayersReady = hasPlayersInLobby
    ? lobbyPlayers.every((player) => player.ready)
    : isReady || Boolean(selfLobbyPlayer?.ready);
  const canStartGame =
    isConnected && canStartAsHost && allPlayersReady && !isStartingGame;

  const handleStartGame = async () => {
    const activeRoomCode = connectedRoomCodeRef.current;
    if (!activeRoomCode || !canStartGame) {
      return;
    }

    try {
      setIsStartingGame(true);
      setError(null);
      setStatus("Démarrage de la partie...");
      await startMultiplayerRoom(activeRoomCode, {}, user?.jwt);
      setStatus("Partie lancée");
    } catch (startError) {
      console.error("Failed to start game", startError);
      setError("Impossible de lancer la partie.");
      setStatus("Erreur au lancement de la partie");
    } finally {
      setIsStartingGame(false);
    }
  };

  const handleConnect = async (codeOverride?: string) => {
    const cleanedRoomCode = normalizeRoomCode(codeOverride ?? roomCode);
    if (!cleanedRoomCode) {
      setError("Please provide a room code.");
      return;
    }

    setError(null);
    setIsConnecting(true);
    setStatus("Connexion en cours...");

    try {
      disconnect();
      const socket = new GameRoomSocket(user?.jwt);
      socketRef.current = socket;
      await socket.connect();
      connectedRoomCodeRef.current = cleanedRoomCode;

      const roomCleanup = socket.subscribeRoomEvents(
        cleanedRoomCode,
        handleRoomEvent,
      );
      cleanupFnsRef.current.push(roomCleanup);

      const publicAnswerCleanup = socket.subscribeAnswerResultPublic(
        cleanedRoomCode,
        (result) => {
          const currentUserId = user?.id ?? -1;
          if (result.userId === currentUserId || currentUserId < 0) {
            setStatus("Answer feedback received");
          }
        },
      );
      cleanupFnsRef.current.push(publicAnswerCleanup);

      if ((user?.id ?? -1) >= 0) {
        const privateAnswerCleanup = socket.subscribeAnswerResultPrivate(
          cleanedRoomCode,
          () => {
            setStatus("Private answer feedback received");
          },
        );
        cleanupFnsRef.current.push(privateAnswerCleanup);
      }

      socket.sendJoinRoom(cleanedRoomCode, {
        userId: user?.id,
        username: user?.username,
      });

      setIsConnected(true);
      setConnectedRoomCode(cleanedRoomCode);
      setStatus(`Connecté à la salle ${cleanedRoomCode}`);
      setRoomCode(cleanedRoomCode);
    } catch (connectionError) {
      console.error("Failed to connect to room socket", connectionError);
      setError(
        "Échec de la connexion. Vérifiez le code de la salle et réessayez.",
      );
      setStatus("Connection failed");
      disconnect();
    } finally {
      setIsConnecting(false);
    }
  };

  // Flag pour éviter le double appel (StrictMode ou navigation double)
  const createRoomCalledRef = useRef(false);
  const handleCreateRoom = async () => {
    if (createRoomCalledRef.current) {
      console.log("handleCreateRoom: déjà appelé, on ignore");
      return;
    }
    createRoomCalledRef.current = true;
    console.log("handleCreateRoom called", Date.now());
    setIsConnecting(true);
    setStatus("Création de la salle...");
    setError(null);
    try {
      // Optionnel : displayName = username ou vide
      const displayName = user?.username || undefined;
      const res = await createMultiplayerRoom({ displayName }, user?.jwt);
      const code = res?.code;
      if (code) {
        setRoomCode(code);
        await handleConnect(code);
      } else {
        setError("Erreur lors de la création de la salle.");
        setStatus("Erreur création salle");
      }
    } catch (e) {
      setError("Erreur lors de la création de la salle.");
      setStatus("Erreur création salle");
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    if (location.pathname === "/create-room") {
      handleCreateRoom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container" style={{ maxWidth: 700, marginTop: 50 }}>
      <div className="card p-4 shadow-lg">
        <h2 className="mb-3 text-center">Multiplayer room</h2>
        <p className="text-center" style={{ color: "#9ca3af" }}>
          Join a room to receive live game events.
        </p>

        <div className="mb-3">
          <label htmlFor="room-code" className="form-label">
            Room code
          </label>
          <input
            id="room-code"
            className="form-control"
            placeholder="Example: ROOM123"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            disabled={isConnecting || isConnected}
          />
        </div>

        {error && (
          <div className="alert alert-danger py-2" role="alert">
            {error}
          </div>
        )}

        <div
          className="mb-3 p-3"
          style={{ backgroundColor: "#111827", borderRadius: 8 }}
        >
          <div>Status: {status}</div>
          {lastEventType && <div>Last event: {lastEventType}</div>}
          <div>Current user: {user?.username || "anonymous"}</div>
          <div>Role: {isHost ? "Host" : "Player"}</div>
          {countdown !== null && <div>Countdown: {countdown}s</div>}
          {connectedRoomCode && <div>Room: {connectedRoomCode}</div>}
        </div>

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
                {lobbyPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={2} style={{ color: "#9ca3af" }}>
                      Waiting for player list...
                    </td>
                  </tr>
                ) : (
                  lobbyPlayers.map((player) => (
                    <tr key={`${player.userId}-${player.username}`}>
                      <td>
                        {player.username}
                        {player.userId < 0 ? " (anonyme)" : ""}
                      </td>
                      <td
                        style={{ color: player.ready ? "#22c55e" : "#f59e0b" }}
                      >
                        {player.ready ? "Ready" : "Not ready"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-bg-theme flex-grow-1"
            onClick={() => handleConnect()}
            disabled={isConnecting || isConnected}
          >
            {isConnecting ? "Connecting..." : "Connect"}
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={disconnect}
            disabled={!isConnected}
          >
            Disconnect
          </button>
          <button
            className="btn btn-outline-gold"
            onClick={handleReady}
            disabled={!isConnected || isReady}
          >
            {isReady ? "Ready sent" : "Ready"}
          </button>
          <button
            className="btn btn-success"
            onClick={handleStartGame}
            disabled={!canStartGame}
          >
            {isStartingGame ? "Lancement..." : "Lancer la partie"}
          </button>
          <button
            className="btn btn-outline-primary"
            onClick={handleCreateRoom}
            disabled={isConnecting || isConnected}
          >
            Créer une salle
          </button>
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

        <button
          className="btn btn-link mt-3"
          style={{ color: "#e5e7eb" }}
          onClick={() => navigate("/play")}
        >
          Back to game mode
        </button>
      </div>
    </div>
  );
};

export default MultiplayerRoomPage;
