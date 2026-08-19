import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createQuestion } from "../../../services/questionsApi";
import { uploadAudio, uploadImage } from "../../../services/uploadApi";
import { useUser } from "../../../context/UserContext";
import { CIVILIZATIONS_MAP } from "../../../data/civilizations";
import { getImageDimensions } from "../utils/getImageDimensions";
import type { QuestionTypeConfig } from "../config/questionTypes";

const TOAST_OPTIONS = { position: "top-right" as const, autoClose: 3000 };

const defaultThemeFor = (config: QuestionTypeConfig) =>
  config.theme.visible ? config.theme.options[0] : config.theme.fixedValue;

/**
 * Drives one of the question-creation forms, based on a QuestionTypeConfig.
 * Owns all the field state a form might need (only the fields the config
 * actually enables are ever read or rendered), validation, submission
 * (including the optional media upload), and the success/error toasts.
 */
export function useQuestionForm(config: QuestionTypeConfig) {
  const navigate = useNavigate();
  const { user } = useUser();

  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState(defaultThemeFor(config));
  const [civilization, setCivilization] = useState("NONE");
  const [building, setBuilding] = useState("NONE");
  const [explication, setExplication] = useState("");
  const [answers, setAnswers] = useState<string[]>(
    config.answers.mode === "list"
      ? Array(config.answers.initialCount).fill("")
      : [],
  );
  const [correctIndices, setCorrectIndices] = useState<number[]>([]);
  const [booleanAnswer, setBooleanAnswer] = useState(true);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const setAnswerAt = (index: number, value: string) => {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const toggleCorrect = (index: number) => {
    setCorrectIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const resetForm = () => {
    if (config.title.mode === "input") {
      setTitle("");
    }
    if (config.resetExplication) {
      setExplication("");
    }
    if (config.resetTheme) {
      setTheme(defaultThemeFor(config));
    }
    setCivilization("NONE");
    setBuilding("NONE");
    setMediaFile(null);
    if (config.answers.mode === "list") {
      setAnswers(Array(config.answers.initialCount).fill(""));
      setCorrectIndices([]);
    } else {
      setBooleanAnswer(true);
    }
  };

  const validate = (): string | null => {
    if (config.title.mode === "input" && !title.trim()) {
      return config.title.requiredMessage;
    }

    if (config.media && !mediaFile) {
      return config.media.missingMessage;
    }

    if (config.answers.mode === "list") {
      const {
        minAnswers,
        exactAnswers,
        tooFewMessage,
        requireCorrectSelection,
        noCorrectMessage,
      } = config.answers;

      const nonEmptyAnswers = answers.filter((a) => a.trim());
      const requiredCount = exactAnswers ?? minAnswers ?? 0;
      if (nonEmptyAnswers.length < requiredCount) {
        return tooFewMessage;
      }

      const trimmedAnswers = answers.map((a) => a.trim()).filter((a) => a);
      const lowerSet = new Set(trimmedAnswers.map((a) => a.toLowerCase()));
      if (lowerSet.size !== trimmedAnswers.length) {
        return "Chaque réponse doit être unique";
      }

      if (requireCorrectSelection && correctIndices.length === 0) {
        return noCorrectMessage;
      }
    }

    return null;
  };

  const buildAnswersPayload = () => {
    if (config.answers.mode === "true-false") {
      return [
        { value: "Vrai", correct: booleanAnswer === true },
        { value: "Faux", correct: booleanAnswer === false },
      ];
    }
    return answers
      .map((value, index) => ({
        value: value.trim(),
        correct: correctIndices.includes(index),
      }))
      .filter((a) => a.value);
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      toast.error(validationError, TOAST_OPTIONS);
      return;
    }

    try {
      setLoading(true);

      let fileUrl: string | undefined;
      if (config.media && mediaFile) {
        if (config.media.kind === "image") {
          const { width, height } = await getImageDimensions(mediaFile);
          fileUrl = await uploadImage(mediaFile, width, height, 0.8, user?.jwt);
        } else {
          fileUrl = await uploadAudio(mediaFile, user?.jwt);
        }
      }

      const payload = {
        theme: config.theme.visible ? theme : config.theme.fixedValue,
        civilisation:
          civilization === "NONE" ? "NONE" : CIVILIZATIONS_MAP[civilization],
        building: building || "NONE",
        libelle: config.title.mode === "input" ? title : config.title.value,
        explication: explication.trim() || undefined,
        ...(fileUrl ? { fileUrl } : {}),
        type: config.type,
        answers: buildAnswersPayload(),
      };

      await createQuestion(payload, user?.jwt);
      toast.success("Question créée avec succès !", {
        ...TOAST_OPTIONS,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      resetForm();
      setTimeout(() => {
        navigate("/create-question");
      }, 2000);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Erreur lors de la création",
        TOAST_OPTIONS,
      );
    } finally {
      setLoading(false);
    }
  };

  return {
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
  };
}
