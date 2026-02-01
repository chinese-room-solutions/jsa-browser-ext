import type { SiteAdapter } from "./sites/base";
import { LinkedInAdapter } from "./sites/linkedin";
import { GlassdoorAdapter } from "./sites/glassdoor";
import { NationaleVacatureBankAdapter } from "./sites/nationalevacaturebank";
import { WerkZoekenAdapter } from "./sites/werkzoeken";
import { JobDetector } from "./detector";
import { JobMatcher } from "./matcher";

// All supported site adapters
const adapters: SiteAdapter[] = [
  new LinkedInAdapter(),
  new GlassdoorAdapter(),
  new NationaleVacatureBankAdapter(),
  new WerkZoekenAdapter(),
];

// Find the appropriate adapter for the current site
function findAdapter(): SiteAdapter | null {
  const hostname = window.location.hostname.toLowerCase();

  for (const adapter of adapters) {
    // Check if hostname matches any of the adapter's expected patterns
    if (hostname.includes(adapter.name)) {
      return adapter;
    }
  }

  // Special cases for sites with different hostnames
  if (hostname.includes("linkedin")) {
    return adapters.find((a) => a.name === "linkedin") || null;
  }
  if (hostname.includes("glassdoor")) {
    return adapters.find((a) => a.name === "glassdoor") || null;
  }
  if (hostname.includes("nationalevacaturebank")) {
    return adapters.find((a) => a.name === "nationalevacaturebank") || null;
  }
  if (hostname.includes("werkzoeken")) {
    return adapters.find((a) => a.name === "werkzoeken") || null;
  }

  return null;
}

// Main initialization
async function init(): Promise<void> {
  const adapter = findAdapter();
  if (!adapter) {
    return;
  }

  // Create matcher and detector
  const matcher = new JobMatcher(adapter);
  const detector = new JobDetector(adapter, (jobs) => {
    matcher.checkAndBadge(jobs);
  });

  // Initialize matcher
  await matcher.initialize();

  // Start detecting jobs (initial scan + poll every 30s)
  detector.start();
}

// Start when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Export for CRXJS loader
export function onExecute() {
  // Already executing above
}
