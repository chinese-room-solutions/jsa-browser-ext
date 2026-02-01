import type { AuthState, JobMatch, ResumeData, UserData } from "./types";

// Message types for extension communication
export type MessageType =
  | "GET_AUTH_STATE"
  | "CHECK_SESSION"
  | "START_AUTH"
  | "AUTH_SUCCESS"
  | "LOGIN_GOOGLE"
  | "LOGIN_MICROSOFT"
  | "LOGOUT"
  | "UPLOAD_RESUME"
  | "GET_RESUME_STATUS"
  | "LIST_RESUMES"
  | "SET_ACTIVE_RESUME"
  | "CHECK_JOB_MATCHES"
  | "SUBMIT_LINKS";

// Message payloads
export interface GetAuthStateMessage {
  type: "GET_AUTH_STATE";
}

export interface CheckSessionMessage {
  type: "CHECK_SESSION";
}

export interface LoginGoogleMessage {
  type: "LOGIN_GOOGLE";
  idToken: string;
}

export interface LoginMicrosoftMessage {
  type: "LOGIN_MICROSOFT";
  authCode: string;
  redirectUri: string;
}

export interface LogoutMessage {
  type: "LOGOUT";
}

export interface UploadResumeMessage {
  type: "UPLOAD_RESUME";
  file: {
    name: string;
    type: string;
    data: string; // base64 encoded
  };
}

export interface GetResumeStatusMessage {
  type: "GET_RESUME_STATUS";
  resumeId: string;
}

export interface CheckJobMatchesMessage {
  type: "CHECK_JOB_MATCHES";
  minScore?: number; // Minimum similarity score threshold (default: 0.55)
  platformSource?: string | null; // Platform source filter (linkedin, glassdoor, etc.)
}

export interface SubmitLinksMessage {
  type: "SUBMIT_LINKS";
  urls: string[];
}

export interface ListResumesMessage {
  type: "LIST_RESUMES";
}

export interface SetActiveResumeMessage {
  type: "SET_ACTIVE_RESUME";
  resumeId: string;
}

export interface StartAuthMessage {
  type: "START_AUTH";
  authUrl: string;
}

export interface AuthSuccessMessage {
  type: "AUTH_SUCCESS";
  data: {
    jwt: string;
    user: UserData;
  };
}

export type ExtensionMessage =
  | GetAuthStateMessage
  | CheckSessionMessage
  | StartAuthMessage
  | AuthSuccessMessage
  | LoginGoogleMessage
  | LoginMicrosoftMessage
  | LogoutMessage
  | UploadResumeMessage
  | GetResumeStatusMessage
  | ListResumesMessage
  | SetActiveResumeMessage
  | CheckJobMatchesMessage
  | SubmitLinksMessage;

// Response types
export interface AuthStateResponse {
  success: true;
  data: AuthState;
}

export interface CheckSessionResponse {
  success: true;
  data:
    | { authenticated: false }
    | { authenticated: true; jwt: string; user: UserData };
}

export interface StartAuthResponse {
  success: true;
  data: { tabId: number | null };
}

export interface LoginResponse {
  success: true;
  data: {
    jwt: string;
    user: UserData;
  };
}

export interface LogoutResponse {
  success: true;
  data: { jwt: null; user: null; resumeId: null };
}

export interface ResumeUploadResponse {
  success: true;
  data: {
    resumeId: string;
  };
}

export interface ResumeStatusResponse {
  success: true;
  data: ResumeData;
}

export interface ListResumesResponse {
  success: true;
  data: { resumes: ResumeData[] };
}

export interface SetActiveResumeResponse {
  success: true;
  data: { resumeId: string };
}

export interface JobMatchesResponse {
  success: true;
  data: {
    matches: JobMatch[];
  };
}

export interface SubmitLinksResponse {
  success: true;
  data: {
    submitted: number;
    skipped: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
}

export type ExtensionResponse =
  | AuthStateResponse
  | CheckSessionResponse
  | StartAuthResponse
  | LoginResponse
  | LogoutResponse
  | ResumeUploadResponse
  | ResumeStatusResponse
  | ListResumesResponse
  | SetActiveResumeResponse
  | JobMatchesResponse
  | SubmitLinksResponse
  | ErrorResponse;

// Helper to send messages from popup/content to background
export async function sendMessage<T extends ExtensionMessage>(
  message: T
): Promise<ExtensionResponse> {
  try {
    return await chrome.runtime.sendMessage(message);
  } catch (error: any) {
    // Handle extension context invalidation gracefully
    if (error?.message?.includes("Extension context invalidated")) {
      return {
        success: false,
        error: "Extension was reloaded. Please refresh the page.",
      };
    }
    throw error;
  }
}
