import { STORAGE_KEYS } from "@/shared/constants";
import type { AuthState, MatchCache, UserData } from "@/shared/types";

// Get auth state from storage
export async function getAuthState(): Promise<AuthState> {
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.JWT,
    STORAGE_KEYS.USER,
    STORAGE_KEYS.RESUME_ID,
  ]);

  return {
    jwt: result[STORAGE_KEYS.JWT] || null,
    user: result[STORAGE_KEYS.USER] || null,
    resumeId: result[STORAGE_KEYS.RESUME_ID] || null,
  };
}

// Save auth state to storage
export async function setAuthState(jwt: string, user: UserData): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.JWT]: jwt,
    [STORAGE_KEYS.USER]: user,
  });
}

// Clear auth state
export async function clearAuthState(): Promise<void> {
  await chrome.storage.local.remove([
    STORAGE_KEYS.JWT,
    STORAGE_KEYS.USER,
    STORAGE_KEYS.RESUME_ID,
    STORAGE_KEYS.MATCH_CACHE,
  ]);
}

// Save resume ID
export async function setResumeId(resumeId: string): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.RESUME_ID]: resumeId,
  });
}

// Get match cache
export async function getMatchCache(): Promise<MatchCache | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.MATCH_CACHE);
  return result[STORAGE_KEYS.MATCH_CACHE] || null;
}

// Set match cache
export async function setMatchCache(cache: MatchCache): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.MATCH_CACHE]: cache,
  });
}

// Clear match cache
export async function clearMatchCache(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEYS.MATCH_CACHE);
}
