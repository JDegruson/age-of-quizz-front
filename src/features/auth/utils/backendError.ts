export const extractBackendMessage = (payload: unknown): string => {
  if (typeof payload === "string") {
    return payload.trim();
  }

  if (payload && typeof payload === "object") {
    const errorPayload = payload as Record<string, unknown>;
    const candidateKeys = ["message", "error", "details"] as const;

    for (const key of candidateKeys) {
      const value = errorPayload[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  }

  return "";
};
