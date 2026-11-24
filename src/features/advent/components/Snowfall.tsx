import React from "react";
import styles from "../AdventCalendar.module.css";

const FLAKES = 42;

/** Pseudo-aléatoire stable : la neige ne « saute » pas à chaque rendu. */
const rand = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

const flakes = Array.from({ length: FLAKES }, (_, i) => ({
  left: rand(i + 1) * 100,
  size: 3 + rand(i + 101) * 5,
  duration: 9 + rand(i + 201) * 12,
  delay: -rand(i + 301) * 20,
  drift: (rand(i + 401) - 0.5) * 80,
  opacity: 0.35 + rand(i + 501) * 0.55,
}));

/** Couche décorative, figée si l'utilisateur préfère réduire les animations. */
const Snowfall: React.FC = () => (
  <div className={styles.snow} aria-hidden="true">
    {flakes.map((f, i) => (
      <span
        key={i}
        className={styles.flake}
        style={
          {
            left: `${f.left}%`,
            width: f.size,
            height: f.size,
            opacity: f.opacity,
            animationDuration: `${f.duration}s`,
            animationDelay: `${f.delay}s`,
            "--drift": `${f.drift}px`,
          } as React.CSSProperties
        }
      />
    ))}
  </div>
);

export default Snowfall;
