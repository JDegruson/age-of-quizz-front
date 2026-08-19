import React from "react";
import { Link } from "react-router-dom";
import { VARIANT_CLASS, type ButtonVariant } from "./Button";

interface LinkButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  /** Internal route - renders a react-router <Link>. Omit and use `href` for an external URL. */
  to?: string;
}

const LinkButton: React.FC<LinkButtonProps> = ({
  variant = "theme",
  to,
  className = "",
  children,
  ...rest
}) => {
  const classes = `btn ${VARIANT_CLASS[variant]} ${className}`.trim();

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <a className={classes} {...rest}>
      {children}
    </a>
  );
};

export default LinkButton;
