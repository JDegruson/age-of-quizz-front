import React from "react";
import { getStatusLabel } from "../../../utils/questionLabels";

const STATUS_BADGE_STYLES: { [key: string]: React.CSSProperties } = {
  PENDING: {
    backgroundColor: "#fbbf24",
    color: "#78350f",
    padding: "4px 12px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  APPROVED: {
    backgroundColor: "#34d399",
    color: "#065f46",
    padding: "4px 12px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  VALIDATED: {
    backgroundColor: "#34d399",
    color: "#065f46",
    padding: "4px 12px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  REJECTED: {
    backgroundColor: "#f87171",
    color: "#7f1d1d",
    padding: "4px 12px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  CREATED_REVIEW: {
    backgroundColor: "#fbbf24",
    color: "#78350f",
    padding: "4px 12px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  CLAIMED_REVIEW: {
    backgroundColor: "#60a5fa",
    color: "#1e3a8a",
    padding: "4px 12px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "bold",
  },
};

interface StatusBadgeProps {
  status?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => (
  <span
    style={STATUS_BADGE_STYLES[status || "PENDING"] || STATUS_BADGE_STYLES.PENDING}
  >
    {getStatusLabel(status)}
  </span>
);

export default StatusBadge;
