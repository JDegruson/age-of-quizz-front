import React from "react";

type AlertVariant = "danger" | "success" | "info";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

const Alert: React.FC<AlertProps> = ({
  variant = "danger",
  className = "",
  children,
  ...rest
}) => {
  return (
    <div className={`alert alert-${variant} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
};

export default Alert;
