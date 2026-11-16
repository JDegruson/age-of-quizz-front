import React from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import type { QuestionTypeConfig } from "./config/questionTypes";
import { useQuestionForm } from "./hooks/useQuestionForm";
import QuestionMetadataFields from "./components/QuestionMetadataFields";
import AnswerOptionList from "./components/AnswerOptionList";
import MediaUploadField from "./components/MediaUploadField";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { useRequireRole } from "../../hooks/useRequireRole";
interface CreateQuestionPageProps {
  config: QuestionTypeConfig;
}

const CreateQuestionPage: React.FC<CreateQuestionPageProps> = ({ config }) => {
  const navigate = useNavigate();
  const { hasRequiredRole: isAuthor, isAuthLoading } = useRequireRole([
    "AUTHOR",
    "ADMIN",
  ]);
  const {
    title,
    setTitle,
    theme,
    setTheme,
    civilization,
    setCivilization,
    building,
    setBuilding,
    explication,
    setExplication,
    answers,
    setAnswerAt,
    correctIndices,
    toggleCorrect,
    booleanAnswer,
    setBooleanAnswer,
    mediaFile,
    setMediaFile,
    loading,
    handleSave,
  } = useQuestionForm(config);
  if (isAuthLoading || !isAuthor) {
    return null;
  }
  return (
    <>
      <ToastContainer />
      <div className="container page-fit page-lg mt-5">
        <Card style={{ position: "relative" }}>
          <Button
            variant="outline-secondary"
            className="btn-sm"
            onClick={() => navigate("/create-question")}
            style={{
              position: "absolute",
              top: "20px",
              left: "20px",
              zIndex: 10,
            }}
            title="Retour"
          >
            <i className="bi bi-arrow-left"></i>
          </Button>
          <h2 className="text-center mb-4 fw-bold">{config.heading}</h2>

          <form onSubmit={(e) => e.preventDefault()}>
            <QuestionMetadataFields
              showTheme={config.theme.visible}
              themeOptions={
                config.theme.visible ? config.theme.options : undefined
              }
              theme={theme}
              onThemeChange={setTheme}
              civilization={civilization}
              onCivilizationChange={setCivilization}
              building={building}
              onBuildingChange={setBuilding}
            />

            {config.title.mode === "input" && (
              <div className="mb-3">
                <label className="form-label">{config.title.label}</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-control"
                  placeholder={config.title.placeholder}
                />
              </div>
            )}

            <div className="mb-3">
              <label className="form-label">Explication</label>
              <textarea
                value={explication}
                onChange={(e) => setExplication(e.target.value)}
                className="form-control"
                placeholder={config.explicationPlaceholder}
                rows={3}
              />
            </div>

            {config.media && (
              <MediaUploadField
                kind={config.media.kind}
                label={config.media.label}
                file={mediaFile}
                onChange={setMediaFile}
              />
            )}

            {config.answers.mode === "list" ? (
              <AnswerOptionList
                answers={answers}
                correctIndices={correctIndices}
                onAnswerChange={setAnswerAt}
                onToggleCorrect={toggleCorrect}
              />
            ) : (
              <div className="mb-4">
                <label className="form-label">Réponse</label>
                <select
                  value={booleanAnswer.toString()}
                  onChange={(e) => setBooleanAnswer(e.target.value === "true")}
                  className="form-select"
                >
                  <option value="true">Vrai</option>
                  <option value="false">Faux</option>
                </select>
              </div>
            )}

            <div className="d-flex gap-3 justify-content-center mt-4">
              <Button
                type="button"
                variant="theme"
                onClick={handleSave}
                className="btn-lg px-5 rounded-pill shadow"
                disabled={loading}
                loading={loading}
                loadingLabel={config.savingLabel}
              >
                <i className="bi bi-check-circle me-2"></i>
                Enregistrer
              </Button>
              <Button
                type="button"
                variant="outline-secondary"
                onClick={() => navigate("/create-question")}
                className="btn-lg px-4 rounded-pill"
                disabled={loading}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Retour
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
};

export default CreateQuestionPage;
