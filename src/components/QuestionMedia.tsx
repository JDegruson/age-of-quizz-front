import React from "react";
import { buildAudioMediaUrl, buildImageMediaUrl } from "../utils/mediaUrl";

interface QuestionMediaProps {
  fileUrl?: string | null;
  type?: string;
  imageTitle?: string;
  onImageClick?: (imageUrl: string) => void;
  audioRef?: React.RefObject<HTMLAudioElement>;
  audioAutoPlay?: boolean;
  audioSrcOverride?: string;
  /** Explicite, car les 3 appelants ne sont pas d'accord là-dessus (repris tel quel de chacun). */
  audioMarginTop?: number;
}

/**
 * Affiche l'image ou l'audio d'une question selon son type. Partagé entre
 * QuestionView, SoloCorrectionView et QuestionDetails, qui dupliquaient
 * chacun ce branchement IMAGE/SOUND indépendamment.
 *
 * Ne rend que l'élément média lui-même (pas de div wrapper) — chaque
 * appelant garde le contrôle de sa propre mise en page/marges autour.
 */
const QuestionMedia: React.FC<QuestionMediaProps> = ({
  fileUrl,
  type,
  imageTitle,
  onImageClick,
  audioRef,
  audioAutoPlay,
  audioSrcOverride,
  audioMarginTop,
}) => {
  if (!fileUrl) {
    return null;
  }

  const normalizedType = (type || "").toUpperCase();

  if (normalizedType === "IMAGE") {
    const imageUrl = buildImageMediaUrl(fileUrl);
    return (
      <img
        src={imageUrl}
        alt="Question"
        title={imageTitle}
        onClick={onImageClick ? () => onImageClick(imageUrl) : undefined}
        style={{
          maxWidth: "320px",
          width: "100%",
          height: "auto",
          borderRadius: "8px",
          border: "1px solid #374151",
          cursor: onImageClick ? "zoom-in" : undefined,
        }}
      />
    );
  }

  if (normalizedType === "SOUND") {
    const audioUrl = buildAudioMediaUrl(fileUrl);
    return (
      <audio
        ref={audioRef}
        controls
        autoPlay={audioAutoPlay}
        style={{ width: "100%", marginTop: audioMarginTop }}
      >
        <source src={audioSrcOverride || audioUrl} type="audio/mpeg" />
        Votre navigateur ne supporte pas l'élément audio.
      </audio>
    );
  }

  return null;
};

export default QuestionMedia;
