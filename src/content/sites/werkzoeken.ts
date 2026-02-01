import type { JobListing } from "@/shared/types";
import { BaseSiteAdapter } from "./base";

export class WerkZoekenAdapter extends BaseSiteAdapter {
  name = "werkzoeken";

  isJobListingPage(): boolean {
    // WerkZoeken uses div.vacancies-wrapper as the job list container
    const hasVacatureInPath = window.location.pathname.includes("/vacature");
    const hasVacanciesWrapper = document.querySelector('div.vacancies-wrapper') !== null;
    return hasVacatureInPath || hasVacanciesWrapper;
  }

  extractJobListings(): JobListing[] {
    const listings: JobListing[] = [];

    // WerkZoeken job cards are anchor tags inside div.vacancies-wrapper
    // The structure is: div.vacancies-wrapper > div (no class) > a
    const cards = document.querySelectorAll(
      'div.vacancies-wrapper div:not([class]) a[href*="/vacature"]'
    );

    cards.forEach((card) => {
      const element = card as HTMLElement;

      // The card itself is the link
      const url = this.getHref(element);
      if (!url) return;

      // Extract job title from h2
      const title = this.getTextContent(element.querySelector("h2"));

      // Extract company name from span.fake-link inside location span
      const company = this.getTextContent(
        element.querySelector('span.location span[class^="fake-link"]')
      );

      // Extract location - it's in span.location but we want the city part, not company
      // The location span contains both city and company, city comes first
      const locationSpan = element.querySelector("span.location");
      let location: string | undefined;
      if (locationSpan) {
        // Get direct text content (city) before the company span
        const fullText = locationSpan.textContent || "";
        const companySpan = locationSpan.querySelector('span[class^="fake-link"]');
        if (companySpan) {
          location = fullText.replace(companySpan.textContent || "", "").trim();
          // Remove trailing " - " or similar separators
          location = location.replace(/\s*[-–]\s*$/, "").trim();
        } else {
          location = fullText.trim();
        }
        if (location === "") location = undefined;
      }

      const listing: JobListing = { url, element };
      if (title !== undefined) listing.title = title;
      if (company !== undefined) listing.company = company;
      if (location !== undefined) listing.location = location;
      listings.push(listing);
    });

    return listings;
  }

  getListingContainer(): HTMLElement | null {
    return document.querySelector("div.vacancies-wrapper");
  }

  protected getBadgeTarget(element: HTMLElement): HTMLElement | null {
    // Place badge next to the job title (h2)
    return element.querySelector("h2")?.parentElement || element;
  }
}
