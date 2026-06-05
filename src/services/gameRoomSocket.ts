import SockJS from "sockjs-client";
import { Client, IMessage, StompHeaders } from "@stomp/stompjs";
import type {
  AnswerProcessingResult,
  GameEvent,
  GameRecapPayload,
} from "../types/multiplayer";
import BACKEND_URL from "../config";

const WS_ENDPOINT_PATH =
  (import.meta.env.VITE_WS_ENDPOINT_PATH as string) || "/ws";

const toSockJsUrl = () => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL as string;
  }
  return `${BACKEND_URL}${WS_ENDPOINT_PATH}`;
};

const withAuthQuery = (url: string, jwt?: string) => {
  if (!jwt) {
    return url;
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}token=${encodeURIComponent(jwt)}`;
};

const parseMessage = <T>(message: IMessage): T | null => {
  try {
    return JSON.parse(message.body) as T;
  } catch (error) {
    console.error("Failed to parse STOMP message", error);
    return null;
  }
};

type SubscriptionCleanup = () => void;

export interface RoomAnswerPayload {
  answerIds: number[];
  participantId: string;
  questionId: number;
}

export class GameRoomSocket {
  private readonly client: Client;

  private getAuthHeaders(): StompHeaders {
    return this.jwt ? { Authorization: `Bearer ${this.jwt}` } : {};
  }

  constructor(private readonly jwt?: string) {
    const sockJsUrl = withAuthQuery(toSockJsUrl(), this.jwt);
    console.log("[GameRoomSocket] SockJS URL:", sockJsUrl);
    this.client = new Client({
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      webSocketFactory: () => new SockJS(sockJsUrl),
    });
  }

  connect(): Promise<void> {
    if (this.client.connected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.client.onConnect = () => resolve();
      this.client.onStompError = (frame) => {
        reject(new Error(frame.headers.message || "STOMP connection error"));
      };

      const headers: StompHeaders = this.getAuthHeaders();
      this.client.connectHeaders = headers;
      this.client.activate();
    });
  }

  disconnect() {
    if (this.client.active) {
      this.client.deactivate();
    }
  }

  subscribeRoomEvents(
    roomCode: string,
    onEvent: (event: GameEvent<unknown>) => void,
  ): SubscriptionCleanup {
    const subscription = this.client.subscribe(
      `/topic/room/${roomCode}`,
      (msg) => {
        const event = parseMessage<GameEvent<unknown>>(msg);
        if (event) {
          onEvent(event);
        }
      },
      this.getAuthHeaders(),
    );
    return () => subscription.unsubscribe();
  }

  subscribeAnswerResultPublic(
    roomCode: string,
    onResult: (result: AnswerProcessingResult) => void,
  ): SubscriptionCleanup {
    const subscription = this.client.subscribe(
      `/topic/room/${roomCode}/answer/result`,
      (msg) => {
        const result = parseMessage<AnswerProcessingResult>(msg);
        if (result) {
          onResult(result);
        }
      },
      this.getAuthHeaders(),
    );
    return () => subscription.unsubscribe();
  }

  subscribeAnswerResultPrivate(
    roomCode: string,
    onResult: (result: AnswerProcessingResult) => void,
  ): SubscriptionCleanup {
    const subscription = this.client.subscribe(
      `/user/queue/room/${roomCode}/answer/result`,
      (msg) => {
        const result = parseMessage<AnswerProcessingResult>(msg);
        if (result) {
          onResult(result);
        }
      },
      this.getAuthHeaders(),
    );
    return () => subscription.unsubscribe();
  }

  sendRematch(roomCode: string) {
    this.client.publish({
      destination: `/app/room/${roomCode}/rematch`,
      body: JSON.stringify({ roomCode }),
      headers: this.getAuthHeaders(),
    });
  }

  sendJoinRoom(
    roomCode: string,
    payload?: { userId?: number; username?: string },
  ) {
    this.client.publish({
      destination: `/app/room/${roomCode}/join`,
      body: JSON.stringify({ roomCode, ...payload }),
      headers: this.getAuthHeaders(),
    });
  }

  sendPlayerReady(
    roomCode: string,
    payload?: { userId?: number; username?: string; ready?: boolean },
  ) {
    this.client.publish({
      destination: `/app/room/${roomCode}/ready`,
      body: JSON.stringify({ roomCode, ready: true, ...payload }),
      headers: this.getAuthHeaders(),
    });
  }

  sendAnswer(roomCode: string, payload: RoomAnswerPayload) {
    this.client.publish({
      destination: `/app/room/${roomCode}/answer`,
      body: JSON.stringify(payload),
      headers: this.getAuthHeaders(),
    });
  }
}

export const isGameRecapEvent = (
  event: GameEvent<unknown>,
): event is GameEvent<GameRecapPayload> => {
  return event.type === "GAME_FINISHED" || event.type === "GAME_RECAP";
};
