/**
 * Resolving the "participant id" used to identify a player (logged-in or
 * anonymous) in the multiplayer game room.
 *
 * QuizPage and MultiplayerRoomPage previously each had their own copy of
 * this logic, using the same sessionStorage key but with two intentionally
 * different fallback strategies:
 *   - on the quiz screen, we need *some* id to send with an answer even if
 *     nothing was stored yet, so we invent an anonymous one;
 *   - on the room/lobby screen, the id must come from the backend
 *     (createRoom/joinRoom response), so we return null rather than invent
 *     one that would never match what the server stored.
 *
 * Both strategies are kept here, sharing the same storage key and read
 * logic, so the duplication is only in intent, not in code.
 */

export const PARTICIPANT_ID_STORAGE_KEY = "multiplayer_participant_id";

type ParticipantLike = { id?: number | string | null } | null | undefined;

const getStoredParticipantId = (): string | null =>
  window.sessionStorage.getItem(PARTICIPANT_ID_STORAGE_KEY);

export const setStoredParticipantId = (participantId: string): void => {
  window.sessionStorage.setItem(PARTICIPANT_ID_STORAGE_KEY, participantId);
};

/** Quiz screen behaviour: always returns a usable id, generating one if needed. */
export const resolveOrGenerateParticipantId = (
  user: ParticipantLike,
): string => {
  if (user?.id !== undefined && user?.id !== null) {
    return `user_${user.id}`;
  }

  const fromStorage = getStoredParticipantId();
  if (fromStorage) {
    return fromStorage;
  }

  const generated = `anon_${Math.random().toString(36).slice(2, 10)}`;
  setStoredParticipantId(generated);
  return generated;
};

/** Room/lobby screen behaviour: never invents an id, returns null instead. */
export const resolveKnownParticipantId = (
  user: ParticipantLike,
): string | null => {
  if (user?.id !== undefined && user?.id !== null) {
    return `user_${user.id}`;
  }

  return getStoredParticipantId();
};
