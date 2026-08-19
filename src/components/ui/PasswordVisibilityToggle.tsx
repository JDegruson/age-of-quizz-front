import React from "react";

interface PasswordVisibilityToggleProps {
  visible: boolean;
  onToggle: () => void;
}

const PasswordVisibilityToggle: React.FC<PasswordVisibilityToggleProps> = ({
  visible,
  onToggle,
}) => {
  return (
    <button
      type="button"
      className="btn btn-sm btn-outline-color-theme position-absolute border border-0"
      style={{ top: "50%", right: "10px" }}
      onClick={onToggle}
      tabIndex={-1}
    >
      <i className={`bi ${visible ? "bi-eye-slash" : "bi-eye"}`} />
    </button>
  );
};

export default PasswordVisibilityToggle;
