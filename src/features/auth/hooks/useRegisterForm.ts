import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../../../types/user";
import { BACKEND_URL } from "../../../config";
import { extractBackendMessage } from "../utils/backendError";

const EMPTY_USER: User = {
  id: 0,
  name: "",
  surname: "",
  username: "",
  password: "",
  email: "",
  enabled: true,
  roles: [],
  userProfile: {
    id: 0,
    bio: "",
    avatar: "",
    pseudo: "",
    pseudoDiscord: "",
  },
  jwt: "",
};

const trimUserFields = (user: User): User => ({
  ...user,
  username: user.username?.trim(),
  email: user.email?.trim(),
  userProfile: {
    ...user.userProfile,
    pseudo: user.userProfile?.pseudo?.trim(),
  },
});

/**
 * Encapsulates the registration form's state, validation and submit flow.
 * Extracted from RegisterPage so the page stays a pure render layer -
 * mirrors what useQuestionForm did for CreateQuestionPage.
 */
export function useRegisterForm() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User>(EMPTY_USER);

  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [pseudoError, setPseudoError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const profileFields = ["pseudo", "pseudoDiscord", "bio", "avatar"];

    if (profileFields.includes(name)) {
      setUser({
        ...user,
        userProfile: {
          ...user.userProfile,
          [name]: value,
        },
      });
    } else {
      setUser({
        ...user,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUsernameError(null);
    setPseudoError(null);
    setPasswordError(false);
    setEmailError(null);
    setConfirmError(false);
    setError(null);

    if (user.password.length < 6) {
      setPasswordError(true);
      return;
    }
    if (confirmPassword !== user.password) {
      setConfirmError(true);
      return;
    }

    try {
      setIsLoading(true);
      const cleanedUser = trimUserFields(user);

      const response = await fetch(`${BACKEND_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedUser),
      });
      if (!response.ok) {
        const rawMessage = await response.text();
        const backendMessage = extractBackendMessage(rawMessage);

        if (backendMessage.includes("UserWithSamePseudoExistException")) {
          setPseudoError("Ce pseudo Age of Quizz est déjà utilisé.");
        } else if (
          backendMessage.includes("UserWithSameUsernameExistException")
        ) {
          setUsernameError("Cet identifiant est déjà utilisé.");
        } else if (/email/i.test(backendMessage)) {
          setEmailError(
            backendMessage || "Cette adresse mail est déjà utilisée.",
          );
        } else {
          setError(
            backendMessage || "Une erreur est survenue lors de l'inscription.",
          );
        }

        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      alert("Inscription réussie !");
      navigate("/login");
    } catch (error: any) {
      setIsLoading(false);
      const message = error.message || error.toString();
      if (message.includes("UserWithSamePseudoExistException")) {
        setPseudoError("Ce pseudo Age of Quizz est déjà utilisé.");
        setUsernameError(null);
        setEmailError(null);
      } else if (message.includes("UserWithSameUsernameExistException")) {
        setUsernameError("Cet identifiant est déjà utilisé.");
        setPseudoError(null);
        setEmailError(null);
      } else if (message.includes("email")) {
        setUsernameError(null);
        setPseudoError(null);
        setEmailError(message);
      } else {
        setError(message || "Une erreur est survenue lors de l'inscription.");
        setPseudoError(null);
      }
    }
  };

  return {
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
  };
}
