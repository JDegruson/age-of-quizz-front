import React from "react";

interface RoomCodeFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

const RoomCodeField: React.FC<RoomCodeFieldProps> = ({
  value,
  onChange,
  disabled,
}) => {
  return (
    <div className="mb-3">
      <label htmlFor="room-code" className="form-label">
        Room code
      </label>
      <input
        id="room-code"
        className="form-control"
        placeholder="Example: ROOM123"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
};

export default RoomCodeField;
