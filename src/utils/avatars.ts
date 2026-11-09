/// <reference types="vite/client" />

/**
 * Avatars a player can pick on their profile: every image dropped in
 * src/assets/avatars/ is picked up automatically at build time. The profile
 * stores the file name (e.g. "knight.png").
 */
const AVATAR_FILES = import.meta.glob<string>(
  "../assets/avatars/*.{png,jpg,jpeg,webp,svg,gif}",
  { eager: true, query: "?url", import: "default" },
);

const AVATAR_URLS: Record<string, string> = Object.fromEntries(
  Object.entries(AVATAR_FILES).map(([path, url]) => [
    path.split("/").pop() as string,
    url,
  ]),
);

/** File names of the available avatars, sorted. */
export const AVAILABLE_AVATARS = Object.keys(AVATAR_URLS).sort();

/**
 * URL of a stored avatar. Unknown names fall back to /Avatar/<name> (the old
 * public folder), which the caller handles with an initial if it fails.
 */
export const getAvatarUrl = (avatar?: string | null): string | null => {
  if (!avatar) {
    return null;
  }
  return AVATAR_URLS[avatar] ?? `/Avatar/${avatar}`;
};
