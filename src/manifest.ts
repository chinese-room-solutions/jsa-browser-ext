import { defineManifest } from "@crxjs/vite-plugin";
import packageJson from "../package.json";

const { version } = packageJson;

export default defineManifest(() => {
  return {
    manifest_version: 3,
    name: "__MSG_extName__",
    version,
    description: "__MSG_extDescription__",
    default_locale: "en",

    icons: {
      16: "src/assets/icons/icon-16.png",
      32: "src/assets/icons/icon-32.png",
      48: "src/assets/icons/icon-48.png",
      128: "src/assets/icons/icon-128.png",
    },

    permissions: ["storage", "activeTab", "tabs"],

    host_permissions: [
      "https://jsa.works/*",
      "http://localhost/*",
      "https://localhost/*",
      "https://*.linkedin.com/*",
      "https://*.glassdoor.com/*",
      "https://*.glassdoor.nl/*",
      "https://*.nationalevacaturebank.nl/*",
      "https://*.werkzoeken.nl/*",
    ],

    background: {
      service_worker: "src/background/index.ts",
    },

    action: {
      default_popup: "src/popup/index.html",
      default_icon: {
        16: "src/assets/icons/icon-16.png",
        32: "src/assets/icons/icon-32.png",
      },
    },

    content_scripts: [
      {
        matches: [
          "https://*.linkedin.com/jobs/*",
          "https://*.glassdoor.com/*",
          "https://*.glassdoor.nl/*",
          "https://*.nationalevacaturebank.nl/*",
          "https://*.werkzoeken.nl/*",
        ],
        js: ["src/content/index.ts"],
        css: ["src/content/styles.css"],
        run_at: "document_idle",
      },
    ],
  };
});
