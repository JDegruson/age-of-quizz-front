import React from "react";
import CIVILIZATIONS from "../../../data/civilizations";
import { BUILDING_OPTIONS } from "../../../data/buildings";
import { getThemeLabel } from "../../../utils/questionLabels";

interface QuestionMetadataFieldsProps {
  showTheme: boolean;
  themeOptions?: string[];
  theme: string;
  onThemeChange: (value: string) => void;
  civilization: string;
  onCivilizationChange: (value: string) => void;
  building: string;
  onBuildingChange: (value: string) => void;
}

const QuestionMetadataFields: React.FC<QuestionMetadataFieldsProps> = ({
  showTheme,
  themeOptions,
  theme,
  onThemeChange,
  civilization,
  onCivilizationChange,
  building,
  onBuildingChange,
}) => {
  return (
    <>
      {showTheme && (
        <div className="mb-3">
          <label className="form-label">Thème</label>
          <select
            value={theme}
            onChange={(e) => onThemeChange(e.target.value)}
            className="form-select"
          >
            {(themeOptions || []).map((value) => (
              <option key={value} value={value}>
                {getThemeLabel(value)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mb-3">
        <label className="form-label">Civilisation</label>
        <select
          value={civilization}
          onChange={(e) => onCivilizationChange(e.target.value)}
          className="form-select"
        >
          <option value="NONE">Aucune civilisation</option>
          {CIVILIZATIONS.map((civ) => (
            <option key={civ} value={civ}>
              {civ}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">Bâtiment</label>
        <select
          value={building}
          onChange={(e) => onBuildingChange(e.target.value)}
          className="form-select"
        >
          {BUILDING_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
};

export default QuestionMetadataFields;
