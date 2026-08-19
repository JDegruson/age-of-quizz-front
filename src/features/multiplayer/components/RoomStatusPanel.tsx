import React from "react";

interface RoomStatusPanelProps {
  status: string;
  lastEventType: string | null;
  currentUserLabel: string;
  isHost: boolean;
  countdown: number | null;
  connectedRoomCode: string | null;
}

const RoomStatusPanel: React.FC<RoomStatusPanelProps> = ({
  status,
  lastEventType,
  currentUserLabel,
  isHost,
  countdown,
  connectedRoomCode,
}) => {
  return (
    <div
      className="mb-3 p-3"
      style={{ backgroundColor: "#111827", borderRadius: 8 }}
    >
      <div>Status: {status}</div>
      {lastEventType && <div>Last event: {lastEventType}</div>}
      <div>Current user: {currentUserLabel}</div>
      <div>Role: {isHost ? "Host" : "Player"}</div>
      {countdown !== null && <div>Countdown: {countdown}s</div>}
      {connectedRoomCode && <div>Room: {connectedRoomCode}</div>}
    </div>
  );
};

export default RoomStatusPanel;
