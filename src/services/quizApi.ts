import axios from "axios";
import BACKEND_URL from "../config";
import { buildJsonHeaders } from "./http";

const API_URL = BACKEND_URL;

export const submitAnswers = async (
  answers: {
    questionId: number;
    answerIds: number[];
    responseTimeSeconds: number;
  }[],
  jwt?: string,
) => {
  try {
    const payload = {
      userAnswerRequests: answers,
    };
    const response = await axios.post(
      `${API_URL}/questions/submit-answers`,
      payload,
      { headers: buildJsonHeaders(jwt) },
    );
    return response.data;
  } catch (error) {
    console.error("Error submitting answers:", error);
    throw error;
  }
};
