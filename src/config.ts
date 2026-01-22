/// <reference types="vite/client" />

// Centralise l'URL du backend pour Vite (import.meta.env)
export const BACKEND_URL =
  (import.meta.env.VITE_REACT_APP_JAVA_BACK_API_BASE_URL as string) ||
  (import.meta.env.VITE_JAVA_BACK_API_BASE_URL as string) ||
  (import.meta.env.VITE_API_BASE_URL as string) ||
  "http://localhost:8080";

export default BACKEND_URL;
