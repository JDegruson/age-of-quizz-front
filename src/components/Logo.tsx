import React from "react";

const Logo: React.FC<{ size?: "small" | "large" }> = ({ size = "large" }) => {
  const isLarge = size === "large";

  return (
    <div
      style={{
        textAlign: "center",
        position: "relative",
        display: "inline-block",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: isLarge ? "column" : "row",
          alignItems: "center",
          gap: isLarge ? "6px" : "6px",
        }}
      >
        <div
          style={{
            fontSize: isLarge ? "2.5rem" : "1.2rem",
            fontWeight: "900",
            fontFamily: "'Times New Roman', serif",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            background:
              "linear-gradient(180deg, #FFD700 0%, #FFA500 30%, #8B6914 60%, #654321 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: "none",
            filter:
              "drop-shadow(2px 2px 0px rgba(0, 0, 0, 0.8)) drop-shadow(0px 0px 10px rgba(255, 215, 0, 0.3))",
            lineHeight: 1,
          }}
        >
          AGE
        </div>

        <div
          style={{
            fontSize: isLarge ? "1rem" : "0.6rem",
            fontWeight: "600",
            fontFamily: "'Times New Roman', serif",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            background:
              "linear-gradient(180deg, #C0C0C0 0%, #808080 50%, #404040 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(1px 1px 0px rgba(0, 0, 0, 0.8))",
          }}
        >
          OF
        </div>

        <div
          style={{
            fontSize: isLarge ? "2.5rem" : "1.2rem",
            fontWeight: "900",
            fontFamily: "'Times New Roman', serif",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            background:
              "linear-gradient(180deg, #FFD700 0%, #FFA500 30%, #8B6914 60%, #654321 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter:
              "drop-shadow(2px 2px 0px rgba(0, 0, 0, 0.8)) drop-shadow(0px 0px 10px rgba(255, 215, 0, 0.3))",
            lineHeight: 1,
          }}
        >
          QUIZZ
        </div>
      </div>
    </div>
  );
};

export default Logo;
