import { DEFAULT_MIN_SCORE } from "@/shared/constants";
import type { JobMatch } from "@/shared/types";
import * as api from "./api";
import { getAuthState } from "./storage";

// Get all job matches above threshold from API
export async function getJobMatches(
  minScore?: number,
  platformSource?: string | null
): Promise<JobMatch[]> {
  const authState = await getAuthState();

  if (!authState.jwt || !authState.resumeId) {
    return [];
  }

  const effectiveMinScore = minScore || DEFAULT_MIN_SCORE;

  try {
    const request: api.CheckMatchesRequest = {
      resumeId: authState.resumeId,
      minScore: effectiveMinScore,
    };
    if (platformSource !== undefined) {
      request.platformSource = platformSource;
    }
    const response = await api.checkJobMatches(authState.jwt, request);

    return response.matches;
  } catch (error) {
    console.error("JSA: Failed to check job matches:", error);
    return [];
  }
}
