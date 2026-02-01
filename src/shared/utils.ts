// Normalize URL for comparison - must match server-side normalization per platform
// Each platform's scraper normalizes URLs differently before storing in Qdrant

// Fix malformed percent encoding (matches Go's fixMalformedURL)
// Replace % followed by non-hex characters with %25
function fixMalformedURL(url: string): string {
  return url.replace(/%([^0-9A-Fa-f]|$)/g, "%25$1");
}

export function normalizeUrl(url: string): string {
  if (!url) return "";

  // Fix malformed percent encoding before parsing (matches Go behavior)
  const fixedUrl = fixMalformedURL(url);

  try {
    const parsed = new URL(fixedUrl);
    const hostname = parsed.hostname.toLowerCase();

    // LinkedIn: remove ALL query params (KeepLinkParams(nil))
    if (hostname.includes("linkedin")) {
      parsed.search = "";
      return parsed.toString();
    }

    // WerkZoeken: remove ALL query params (KeepLinkParams(nil))
    if (hostname.includes("werkzoeken")) {
      parsed.search = "";
      return parsed.toString();
    }

    // Glassdoor: keep query params as-is (only SanitizeURL)
    if (hostname.includes("glassdoor")) {
      return parsed.toString();
    }

    // NationaleVacatureBank: keep query params as-is (only SanitizeURL)
    if (hostname.includes("nationalevacaturebank")) {
      return parsed.toString();
    }

    // Default: remove query params (safe default)
    parsed.search = "";
    return parsed.toString();
  } catch {
    // If URL parsing fails, return as-is
    return url;
  }
}
