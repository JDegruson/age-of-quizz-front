import React from "react";

interface PseudoFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

const PseudoField: React.FC<PseudoFieldProps> = ({
  value,
  onChange,
  disabled,
}) => {
  return (
    <div className="mb-3">
      <label htmlFor="pseudo" className="form-label">
        Pseudo
      </label>
      <input
        id="pseudo"
        className="form-control"
        placeholder="Choisissez un pseudo"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={30}
      />
    </div>
  );
};

export default PseudoField;
