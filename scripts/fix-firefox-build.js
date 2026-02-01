#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';

const distDir = 'dist-firefox';
const manifestPath = join(distDir, 'manifest.json');
const assetsDir = join(distDir, 'assets');

// Read manifest
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

// Find the background script file
const files = readdirSync(assetsDir);
const backgroundFile = files.find(f => {
  if (!f.endsWith('.js')) return false;
  const content = readFileSync(join(assetsDir, f), 'utf-8');
  // Look for background-specific code patterns
  return content.includes('chrome.runtime.onMessage.addListener') &&
         content.includes('chrome.tabs.onUpdated.addListener');
});

if (!backgroundFile) {
  console.error('Could not find background script file');
  process.exit(1);
}

console.log(`Found background script: ${backgroundFile}`);

// Update manifest
manifest.background.scripts = [`assets/${backgroundFile}`];

// Copy CSS file to dist if it's referenced in manifest
if (manifest.content_scripts) {
  manifest.content_scripts.forEach((cs, index) => {
    if (cs.css && Array.isArray(cs.css)) {
      const fixedCss = cs.css.map(cssPath => {
        if (cssPath.startsWith('src/')) {
          // Copy the CSS file from source to dist
          const srcPath = cssPath;
          const destPath = join(distDir, srcPath);
          const srcFullPath = srcPath; // Already relative to project root

          try {
            // Create directory structure
            mkdirSync(dirname(destPath), { recursive: true });
            // Copy CSS file
            copyFileSync(srcFullPath, destPath);
            console.log(`✓ Copied ${srcPath} to dist`);
            return srcPath;
          } catch (err) {
            console.error(`Failed to copy ${srcPath}:`, err.message);
            return cssPath;
          }
        }
        return cssPath;
      });
      manifest.content_scripts[index].css = fixedCss;
    }
  });
}

// Copy _locales directory for i18n support
const localesSource = 'src/_locales';
const localesDest = join(distDir, '_locales');
if (existsSync(localesSource)) {
  const locales = readdirSync(localesSource);
  locales.forEach(locale => {
    const srcPath = join(localesSource, locale, 'messages.json');
    const destPath = join(localesDest, locale, 'messages.json');
    if (existsSync(srcPath)) {
      mkdirSync(dirname(destPath), { recursive: true });
      copyFileSync(srcPath, destPath);
    }
  });
  console.log(`✓ Copied _locales (${locales.join(', ')}) to dist`);
}

// Write manifest back
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log('✓ Fixed Firefox manifest');
