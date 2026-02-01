import type { JobListing } from "@/shared/types";
import { t } from "@/shared/i18n";

// Site adapter interface
export interface SiteAdapter {
  // Site name for logging
  name: string;

  // Check if current page is a job listing page
  isJobListingPage(): boolean;

  // Extract all visible job listings from the page
  extractJobListings(): JobListing[];

  // Get the container element that changes when listings update
  // Used for MutationObserver
  getListingContainer(): HTMLElement | null;

  // Inject a match badge into a job listing element
  injectBadge(listing: JobListing, score: number): void;
}

// Base class with common functionality
export abstract class BaseSiteAdapter implements SiteAdapter {
  abstract name: string;

  abstract isJobListingPage(): boolean;
  abstract extractJobListings(): JobListing[];
  abstract getListingContainer(): HTMLElement | null;

  // Common badge injection logic
  injectBadge(listing: JobListing, score: number): void {
    // Check if badge already exists
    if (listing.element.querySelector(".jsa-match-badge")) {
      return;
    }

    const badge = this.createBadge(score);
    const targetElement = this.getBadgeTarget(listing.element);

    if (targetElement) {
      targetElement.style.position = "relative";
      targetElement.insertBefore(badge, targetElement.firstChild);
    }
  }

  // Get the element to attach the badge to
  protected getBadgeTarget(element: HTMLElement): HTMLElement | null {
    // Default: first child or the element itself
    return element;
  }

  // Create the badge element
  // Blue badge:  [0.5, 0.65)  - "Worth checking out!"
  // Green badge: [0.65, 0.75) - "Good match!"
  // Gold badge:  [0.75, 1.0]  - "Excellent match!"
  protected createBadge(score: number): HTMLElement {
    const badge = document.createElement("div");

    let badgeClass = "jsa-match-badge";
    let text: string;

    if (score >= 0.75) {
      badgeClass += " jsa-match-badge--gold";
      text = t("badgeExcellent");
    } else if (score >= 0.65) {
      badgeClass += " jsa-match-badge--green";
      text = t("badgeGood");
    } else {
      text = t("badgeWorth");
    }

    badge.className = badgeClass;
    const span = document.createElement("span");
    span.className = "jsa-match-badge-text";
    span.textContent = `JSA: ${text}`;
    badge.appendChild(span);
    return badge;
  }

  // Helper to safely extract text content
  protected getTextContent(element: Element | null): string | undefined {
    return element?.textContent?.trim() || undefined;
  }

  // Helper to extract URL from an anchor element
  protected getHref(element: Element | null): string {
    if (!element) return "";
    const href = element.getAttribute("href") || "";
    // Convert relative URLs to absolute
    if (href.startsWith("/")) {
      return window.location.origin + href;
    }
    return href;
  }
}
