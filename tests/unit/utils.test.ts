import { describe, it, expect } from "vitest";
import { normalizeUrl } from "@/shared/utils";

/**
 * URL Normalization Tests
 *
 * IMPORTANT: These test cases MUST match the tests in:
 * jsa-go/service/scraper/internal/domain/normalize_url_test.go
 *
 * The extension's normalizeUrl() must produce identical output to the
 * server-side NormalizeURLForPlatform() function for URL matching to work.
 */
describe("normalizeUrl", () => {
  // Basic edge cases
  describe("edge cases", () => {
    it("should return empty string for empty input", () => {
      expect(normalizeUrl("")).toBe("");
    });

    it("should return empty string for null/undefined input", () => {
      // @ts-expect-error testing null input
      expect(normalizeUrl(null)).toBe("");
      // @ts-expect-error testing undefined input
      expect(normalizeUrl(undefined)).toBe("");
    });

    it("should handle invalid URLs gracefully", () => {
      expect(normalizeUrl("not-a-url")).toBe("not-a-url");
      expect(normalizeUrl("://broken")).toBe("://broken");
    });
  });

  // LinkedIn: removes ALL query params (KeepLinkParams(nil))
  // Mirror of: TestNormalizeURLForPlatform/linkedin_*
  describe("LinkedIn URLs", () => {
    it("linkedin_removes_all_query_params", () => {
      expect(
        normalizeUrl(
          "https://www.linkedin.com/jobs/view/3847291834?refId=abc123&trackingId=xyz"
        )
      ).toBe("https://www.linkedin.com/jobs/view/3847291834");
    });

    it("linkedin_no_query_params_unchanged", () => {
      expect(
        normalizeUrl("https://www.linkedin.com/jobs/view/3847291834")
      ).toBe("https://www.linkedin.com/jobs/view/3847291834");
    });

    it("linkedin_preserves_path_case", () => {
      expect(
        normalizeUrl(
          "https://www.linkedin.com/jobs/view/Software-Engineer-123?ref=abc"
        )
      ).toBe("https://www.linkedin.com/jobs/view/Software-Engineer-123");
    });

    it("linkedin_country_subdomain", () => {
      expect(
        normalizeUrl("https://nl.linkedin.com/jobs/view/123?tracking=abc")
      ).toBe("https://nl.linkedin.com/jobs/view/123");
    });

    it("linkedin_malformed_percent_encoding", () => {
      // Malformed % in URL path should be fixed to %25 (matches Go behavior)
      expect(
        normalizeUrl(
          "https://www.linkedin.com/jobs/view/job-80-100%-at-company-123?ref=abc"
        )
      ).toBe("https://www.linkedin.com/jobs/view/job-80-100%25-at-company-123");
    });
  });

  // WerkZoeken: removes ALL query params (KeepLinkParams(nil))
  // Mirror of: TestNormalizeURLForPlatform/werkzoeken_*
  describe("WerkZoeken URLs", () => {
    it("werkzoeken_removes_all_query_params", () => {
      expect(
        normalizeUrl(
          "https://www.werkzoeken.nl/vacature/12345?ref=abc&utm_source=google"
        )
      ).toBe("https://www.werkzoeken.nl/vacature/12345");
    });

    it("werkzoeken_no_query_params_unchanged", () => {
      expect(normalizeUrl("https://www.werkzoeken.nl/vacature/12345")).toBe(
        "https://www.werkzoeken.nl/vacature/12345"
      );
    });
  });

  // Glassdoor: keeps query params (SanitizeURL only)
  // Mirror of: TestNormalizeURLForPlatform/glassdoor_*
  describe("Glassdoor URLs", () => {
    it("glassdoor_keeps_query_params", () => {
      expect(
        normalizeUrl(
          "https://www.glassdoor.com/job-listing/software-engineer-JV_IC123.htm?jl=123456"
        )
      ).toBe(
        "https://www.glassdoor.com/job-listing/software-engineer-JV_IC123.htm?jl=123456"
      );
    });

    it("glassdoor_no_query_params_unchanged", () => {
      expect(
        normalizeUrl(
          "https://www.glassdoor.com/job-listing/software-engineer-JV_IC123.htm"
        )
      ).toBe(
        "https://www.glassdoor.com/job-listing/software-engineer-JV_IC123.htm"
      );
    });

    it("glassdoor_nl_domain", () => {
      expect(
        normalizeUrl(
          "https://www.glassdoor.nl/job-listing/test-JV_IC456.htm?jl=789"
        )
      ).toBe("https://www.glassdoor.nl/job-listing/test-JV_IC456.htm?jl=789");
    });
  });

  // NationaleVacatureBank: keeps query params (SanitizeURL only)
  // Mirror of: TestNormalizeURLForPlatform/nvb_*
  describe("NationaleVacatureBank URLs", () => {
    it("nvb_keeps_query_params", () => {
      expect(
        normalizeUrl(
          "https://www.nationalevacaturebank.nl/vacature/12345?ref=abc"
        )
      ).toBe("https://www.nationalevacaturebank.nl/vacature/12345?ref=abc");
    });

    it("nvb_no_query_params_unchanged", () => {
      expect(
        normalizeUrl("https://www.nationalevacaturebank.nl/vacature/12345")
      ).toBe("https://www.nationalevacaturebank.nl/vacature/12345");
    });
  });

  // Unknown domains: removes query params as safe default
  describe("Unknown domain URLs", () => {
    it("removes query params for unknown domains", () => {
      expect(normalizeUrl("https://example.com/job?id=123&ref=abc")).toBe(
        "https://example.com/job"
      );
    });

    it("preserves path case for unknown domains", () => {
      expect(normalizeUrl("HTTPS://EXAMPLE.COM/JOB")).toBe(
        "https://example.com/JOB"
      );
    });
  });
});
