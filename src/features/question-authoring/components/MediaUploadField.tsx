import React from "react";

interface MediaUploadFieldProps {
  kind: "image" | "audio";
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
}

const MediaUploadField: React.FC<MediaUploadFieldProps> = ({
  kind,
  label,
  file,
  onChange,
}) => {
  return (
    <div className="mb-4">
      <label className="form-label">{label}</label>
      <input
        type="file"
        accept={kind === "image" ? "image/*" : "audio/*"}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        className="form-control"
      />
      {file && (
        <small className="text-muted mt-1">
          Fichier sélectionné : {file.name}
        </small>
      )}
    </div>
  );
};

export default MediaUploadField;
