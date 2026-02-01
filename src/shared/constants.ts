// API Configuration
// Use VITE_API_BASE_URL environment variable to override (e.g., for local testing)
// Example: VITE_API_BASE_URL=http://localhost:8080 bun run dev:chrome
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://jsa.works";

// Storage Keys
export const STORAGE_KEYS = {
  JWT: "jsa_jwt",
  USER: "jsa_user",
  RESUME_ID: "jsa_resume_id",
  MATCH_CACHE: "jsa_match_cache",
  THEME: "jsa_theme",
} as const;

// Cache Configuration
export const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Match Configuration
export const DEFAULT_MIN_SCORE = 0.5; // Default minimum similarity score threshold

// Supported Job Sites
export const SUPPORTED_SITES = [
  "linkedin.com",
  "glassdoor.com",
  "glassdoor.nl",
  "glassdoor.de",
  "glassdoor.fr",
  "nationalevacaturebank.nl",
  "werkzoeken.nl",
] as const;
