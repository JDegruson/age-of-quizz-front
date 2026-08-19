/**
 * Shared low-level helpers used by the domain-specific *Api.ts services
 * (questionsApi, uploadApi, quizApi, dataExportApi, multiplayer). Kept here
 * so header-building and filename-sanitizing logic isn't copy-pasted in
 * every single endpoint function, as it was in the old monolithic api.ts.
 */

export const buildJsonHeaders = (jwt?: string) =>
  jwt
    ? {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      }
    : {
        "Content-Type": "application/json",
      };

export const buildAuthHeaders = (jwt?: string) =>
  jwt ? { Authorization: `Bearer ${jwt}` } : {};

export const sanitizeFilename = (filename: string) => {
  const parts = filename.split(".");
  const extension = parts.length > 1 ? `.${parts.pop()}` : "";
  const baseName = parts.join(".") || "upload";
  const suffix = `_${Date.now()}`;
  const diacriticsPattern = new RegExp("[\\u0300-\\u036f]", "g");
  const asciiBase = baseName
    .normalize("NFD")
    .replace(diacriticsPattern, "")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, Math.max(1, 80 - suffix.length));
  const safeBase = asciiBase || "upload";
  return `${safeBase}${suffix}${extension}`;
};

/**
 * The upload endpoints return either a bare path or a message like
 * "Fichier uploadé avec succès : questions/xyz.png". This extracts just
 * the relative "questions/..." path either way.
 */
export const extractUploadedRelativePath = (rawResponse: string) => {
  let fullPath = rawResponse;

  if (fullPath.includes(":")) {
    fullPath = fullPath.split(":").pop()!.trim();
  }

  return fullPath.includes("questions/")
    ? fullPath.substring(fullPath.indexOf("questions/"))
    : fullPath;
};
