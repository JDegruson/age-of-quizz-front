import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useAuth } from "../context/AuthContext";

interface UseRequireRoleOptions {
  /** Où sont redirigés les utilisateurs authentifiés mais sans le bon rôle. Défaut "/". */
  redirectTo?: string;
  /** Message optionnel passé en state du router lors de la redirection vers /login. */
  loginMessage?: string;
}

/**
 * Redirige vers /login si l'utilisateur n'est pas authentifié, ou vers `redirectTo`
 * s'il est authentifié mais n'a pas l'un des `allowedRoles`. Extrait de la garde
 * identique dupliquée entre ReviewQuestionsPage et ExportCivDataPage avant que ce
 * hook n'existe.
 */
export function useRequireRole(
  allowedRoles: string[],
  options: UseRequireRoleOptions = {},
) {
  const { redirectTo = "/", loginMessage } = options;
  const { user } = useUser();
  const { isAuthenticated, isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const hasRequiredRole = user?.roles?.some((role) =>
    allowedRoles.includes(role.name),
  );

  useEffect(() => {
    if (!isAuthLoading) {
      if (!isAuthenticated) {
        navigate(
          "/login",
          loginMessage ? { state: { message: loginMessage } } : undefined,
        );
      } else if (!hasRequiredRole) {
        navigate(redirectTo);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthLoading, isAuthenticated, hasRequiredRole, navigate]);

  return { hasRequiredRole, isAuthLoading, isAuthenticated };
}
