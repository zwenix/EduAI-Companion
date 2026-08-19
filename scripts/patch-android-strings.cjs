#!/usr/bin/env node
// Patch android/app/src/main/res/values/strings.xml with the Web client ID
// so the native GoogleAuth plugin can resolve it via R.string.server_client_id
// even when no google-services.json is present. This is also done in CI via
// the workflow step "Patch Android Google Sign-In config".
const fs = require('fs');
const path = require('path');

const WEB_CLIENT_ID = '725068822716-tv8hh929bsagjliekkoq4ptkcfb3gs0k.apps.googleusercontent.com';
const STRINGS = path.join(process.cwd(), 'android/app/src/main/res/values/strings.xml');

if (!fs.existsSync(STRINGS)) {
  console.warn(`[patch-android-strings] ${STRINGS} not found — run 'npx cap add android && npx cap sync android' first`);
  process.exit(0);
}

let xml = fs.readFileSync(STRINGS, 'utf8');
if (xml.includes('server_client_id')) {
  xml = xml.replace(
    /<string name="server_client_id">.*<\/string>/,
    `<string name="server_client_id">${WEB_CLIENT_ID}</string>`
  );
  console.log(`[patch-android-strings] updated server_client_id in ${STRINGS}`);
} else {
  xml = xml.replace('</resources>', `    <string name="server_client_id">${WEB_CLIENT_ID}</string>\n</resources>`);
  console.log(`[patch-android-strings] inserted server_client_id into ${STRINGS}`);
}
fs.writeFileSync(STRINGS, xml, 'utf8');

// Also ensure the committed debug keystore is used for local builds so the SHA-1
// matches the OAuth client registration. CI does: cp signing/android-debug.keystore ~/.android/debug.keystore
const srcKeystore = path.join(process.cwd(), 'signing/android-debug.keystore');
const destHome = path.join(require('os').homedir(), '.android/debug.keystore');
const destApp = path.join(process.cwd(), 'android/app/debug.keystore');
try {
  if (fs.existsSync(srcKeystore)) {
    fs.mkdirSync(path.dirname(destHome), { recursive: true });
    fs.copyFileSync(srcKeystore, destHome);
    console.log(`[patch-android-strings] copied ${srcKeystore} -> ${destHome}`);
    if (fs.existsSync(path.dirname(destApp))) {
      fs.copyFileSync(srcKeystore, destApp);
      console.log(`[patch-android-strings] copied ${srcKeystore} -> ${destApp}`);
    }
  }
} catch (e) {
  console.warn('[patch-android-strings] keystore copy warning:', e.message);
}
