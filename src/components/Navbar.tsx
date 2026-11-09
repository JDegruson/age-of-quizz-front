import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";
import Button from "./ui/Button";
import LinkButton from "./ui/LinkButton";
import styles from "./Navbar.module.css";

interface MenuItem {
  to: string;
  label: string;
  icon: string;
}

interface RoleMenuDef {
  id: "author" | "reviewer" | "admin";
  label: string;
  icon: string;
  className: string;
  items: MenuItem[];
}

const AUTHOR_MENU: RoleMenuDef = {
  id: "author",
  label: "Auteur",
  icon: "bi-pencil-square",
  className: styles.roleAuthor,
  items: [
    { to: "/create-question", label: "Créer une question", icon: "bi-plus-circle" },
    { to: "/review-questions", label: "Questions existantes", icon: "bi-list-ul" },
  ],
};

const REVIEWER_MENU: RoleMenuDef = {
  id: "reviewer",
  label: "Relecture",
  icon: "bi-check2-square",
  className: styles.roleReviewer,
  items: [
    { to: "/review-questions", label: "Révision des questions", icon: "bi-list-check" },
    { to: "/export-civ-data", label: "Export JSON / Excel", icon: "bi-file-earmark-arrow-down" },
  ],
};

const ADMIN_MENU: RoleMenuDef = {
  id: "admin",
  label: "Admin",
  icon: "bi-shield-lock-fill",
  className: styles.roleAdmin,
  items: [
    { to: "/daily-riddle-admin", label: "Énigmes du jour", icon: "bi-question-diamond" },
  ],
};

const RoleMenu: React.FC<{
  menu: RoleMenuDef;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ menu, isOpen, onToggle }) => {
  const listId = `nav-menu-${menu.id}`;
  return (
    <li className={`${styles.roleMenu} ${menu.className}`}>
      <button
        type="button"
        className={`${styles.link} ${styles.roleButton} ${isOpen ? styles.roleButtonOpen : ""}`}
        aria-expanded={isOpen}
        aria-controls={listId}
        onClick={onToggle}
      >
        <i className={`bi ${menu.icon}`} aria-hidden="true"></i>
        {menu.label}
        <i className={`bi bi-chevron-down ${styles.caret}`} aria-hidden="true"></i>
      </button>
      {isOpen && (
        <ul id={listId} className={styles.dropdown}>
          {menu.items.map((item) => (
            <li key={item.to}>
              <Link className={styles.dropdownItem} to={item.to}>
                <i className={`bi ${item.icon}`} aria-hidden="true"></i>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

const Navbar: React.FC = () => {
  const { user, setUser } = useUser();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<RoleMenuDef["id"] | null>(null);

  const hasRole = (name: string) =>
    !!user?.roles?.some((role) => role.name === name);
  // Admin has every right: they get the author and reviewer menus too
  const isAdmin = hasRole("ADMIN");
  const isAuthor = isAdmin || hasRole("AUTHOR");
  const isReviewer = isAdmin || hasRole("REVIEWER");

  const roleMenus = [
    isAuthor && AUTHOR_MENU,
    isReviewer && REVIEWER_MENU,
    isAdmin && ADMIN_MENU,
  ].filter(Boolean) as RoleMenuDef[];

  // Highest role, shown next to the pseudo
  const topRole = isAdmin
    ? ADMIN_MENU
    : isReviewer
      ? { ...REVIEWER_MENU, label: "Relecteur" }
      : isAuthor
        ? AUTHOR_MENU
        : null;

  // Close everything on navigation
  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [location.pathname]);

  // Close the open dropdown on outside click / Escape
  useEffect(() => {
    if (!openMenu) return;
    const onClick = (event: MouseEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

  const handleLogout = () => {
    setUser(null);
    logout();
    navigate("/");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.link} ${isActive ? styles.linkActive : ""}`;

  return (
    <nav ref={navRef} className={styles.nav} aria-label="Navigation principale">
      <div className={styles.inner}>
        <Link className={styles.brand} to="/" aria-label="Accueil">
          <Logo size="small" />
        </Link>

        <button
          type="button"
          className={styles.toggler}
          aria-expanded={mobileOpen}
          aria-controls="main-menu"
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setMobileOpen((open) => !open)}
        >
          <i className={`bi ${mobileOpen ? "bi-x-lg" : "bi-list"}`} aria-hidden="true"></i>
        </button>

        <div
          id="main-menu"
          className={`${styles.menu} ${mobileOpen ? styles.menuOpen : ""}`}
        >
          <ul className={styles.links}>
            <li>
              <NavLink className={navLinkClass} to="/" end>
                <i className="bi bi-controller" aria-hidden="true"></i>
                Jouer
              </NavLink>
            </li>
            <li>
              <NavLink className={navLinkClass} to="/leaderboard">
                <i className="bi bi-trophy" aria-hidden="true"></i>
                Classement
              </NavLink>
            </li>
            {user && !isAuthor && (
              <li>
                <NavLink className={navLinkClass} to="/become-author">
                  <i className="bi bi-pencil" aria-hidden="true"></i>
                  Devenir auteur
                </NavLink>
              </li>
            )}
            {roleMenus.map((menu) => (
              <RoleMenu
                key={menu.id}
                menu={menu}
                isOpen={openMenu === menu.id}
                onToggle={() =>
                  setOpenMenu((current) => (current === menu.id ? null : menu.id))
                }
              />
            ))}
          </ul>

          <ul className={styles.account}>
            {user ? (
              <>
                <li>
                  <Link to="/profile" className={styles.profileLink}>
                    <i className="bi bi-person-circle" aria-hidden="true"></i>
                    {user.userProfile?.pseudo || user.username}
                    {topRole && (
                      <span className={`${styles.roleBadge} ${topRole.className}`}>
                        {topRole.label}
                      </span>
                    )}
                  </Link>
                </li>
                <li>
                  <Button
                    onClick={handleLogout}
                    variant="outline-light"
                    className="btn-sm"
                  >
                    <i className="bi bi-box-arrow-right me-2" aria-hidden="true"></i>
                    Déconnexion
                  </Button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <LinkButton to="/register" variant="outline-light" className="btn-sm">
                    Inscription
                  </LinkButton>
                </li>
                <li>
                  <LinkButton to="/login" variant="primary" className="btn-sm">
                    <i className="bi bi-box-arrow-in-right me-2" aria-hidden="true"></i>
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
