import type { JobListing } from "@/shared/types";
import { BaseSiteAdapter } from "./base";

export class LinkedInAdapter extends BaseSiteAdapter {
  name = "linkedin";

  isJobListingPage(): boolean {
    return window.location.pathname.startsWith("/jobs/");
  }

  extractJobListings(): JobListing[] {
    const listings: JobListing[] = [];

    // LinkedIn job cards in search results - try multiple selectors
    const selectors = [
      ".job-card-container",
      ".jobs-search-results__list-item",
      "[data-job-id]",
      ".job-card-list__entity-lockup",
      ".scaffold-layout__list-item", // Newer LinkedIn
      "li.jobs-search-results__list-item", // More specific
    ];

    let cards: NodeListOf<Element> | null = null;
    for (const selector of selectors) {
      cards = document.querySelectorAll(selector);
      if (cards.length > 0) {
        break;
      }
    }

    if (!cards || cards.length === 0) {
      return listings;
    }

    cards.forEach((card) => {
      const element = card as HTMLElement;

      // Find the job link - try multiple patterns
      let link = element.querySelector('a[href*="/jobs/view/"]');
      if (!link) {
        link = element.querySelector('a[href*="/jobs/"]');
      }

      const url = this.getHref(link);
      if (!url) {
        return;
      }

      // Extract job details
      let title = this.getTextContent(
        element.querySelector(
          ".job-card-list__title, .artdeco-entity-lockup__title, .job-card-container__link, h3"
        )
      );

      // LinkedIn sometimes duplicates text - try multiple deduplication strategies
      if (title) {
        // Strategy 1: Check if the string is literally repeated (e.g., "FooFoo" → "Foo")
        const halfPoint = Math.floor(title.length / 2);
        const firstHalfStr = title.substring(0, halfPoint);
        const secondHalfStr = title.substring(halfPoint);
        if (firstHalfStr === secondHalfStr && firstHalfStr.length > 0) {
          title = firstHalfStr;
        } else {
          // Strategy 2: Check if words are duplicated (e.g., "Senior Back End Engineer Senior Back End Engineer")
          const titleWords = title.split(/\s+/);
          const halfLength = Math.floor(titleWords.length / 2);
          if (titleWords.length > 2 && titleWords.length % 2 === 0) {
            const firstHalf = titleWords.slice(0, halfLength).join(" ");
            const secondHalf = titleWords.slice(halfLength).join(" ");
            if (firstHalf === secondHalf) {
              title = firstHalf;
            }
          }
        }
      }

      const company = this.getTextContent(
        element.querySelector(
          ".job-card-container__company-name, .artdeco-entity-lockup__subtitle, .job-card-container__primary-description, h4"
        )
      );

      const location = this.getTextContent(
        element.querySelector(
          ".job-card-container__metadata-item, .job-card-container__metadata-wrapper span"
        )
      );

      const listing: JobListing = { url, element };
      if (title !== undefined) listing.title = title;
      if (company !== undefined) listing.company = company;
      if (location !== undefined) listing.location = location;
      listings.push(listing);
    });

    return listings;
  }

  getListingContainer(): HTMLElement | null {
    return document.querySelector(
      ".jobs-search-results-list, .scaffold-layout__list, .jobs-search-results__list"
    );
  }

  protected getBadgeTarget(element: HTMLElement): HTMLElement | null {
    // Target the job title area
    return (
      element.querySelector(".job-card-list__title")?.parentElement ||
      element.querySelector(".artdeco-entity-lockup__title")?.parentElement ||
      element
    );
  }
}
