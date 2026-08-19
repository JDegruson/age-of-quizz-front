import React from "react";

export type ButtonVariant =
  | "theme"
  | "outline-theme"
  | "outline-secondary"
  | "outline-primary"
  | "outline-light"
  | "success"
  | "danger"
  | "secondary"
  | "link"
  | "primary";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  loadingLabel?: React.ReactNode;
}

export const VARIANT_CLASS: Record<ButtonVariant, string> = {
  theme: "btn-bg-theme",
  "outline-theme": "btn-outline-theme",
  "outline-secondary": "btn-outline-secondary",
  "outline-primary": "btn-outline-primary",
  "outline-light": "btn-outline-light",
  success: "btn-success",
  danger: "btn-danger",
  secondary: "btn-secondary",
  link: "btn-link",
  primary: "btn-primary",
};

const Button: React.FC<ButtonProps> = ({
  variant = "theme",
  loading = false,
  loadingLabel,
  disabled,
  className = "",
  children,
  ...rest
}) => {
  return (
    <button
      className={`btn ${VARIANT_CLASS[variant]} ${className}`.trim()}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <>
          <span
            className="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          ></span>
          {loadingLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
