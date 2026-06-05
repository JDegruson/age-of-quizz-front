/// <reference types="vite/client" />

// Mise à jour pour utiliser uniquement VITE_REACT_APP_JAVA_BACK_API_BASE_URL
export const BACKEND_URL =
  (import.meta.env.VITE_REACT_APP_JAVA_BACK_API_BASE_URL as string) ||
  "http://localhost:8080";

export default BACKEND_URL;
