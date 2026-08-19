import BACKEND_URL from "../config";

/**
 * Shared helpers for turning a question's `fileUrl` (as stored/returned by
 * the backend) into the actual media URLs used to display it. Previously
 * duplicated in several places in QuizPage.tsx (and reimplemented again in
 * ReviewQuestionsPage.tsx).
 */

export const getFileNameFromUrl = (fileUrl?: string | null): string => {
  if (!fileUrl) return "";
  return fileUrl.split(/[/\\]/).pop() || "";
};

export const buildImageMediaUrl = (fileUrl?: string | null): string => {
  const filename = getFileNameFromUrl(fileUrl);
  return `${BACKEND_URL}/media/image/${encodeURIComponent(filename)}`;
};

export const buildAudioMediaUrl = (fileUrl?: string | null): string => {
  const filename = getFileNameFromUrl(fileUrl);
  return `${BACKEND_URL}/media/audio/${encodeURIComponent(filename)}`;
};
/**
 * Résout la bonne URL média (image ou audio) pour une question, selon son
 * type. Utilisé quand on a besoin d'une URL seule (ex: un lien "ouvrir
 * dans un nouvel onglet") plutôt que d'un élément rendu.
 */
export const buildQuestionMediaUrl = (
  type: string | undefined,
  fileUrl?: string | null,
): string =>
  type === "IMAGE" ? buildImageMediaUrl(fileUrl) : buildAudioMediaUrl(fileUrl);
