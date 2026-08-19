import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
  shadow?: boolean;
}

const PADDING_CLASS: Record<NonNullable<CardProps["padding"]>, string> = {
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

const Card: React.FC<CardProps> = ({
  padding = "md",
  shadow = true,
  className = "",
  children,
  ...rest
}) => {
  const classes = [
    "card",
    shadow && "shadow-lg",
    PADDING_CLASS[padding],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
};

export default Card;
