import React from "react";
import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import ChooseQuestionType from "../features/question-authoring/ChooseQuestionType";
import CreateQuestionPage from "../features/question-authoring/CreateQuestionPage";
import {
  multipleChoiceConfig,
  trueFalseConfig,
  soundQuestionConfig,
  imageQuestionConfig,
} from "../features/question-authoring/config/questionTypes";
import LoginPage from "../features/auth/LoginPage";
import RegisterPage from "../features/auth/RegisterPage";
import ForgotPasswordPage from "../features/auth/ForgotPasswordPage";
import ResetPasswordPage from "../features/auth/ResetPasswordPage";
import UserProfilePage from "../features/profile/UserProfilePage";
import QuizPage from "../features/quiz/QuizPage";
import ReviewQuestionsPage from "../features/review/ReviewQuestionsPage";
import ExportCivDataPage from "../pages/ExportCivDataPage";
import MultiplayerRoomPage from "../features/multiplayer/MultiplayerRoomPage";
import MultiplayerOptionsPage from "../features/multiplayer/MultiplayerOptionsPage";
import VerifyEmailPage from "../features/auth/VerifyEmailPage";
import BecomeAuthorPage from "../pages/BecomeAuthorPage";
import ChooseGameModePage from "../pages/ChooseGameModePage";
import SoloQuizStartPage from "../features/quiz/SoloQuizStartPage";

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<Home />} />

    <Route path="/create-question" element={<ChooseQuestionType />} />
    <Route
      path="/create-question/multiple"
      element={<CreateQuestionPage config={multipleChoiceConfig} />}
    />
    <Route
      path="/create-question/truefalse"
      element={<CreateQuestionPage config={trueFalseConfig} />}
    />
    <Route
      path="/create-question/sound"
      element={<CreateQuestionPage config={soundQuestionConfig} />}
    />
    <Route
      path="/create-question/image"
      element={<CreateQuestionPage config={imageQuestionConfig} />}
    />

    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />

    <Route path="/ask-mail" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

    <Route path="/profile" element={<UserProfilePage />} />

    <Route path="/review-questions" element={<ReviewQuestionsPage />} />
    <Route path="/export-civ-data" element={<ExportCivDataPage />} />
    <Route path="/verify-email" element={<VerifyEmailPage />} />
    <Route path="/become-author" element={<BecomeAuthorPage />} />
    <Route path="/play" element={<ChooseGameModePage />} />
    <Route path="/quizz/solo" element={<SoloQuizStartPage />} />
    <Route path="/quizz/multiplayer" element={<MultiplayerOptionsPage />} />
    <Route
      path="/create-room"
      element={<MultiplayerRoomPage mode="create" />}
    />
    <Route path="/join-room" element={<MultiplayerRoomPage mode="join" />} />
    <Route path="/quiz" element={<QuizPage />} />
  </Routes>
);

export default AppRoutes;
