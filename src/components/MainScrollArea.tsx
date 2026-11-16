import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Zone principale sous la navbar. Sur desktop, c'est elle (ou la carte d'une
 * page "page-fit") qui défile, sur mobile c'est la fenêtre : on remet tout
 * en haut à chaque changement de page.
 */
const MainScrollArea: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const ref = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const main = ref.current;
    window.scrollTo(0, 0);
    if (!main) return;
    main.scrollTop = 0;
    main
      .querySelectorAll<HTMLElement>(".page-fit > .card")
      .forEach((card) => {
        card.scrollTop = 0;
      });
  }, [pathname]);

  return (
    <main ref={ref} className="app-main">
      {children}
    </main>
  );
};

export default MainScrollArea;
