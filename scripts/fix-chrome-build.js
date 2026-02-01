#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

const distDir = 'dist-chrome';
const manifestPath = join(distDir, 'manifest.json');

// Read manifest
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

// Copy CSS file to dist if it's referenced in manifest
if (manifest.content_scripts) {
  manifest.content_scripts.forEach((cs, index) => {
    if (cs.css && Array.isArray(cs.css)) {
      cs.css.forEach(cssPath => {
        if (cssPath.startsWith('src/')) {
          // Copy the CSS file from source to dist
          const destPath = join(distDir, cssPath);

          try {
            // Create directory structure
            mkdirSync(dirname(destPath), { recursive: true });
            // Copy CSS file
            copyFileSync(cssPath, destPath);
            console.log(`✓ Copied ${cssPath} to dist`);
          } catch (err) {
            console.error(`Failed to copy ${cssPath}:`, err.message);
          }
        }
      });
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

console.log('✓ Fixed Chrome build');
