#!/usr/bin/env node
/**
 * Repository secret scanner.
 *
 * WHY THIS EXISTS
 * ---------------
 * `src/lib/aiSecrets.ts` intentionally embeds obfuscated fallback provider keys
 * so the standalone Android APK can call AI providers without a Node backend.
 * That file is an accepted, documented exception — but nothing prevented a REAL
 * key (or a `.env` file, a service-account JSON, a keystore password…) from
 * being committed somewhere else in the tree.
 *
 * This scanner fails the build when it finds credential-shaped material outside
 * the allow-listed, reviewed locations. It is intentionally dependency-free so
 * it can run in any CI job before `npm ci`.
 *
 * Usage:
 *   node scripts/scan-secrets.mjs            # scan the repo, exit 1 on findings
 *   node scripts/scan-secrets.mjs --verbose  # list every scanned file
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VERBOSE = process.argv.includes('--verbose');

/** Directories that never contain reviewable source. */
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  'out',
  'target',
  '.next',
  '.vite',
  '.cache',
  '.gradle',
  'android',
  'ios',
]);

/** Binary / generated extensions we never scan. */
const SKIP_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.bmp', '.svg',
  '.mp4', '.mov', '.webm', '.mp3', '.wav', '.ogg', '.flac', '.m4a',
  '.pdf', '.zip', '.gz', '.tar', '.tgz', '.bz2', '.7z', '.rar',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.keystore', '.jks', '.apk', '.aab', '.dex', '.jar', '.so', '.dylib', '.dll', '.exe',
  '.lock', '.patch',
]);

/**
 * Reviewed, deliberate exceptions. Keep this list SHORT and justified.
 * Paths are repository-relative, using forward slashes.
 */
const ALLOWLIST = [
  {
    path: 'src/lib/aiSecrets.ts',
    reason:
      'Deliberate, documented fallback keys for the standalone Android APK. ' +
      'Reversed strings so secret scanners (and the GitHub push protector) do not ' +
      'block the repo. Acceptable only for private/personal distribution — see ' +
      'TECHNICAL_SPECIFICATION.md §13.2.',
  },
  {
    path: 'env-info.json',
    reason: 'AI Studio environment metadata; all credential values are [REDACTED].',
  },
  {
    path: 'firebase-applet-config.json',
    reason: 'Firebase web config (public identifiers, protected by security rules).',
  },
  {
    path: 'google-services.json',
    reason: 'Firebase Android config (public identifiers).',
  },
  {
    path: 'docs/build-android2.workflow.yml',
    reason: 'Workflow template; contains only SHA-1/SHA-256 fingerprints, which are public.',
  },
  {
    path: 'AGENTS.md',
    reason: 'Documents the Android debug SHA-1/SHA-256 fingerprints (public identifiers).',
  },
  {
    path: '.env.example',
    reason: 'Placeholders only — no real values.',
  },
];

/**
 * Credential patterns. Each entry is { id, regex, hint }.
 * Regexes are deliberately narrow to avoid flagging documentation prose.
 */
const RULES = [
  {
    id: 'google-api-key',
    regex: /\bAIza[0-9A-Za-z\-_]{30,}\b/g,
    hint: 'Google/Firebase API key',
  },
  {
    id: 'openai-style-key',
    regex: /\bsk-[A-Za-z0-9]{20,}\b/g,
    hint: 'OpenAI-style secret key (also used by Alibaba/DashScope)',
  },
  {
    id: 'nvidia-nim-key',
    regex: /\bnvapi-[A-Za-z0-9\-_]{20,}\b/g,
    hint: 'NVIDIA NIM API key',
  },
  {
    id: 'huggingface-token',
    regex: /\bhf_[A-Za-z0-9]{30,}\b/g,
    hint: 'Hugging Face access token',
  },
  {
    id: 'replicate-token',
    regex: /\br8_[A-Za-z0-9]{30,}\b/g,
    hint: 'Replicate API token',
  },
  {
    id: 'github-token',
    regex: /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b/g,
    hint: 'GitHub token',
  },
  {
    id: 'slack-token',
    regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
    hint: 'Slack token',
  },
  {
    id: 'aws-access-key',
    regex: /\bAKIA[0-9A-Z]{16}\b/g,
    hint: 'AWS access key id',
  },
  {
    id: 'private-key-block',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g,
    hint: 'PEM private key block',
  },
  {
    id: 'vapid-private-key',
    regex: /\bVAPID_PRIVATE_KEY\s*[:=]\s*["']?(?!\s*$|["']?\s*$|\$|process\.env|YOUR|MY_|<)[A-Za-z0-9\-_]{40,}/g,
    hint: 'Hard-coded VAPID private key',
  },
];

const rel = (p) => relative(ROOT, p).split(sep).join('/');

const isAllowlisted = (path) =>
  ALLOWLIST.find((entry) => entry.path === path) || null;

function walk(dir, files = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }
  for (const name of entries) {
    const full = join(dir, name);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      walk(full, files);
    } else if (stat.isFile()) {
      const dot = name.lastIndexOf('.');
      const ext = dot >= 0 ? name.slice(dot).toLowerCase() : '';
      if (SKIP_EXT.has(ext)) continue;
      if (stat.size > 4 * 1024 * 1024) continue; // 4 MB cap
      files.push(full);
    }
  }
  return files;
}

/** True when the matched value is an obvious placeholder. */
const isPlaceholder = (value) =>
  /(YOUR|MY_|EXAMPLE|PLACEHOLDER|CHANGEME|XXXX|dummy|redacted|\[REDACTED\])/i.test(value);

const findings = [];
let scanned = 0;

for (const file of walk(ROOT)) {
  const path = rel(file);
  if (isAllowlisted(path)) {
    if (VERBOSE) console.log(`allowlisted: ${path}`);
    continue;
  }

  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  // Cheap skip for binary-ish files that slipped through.
  if (content.includes('\u0000')) continue;
  scanned += 1;
  if (VERBOSE) console.log(`scanning: ${path}`);

  const lines = content.split(/\r?\n/);
  for (const rule of RULES) {
    lines.forEach((line, index) => {
      rule.regex.lastIndex = 0;
      let match;
      while ((match = rule.regex.exec(line)) !== null) {
        if (isPlaceholder(match[0]) || isPlaceholder(line)) continue;
        findings.push({
          path,
          line: index + 1,
          rule: rule.id,
          hint: rule.hint,
          excerpt: line.trim().slice(0, 140),
        });
      }
    });
  }
}

console.log(`\n🔎 Secret scan — ${scanned} files scanned, ${ALLOWLIST.length} reviewed exceptions skipped.`);

if (findings.length === 0) {
  console.log('✅ No credential-shaped material found outside the reviewed exceptions.\n');
  process.exit(0);
}

console.error(`\n❌ ${findings.length} potential secret(s) found:\n`);
for (const finding of findings) {
  console.error(`  ${finding.path}:${finding.line}  [${finding.rule}] ${finding.hint}`);
  console.error(`     ${finding.excerpt}`);
}
console.error(
  '\nIf this is a deliberate, documented exception, add the file to ALLOWLIST in ' +
    'scripts/scan-secrets.mjs with a reason.\n' +
    'If it is a real credential: rotate it immediately, remove it from the file and ' +
    'purge it from git history.\n',
);
process.exit(1);
