import type { JobListing, JobMatch } from "@/shared/types";
import { sendMessage } from "@/shared/messages";
import type { SiteAdapter } from "./sites/base";
import { normalizeUrl } from "@/shared/utils";

// Fetch interval (2 minutes) - refresh the list of all matching positions
const FETCH_INTERVAL_MS = 120000;

export class JobMatcher {
  private adapter: SiteAdapter;
  private matchedUrls = new Map<string, number>(); // url -> score (fetched from backend)
  private submittedUrls = new Set<string>(); // URLs already submitted for indexing
  private fetchTimer: number | null = null;

  constructor(adapter: SiteAdapter) {
    this.adapter = adapter;
  }

  // Initialize matcher - fetch ALL matching positions above threshold immediately
  async initialize(): Promise<void> {
    // Fetch all matching positions immediately on page load
    await this.fetchAllMatches();

    // Start periodic refresh every 2 minutes
    this.startPeriodicFetch();
  }

  // Send message with retry logic for service worker wake-up
  private async sendMessageWithRetry(message: any, maxRetries = 2): Promise<any> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await sendMessage(message);
      } catch (error: any) {
        // Check if extension context was invalidated (extension reloaded)
        if (error?.message?.includes("Extension context invalidated")) {
          console.log("JSA: Extension context invalidated, stopping content script");
          this.cleanup();
          return { success: false, error: "Extension context invalidated" };
        }

        // Check if it's a "Could not establish connection" error (service worker not ready)
        if (error?.message?.includes("Could not establish connection") && i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
          continue;
        }
        throw error;
      }
    }
  }

  // Fetch ALL matching positions above threshold from backend
  private async fetchAllMatches(): Promise<void> {
    try {
      const platformSource = this.detectPlatformSource();

      const response = await this.sendMessageWithRetry({
        type: "CHECK_JOB_MATCHES",
        platformSource,
      });

      if (response.success) {
        const data = response.data as { matches: JobMatch[] };

        // Clear and rebuild the cache with fresh data
        this.matchedUrls.clear();
        data.matches.forEach((match) => {
          this.matchedUrls.set(normalizeUrl(match.url), match.score);
        });
      }
    } catch (error: any) {
      // Don't log errors if context was invalidated (extension reloaded)
      if (!error?.message?.includes("Extension context invalidated")) {
        console.error("JSA: Failed to fetch matches:", error);
      }
    }
  }

  // Start periodic fetching to keep the list fresh
  private startPeriodicFetch(): void {
    if (this.fetchTimer) return; // Already running

    this.fetchTimer = window.setInterval(() => {
      this.fetchAllMatches();
    }, FETCH_INTERVAL_MS);
  }

  // Check jobs and inject badges - instant lookup from pre-fetched cache
  async checkAndBadge(jobs: JobListing[]): Promise<void> {
    // Filter out jobs that already have badges
    const jobsToCheck = jobs.filter(
      (job) => !job.element.querySelector(".jsa-match-badge")
    );

    if (jobsToCheck.length === 0) {
      return;
    }

    // Collect URLs to submit for indexing (ones we haven't submitted yet)
    const urlsToSubmit: string[] = [];

    // Badge from cache (instant) - no waiting for API calls
    jobsToCheck.forEach((job) => {
      const normalizedUrl = normalizeUrl(job.url);
      const score = this.matchedUrls.get(normalizedUrl);
      if (score !== undefined) {
        this.adapter.injectBadge(job, score);
      }

      // Track URL for submission if not already submitted
      if (!this.submittedUrls.has(normalizedUrl)) {
        urlsToSubmit.push(normalizedUrl);
        this.submittedUrls.add(normalizedUrl);
      }
    });

    // Submit URLs for indexing in background (fire and forget)
    if (urlsToSubmit.length > 0) {
      this.submitUrlsForIndexing(urlsToSubmit);
    }
  }

  // Submit URLs to backend for indexing (non-blocking)
  private async submitUrlsForIndexing(urls: string[]): Promise<void> {
    try {
      await this.sendMessageWithRetry({
        type: "SUBMIT_LINKS",
        urls,
      });
    } catch {
      // Silently ignore - indexing is best-effort
    }
  }

  // Detect the current platform/source
  // NOTE: Source names must match exactly what's indexed in Qdrant
  private detectPlatformSource(): string | null {
    const hostname = window.location.hostname.toLowerCase();

    if (hostname.includes("linkedin")) return "LinkedIn";
    if (hostname.includes("glassdoor")) return "Glassdoor";
    if (hostname.includes("nationalevacaturebank")) return "NationaleVacatureBank";
    if (hostname.includes("werkzoeken")) return "WerkZoeken";

    return null; // Unknown platform
  }

  // Clean up
  cleanup(): void {
    if (this.fetchTimer) {
      clearInterval(this.fetchTimer);
      this.fetchTimer = null;
    }
    this.matchedUrls.clear();
    this.submittedUrls.clear();
  }
}
