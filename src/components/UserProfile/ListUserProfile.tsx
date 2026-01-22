import React, { useEffect, useState } from "react";
import { UserProfile } from "./interfaces";
import { Link } from "react-router-dom";
import { useUser } from "../Context/UserContext";
import { UsersFilters } from "./types";
import { BACKEND_URL } from "../../config";

const Users: React.FC<{ filters: UsersFilters }> = ({ filters }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const { user } = useUser();
  useEffect(() => {
    const filter = (users: UserProfile[]) => {
      return users.filter((user) => {
        let isPseudoDOLMatch = true;

        if (user.pseudo && filters.pseudoDOL) {
          isPseudoDOLMatch = user.pseudo
            .toLowerCase()
            .includes(filters.pseudoDOL.toLowerCase());
        }

        return isPseudoDOLMatch;
      });
    };

    setFilteredUsers(filter(users));
  }, [filters, users]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const jwt = user?.jwt;
        const response = await fetch(`${BACKEND_URL}/users/profiles`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
          },
        });
        if (!response.ok) {
          throw new Error(
            `Erreur ${response.status}: ${await response.text()}`
          );
        }
        const data = await response.json();
        setUsers(data);
      } catch (err: any) {
        setError("Aucun utilisateur trouvé");
        console.log(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading)
    return <p className="text-center bg-theme p-2 rounded">Chargement...</p>;
  if (error)
    return (
      <p className="text-center bg-theme p-2 rounded text-danger">{error}</p>
    );

  return (
    <div>
      <div>
        <div
          className={`card shadow mb-2 h-100 bg-theme border-theme color-theme`}
        >
          <div className="row p-2 d-flex justify-content-center align-items-center">
            <div className="col-sm-4 text-center">Pseudo DoL</div>
            <div className="col-sm-4 text-center">Pseudo LoL</div>
            <div className="col-sm-4 text-center">Pseudo Discord</div>
          </div>
        </div>
      </div>
      {filteredUsers.map((user) => (
        <div key={user.id}>
          <div>
            <div
              className={`card shadow mb-2 h-100 bg-theme border border-theme color-theme`}
            >
              <div className="row p-2 d-flex justify-content-center align-items-center">
                <div className="col-sm-2 text-center">
                  <Link
                    to={`/profile/${user.id}`}
                    className="text-reset stretched-link text-decoration-none"
                  >
                    <img
                      src={`/Avatar/${user.avatar}`}
                      alt={`Avatar de ${user.pseudo}`}
                      width="50"
                      height="50"
                      className="rounded-circle me-2"
                    />
                  </Link>
                </div>
                <div className="col-sm-2 text-center">{user.pseudo}</div>
                <div className="col-sm-4 text-center">{user.pseudo}</div>
                <div className="col-sm-4 text-center">{user.pseudoDiscord}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Users;
