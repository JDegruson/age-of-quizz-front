import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";
import Button from "./ui/Button";
import LinkButton from "./ui/LinkButton";

const Navbar: React.FC = () => {
  const { user, setUser } = useUser();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const isAuthor = user?.roles?.some(
    (role) => role.name === "AUTHOR" || role.name === "ADMIN",
  );
  const isNotAuthor = user && !isAuthor;
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
                {isNotAuthor && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/become-author">
                      Devenir auteur
                    </Link>
                  </li>
                )}
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
                {isReviewer && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/export-civ-data">
                      Export JSON Excel
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
                  <Button
                    onClick={handleLogout}
                    variant="outline-light"
                    className="btn-sm"
                  >
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Déconnexion
                  </Button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item me-2">
                  <LinkButton
                    to="/register"
                    variant="outline-light"
                    className="btn-sm"
                  >
                    Inscription
                  </LinkButton>
                </li>
                <li className="nav-item">
                  <LinkButton to="/login" variant="primary" className="btn-sm">
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Connexion
                  </LinkButton>
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
