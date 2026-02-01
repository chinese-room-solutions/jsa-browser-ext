import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JobDetector } from "@/content/detector";
import type { SiteAdapter } from "@/content/sites/base";
import type { JobListing } from "@/shared/types";

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
function createMockJobListing(url: string): JobListing {
  return {
    url,
    title: "Software Engineer",
    company: "Test Company",
    element: document.createElement("div"),
  };
}

describe("JobDetector", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("start", () => {
    it("should not start scanning if not on a job listing page", () => {
      const adapter = createMockAdapter({ isJobListingPage: vi.fn(() => false) });
      const onJobsDetected = vi.fn();
      const detector = new JobDetector(adapter, onJobsDetected);

      detector.start();

      expect(adapter.isJobListingPage).toHaveBeenCalled();
      expect(adapter.extractJobListings).not.toHaveBeenCalled();
      expect(onJobsDetected).not.toHaveBeenCalled();
    });

    it("should perform initial scan when started on job listing page", () => {
      const mockJobs = [createMockJobListing("https://example.com/job/1")];
      const adapter = createMockAdapter({
        extractJobListings: vi.fn(() => mockJobs),
      });
      const onJobsDetected = vi.fn();
      const detector = new JobDetector(adapter, onJobsDetected);

      detector.start();

      expect(adapter.extractJobListings).toHaveBeenCalledTimes(1);
      expect(onJobsDetected).toHaveBeenCalledWith(mockJobs);
    });

    it("should scan periodically after starting", () => {
      const mockJobs = [createMockJobListing("https://example.com/job/1")];
      const adapter = createMockAdapter({
        extractJobListings: vi.fn(() => mockJobs),
      });
      const onJobsDetected = vi.fn();
      const detector = new JobDetector(adapter, onJobsDetected);

      detector.start();
      expect(adapter.extractJobListings).toHaveBeenCalledTimes(1);

      // Advance time by 1 second (scan interval)
      vi.advanceTimersByTime(1000);
      expect(adapter.extractJobListings).toHaveBeenCalledTimes(2);

      // Advance time by another second
      vi.advanceTimersByTime(1000);
      expect(adapter.extractJobListings).toHaveBeenCalledTimes(3);

      detector.stop();
    });

    it("should not call onJobsDetected if no jobs are found", () => {
      const adapter = createMockAdapter({
        extractJobListings: vi.fn(() => []),
      });
      const onJobsDetected = vi.fn();
      const detector = new JobDetector(adapter, onJobsDetected);

      detector.start();

      expect(adapter.extractJobListings).toHaveBeenCalled();
      expect(onJobsDetected).not.toHaveBeenCalled();
    });
  });

  describe("stop", () => {
    it("should stop periodic scanning", () => {
      const adapter = createMockAdapter({
        extractJobListings: vi.fn(() => [createMockJobListing("https://example.com/job/1")]),
      });
      const onJobsDetected = vi.fn();
      const detector = new JobDetector(adapter, onJobsDetected);

      detector.start();
      expect(adapter.extractJobListings).toHaveBeenCalledTimes(1);

      detector.stop();

      // Advance time - should not scan anymore
      vi.advanceTimersByTime(5000);
      expect(adapter.extractJobListings).toHaveBeenCalledTimes(1);
    });
  });

  describe("rescan", () => {
    it("should trigger a manual scan", () => {
      const mockJobs = [createMockJobListing("https://example.com/job/1")];
      const adapter = createMockAdapter({
        extractJobListings: vi.fn(() => mockJobs),
      });
      const onJobsDetected = vi.fn();
      const detector = new JobDetector(adapter, onJobsDetected);

      detector.rescan();

      expect(adapter.extractJobListings).toHaveBeenCalledTimes(1);
      expect(onJobsDetected).toHaveBeenCalledWith(mockJobs);
    });
  });

  describe("getAdapter", () => {
    it("should return the site adapter", () => {
      const adapter = createMockAdapter();
      const detector = new JobDetector(adapter, vi.fn());

      expect(detector.getAdapter()).toBe(adapter);
    });
  });

  describe("error handling", () => {
    it("should catch errors during scanning and continue", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const adapter = createMockAdapter({
        extractJobListings: vi.fn(() => {
          throw new Error("Test error");
        }),
      });
      const onJobsDetected = vi.fn();
      const detector = new JobDetector(adapter, onJobsDetected);

      // Should not throw
      expect(() => detector.start()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith("JSA: Error scanning for jobs:", expect.any(Error));

      consoleSpy.mockRestore();
      detector.stop();
    });
  });
});
