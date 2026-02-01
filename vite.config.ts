import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import { resolve } from "path";
import manifestBase from "./src/manifest";
import type { ManifestV3Export } from "@crxjs/vite-plugin";

const isFirefox = process.env.VITE_BROWSER === "firefox";

// Extend the base manifest with browser-specific settings
const manifest: ManifestV3Export = async (env) => {
  const base = await manifestBase(env);

  if (isFirefox) {
    return {
      ...base,
      background: {
        scripts: ["src/background/index.ts"],
      },
      browser_specific_settings: {
        gecko: {
          id: "jsa@chinese-room-solutions.com",
          strict_min_version: "140.0",
          data_collection_permissions: {
            required: ["personallyIdentifyingInfo", "websiteActivity"],
            optional: ["technicalAndInteraction"],
          },
        },
      },
    };
  }

  return base;
};

export default defineConfig({
  plugins: [
    crx({
      manifest,
      browser: isFirefox ? "firefox" : "chrome",
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
  build: {
    outDir: isFirefox ? "dist-firefox" : "dist-chrome",
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html"),
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
