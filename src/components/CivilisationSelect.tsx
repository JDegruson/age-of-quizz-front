import React, { useMemo } from "react";
import SelectAutocomplete, { type SelectOption } from "./ui/SelectAutocomplete";
import { CIVILIZATIONS_MAP } from "../data/civilizations";

interface CivilisationSelectProps {
  id?: string;
  /** Selected value: an enum value ("FRANKS") or one of the extra options. */
  value: string;
  onChange: (value: string) => void;
  /** Options listed before the civilisations ("Toutes", "Aucune"...). */
  extraOptions?: SelectOption[];
  /**
   * "enum" (default): values are backend enums. "label": values are the
   * French names (question creation form).
   */
  valueKind?: "enum" | "label";
  placeholder?: string;
  disabled?: boolean;
}

// Tri français : "Éthiopiens" entre "Espagnols" et "Francs"
const SORTED_CIVILISATIONS = Object.entries(CIVILIZATIONS_MAP).sort(
  ([a], [b]) => a.localeCompare(b, "fr"),
);

/** Civilisation picker with type-to-filter (accent insensitive). */
const CivilisationSelect: React.FC<CivilisationSelectProps> = ({
  id,
  value,
  onChange,
  extraOptions = [],
  valueKind = "enum",
  placeholder = "Rechercher une civilisation...",
  disabled,
}) => {
  const options = useMemo(
    () => [
      ...extraOptions,
      ...SORTED_CIVILISATIONS.map(([label, enumValue]) => ({
        value: valueKind === "label" ? label : enumValue,
        label,
      })),
    ],
    [extraOptions, valueKind],
  );

  return (
    <SelectAutocomplete
      id={id}
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
};

export default CivilisationSelect;
