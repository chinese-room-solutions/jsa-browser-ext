import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JobMatcher } from "@/content/matcher";
import type { SiteAdapter } from "@/content/sites/base";
import type { JobListing } from "@/shared/types";

// Mock the messages module
vi.mock("@/shared/messages", () => ({
  sendMessage: vi.fn(),
}));

import { sendMessage } from "@/shared/messages";

// Mock SiteAdapter
function createMockAdapter(overrides: Partial<SiteAdapter> = {}): SiteAdapter {
  return {
    isJobListingPage: vi.fn(() => true),
    extractJobListings: vi.fn(() => []),
    injectBadge: vi.fn(),
    ...overrides,
  };
}

// Mock job listing
function createMockJobListing(
  url: string,
  existingBadge = false
): JobListing {
  const element = document.createElement("div");
  if (existingBadge) {
    const badge = document.createElement("span");
    badge.className = "jsa-match-badge";
    element.appendChild(badge);
  }
  return {
    url,
    title: "Software Engineer",
    company: "Test Company",
    element,
  };
}

describe("JobMatcher", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    // Mock window.location for platform detection
    Object.defineProperty(window, "location", {
      value: { hostname: "www.linkedin.com" },
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initialize", () => {
    it("should fetch all matches on initialization", async () => {
      const adapter = createMockAdapter();
      const matcher = new JobMatcher(adapter);

      vi.mocked(sendMessage).mockResolvedValue({
        success: true,
        data: {
          matches: [
            { url: "https://example.com/job/1", score: 0.85 },
            { url: "https://example.com/job/2", score: 0.72 },
          ],
        },
      });

      await matcher.initialize();

      expect(sendMessage).toHaveBeenCalledWith({
        type: "CHECK_JOB_MATCHES",
        platformSource: "LinkedIn",
      });

      matcher.cleanup();
    });

    it("should start periodic fetching after initialization", async () => {
      const adapter = createMockAdapter();
      const matcher = new JobMatcher(adapter);

      vi.mocked(sendMessage).mockResolvedValue({
        success: true,
        data: { matches: [] },
      });

      await matcher.initialize();
      expect(sendMessage).toHaveBeenCalledTimes(1);

      // Advance time by 2 minutes (fetch interval)
      vi.advanceTimersByTime(120000);
      expect(sendMessage).toHaveBeenCalledTimes(2);

      matcher.cleanup();
    });
  });

  describe("checkAndBadge", () => {
    it("should badge jobs that are in the cache", async () => {
      const adapter = createMockAdapter();
      const matcher = new JobMatcher(adapter);

      vi.mocked(sendMessage).mockResolvedValue({
        success: true,
        data: {
          matches: [{ url: "https://example.com/job/1", score: 0.85 }],
        },
      });

      await matcher.initialize();

      const jobs = [createMockJobListing("https://example.com/job/1")];
      await matcher.checkAndBadge(jobs);

      expect(adapter.injectBadge).toHaveBeenCalledWith(jobs[0], 0.85);

      matcher.cleanup();
    });

    it("should not badge jobs that are not in the cache", async () => {
      const adapter = createMockAdapter();
      const matcher = new JobMatcher(adapter);

      vi.mocked(sendMessage).mockResolvedValue({
        success: true,
        data: {
          matches: [{ url: "https://example.com/job/1", score: 0.85 }],
        },
      });

      await matcher.initialize();

      const jobs = [createMockJobListing("https://example.com/job/999")];
      await matcher.checkAndBadge(jobs);

      expect(adapter.injectBadge).not.toHaveBeenCalled();

      matcher.cleanup();
    });

    it("should skip jobs that already have badges", async () => {
      const adapter = createMockAdapter();
      const matcher = new JobMatcher(adapter);

      vi.mocked(sendMessage).mockResolvedValue({
        success: true,
        data: {
          matches: [{ url: "https://example.com/job/1", score: 0.85 }],
        },
      });

      await matcher.initialize();

      // Job with existing badge
      const jobs = [createMockJobListing("https://example.com/job/1", true)];
      await matcher.checkAndBadge(jobs);

      expect(adapter.injectBadge).not.toHaveBeenCalled();

      matcher.cleanup();
    });

    it("should normalize URLs when checking cache", async () => {
      const adapter = createMockAdapter();
      const matcher = new JobMatcher(adapter);

      vi.mocked(sendMessage).mockResolvedValue({
        success: true,
        data: {
          // LinkedIn URL without query params (how scraper stores it)
          matches: [{ url: "https://www.linkedin.com/jobs/view/123", score: 0.85 }],
        },
      });

      await matcher.initialize();

      // URL with query params (how browser shows it) - should match after normalization
      const jobs = [createMockJobListing("https://www.linkedin.com/jobs/view/123?refId=abc&trackingId=xyz")];
      await matcher.checkAndBadge(jobs);

      expect(adapter.injectBadge).toHaveBeenCalledWith(jobs[0], 0.85);

      matcher.cleanup();
    });
  });

  describe("platform detection", () => {
    it("should detect LinkedIn", async () => {
      Object.defineProperty(window, "location", {
        value: { hostname: "www.linkedin.com" },
      });

      const adapter = createMockAdapter();
      const matcher = new JobMatcher(adapter);

      vi.mocked(sendMessage).mockResolvedValue({
        success: true,
        data: { matches: [] },
      });

      await matcher.initialize();

      expect(sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ platformSource: "LinkedIn" })
      );

      matcher.cleanup();
    });

    it("should detect Glassdoor", async () => {
      Object.defineProperty(window, "location", {
        value: { hostname: "www.glassdoor.com" },
      });

      const adapter = createMockAdapter();
      const matcher = new JobMatcher(adapter);

      vi.mocked(sendMessage).mockResolvedValue({
        success: true,
        data: { matches: [] },
      });

      await matcher.initialize();

      expect(sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ platformSource: "Glassdoor" })
      );

      matcher.cleanup();
    });

    it("should detect NationaleVacatureBank", async () => {
      Object.defineProperty(window, "location", {
        value: { hostname: "www.nationalevacaturebank.nl" },
      });

      const adapter = createMockAdapter();
      const matcher = new JobMatcher(adapter);

      vi.mocked(sendMessage).mockResolvedValue({
        success: true,
        data: { matches: [] },
      });

      await matcher.initialize();

      expect(sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ platformSource: "NationaleVacatureBank" })
      );

      matcher.cleanup();
    });

    it("should detect WerkZoeken", async () => {
      Object.defineProperty(window, "location", {
        value: { hostname: "www.werkzoeken.nl" },
      });

      const adapter = createMockAdapter();
      const matcher = new JobMatcher(adapter);

      vi.mocked(sendMessage).mockResolvedValue({
        success: true,
        data: { matches: [] },
      });

      await matcher.initialize();

      expect(sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ platformSource: "WerkZoeken" })
      );

      matcher.cleanup();
    });

    it("should return null for unknown platforms", async () => {
      Object.defineProperty(window, "location", {
        value: { hostname: "www.unknown-site.com" },
      });

      const adapter = createMockAdapter();
      const matcher = new JobMatcher(adapter);

      vi.mocked(sendMessage).mockResolvedValue({
        success: true,
        data: { matches: [] },
      });

      await matcher.initialize();

      expect(sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ platformSource: null })
      );

      matcher.cleanup();
    });
  });

  describe("cleanup", () => {
    it("should stop periodic fetching and clear cache", async () => {
      const adapter = createMockAdapter();
      const matcher = new JobMatcher(adapter);

      vi.mocked(sendMessage).mockResolvedValue({
        success: true,
        data: {
          matches: [{ url: "https://example.com/job/1", score: 0.85 }],
        },
      });

      await matcher.initialize();
      matcher.cleanup();

      // Advance time - should not fetch anymore
      vi.advanceTimersByTime(60000);
      expect(sendMessage).toHaveBeenCalledTimes(1);

      // Cache should be cleared - job should not be badged
      const jobs = [createMockJobListing("https://example.com/job/1")];
      await matcher.checkAndBadge(jobs);
      expect(adapter.injectBadge).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should handle API errors gracefully", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const adapter = createMockAdapter();
      const matcher = new JobMatcher(adapter);

      vi.mocked(sendMessage).mockRejectedValue(new Error("API error"));

      // Should not throw
      await expect(matcher.initialize()).resolves.not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        "JSA: Failed to fetch matches:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
      matcher.cleanup();
    });

    it("should retry on connection errors", async () => {
      vi.useRealTimers(); // Use real timers for this test since retry uses setTimeout

      const adapter = createMockAdapter();
      const matcher = new JobMatcher(adapter);

      // First call fails with connection error, second succeeds
      vi.mocked(sendMessage)
        .mockRejectedValueOnce(new Error("Could not establish connection"))
        .mockResolvedValueOnce({
          success: true,
          data: { matches: [] },
        });

      await matcher.initialize();

      // Should have retried
      expect(sendMessage).toHaveBeenCalledTimes(2);

      matcher.cleanup();
      vi.useFakeTimers(); // Restore fake timers
    });
  });
});
