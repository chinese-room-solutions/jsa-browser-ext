import type { JobListing } from "@/shared/types";
import { BaseSiteAdapter } from "./base";

export class GlassdoorAdapter extends BaseSiteAdapter {
  name = "glassdoor";

  isJobListingPage(): boolean {
    // Glassdoor uses CSS modules with class names like JobCard_jobCardContainer__xyz
    return (
      window.location.pathname.includes("/Job/") ||
      window.location.pathname.includes("/job-listing/") ||
      document.querySelector('[class^="JobCard_jobCardContainer"]') !== null
    );
  }

  extractJobListings(): JobListing[] {
    const listings: JobListing[] = [];

    // Glassdoor job cards - the container has a link inside with the job title
    // Structure: div[class^="JobCard_jobCardContainer"] contains a[class^="JobCard_jobTitle"]
    const cards = document.querySelectorAll('[class^="JobCard_jobCardContainer"]');

    cards.forEach((card) => {
      const element = card as HTMLElement;

      // Find the job title link which contains the URL
      const titleLink = element.querySelector('a[class^="JobCard_jobTitle"]');
      const url = this.getHref(titleLink);
      if (!url) return;

      // Extract job title from the link text
      const title = this.getTextContent(titleLink);

      // Extract company name
      const company = this.getTextContent(
        element.querySelector('[class^="EmployerProfile_compactEmployerName"]')
      );

      // Extract location
      const location = this.getTextContent(
        element.querySelector('[class^="JobCard_location"]')
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
    return document.querySelector('[class^="JobsList_jobsList"]');
  }

  protected getBadgeTarget(element: HTMLElement): HTMLElement | null {
    return (
      element.querySelector('[class^="JobCard_jobTitle"]')?.parentElement ||
      element
    );
  }
}
