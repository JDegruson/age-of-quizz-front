import React from "react";
import Logo from "../components/Logo";
import { useUser } from "../context/UserContext";
import Card from "../components/ui/Card";
import LinkButton from "../components/ui/LinkButton";

const Home: React.FC = () => {
  const { user } = useUser();
  const isAuthor = user?.roles?.some(
    (role) => role.name === "AUTHOR" || role.name === "ADMIN",
  );
  return (
    <div className="container page-md text-center mt-5">
      <Card padding="lg">
        <div className="mb-4">
          <Logo size="large" />
          <p className="lead fs-4 mt-4" style={{ color: "#b0b0b0" }}>
            Testez vos connaissances sur Age of Empires 2
          </p>
        </div>

        <div className="d-grid gap-3 col-md-8 mx-auto mt-5">
          <LinkButton
            to="/play"
            variant="theme"
            className="btn-lg py-3 rounded-pill shadow"
          >
            <i className="bi bi-play-circle me-2"></i>
            Jouer
          </LinkButton>
          {isAuthor && (
            <LinkButton
              to="/create-question"
              variant="theme"
              className="btn-lg py-3 rounded-pill shadow"
            >
              <i className="bi bi-plus-circle me-2"></i>
              Créer une question
            </LinkButton>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Home;
