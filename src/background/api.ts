import { API_BASE_URL } from "@/shared/constants";
import type { JobMatch, ResumeData, UserData } from "@/shared/types";

// API error class
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Make authenticated API request
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit & { jwt?: string } = {}
): Promise<T> {
  const { jwt, ...fetchOptions } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (jwt) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${jwt}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    let errorMessage = "Request failed";
    try {
      const errorBody = await response.text();
      // Try to parse as JSON to get structured error message
      try {
        const errorJson = JSON.parse(errorBody);
        errorMessage = errorJson.error || errorJson.message || errorBody;
      } catch {
        // Not JSON, use raw text if it's not empty
        if (errorBody.trim()) {
          errorMessage = errorBody;
        }
      }
    } catch {
      errorMessage = `Request failed (HTTP ${response.status})`;
    }
    throw new ApiError(response.status, errorMessage);
  }

  return response.json();
}

// Auth API
export interface AuthResponse {
  jwt: string;
  user: UserData;
}

export interface SessionResponse {
  authenticated: boolean;
  jwt?: string;
  user?: UserData;
}

// Check if user has an existing session on the website (via cookies)
export async function checkSession(): Promise<SessionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/ext/session`, {
    method: "GET",
    credentials: "include", // Include cookies from jsa.works
  });

  if (!response.ok) {
    return { authenticated: false };
  }

  return response.json();
}

export async function authenticateWithGoogle(idToken: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/ext/auth", {
    method: "POST",
    body: JSON.stringify({
      provider: "google",
      idToken,
    }),
  });
}

export async function authenticateWithMicrosoft(
  authCode: string,
  redirectUri: string
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/ext/auth", {
    method: "POST",
    body: JSON.stringify({
      provider: "microsoft",
      authCode,
      redirectUri,
    }),
  });
}

// Resume API
export interface ResumeUploadResponse {
  resumeId: string;
}

export async function uploadResume(
  jwt: string,
  file: { name: string; type: string; data: string }
): Promise<ResumeUploadResponse> {
  console.log("JSA API: Converting base64 to blob for", file.name);

  // Convert base64 to blob
  const binaryStr = atob(file.data);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: file.type });
  console.log("JSA API: Blob created, size:", blob.size);

  // Create form data
  const formData = new FormData();
  formData.append("file", blob, file.name);

  console.log("JSA API: Sending upload request to", `${API_BASE_URL}/api/ext/resume`);
  const response = await fetch(`${API_BASE_URL}/api/ext/resume`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
    body: formData,
  });

  console.log("JSA API: Upload response status:", response.status);

  if (!response.ok) {
    let errorMessage = "Upload failed";
    try {
      const errorBody = await response.text();
      console.error("JSA API: Upload failed:", response.status, errorBody);
      // Try to parse as JSON to get structured error message
      try {
        const errorJson = JSON.parse(errorBody);
        errorMessage = errorJson.error || errorJson.message || errorBody;
      } catch {
        // Not JSON, use raw text if it's not empty
        if (errorBody.trim()) {
          errorMessage = errorBody;
        }
      }
    } catch {
      errorMessage = `Upload failed (HTTP ${response.status})`;
    }
    throw new ApiError(response.status, errorMessage);
  }

  const result = await response.json();
  console.log("JSA API: Upload successful:", result);
  return result;
}

export async function getResumeStatus(jwt: string, resumeId: string): Promise<ResumeData> {
  return apiRequest<ResumeData>(`/api/ext/resume/${resumeId}/status`, {
    method: "GET",
    jwt,
  });
}

export async function listResumes(jwt: string): Promise<{ resumes: ResumeData[] }> {
  return apiRequest<{ resumes: ResumeData[] }>("/api/ext/resumes", {
    method: "GET",
    jwt,
  });
}

// Job matches API
export interface CheckMatchesRequest {
  resumeId: string;
  minScore?: number; // Minimum similarity score (default 0.55)
  platformSource?: string | null; // Platform source filter (linkedin, glassdoor, etc.)
}

export interface CheckMatchesResponse {
  matches: JobMatch[];
}

export async function checkJobMatches(
  jwt: string,
  request: CheckMatchesRequest
): Promise<CheckMatchesResponse> {
  return apiRequest<CheckMatchesResponse>("/api/ext/check-matches", {
    method: "POST",
    jwt,
    body: JSON.stringify(request),
  });
}

// Submit links API - submit URLs for indexing
export interface SubmitLinksResponse {
  submitted: number;
  skipped: number;
}

export async function submitLinks(
  jwt: string,
  urls: string[]
): Promise<SubmitLinksResponse> {
  return apiRequest<SubmitLinksResponse>("/api/ext/submit-links", {
    method: "POST",
    jwt,
    body: JSON.stringify({ urls }),
  });
}

// Get user info from JWT
export async function getUserInfo(jwt: string): Promise<UserData> {
  return apiRequest<UserData>("/api/ext/me", {
    method: "GET",
    jwt,
  });
}
