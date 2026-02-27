import axios from "axios";
import BACKEND_URL from "../config";

const API_URL = BACKEND_URL;

const sanitizeFilename = (filename: string) => {
  const parts = filename.split(".");
  const extension = parts.length > 1 ? `.${parts.pop()}` : "";
  const baseName = parts.join(".") || "upload";
  const suffix = `_${Date.now()}`;
  const asciiBase = baseName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, Math.max(1, 80 - suffix.length));
  const safeBase = asciiBase || "upload";
  return `${safeBase}${suffix}${extension}`;
};

export const fetchQuestions = async (jwt?: string) => {
  try {
    const headers = jwt
      ? {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        }
      : {
          "Content-Type": "application/json",
        };
    const response = await axios.get(`${API_URL}/questions/all`, { headers });
    return response.data;
  } catch (error) {
    console.error("Error fetching questions:", error);
    throw error;
  }
};

export const createQuestion = async (questionData: any, jwt?: string) => {
  try {
    const headers = jwt
      ? {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        }
      : {
          "Content-Type": "application/json",
        };
    const response = await axios.post(`${API_URL}/questions`, questionData, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating question:", error);
    throw error;
  }
};

export const updateQuestionStatus = async (
  questionId: number,
  status: string,
  jwt?: string,
) => {
  try {
    const headers = jwt
      ? {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        }
      : {
          "Content-Type": "application/json",
        };
    const response = await axios.put(
      `${API_URL}/questions/${questionId}/${status}`,
      null,
      {
        headers,
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error updating question status:", error);
    throw error;
  }
};

export const updateQuestion = async (questionData: any, jwt?: string) => {
  try {
    const headers = jwt
      ? {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        }
      : {
          "Content-Type": "application/json",
        };
    const response = await axios.put(`${API_URL}/questions`, questionData, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating question:", error);
    throw error;
  }
};

export const uploadImage = async (
  file: File,
  width: number,
  height: number,
  quality: number = 0.8,
  jwt?: string,
) => {
  try {
    const safeFile = new File([file], sanitizeFilename(file.name), {
      type: file.type,
      lastModified: file.lastModified,
    });
    const formData = new FormData();
    formData.append("file", safeFile);
    formData.append("width", width.toString());
    formData.append("height", height.toString());
    formData.append("quality", quality.toString());

    const headers = jwt
      ? {
          Authorization: `Bearer ${jwt}`,
        }
      : {};

    const response = await axios.post(`${API_URL}/upload/image`, formData, {
      headers,
    });

    // Extraire uniquement la partie relative du chemin (à partir de "questions/")
    let fullPath = response.data;

    // Si le backend retourne un message avec ":" (ex: "Fichier uploadé avec succès : chemin")
    if (fullPath.includes(":")) {
      fullPath = fullPath.split(":").pop().trim();
    }

    // Extraire seulement la partie relative à partir de "questions/"
    const relativePath = fullPath.includes("questions/")
      ? fullPath.substring(fullPath.indexOf("questions/"))
      : fullPath;

    return relativePath;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

export const uploadAudio = async (file: File, jwt?: string) => {
  try {
    const safeFile = new File([file], sanitizeFilename(file.name), {
      type: file.type,
      lastModified: file.lastModified,
    });
    const formData = new FormData();
    formData.append("file", safeFile);

    const headers = jwt
      ? {
          Authorization: `Bearer ${jwt}`,
        }
      : {};

    const response = await axios.post(`${API_URL}/upload/audio`, formData, {
      headers,
    });

    // Extraire uniquement la partie relative du chemin (à partir de "questions/")
    let fullPath = response.data;

    // Si le backend retourne un message avec ":" (ex: "Fichier uploadé avec succès : chemin")
    if (fullPath.includes(":")) {
      fullPath = fullPath.split(":").pop().trim();
    }

    // Extraire seulement la partie relative à partir de "questions/"
    const relativePath = fullPath.includes("questions/")
      ? fullPath.substring(fullPath.indexOf("questions/"))
      : fullPath;

    return relativePath;
  } catch (error) {
    console.error("Error uploading audio:", error);
    throw error;
  }
};

export const submitAnswers = async (
  answers: {
    questionId: number;
    answerIds: number[];
    responseTimeSeconds: number;
  }[],
  jwt?: string,
) => {
  try {
    const headers = jwt
      ? {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        }
      : {
          "Content-Type": "application/json",
        };
    const payload = {
      userAnswerRequests: answers,
    };
    const response = await axios.post(
      `${API_URL}/questions/submit-answers`,
      payload,
      { headers },
    );
    return response.data;
  } catch (error) {
    console.error("Error submitting answers:", error);
    throw error;
  }
};
