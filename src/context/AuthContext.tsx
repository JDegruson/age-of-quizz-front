import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "./UserContext";

// Définition du contexte
interface AuthContextType {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: () => void;
  logout: () => void;
}

// Création du contexte avec des valeurs par défaut
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isAuthLoading: true,
  login: () => { },
  logout: () => { },
});

// Hook personnalisé pour utiliser le contexte
export const useAuth = () => useContext(AuthContext);

// Provider qui englobe l’application
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const navigate = useNavigate();
  const { user, setUser, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading) {
      setIsAuthenticated(!!user);
      setIsAuthLoading(false);
    }
  }, [user, isUserLoading]);


  const login = () => {
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAuthLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
