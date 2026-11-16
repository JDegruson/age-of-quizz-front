import React from "react";
import styles from "../MultiplayerRoom.module.css";

interface RoomCodeFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  autoFocus?: boolean;
}

const RoomCodeField: React.FC<RoomCodeFieldProps> = ({
  value,
  onChange,
  disabled,
  autoFocus,
}) => (
  <div className="mb-3">
    <label htmlFor="room-code" className="form-label">
      Code de la salle
    </label>
    <input
      id="room-code"
      className={`form-control ${styles.codeInput}`}
      placeholder="Ex. AB12CD"
      value={value}
      onChange={(e) => onChange(e.target.value.toUpperCase().replace(/\s/g, ""))}
      disabled={disabled}
      autoFocus={autoFocus}
      autoComplete="off"
      autoCapitalize="characters"
      spellCheck={false}
      maxLength={12}
    />
    <div className="form-text" style={{ color: "#9ca3af" }}>
      Demande le code à l'hôte de la partie.
    </div>
  </div>
);

export default RoomCodeField;
