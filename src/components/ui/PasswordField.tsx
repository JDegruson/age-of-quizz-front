import React from "react";
import PasswordVisibilityToggle from "./PasswordVisibilityToggle";

interface PasswordFieldProps {
  id: string;
  name?: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  visible: boolean;
  onToggleVisibility: () => void;
  isInvalid?: boolean;
  placeholder?: string;
  required?: boolean;
}

const PasswordField: React.FC<PasswordFieldProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  visible,
  onToggleVisibility,
  isInvalid = false,
  placeholder,
  required = false,
}) => {
  return (
    <>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        required={required}
        className={`form-control ${isInvalid ? "is-invalid" : ""}`}
        placeholder={placeholder}
      />
      <PasswordVisibilityToggle
        visible={visible}
        onToggle={onToggleVisibility}
      />
    </>
  );
};

export default PasswordField;
