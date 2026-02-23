import SoloQuizStartPage from "./pages/SoloQuizStartPage";
import ChooseGameModePage from "./pages/ChooseGameModePage";
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CreateMultipleChoice from "./pages/CreateMultipleChoice";
import CreateTrueFalse from "./pages/CreateTrueFalse";
import CreateSoundQuestion from "./pages/CreateSoundQuestion";
import CreateImageQuestion from "./pages/CreateImageQuestion";
import ChooseQuestionType from "./pages/ChooseQuestionType";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AskMailpage from "./pages/AskMailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import UserProfilePage from "./pages/UserProfilePage";

import QuizPage from "./pages/QuizPage";
import ReviewQuestionsPage from "./pages/ReviewQuestionsPage";

import { AuthProvider } from "./components/Context/AuthContext";
import { UserProvider } from "./components/Context/UserContext";

export default function App() {
  return (
    <Router>
      <UserProvider>
        <AuthProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />

            <Route path="/create-question" element={<ChooseQuestionType />} />
            <Route
              path="/create-question/multiple"
              element={<CreateMultipleChoice />}
            />
            <Route
              path="/create-question/truefalse"
              element={<CreateTrueFalse />}
            />
            <Route
              path="/create-question/sound"
              element={<CreateSoundQuestion />}
            />
            <Route
              path="/create-question/image"
              element={<CreateImageQuestion />}
            />
            <Route
              path="/choose-question-type"
              element={<ChooseQuestionType />}
            />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/ask-mail" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/reset-password/:token"
              element={<ResetPasswordPage />}
            />

            <Route path="/profile" element={<UserProfilePage />} />

            <Route path="/review-questions" element={<ReviewQuestionsPage />} />
            <Route path="/play" element={<ChooseGameModePage />} />
            <Route path="/quizz/solo" element={<SoloQuizStartPage />} />
            <Route path="/quiz" element={<QuizPage />} />
          </Routes>
        </AuthProvider>
      </UserProvider>
    </Router>
  );
}
