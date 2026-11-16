import React from "react";
import CivilisationSelect from "../../../components/CivilisationSelect";

const CIVILISATION_FILTER_EXTRAS = [
  { value: "ALL", label: "Toutes les civilisations" },
  { value: "NONE", label: "Aucune" },
];

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
  authorFilter: string;
  onAuthorFilterChange: (value: string) => void;
  authors: string[];
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
  authorFilter,
  onAuthorFilterChange,
  authors,
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
          <label htmlFor="filter-civilisation" style={LABEL_STYLE}>
            Filtrer par civilisation:
          </label>
          <CivilisationSelect
            id="filter-civilisation"
            value={civilFilter}
            onChange={onCivilFilterChange}
            extraOptions={CIVILISATION_FILTER_EXTRAS}
          />
        </div>
        <div>
          <label style={LABEL_STYLE}>Filtrer par auteur:</label>
          <select
            value={authorFilter}
            onChange={(e) => onAuthorFilterChange(e.target.value)}
            className="form-select"
          >
            <option value="ALL">Tous les auteurs</option>
            <option value="NONE">Inconnu</option>
            {authors.map((author) => (
              <option key={author} value={author}>
                {author}
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
