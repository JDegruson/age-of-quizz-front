import React from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import { useUser } from "../components/Context/UserContext";

const Home: React.FC = () => {
  const { user } = useUser();
  const isAuthor = user?.roles?.some(
    (role) => role.name === "AUTHOR" || role.name === "ADMIN",
  );
  return (
    <div
      className="container"
      style={{ maxWidth: "800px", marginTop: "80px", textAlign: "center" }}
    >
      <div className="card shadow-lg p-5">
        <div className="mb-4">
          <Logo size="large" />
          <p className="lead fs-4 mt-4" style={{ color: "#b0b0b0" }}>
            Testez vos connaissances sur Age of Empires 2
          </p>
        </div>

        <div className="d-grid gap-3 col-md-8 mx-auto mt-5">
          <Link
            to="/play"
            className="btn btn-lg btn-gold py-3 rounded-pill shadow"
          >
            <i className="bi bi-play-circle me-2"></i>
            Jouer
          </Link>
          {isAuthor && (
            <Link
              to="/create-question"
              className="btn btn-lg btn-gold py-3 rounded-pill shadow"
            >
              <i className="bi bi-plus-circle me-2"></i>
              Créer une question
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
