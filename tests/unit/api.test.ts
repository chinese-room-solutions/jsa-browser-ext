import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ApiError,
  checkSession,
  checkJobMatches,
  getUserInfo,
  listResumes,
} from "@/background/api";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock API_BASE_URL
vi.mock("@/shared/constants", () => ({
  API_BASE_URL: "https://jsa.works",
  DEFAULT_MIN_SCORE: 0.5,
  STORAGE_KEYS: {
    JWT: "jsa_jwt",
    USER: "jsa_user",
    RESUME_ID: "jsa_resume_id",
    MATCH_CACHE: "jsa_match_cache",
  },
  CACHE_TTL_MS: 300000,
  SUPPORTED_SITES: ["linkedin.com", "glassdoor.com"],
}));

describe("API module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ApiError", () => {
    it("should create error with status and message", () => {
      const error = new ApiError(404, "Not found");
      expect(error.status).toBe(404);
      expect(error.message).toBe("Not found");
      expect(error.name).toBe("ApiError");
    });
  });

  describe("checkSession", () => {
    it("should return authenticated=false when not logged in", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const result = await checkSession();

      expect(result).toEqual({ authenticated: false });
      expect(mockFetch).toHaveBeenCalledWith("https://jsa.works/api/ext/session", {
        method: "GET",
        credentials: "include",
      });
    });

    it("should return session data when authenticated", async () => {
      const sessionData = {
        authenticated: true,
        jwt: "test-jwt",
        user: { id: "1", name: "Test", email: "test@example.com", provider: "GOOGLE" },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(sessionData),
      });

      const result = await checkSession();

      expect(result).toEqual(sessionData);
    });
  });

  describe("checkJobMatches", () => {
    it("should send correct request with JWT", async () => {
      const matches = [
        { url: "https://example.com/job/1", score: 0.85 },
        { url: "https://example.com/job/2", score: 0.72 },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ matches }),
      });

      const result = await checkJobMatches("test-jwt", {
        resumeId: "resume-123",
        jobs: [],
        minScore: 0.5,
      });

      expect(result.matches).toEqual(matches);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://jsa.works/api/ext/check-matches",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer test-jwt",
          }),
        })
      );
    });

    it("should include platformSource in request when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ matches: [] }),
      });

      await checkJobMatches("test-jwt", {
        resumeId: "resume-123",
        jobs: [],
        platformSource: "LinkedIn",
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.platformSource).toBe("LinkedIn");
    });

    it("should throw ApiError on failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
      });

      await expect(
        checkJobMatches("invalid-jwt", {
          resumeId: "resume-123",
          jobs: [],
        })
      ).rejects.toThrow(ApiError);
    });

    it("should parse JSON error response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve(JSON.stringify({ error: "Invalid request" })),
      });

      try {
        await checkJobMatches("test-jwt", {
          resumeId: "resume-123",
          jobs: [],
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toBe("Invalid request");
      }
    });
  });

  describe("getUserInfo", () => {
    it("should return user data", async () => {
      const userData = {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        provider: "GOOGLE" as const,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(userData),
      });

      const result = await getUserInfo("test-jwt");

      expect(result).toEqual(userData);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://jsa.works/api/ext/me",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer test-jwt",
          }),
        })
      );
    });
  });

  describe("listResumes", () => {
    it("should return list of resumes", async () => {
      const resumes = [
        {
          id: "resume-1",
          userId: "user-123",
          name: "Resume 1",
          status: "PROCESSING_SUCCEEDED" as const,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "resume-2",
          userId: "user-123",
          name: "Resume 2",
          status: "PROCESSING" as const,
          createdAt: "2024-01-02T00:00:00Z",
          updatedAt: "2024-01-02T00:00:00Z",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ resumes }),
      });

      const result = await listResumes("test-jwt");

      expect(result.resumes).toEqual(resumes);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://jsa.works/api/ext/resumes",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer test-jwt",
          }),
        })
      );
    });
  });

  describe("error handling", () => {
    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(getUserInfo("test-jwt")).rejects.toThrow("Network error");
    });

    it("should handle empty error response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve(""),
      });

      try {
        await getUserInfo("test-jwt");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(500);
      }
    });
  });
});
