import axios from "axios";
import BACKEND_URL from "../config";

const API_URL = BACKEND_URL;

export interface CreateRoomRequest {
  displayName?: string;
}

export interface CreateRoomResponse {
  code: any;
}

export interface StartGameRequest {
  participantId?: string;
}

export interface ReadyRequest {
  participantId?: string;
  ready?: boolean;
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
