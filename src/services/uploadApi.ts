import axios from "axios";
import BACKEND_URL from "../config";
import {
  buildAuthHeaders,
  extractUploadedRelativePath,
  sanitizeFilename,
} from "./http";

const API_URL = BACKEND_URL;

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

    const response = await axios.post(`${API_URL}/upload/image`, formData, {
      headers: buildAuthHeaders(jwt),
    });

    return extractUploadedRelativePath(response.data);
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

    const response = await axios.post(`${API_URL}/upload/audio`, formData, {
      headers: buildAuthHeaders(jwt),
    });

    return extractUploadedRelativePath(response.data);
  } catch (error) {
    console.error("Error uploading audio:", error);
    throw error;
  }
};
