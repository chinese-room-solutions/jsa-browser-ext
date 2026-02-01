// User data from JSA
export interface UserData {
  id: string;
  name: string;
  email: string;
  provider: "GOOGLE" | "MICROSOFT" | "MAGIC_LINK";
}

// Resume data from JSA
export interface ResumeData {
  id: string;
  userId: string;
  name: string;
  status: ResumeStatus;
  statusReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type ResumeStatus = "PROCESSING" | "PROCESSING_SUCCEEDED" | "PROCESSING_FAILED";

// Job match result
export interface JobMatch {
  url: string;
  score: number;
}

// Auth state
export interface AuthState {
  jwt: string | null;
  user: UserData | null;
  resumeId: string | null;
}

// Cached match data
export interface MatchCache {
  resumeId: string;
  minScore: number;
  matches: JobMatch[];
  timestamp: number;
}

// Job listing extracted from page
export interface JobListing {
  url: string;
  title?: string;
  company?: string;
  location?: string;
  element: HTMLElement;
}

// Theme preference
export type ThemePreference = "system" | "light" | "dark";
