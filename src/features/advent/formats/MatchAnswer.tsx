import React, { useState } from "react";
import Button from "../../../components/ui/Button";
import {
  ADVENT_PAIR_LINK,
  ADVENT_PAIR_SEPARATOR,
} from "../../../types/advent";
import type { AnswerFormatProps } from ".";
import ZoomButton from "../components/ZoomButton";
import styles from "../AdventCalendar.module.css";

/**
 * Relier : on sélectionne un élément de gauche puis un élément de droite.
 * Un élément de droite déjà relié est déplacé vers la nouvelle ligne ; cliquer
 * sur la case reliée d'une ligne la libère.
 */
const MatchAnswer: React.FC<AnswerFormatProps> = ({
  day,
  submitting,
  onSubmit,
  onZoom,
}) => {
  /** gauche -> droite */
  const [links, setLinks] = useState<Record<string, string>>({});
  const [active, setActive] = useState<string | null>(day.choices[0] ?? null);

  const ownerOf = (target: string) =>
    Object.keys(links).find((left) => links[left] === target);
  const complete = day.choices.every((left) => links[left]);
  /** Colonne de gauche sans images (ex. civilisation ↔ unité). */
  const textOnly = day.choiceImages.length === 0;
  /** Images nommées (ex. portraits de héros) : nom écrit sous l'image. */
  const named = !textOnly && day.choices.some((left) => left.length > 1);
  const imageOf = (target: string) =>
    day.targetImages[day.targets.indexOf(target)];

  const link = (target: string) => {
    if (!active || submitting) return;
    const next = { ...links };
    const previousOwner = ownerOf(target);
    if (previousOwner) delete next[previousOwner];
    next[active] = target;
    setLinks(next);
    // Passe à la prochaine ligne encore vide
    setActive(day.choices.find((l) => !next[l]) ?? null);
  };

  const unlink = (left: string) => {
    const next = { ...links };
    delete next[left];
    setLinks(next);
    setActive(left);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!complete) return;
        onSubmit(
          day.choices
            .map((left) => `${left}${ADVENT_PAIR_LINK}${links[left]}`)
            .join(ADVENT_PAIR_SEPARATOR),
        );
      }}
    >
      <p className={styles.matchHint}>
        Touche une ligne à gauche, puis l'élément qui lui correspond en
        dessous. Touche une ligne déjà reliée pour la libérer.
      </p>

      <ul className={styles.matchRows}>
        {day.choices.map((left, i) => {
          const target = links[left];
          return (
            <li
              key={left}
              className={`${styles.matchItem} ${
                named ? styles.matchItemNamed : ""
              }`}
            >
              <button
                type="button"
                className={`${styles.matchRow} ${
                  textOnly ? styles.matchRowText : ""
                } ${named ? styles.matchRowNamed : ""} ${
                  active === left ? styles.matchRowActive : ""
                }`}
                onClick={() => (target ? unlink(left) : setActive(left))}
                disabled={submitting}
                aria-pressed={active === left}
                aria-label={
                  target
                    ? `${left} relié à ${target}, toucher pour délier`
                    : `Choisir ${left}`
                }
              >
                {named ? (
                  <span className={styles.matchNamed}>
                    <img
                      src={day.choiceImages[i]}
                      alt=""
                      className={styles.matchLeftImage}
                    />
                    <span className={styles.matchNamedLabel}>{left}</span>
                  </span>
                ) : (
                  <>
                    {/* Texte à gauche : le libellé ; images anonymes : une pastille « A », « B »... */}
                    <span
                      className={
                        textOnly ? styles.matchLeftLabel : styles.matchLetter
                      }
                    >
                      {left}
                    </span>
                    {day.choiceImages[i] && (
                      <img
                        src={day.choiceImages[i]}
                        alt=""
                        className={styles.matchLeftImage}
                      />
                    )}
                  </>
                )}
                <i
                  className={`bi bi-arrow-right ${styles.matchArrow}`}
                  aria-hidden="true"
                ></i>
                <span className={styles.matchSlot}>
                  {target ? (
                    <>
                      {imageOf(target) && (
                        <img
                          src={imageOf(target)}
                          alt=""
                          className={styles.matchSlotImage}
                        />
                      )}
                      <span className={styles.matchSlotLabel}>{target}</span>
                    </>
                  ) : (
                    <span className={styles.matchEmpty}>?</span>
                  )}
                </span>
              </button>
              {/* À côté du bouton de ligne (pas de bouton dans un bouton) */}
              {day.choiceImages[i] && (
                <ZoomButton
                  url={day.choiceImages[i]}
                  onZoom={onZoom}
                  className={styles.matchZoom}
                />
              )}
            </li>
          );
        })}
      </ul>

      <div className={styles.matchPool} aria-label="Civilisations">
        {day.targets.map((target) => {
          const owner = ownerOf(target);
          return (
            <button
              key={target}
              type="button"
              className={`${styles.matchTarget} ${
                owner ? styles.matchTargetUsed : ""
              }`}
              onClick={() => link(target)}
              disabled={submitting || !active}
              title={owner ? `${target} (relié à ${owner})` : target}
            >
              {imageOf(target) && (
                <img src={imageOf(target)} alt="" className={styles.matchTargetImage} />
              )}
              <span>{target}</span>
              {owner && <span className={styles.matchOwner}>{owner}</span>}
            </button>
          );
        })}
      </div>

      <Button
        type="submit"
        className="w-100 rounded-pill mt-3"
        disabled={!complete}
        loading={submitting}
        loadingLabel="Envoi..."
      >
        Valider mes paires
      </Button>
    </form>
  );
};

export default MatchAnswer;
