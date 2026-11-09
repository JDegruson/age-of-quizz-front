import axios from "axios";
import BACKEND_URL from "../config";
import { buildAuthHeaders } from "./http";
import type { UserProfile } from "../types/user";
import type { UserStats } from "../types/userStats";
import type { Leaderboard } from "../types/leaderboard";

const API_URL = BACKEND_URL;

// Les profils sont publics : le JWT est optionnel.

export const fetchUserProfile = async (
  userProfileId: number,
  jwt?: string,
): Promise<UserProfile> => {
  const response = await axios.get(
    `${API_URL}/users/profile/${userProfileId}`,
    { headers: buildAuthHeaders(jwt) },
  );
  return response.data;
};

export const fetchLeaderboard = async (): Promise<Leaderboard> => {
  const response = await axios.get(`${API_URL}/leaderboard`);
  return response.data;
};

export const fetchUserStats = async (
  userProfileId: number,
  jwt?: string,
): Promise<UserStats> => {
  const response = await axios.get(
    `${API_URL}/users/profile/${userProfileId}/stats`,
    { headers: buildAuthHeaders(jwt) },
  );
  return response.data;
};
