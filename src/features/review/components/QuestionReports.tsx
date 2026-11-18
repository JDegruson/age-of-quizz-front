import React from "react";
import {
  getReportReasonLabel,
  type QuestionReport,
} from "../../../types/questionReport";
import Button from "../../../components/ui/Button";

interface QuestionReportsProps {
  reports: QuestionReport[];
  /** REVIEWER / ADMIN only. */
  canResolve: boolean;
  isResolving: boolean;
  onResolve: () => void;
}

/** Open player reports of a question, shown above its details. */
const QuestionReports: React.FC<QuestionReportsProps> = ({
  reports,
  canResolve,
  isResolving,
  onResolve,
}) => (
  <div
    style={{
      marginBottom: "16px",
      padding: "12px 14px",
      borderRadius: "8px",
      border: "1px solid #f87171",
      backgroundColor: "rgba(248, 113, 113, 0.08)",
    }}
    onClick={(e) => e.stopPropagation()}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        marginBottom: "8px",
      }}
    >
      <h4 style={{ fontSize: "16px", fontWeight: 600, color: "#fca5a5", margin: 0 }}>
        <i className="bi bi-flag-fill me-2" aria-hidden="true"></i>
        Signalements ({reports.length})
      </h4>
      {canResolve && (
        <Button
          variant="outline-light"
          className="btn-sm"
          loading={isResolving}
          loadingLabel="..."
          onClick={onResolve}
        >
          Marquer comme traité
        </Button>
      )}
    </div>
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {reports.map((report) => (
        <li
          key={report.id}
          style={{
            padding: "8px 0",
            borderTop: "1px solid rgba(248, 113, 113, 0.25)",
            color: "#e5e7eb",
            fontSize: "14px",
          }}
        >
          <strong>{getReportReasonLabel(report.reason)}</strong>
          <span style={{ color: "#9ca3af" }}>
            {" "}
            · {report.reporterName || "Joueur inconnu"} ·{" "}
            {new Date(report.createdAt).toLocaleString("fr-FR")}
          </span>
          {report.comment && (
            <p style={{ margin: "4px 0 0", whiteSpace: "pre-line" }}>
              {report.comment}
            </p>
          )}
        </li>
      ))}
    </ul>
  </div>
);

export default QuestionReports;
