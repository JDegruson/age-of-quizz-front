import React from "react";
import { useRegisterForm } from "./hooks/useRegisterForm";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import PasswordField from "../../components/ui/PasswordField";
import AuthCardLayout from "../../components/AuthCardLayout";

const RegisterPage: React.FC = () => {
  const {
    user,
    handleChange,
    handleSubmit,
    error,
    usernameError,
    pseudoError,
    emailError,
    passwordError,
    confirmPassword,
    setConfirmPassword,
    confirmError,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    isLoading,
  } = useRegisterForm();

  return (
    <AuthCardLayout title="Inscription">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="username" className="form-label">
            Nom d'utilisateur
          </label>
          <input
            type="text"
            name="username"
            value={user.username}
            placeholder="Nom d'utilisateur"
            onChange={handleChange}
            required
            className={`form-control ${usernameError ? "is-invalid" : ""}`}
            id="username"
          />
          {usernameError && <Alert className="mt-3">{usernameError}</Alert>}
        </div>
        <div className="mb-4">
          <label htmlFor="pseudo" className="form-label">
            Pseudo Age of Quizz
          </label>
          <input
            type="text"
            name="pseudo"
            value={user.userProfile.pseudo}
            placeholder="Pseudo Age of Quizz"
            onChange={handleChange}
            required
            className={`form-control ${pseudoError ? "is-invalid" : ""}`}
            id="pseudo"
          />
          {pseudoError && <Alert className="mt-3">{pseudoError}</Alert>}
        </div>
        <div className="mb-4 position-relative">
          <PasswordField
            id="password"
            name="password"
            label="Mot de passe"
            value={user.password}
            onChange={handleChange}
            visible={showPassword}
            onToggleVisibility={() => setShowPassword((prev) => !prev)}
            required
            placeholder="Mot de passe"
          />
          {passwordError && (
            <Alert className="mt-3">
              Le mot de passe doit contenir au moins 6 caractères.
            </Alert>
          )}
        </div>
        <div className="mb-4 position-relative">
          <PasswordField
            id="confirmPassword"
            name="confirmPassword"
            label="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            visible={showConfirmPassword}
            onToggleVisibility={() => setShowConfirmPassword((prev) => !prev)}
            isInvalid={confirmError}
            required
            placeholder="Répétez le mot de passe"
          />
          {confirmError && (
            <Alert className="mt-3">
              Les mots de passe ne correspondent pas.
            </Alert>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="form-label">
            Adresse email
          </label>
          <input
            type="email"
            name="email"
            value={user.email}
            placeholder="Adresse email"
            onChange={handleChange}
            required
            className={`form-control ${emailError ? "is-invalid" : ""}`}
            id="email"
          />
          {emailError && <Alert className="mt-3">{emailError}</Alert>}
        </div>
        {error && <Alert className="mt-3">{error}</Alert>}
        <Button
          type="submit"
          disabled={isLoading}
          loading={isLoading}
          loadingLabel="Inscription en cours..."
        >
          S'inscrire
        </Button>
      </form>
    </AuthCardLayout>
  );
};

export default RegisterPage;
