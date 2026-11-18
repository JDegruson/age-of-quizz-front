import axios from "axios";
import BACKEND_URL from "../config";
import { buildJsonHeaders } from "./http";
import type {
  QuestionReport,
  QuestionReportReason,
} from "../types/questionReport";

const API_URL = BACKEND_URL;

export const fetchQuestions = async (jwt?: string) => {
  try {
    const response = await axios.get(`${API_URL}/questions/all`, {
      headers: buildJsonHeaders(jwt),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching questions:", error);
    throw error;
  }
};

export const createQuestion = async (questionData: any, jwt?: string) => {
  try {
    const response = await axios.post(`${API_URL}/questions`, questionData, {
      headers: buildJsonHeaders(jwt),
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
    const response = await axios.put(
      `${API_URL}/questions/${questionId}/${status}`,
      null,
      { headers: buildJsonHeaders(jwt) },
    );
    return response.data;
  } catch (error) {
    console.error("Error updating question status:", error);
    throw error;
  }
};

export const updateQuestion = async (questionData: any, jwt?: string) => {
  try {
    const response = await axios.put(`${API_URL}/questions`, questionData, {
      headers: buildJsonHeaders(jwt),
    });
    return response.data;
  } catch (error) {
    console.error("Error updating question:", error);
    throw error;
  }
};

/**
 * Report a question (any logged-in player). Reporting the same question
 * again while the first report is still open just updates it.
 */
export const reportQuestion = async (
  questionId: number,
  reason: QuestionReportReason,
  comment: string | null,
  jwt: string,
): Promise<QuestionReport> => {
  const response = await axios.post<QuestionReport>(
    `${API_URL}/questions/${questionId}/reports`,
    { reason, comment },
    { headers: buildJsonHeaders(jwt) },
  );
  return response.data;
};

/** Open (not yet handled) reports, for the review screen. */
export const fetchOpenReports = async (
  jwt: string,
): Promise<QuestionReport[]> => {
  const response = await axios.get<QuestionReport[]>(
    `${API_URL}/questions/reports`,
    { headers: buildJsonHeaders(jwt) },
  );
  return response.data;
};

/** Reviewer: closes every open report of a question. */
export const resolveQuestionReports = async (
  questionId: number,
  jwt: string,
) => {
  await axios.put(`${API_URL}/questions/${questionId}/reports/resolve`, null, {
    headers: buildJsonHeaders(jwt),
  });
};

/** Usernames of authors with at least one validated question (public). */
export const fetchQuestionAuthors = async (): Promise<string[]> => {
  const response = await axios.get<string[]>(`${API_URL}/questions/authors`);
  return response.data;
};
