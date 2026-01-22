import React, { useState } from "react";
import { UsersFilters } from "./types";

export type FiltersUserProps = {
  onFiltersChange: (filters: UsersFilters) => void;
};
const FiltersDuel: React.FC<FiltersUserProps> = ({ onFiltersChange }) => {
  const [pseudoDoL, setPseudoDoL] = useState<string>("");

  const handlePseudoDoLChange = (newPseudoDOL: string) => {
    setPseudoDoL(newPseudoDOL);
    onFiltersChange({
      pseudoDOL: newPseudoDOL,
    });
  };

  return (
    <div className="card p-4 shadow bg-theme color-theme border border-theme">
      <h5 className="mb-4">Filtrer les utilisateurs</h5>
      <form>
        <div className="row g-3">
          <div className="col-12">
            <input
              type="text"
              className="form-control"
              id="lane"
              placeholder="Pseudo Age of Quizz"
              value={pseudoDoL} // Valeur liée à l'état local
              onChange={(e) => handlePseudoDoLChange(e.target.value)}
            ></input>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FiltersDuel;
