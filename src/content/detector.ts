import type { JobListing } from "@/shared/types";
import type { SiteAdapter } from "./sites/base";

// Scan interval (1 second) - fast scanning since badge check is instant from cache
const SCAN_INTERVAL_MS = 1000;

export class JobDetector {
  private adapter: SiteAdapter;
  private scanTimer: number | null = null;
  private onJobsDetected: (jobs: JobListing[]) => void;

  constructor(adapter: SiteAdapter, onJobsDetected: (jobs: JobListing[]) => void) {
    this.adapter = adapter;
    this.onJobsDetected = onJobsDetected;
  }

  // Start detecting jobs
  start(): void {
    // Check if this is a job listing page
    if (!this.adapter.isJobListingPage()) {
      return;
    }

    // Initial scan
    this.scan();

    // Poll every second
    this.scanTimer = window.setInterval(() => {
      this.scan();
    }, SCAN_INTERVAL_MS);
  }

  // Stop detecting jobs
  stop(): void {
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = null;
    }
  }

  // Scan page for job listings
  private scan(): void {
    try {
      const listings = this.adapter.extractJobListings();

      if (listings.length === 0) {
        return;
      }

      // Notify callback with all listings (matcher handles dedup via badge check)
      this.onJobsDetected(listings);
    } catch (error) {
      console.error("JSA: Error scanning for jobs:", error);
    }
  }

  // Re-scan the page (manual trigger)
  rescan(): void {
    this.scan();
  }

  // Get the site adapter
  getAdapter(): SiteAdapter {
    return this.adapter;
  }
}
