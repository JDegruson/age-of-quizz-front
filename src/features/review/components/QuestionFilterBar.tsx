import React from "react";
import { CIVILIZATIONS_MAP } from "../../../data/civilizations";

const LABEL_STYLE: React.CSSProperties = {
  marginRight: "10px",
  fontWeight: "bold",
  color: "#e5e7eb",
};

interface QuestionFilterBarProps {
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  civilFilter: string;
  onCivilFilterChange: (value: string) => void;
  dateSort: string;
  onDateSortChange: (value: string) => void;
  resultCount: number;
}

const QuestionFilterBar: React.FC<QuestionFilterBarProps> = ({
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  civilFilter,
  onCivilFilterChange,
  dateSort,
  onDateSortChange,
  resultCount,
}) => {
  return (
    <>
      <div
        style={{
          marginBottom: "20px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
        }}
      >
        <div>
          <label style={LABEL_STYLE}>Filtrer par statut:</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="form-select"
          >
            <option value="ALL">Toutes</option>
            <option value="CREATED_REVIEW">En révision</option>
            <option value="CLAIMED_REVIEW">Prise en charge</option>
            <option value="VALIDATED">Validées</option>
            <option value="REJECTED">Rejetées</option>
          </select>
        </div>

        <div>
          <label style={LABEL_STYLE}>Filtrer par type:</label>
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
            className="form-select"
          >
            <option value="ALL">Tous les types</option>
            <option value="MULTIPLE">Choix multiple</option>
            <option value="TRUE_FALSE">Vrai/Faux</option>
            <option value="SOUND">Question audio</option>
            <option value="IMAGE">Question image</option>
          </select>
        </div>
        <div>
          <label style={LABEL_STYLE}>Filtrer par civilisation:</label>
          <select
            value={civilFilter}
            onChange={(e) => onCivilFilterChange(e.target.value)}
            className="form-select"
          >
            <option value="ALL">Toutes les civilisations</option>
            <option value="NONE">Aucune</option>
            {Object.entries(CIVILIZATIONS_MAP).map(([label, value]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={LABEL_STYLE}>Trier par date:</label>
          <select
            value={dateSort}
            onChange={(e) => onDateSortChange(e.target.value)}
            className="form-select"
          >
            <option value="DESC">Plus recente</option>
            <option value="ASC">Plus ancienne</option>
          </select>
        </div>
      </div>

      <div style={{ fontSize: "14px", color: "#9ca3af", marginBottom: "20px" }}>
        {resultCount} question(s) trouvée(s)
      </div>
    </>
  );
};

export default QuestionFilterBar;
