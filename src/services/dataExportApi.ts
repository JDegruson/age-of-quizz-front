import axios from "axios";
import BACKEND_URL from "../config";
import { buildJsonHeaders } from "./http";

const API_URL = BACKEND_URL;

export const exportCivJsonToCsv = async (json: string, jwt?: string) => {
  try {
    const response = await axios.post(`${API_URL}/data/civ`, json, {
      headers: buildJsonHeaders(jwt),
      responseType: "blob",
    });

    const contentDisposition = response.headers["content-disposition"] as
      | string
      | undefined;

    return {
      blob: response.data as Blob,
      filename: contentDisposition,
    };
  } catch (error) {
    console.error("Error exporting civ data:", error);
    throw error;
  }
};
