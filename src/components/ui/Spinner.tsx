import React from "react";

interface SpinnerProps {
  size?: "sm" | "md";
  label?: string;
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  label = "Chargement...",
  className = "",
}) => {
  return (
    <div
      className={`spinner-border ${size === "sm" ? "spinner-border-sm" : ""} ${className}`.trim()}
      role="status"
    >
      <span className="visually-hidden">{label}</span>
    </div>
  );
};

export default Spinner;
