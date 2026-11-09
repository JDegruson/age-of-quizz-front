/**
 * Date d'expiration (ms epoch) lue dans le payload du JWT, sans vérifier la
 * signature : sert seulement à ne pas envoyer un jeton qu'on sait périmé.
 * Renvoie null si le jeton est illisible ou n'a pas de champ `exp`.
 */
export const getJwtExpiry = (token: string): number | null => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(window.atob(base64));
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
};

export const isJwtExpired = (token: string): boolean => {
  const expiry = getJwtExpiry(token);
  return expiry !== null && expiry <= Date.now();
};
