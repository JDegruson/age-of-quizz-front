import { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../../../context/UserContext";
import {
  GameRoomSocket,
  isGameRecapEvent,
} from "../../../services/gameRoomSocket";
import type { GameEvent } from "../../../types/multiplayer";
import {
  createMultiplayerRoom,
  getMultiplayerRoomState,
  joinMultiplayerRoom,
  setMultiplayerPlayerReady,
  startMultiplayerRoom,
  updateMultiplayerRoomSettings,
} from "../../../services/multiplayer";
import {
  extractQuestionProgress,
  extractQuestionsFromEvent,
} from "../utils/gameEvents";
import {
  resolveKnownParticipantId,
  setStoredParticipantId,
} from "../utils/participant";
import {
  DEFAULT_ROOM_SETTINGS,
  type LobbyPlayer,
  type RoomSettings,
} from "../../../types/multiplayer";

const normalizeRoomCode = (value: string) => value.trim().toUpperCase();

const PSEUDO_STORAGE_KEY = "multiplayer_pseudo";

const normalizeLobbyPlayers = (rawPlayers: any[]): LobbyPlayer[] => {
  return (rawPlayers || []).map((player: any) =>
    // Older payloads only carried usernames
    typeof player === "string"
      ? {
          participantKey: null,
          userId: -1,
          username: player,
          ready: false,
          isHost: false,
        }
      : {
          participantKey: player.participantKey ?? null,
          userId: Number(player.userId ?? -1),
          username: String(player.username || `anon_${player.userId ?? -1}`),
          ready: Boolean(player.ready),
          isHost: Boolean(player.host),
          avatar: player.avatar || null,
          userProfileId:
            typeof player.userProfileId === "number"
              ? player.userProfileId
              : null,
        },
  );
};

/**
 * Key identifying the current client in the room, in the backend format:
 * "user:<id>" for logged-in users, the stored participantId for guests.
 */
const resolveSelfParticipantKey = (
  user: { id?: number | string | null } | null,
): string | null => {
  if (user?.id !== undefined && user?.id !== null) {
    return `user:${user.id}`;
  }
  return resolveKnownParticipantId(user);
};

/**
 * Encapsulates the whole multiplayer lobby lifecycle: socket connection,
 * room state derived from server events, and the connect/ready/start/create
 * handlers. Extracted from MultiplayerRoomPage so the page component can
 * stay a thin render layer.
 */
export function useMultiplayerRoom(mode: "create" | "join") {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  const socketRef = useRef<GameRoomSocket | null>(null);
  const cleanupFnsRef = useRef<Array<() => void>>([]);
  const connectedRoomCodeRef = useRef<string>("");

  const [roomCode, setRoomCode] = useState("");
  const [pseudo, setPseudo] = useState(
    () => window.localStorage.getItem(PSEUDO_STORAGE_KEY) || "",
  );
  const isAnonymous = !user?.username;
  const trimmedPseudo = pseudo.trim();
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
  const [hostParticipantKey, setHostParticipantKey] = useState<string | null>(
    null,
  );
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [lastEventType, setLastEventType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roomSettings, setRoomSettings] = useState<RoomSettings>(
    DEFAULT_ROOM_SETTINGS,
  );
  const [isSavingSettings, setIsSavingSettings] = useState(false);

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
    setHostParticipantKey(null);
    setIsStartingGame(false);
    setRoomSettings(DEFAULT_ROOM_SETTINGS);
    setStatus("Déconnecté");
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requireDisplayName = (): string | null => {
    if (user?.username) {
      return user.userProfile?.pseudo || user.username;
    }
    if (!trimmedPseudo) {
      setError("Merci de choisir un pseudo avant de rejoindre une salle.");
      return null;
    }
    window.localStorage.setItem(PSEUDO_STORAGE_KEY, trimmedPseudo);
    return trimmedPseudo;
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

    const nextHostKey = (payload?.room?.host ?? payload?.host)?.participantKey;
    if (typeof nextHostKey === "string") {
      setHostParticipantKey(nextHostKey);
    }

    if (payload.settings && typeof payload.settings === "object") {
      setRoomSettings(payload.settings as RoomSettings);
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
            questionProgress: extractQuestionProgress(event.data),
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
      event.type === "COUNTDOWN_STARTED" ||
      event.type === "ROOM_SETTINGS_UPDATED"
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
        {
          ready: true,
          participantId: resolveKnownParticipantId(user) ?? undefined,
        },
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
  const selfParticipantKey = resolveSelfParticipantKey(user);
  // Guests all share userId -1 on the backend, so the participant key is the
  // only reliable way to recognise the host
  const isHost =
    hostParticipantKey !== null
      ? selfParticipantKey === hostParticipantKey
      : currentUserId !== null &&
        hostUserId !== null &&
        currentUserId === hostUserId;
  const canAssumeHostWhenUnknown =
    isConnected && hostUserId === null && hostParticipantKey === null;
  const canStartAsHost = isHost || canAssumeHostWhenUnknown;
  const hasPlayersInLobby = lobbyPlayers.length > 0;
  const selfLobbyPlayer =
    lobbyPlayers.find(
      (player) =>
        player.participantKey !== null &&
        player.participantKey === selfParticipantKey,
    ) ||
    (currentUserId === null
      ? null
      : lobbyPlayers.find((player) => player.userId === currentUserId) ||
        null);
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
      await startMultiplayerRoom(
        activeRoomCode,
        { participantId: resolveKnownParticipantId(user) ?? undefined },
        user?.jwt,
      );
      setStatus("Partie lancée");
    } catch (startError) {
      console.error("Failed to start game", startError);
      setError("Impossible de lancer la partie.");
      setStatus("Erreur au lancement de la partie");
    } finally {
      setIsStartingGame(false);
    }
  };

  // Host only: the server broadcasts ROOM_SETTINGS_UPDATED to every client,
  // the local state is applied right away so the form stays responsive.
  const handleUpdateSettings = async (nextSettings: RoomSettings) => {
    const activeRoomCode = connectedRoomCodeRef.current;
    if (!activeRoomCode || !isHost) {
      return;
    }

    const previousSettings = roomSettings;
    setRoomSettings(nextSettings);
    try {
      setIsSavingSettings(true);
      setError(null);
      const saved = await updateMultiplayerRoomSettings(
        activeRoomCode,
        nextSettings,
        resolveKnownParticipantId(user) ?? undefined,
        user?.jwt,
      );
      setRoomSettings(saved);
    } catch (settingsError) {
      console.error("Failed to update room settings", settingsError);
      setRoomSettings(previousSettings);
      setError("Impossible de modifier les options de la partie.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleConnect = async (
    codeOverride?: string,
    options: { alreadyJoined?: boolean } = {},
  ) => {
    const cleanedRoomCode = normalizeRoomCode(codeOverride ?? roomCode);
    if (!cleanedRoomCode) {
      setError("Please provide a room code.");
      return;
    }

    const displayName = requireDisplayName();
    if (!displayName) {
      return;
    }

    setError(null);
    setIsConnecting(true);
    setStatus("Connexion en cours...");

    try {
      if (!options.alreadyJoined) {
        const joinResponse = await joinMultiplayerRoom(
          {
            code: cleanedRoomCode,
            displayName,
            participantId: resolveKnownParticipantId(user) ?? undefined,
          },
          user?.jwt,
        );
        if (joinResponse.participantId) {
          setStoredParticipantId(joinResponse.participantId);
        }
      }

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

      setIsConnected(true);
      setConnectedRoomCode(cleanedRoomCode);
      setStatus(`Connecté à la salle ${cleanedRoomCode}`);
      setRoomCode(cleanedRoomCode);

      // Our own PLAYER_JOINED was broadcast before we subscribed: fetch the
      // current lobby so we see players (and their ready state) already there
      try {
        const roomState = await getMultiplayerRoomState(
          cleanedRoomCode,
          user?.jwt,
        );
        updateLobbyState(roomState);
      } catch (stateError) {
        console.error("Failed to fetch room state", stateError);
      }
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

    const displayName = requireDisplayName();
    if (!displayName) {
      return;
    }

    createRoomCalledRef.current = true;
    console.log("handleCreateRoom called", Date.now());
    setIsConnecting(true);
    setStatus("Création de la salle...");
    setError(null);
    try {
      const res = await createMultiplayerRoom({ displayName }, user?.jwt);
      const code = res?.code;
      if (res?.participantId) {
        setStoredParticipantId(res.participantId);
      }
      if (code) {
        setRoomCode(code);
        await handleConnect(code, { alreadyJoined: true });
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
    if (mode === "create") {
      handleCreateRoom();
      return;
    }
    // Coming back from a rematch: the server already put us back in the room
    const rejoinRoomCode = (location.state as { rejoinRoomCode?: string })
      ?.rejoinRoomCode;
    if (rejoinRoomCode) {
      setRoomCode(rejoinRoomCode);
      handleConnect(rejoinRoomCode, { alreadyJoined: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentUserLabel =
    user?.userProfile?.pseudo ||
    user?.username ||
    trimmedPseudo ||
    "Utilisateur non connecté";

  return {
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
    roomSettings,
    isSavingSettings,
    disconnect,
    handleReady,
    handleStartGame,
    handleUpdateSettings,
    handleConnect,
    handleCreateRoom,
    navigate,
  };
}
