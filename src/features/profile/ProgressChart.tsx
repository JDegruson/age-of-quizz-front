import React, { useState } from "react";
import styles from "./ProfileStats.module.css";
import type { WeeklyProgress } from "../../types/userStats";

const WIDTH = 640;
const HEIGHT = 220;
const MARGIN = { top: 12, right: 16, bottom: 28, left: 40 };
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;
const Y_TICKS = [0, 25, 50, 75, 100];

const formatWeek = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });

/**
 * Weekly accuracy (% of correct answers) over the last weeks. Weeks without
 * any answer leave a gap in the line instead of dropping to 0 %.
 */
const ProgressChart: React.FC<{ weeks: WeeklyProgress[] }> = ({ weeks }) => {
  const [hovered, setHovered] = useState<number | null>(null);

  const step = weeks.length > 1 ? PLOT_W / (weeks.length - 1) : 0;
  const x = (i: number) => MARGIN.left + i * step;
  const y = (pct: number) => MARGIN.top + PLOT_H * (1 - pct / 100);
  const accuracy = (w: WeeklyProgress) =>
    w.answered > 0 ? (100 * w.correct) / w.answered : null;

  // One path segment per run of consecutive weeks with answers
  const segments: string[] = [];
  let current = "";
  weeks.forEach((w, i) => {
    const pct = accuracy(w);
    if (pct === null) {
      if (current) segments.push(current);
      current = "";
      return;
    }
    current += `${current ? "L" : "M"}${x(i)},${y(pct)}`;
  });
  if (current) segments.push(current);

  const handleMove = (event: React.MouseEvent<SVGRectElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const index = Math.round(ratio * (weeks.length - 1));
    setHovered(Math.max(0, Math.min(weeks.length - 1, index)));
  };

  const hoveredWeek = hovered === null ? null : weeks[hovered];
  const hoveredPct = hoveredWeek ? accuracy(hoveredWeek) : null;
  // Label every other week so the axis stays readable on 12 weeks
  const labelEvery = weeks.length > 6 ? 2 : 1;

  return (
    <div className={styles.chart}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className={styles.chartSvg}
        role="img"
        aria-label="Pourcentage de bonnes réponses par semaine"
      >
        {Y_TICKS.map((tick) => (
          <g key={tick}>
            <line
              x1={MARGIN.left}
              x2={WIDTH - MARGIN.right}
              y1={y(tick)}
              y2={y(tick)}
              className={styles.chartGrid}
            />
            <text
              x={MARGIN.left - 8}
              y={y(tick)}
              className={styles.chartAxisLabel}
              textAnchor="end"
              dominantBaseline="middle"
            >
              {tick} %
            </text>
          </g>
        ))}

        {weeks.map((w, i) =>
          i % labelEvery === (weeks.length - 1) % labelEvery ? (
            <text
              key={w.weekStart}
              x={x(i)}
              y={HEIGHT - 8}
              className={styles.chartAxisLabel}
              textAnchor="middle"
            >
              {formatWeek(w.weekStart)}
            </text>
          ) : null,
        )}

        {hovered !== null && (
          <line
            x1={x(hovered)}
            x2={x(hovered)}
            y1={MARGIN.top}
            y2={MARGIN.top + PLOT_H}
            className={styles.chartCrosshair}
          />
        )}

        {segments.map((d) => (
          <path key={d} d={d} className={styles.chartLine} />
        ))}

        {weeks.map((w, i) => {
          const pct = accuracy(w);
          return pct === null ? null : (
            <circle
              key={w.weekStart}
              cx={x(i)}
              cy={y(pct)}
              r={hovered === i ? 6 : 4}
              className={styles.chartPoint}
            />
          );
        })}

        {/* Hit area bigger than the marks: the whole plot */}
        <rect
          x={MARGIN.left - step / 2}
          y={MARGIN.top}
          width={PLOT_W + step}
          height={PLOT_H}
          fill="transparent"
          onMouseMove={handleMove}
          onMouseLeave={() => setHovered(null)}
        />
      </svg>

      {hoveredWeek && hovered !== null && (
        <div
          className={styles.chartTooltip}
          style={{
            left: `${(x(hovered) / WIDTH) * 100}%`,
            top: `${((hoveredPct === null ? y(50) : y(hoveredPct)) / HEIGHT) * 100}%`,
          }}
        >
          <div className={styles.chartTooltipTitle}>
            Semaine du {formatWeek(hoveredWeek.weekStart)}
          </div>
          {hoveredPct === null ? (
            <div>Aucune question</div>
          ) : (
            <>
              <div>
                <strong>{Math.round(hoveredPct)} %</strong> de bonnes réponses
              </div>
              <div className={styles.chartTooltipMuted}>
                {hoveredWeek.correct} / {hoveredWeek.answered} questions
              </div>
            </>
          )}
        </div>
      )}

      <table className="visually-hidden">
        <caption>Bonnes réponses par semaine</caption>
        <thead>
          <tr>
            <th scope="col">Semaine</th>
            <th scope="col">Bonnes réponses</th>
            <th scope="col">Questions</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => (
            <tr key={w.weekStart}>
              <td>{formatWeek(w.weekStart)}</td>
              <td>{w.correct}</td>
              <td>{w.answered}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProgressChart;
