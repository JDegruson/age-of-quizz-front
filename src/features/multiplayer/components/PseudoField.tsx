import React from "react";

interface PseudoFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  autoFocus?: boolean;
}

const PseudoField: React.FC<PseudoFieldProps> = ({
  value,
  onChange,
  disabled,
  autoFocus,
}) => (
  <div className="mb-3">
    <label htmlFor="pseudo" className="form-label">
      Ton pseudo
    </label>
    <input
      id="pseudo"
      className="form-control"
      placeholder="Ex. Jeanne d'Arc"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      autoFocus={autoFocus}
      maxLength={30}
    />
    <div className="form-text" style={{ color: "#9ca3af" }}>
      Tu joues en invité : ce pseudo sera visible par les autres joueurs.
    </div>
  </div>
);

export default PseudoField;
