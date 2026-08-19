import React from "react";

interface ImageZoomModalProps {
  imageUrl: string;
  zoomLevel: number;
  onClose: () => void;
  onToggleZoom: () => void;
}

const ImageZoomModal: React.FC<ImageZoomModalProps> = ({
  imageUrl,
  zoomLevel,
  onClose,
  onToggleZoom,
}) => {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onClose();
        }
      }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "24px",
        cursor: "zoom-out",
      }}
      aria-label="Fermer le zoom"
    >
      <img
        src={imageUrl}
        alt="Agrandissement"
        onClick={(event) => {
          event.stopPropagation();
          onToggleZoom();
        }}
        style={{
          maxWidth: "95%",
          maxHeight: "95%",
          borderRadius: "8px",
          border: "1px solid #374151",
          backgroundColor: "#111827",
          transform: `scale(${zoomLevel})`,
          transformOrigin: "center center",
          cursor: zoomLevel === 1 ? "zoom-in" : "zoom-out",
        }}
      />
    </div>
  );
};

export default ImageZoomModal;
