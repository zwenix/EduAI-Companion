#!/usr/bin/env node
/**
 * compute-version.mjs — automatic semver for the EduAI Companion CI/CD pipeline.
 *
 * Strategy (no manual versioning anywhere):
 *   1. If HEAD is already tagged with a semver (vX.Y.Z), reuse that version
 *      (idempotent re-runs do not cut duplicate releases).
 *   2. Otherwise start from the newest v-prefixed semver tag reachable from
 *      HEAD. No semver tag yet → start at 0.1.0.
 *   3. Bump level from Conventional Commits since that tag:
 *         "type(scope)!" in a subject, or "BREAKING CHANGE:" in a body → major
 *         "feat(...):" subject                                     → minor
 *         anything else (fix, perf, chore, …)                      → patch
 *
 * Output:
 *   stdout        → version without leading "v" (e.g. "1.2.3")
 *   GITHUB_OUTPUT → version=, sha=, sha_short=, already_released=true|false
 */
import { execSync } from "node:child_process";
import { appendFileSync } from "node:fs";

const git = (args) =>
  execSync(`git ${args}`, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }).trim();

const SEMVER = /^v?(\d+)\.(\d+)\.(\d+)$/;

const parse = (t) => {
  const m = t.match(SEMVER);
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
};
const fmt = (v) => `${v.major}.${v.minor}.${v.patch}`;

const sha = git("rev-parse HEAD");
const shaShort = sha.slice(0, 7);

// 1) Already released at HEAD?
const tagsAtHead = git("tag --list 'v*' --points-at HEAD")
  .split("\n")
  .map((t) => t.trim())
  .filter((t) => t && SEMVER.test(t));

let version;
let alreadyReleased = false;

if (tagsAtHead.length > 0) {
  version = fmt(parse(tagsAtHead[0]));
  alreadyReleased = true;
} else {
  // 2) Newest reachable semver tag (highest, then most recent)
  const reachable = git("tag --list 'v*' --sort=-v:refname")
    .split("\n")
    .map((t) => t.trim())
    .filter((t) => t && SEMVER.test(t));

  if (reachable.length === 0) {
    version = "0.1.0";
  } else {
    const baseTag = reachable[0];
    const subjects = git(`log ${baseTag}..HEAD --format=%s`).split("\n");
    const bodies = git(`log ${baseTag}..HEAD --format=%B`);
    const base = parse(baseTag);

    const breaking =
      subjects.some((s) => /(\(([^)]*)\))?!\s*:/.test(s)) ||
      /BREAKING[ -]CHANGE\s*:/i.test(bodies);
    const feat = subjects.some((s) => /^feat(\([^)]*\))?\s*:/.test(s));

    if (breaking) version = fmt({ major: base.major + 1, minor: 0, patch: 0 });
    else if (feat) version = fmt({ major: base.major, minor: base.minor + 1, patch: 0 });
    else version = fmt({ major: base.major, minor: base.minor, patch: base.patch + 1 });
  }
}

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `version=${version}\nsha=${sha}\nsha_short=${shaShort}\nalready_released=${alreadyReleased}\n`,
  );
}

console.log(version);
