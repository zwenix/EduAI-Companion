#!/usr/bin/env node
/**
 * Wire Google Sign-In native config into the freshly generated Android project.
 *
 * Standalone script (GitHub's assistant token cannot push .github/workflows
 * edits, so the wiring ships as a plain repo file). In CI the repo owner adds a
 * single step after "Sync web assets to Android" (see
 * GOOGLE_SIGNIN_ANDROID_SETUP.md §2 and docs/build-android2.workflow.yml):
 *
 *       - name: Wire Google Sign-In native config
 *         run: node scripts/wire-google-signin.mjs
 *
 * Locally, run it after `npx cap add android` / `npx cap sync android`.
 *
 * Idempotent. It:
 *   1. installs a repo-root google-services.json into android/app/ when
 *      present — the generated android/app/build.gradle only applies the
 *      google-services Gradle plugin when that file exists, and
 *   2. patches android/app/src/main/res/values/strings.xml with
 *      `server_client_id` = the Web OAuth client ID from
 *      src/config/googleAuth.ts (FIREBASE_WEB_CLIENT_ID), so the native
 *      GoogleAuth plugin's last-resort fallback (its own default is the
 *      literal string "Your Web Client Key") resolves the same Web client
 *      the app passes to GoogleAuth.initialize() at runtime.
 */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const androidApp = join(root, 'android', 'app');
const stringsFile = join(androidApp, 'src', 'main', 'res', 'values', 'strings.xml');
const googleServicesSrc = join(root, 'google-services.json');
const googleServicesDst = join(androidApp, 'google-services.json');
const googleAuthTs = join(root, 'src', 'config', 'googleAuth.ts');

if (!existsSync(androidApp)) {
  console.log('ℹ wire-google-signin: no android/app directory (web-only build) — skipping.');
  process.exit(0);
}

// 1. Install google-services.json when committed at the repo root.
if (existsSync(googleServicesSrc)) {
  copyFileSync(googleServicesSrc, googleServicesDst);
  console.log('✓ wire-google-signin: google-services.json installed into android/app/');
} else {
  console.log(
    'ℹ wire-google-signin: no repo-root google-services.json — the Capacitor plugin resolves clients from runtime config.'
  );
}

// 2. Read the Web client ID from the same constant the web app uses.
const googleAuth = readFileSync(googleAuthTs, 'utf8');
const match = googleAuth.match(/'(\d+-[A-Za-z0-9]+\.apps\.googleusercontent\.com)'/);
if (!match) {
  console.error('✗ wire-google-signin: could not extract FIREBASE_WEB_CLIENT_ID from src/config/googleAuth.ts');
  process.exit(1);
}
const clientId = match[1];
console.log(`Google Sign-In Web client ID: ${clientId}`);

if (!existsSync(stringsFile)) {
  console.warn(`! wire-google-signin: ${stringsFile} not found — skipping strings patch.`);
  process.exit(0);
}

const entry = `    <string name="server_client_id">${clientId}</string>`;
let xml = readFileSync(stringsFile, 'utf8');
if (/<string name="server_client_id">/.test(xml)) {
  xml = xml.replace(/<string name="server_client_id">[^<]*<\/string>/, entry.trim());
} else {
  xml = xml.replace(/<\/resources>/, `${entry}\n</resources>`);
}
writeFileSync(stringsFile, xml);
console.log('✓ wire-google-signin: server_client_id patched into strings.xml');
