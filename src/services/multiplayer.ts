import axios from "axios";
import BACKEND_URL from "../config";
import type { RoomSettings } from "../types/multiplayer";

const API_URL = BACKEND_URL;

export interface CreateRoomRequest {
  displayName?: string;
}

export interface CreateRoomResponse {
  code: any;
  participantId?: string;
}

export interface StartGameRequest {
  participantId?: string;
}

export interface ReadyRequest {
  participantId?: string;
  ready?: boolean;
}

export interface JoinRoomRequest {
  code: string;
  participantId?: string;
  displayName?: string;
}

export interface JoinRoomResponse {
  code: string;
  players: string[];
  participantId?: string;
}

export const createMultiplayerRoom = async (
  request: CreateRoomRequest = {},
  jwt?: string,
): Promise<CreateRoomResponse> => {
  console.log(jwt);
  const headers = jwt
    ? {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      }
    : {
        "Content-Type": "application/json",
      };
  const response = await axios.post(`${API_URL}/multiplayer/rooms`, request, {
    headers,
  });
  return response.data;
};

export const startMultiplayerRoom = async (
  roomCode: string,
  request: StartGameRequest = {},
  jwt?: string,
) => {
  const headers = jwt
    ? {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      }
    : {
        "Content-Type": "application/json",
      };

  const response = await axios.post(
    `${API_URL}/multiplayer/rooms/${encodeURIComponent(roomCode)}/start`,
    request,
    {
      headers,
    },
  );

  return response.data;
};

export const joinMultiplayerRoom = async (
  request: JoinRoomRequest,
  jwt?: string,
): Promise<JoinRoomResponse> => {
  const headers = jwt
    ? {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      }
    : {
        "Content-Type": "application/json",
      };
  const response = await axios.post(
    `${API_URL}/multiplayer/rooms/join`,
    request,
    { headers },
  );
  return response.data;
};

/** Leave the lobby; the server passes the host role on if needed. */
export const leaveMultiplayerRoom = async (
  roomCode: string,
  participantId?: string,
  jwt?: string,
) => {
  const headers = jwt
    ? { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };

  const response = await axios.post(
    `${API_URL}/multiplayer/rooms/${encodeURIComponent(roomCode)}/leave`,
    { participantId },
    { headers },
  );
  return response.data;
};

export const setMultiplayerPlayerReady = async (
  roomCode: string,
  request: ReadyRequest = { ready: true },
  jwt?: string,
) => {
  const headers = jwt
    ? {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      }
    : {
        "Content-Type": "application/json",
      };

  const response = await axios.post(
    `${API_URL}/multiplayer/rooms/${encodeURIComponent(roomCode)}/players/ready`,
    request,
    {
      headers,
    },
  );

  return response.data;
};

export const updateMultiplayerRoomSettings = async (
  roomCode: string,
  settings: RoomSettings,
  participantId?: string,
  jwt?: string,
): Promise<RoomSettings> => {
  const headers = jwt
    ? {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      }
    : {
        "Content-Type": "application/json",
      };

  const response = await axios.put(
    `${API_URL}/multiplayer/rooms/${encodeURIComponent(roomCode)}/settings`,
    { ...settings, participantId },
    { headers },
  );
  return response.data;
};

export const getMultiplayerRoomState = async (
  roomCode: string,
  jwt?: string,
) => {
  const headers = jwt ? { Authorization: `Bearer ${jwt}` } : {};
  const response = await axios.get(
    `${API_URL}/multiplayer/rooms/${encodeURIComponent(roomCode)}/state`,
    { headers },
  );
  return response.data;
};

/**
 * Brings the player back to the lobby of the same room after a finished
 * game. The first player to come back resets the room (and becomes host).
 */
export const requestRematch = async (
  roomCode: string,
  participantId?: string,
  jwt?: string,
): Promise<{ code: string }> => {
  try {
    const headers = jwt
      ? {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        }
      : {
          "Content-Type": "application/json",
        };

    const response = await axios.post(
      `${API_URL}/multiplayer/rooms/${encodeURIComponent(roomCode)}/rematch`,
      { participantId },
      { headers },
    );
    return response.data;
  } catch (error) {
    console.error("Error requesting rematch:", error);
    throw error;
  }
};
