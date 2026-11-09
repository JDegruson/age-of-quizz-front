import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

import { User } from "../types/user";
import { getJwtExpiry, isJwtExpired } from "../utils/jwt";

const MAX_TIMEOUT_MS = 2 ** 31 - 1;

type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  isUserLoading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  useEffect(() => {
    const localUser = localStorage.getItem("user");
    if (localUser) {
      const parsed: User = JSON.parse(localUser);
      // Session expirée depuis la dernière visite : on repart déconnecté plutôt
      // que d'envoyer un jeton périmé au back.
      if (parsed.jwt && isJwtExpired(parsed.jwt)) {
        localStorage.removeItem("user");
      } else {
        setUser(parsed);
      }
    }
    setIsUserLoading(false);
  }, []);

  const updateUser = useCallback((newUser: User | null) => {
    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("user");
    }
    setUser(newUser);
  }, []);

  // Déconnexion à l'expiration du jeton si l'onglet reste ouvert.
  useEffect(() => {
    const expiry = user?.jwt ? getJwtExpiry(user.jwt) : null;
    if (expiry === null) return;
    const delay = expiry - Date.now();
    // setTimeout déborde au-delà de ~24,8 jours : le contrôle au chargement prend le relais.
    if (delay > MAX_TIMEOUT_MS) return;
    const timer = window.setTimeout(() => updateUser(null), Math.max(0, delay));
    return () => window.clearTimeout(timer);
  }, [user?.jwt, updateUser]);

  return (
    <UserContext.Provider value={{ user, setUser: updateUser, isUserLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
