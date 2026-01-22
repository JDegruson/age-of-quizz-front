import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "./Context/UserContext";
import { useAuth } from "./Context/AuthContext";
import Logo from "./Logo";

const Navbar: React.FC = () => {
  const { user, setUser } = useUser();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const isAuthor = user?.roles?.some(
    (role) => role.name === "AUTHOR" || role.name === "ADMIN",
  );
  const isReviewer = user?.roles?.some(
    (role) => role.name === "REVIEWER" || role.name === "ADMIN",
  );

  const handleLogout = () => {
    setUser(null);
    logout();
    navigate("/");
  };

  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark bg-dark mb-4"
      style={{ position: "sticky", top: 0, zIndex: 1000 }}
    >
      <div className="container-fluid">
        <Link
          className="navbar-brand"
          to="/"
          style={{ padding: "0", marginLeft: "1rem" }}
        >
          <Logo size="small" />
        </Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav me-auto">
            {user && (
              <>
                {isAuthor && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/create-question">
                      Créer une question
                    </Link>
                  </li>
                )}
                {isReviewer && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/review-questions">
                      Révision des questions
                    </Link>
                  </li>
                )}
              </>
            )}
          </ul>

          <ul className="navbar-nav ms-auto">
            {user ? (
              <>
                <li className="nav-item d-flex align-items-center me-3">
                  <Link
                    to="/profile"
                    className="text-light text-decoration-none"
                    style={{ cursor: "pointer" }}
                  >
                    <i className="bi bi-person-circle me-2"></i>
                    {user.userProfile?.pseudo || user.username}
                  </Link>
                </li>
                <li className="nav-item">
                  <button
                    onClick={handleLogout}
                    className="btn btn-outline-light btn-sm"
                  >
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Déconnexion
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item me-2">
                  <Link to="/register" className="btn btn-outline-light btn-sm">
                    Inscription
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/login" className="btn btn-primary btn-sm">
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Connexion
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
