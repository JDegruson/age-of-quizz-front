import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { UserProvider } from "../context/UserContext";
import { AuthProvider } from "../context/AuthContext";

interface AppProvidersProps {
  children: React.ReactNode;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => (
  <Router>
    <UserProvider>
      <AuthProvider>{children}</AuthProvider>
    </UserProvider>
  </Router>
);

export default AppProviders;
