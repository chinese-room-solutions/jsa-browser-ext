import type { JobListing } from "@/shared/types";
import { BaseSiteAdapter } from "./base";

export class NationaleVacatureBankAdapter extends BaseSiteAdapter {
  name = "nationalevacaturebank";

  isJobListingPage(): boolean {
    // NVB uses CSS modules with class names like nvb_searchResults__xyz
    const hasVacatureInPath = window.location.pathname.includes("/vacature/");
    const hasSearchResults = document.querySelector('[class^="nvb_searchResults"]') !== null;
    return hasVacatureInPath || hasSearchResults;
  }

  extractJobListings(): JobListing[] {
    const listings: JobListing[] = [];

    // NVB uses CSS modules with class names like nvb_searchResult__xyz
    // The job cards are anchor tags inside ul[class^="nvb_searchResults"]
    const cards = document.querySelectorAll(
      'ul[class^="nvb_searchResults"] a[class^="nvb_searchResult"]'
    );

    cards.forEach((card) => {
      const element = card as HTMLElement;

      // The card itself is the link
      const url = this.getHref(element);
      if (!url) return;

      // Extract job title from h2
      const title = this.getTextContent(element.querySelector("h2"));

      // Extract company name - look for company link or text
      const company = this.getTextContent(
        element.querySelector('[class^="nvb_company"] a, [class^="nvb_company"]')
      );

      // Extract location
      const location = this.getTextContent(
        element.querySelector('[class^="nvb_location"], [class^="nvb_city"]')
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
    return document.querySelector('[class^="nvb_searchResults"]');
  }

  protected getBadgeTarget(element: HTMLElement): HTMLElement | null {
    // Place badge next to the job title (h2)
    return element.querySelector("h2")?.parentElement || element;
  }
}
