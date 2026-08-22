#!/usr/bin/env node
/**
 * Adds a soft, low-volume ambient pad to every Help/Support Desk walkthrough
 * clip so the in-app player has an audible audio track and browsers stop
 * treating the clip as a muted/still thumbnail.
 *
 * Usage (from repo root):
 *   node scripts/add-audio-to-clips.mjs
 *
 * Re-encodes only the audio stream — the video stream is copied, so visual
 * output is byte-identical to the original clip.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const VIDEO_DIR = path.join(ROOT, 'src', 'assets', 'videos');

function resolveFfmpeg() {
  // 1) system ffmpeg
  const sys = spawnSync('which', ['ffmpeg'], { encoding: 'utf8' });
  if (sys.status === 0 && sys.stdout.trim()) return sys.stdout.trim();
  // 2) @ffmpeg-installer/ffmpeg (dev-only, used by make-howto-clips.mjs)
  try {
    return require('@ffmpeg-installer/ffmpeg').path;
  } catch {
    console.error('ffmpeg not found. Install with: npm i --no-save --ignore-scripts @ffmpeg-installer/ffmpeg');
    process.exit(1);
  }
}

const FFMPEG = resolveFfmpeg();

const files = fs.readdirSync(VIDEO_DIR)
  .filter((f) => /^howto_.*\.mp4$/i.test(f))
  .sort();

if (!files.length) {
  console.error('No howto_*.mp4 clips found in', VIDEO_DIR);
  process.exit(1);
}

console.log(`Adding ambient audio to ${files.length} clip(s) with ${FFMPEG}`);

let ok = 0;
for (const file of files) {
  const inPath = path.join(VIDEO_DIR, file);
  const tmpPath = path.join(VIDEO_DIR, `${file}.tmp.mp4`);

  // Probe duration so the generated pad exactly matches the clip length.
  const probe = spawnSync(FFMPEG, ['-hide_banner', '-i', inPath], { encoding: 'utf8' });
  const durMatch = (probe.stderr || '').match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
  if (!durMatch) {
    console.warn(`! Could not read duration for ${file}, skipping`);
    continue;
  }
  const hours = parseInt(durMatch[1], 10);
  const minutes = parseInt(durMatch[2], 10);
  const seconds = parseFloat(durMatch[3]);
  const duration = hours * 3600 + minutes * 60 + seconds;
  const fadeOut = Math.max(0.5, duration - 1);

  // Three soft sine voices (C major chord: C4, E4, G4) at very low gain,
  // low-pass filtered so the bed stays unobtrusive. Volume is intentionally
  // quiet — it is an ambient cue, not a soundtrack.
  const filter = [
    '[1:a]volume=0.030[a1]',
    '[2:a]volume=0.022[a2]',
    '[3:a]volume=0.018[a3]',
    `[a1][a2][a3]amix=inputs=3:duration=first:dropout_transition=0,lowpass=f=1600,afade=t=in:st=0:d=1,afade=t=out:st=${fadeOut}:d=1[a]`,
  ].join(';');

  const args = [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', inPath,
    '-f', 'lavfi', '-t', String(duration), '-i', 'sine=frequency=261.63:sample_rate=44100',
    '-f', 'lavfi', '-t', String(duration), '-i', 'sine=frequency=329.63:sample_rate=44100',
    '-f', 'lavfi', '-t', String(duration), '-i', 'sine=frequency=392.00:sample_rate=44100',
    '-filter_complex', filter,
    '-map', '0:v:0',
    '-map', '[a]',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '96k',
    '-ac', '2',
    '-shortest',
    '-movflags', '+faststart',
    tmpPath,
  ];

  const result = spawnSync(FFMPEG, args, { encoding: 'utf8' });
  if (result.status !== 0) {
    console.error(`✗ ${file}: ${result.stderr || result.stdout}`);
    try { fs.unlinkSync(tmpPath); } catch {}
    process.exitCode = 1;
    continue;
  }

  fs.renameSync(tmpPath, inPath);
  const kb = Math.round(fs.statSync(inPath).size / 1024);
  console.log(`✓ ${file}  (${duration.toFixed(1)}s · ${kb} KB)`);
  ok++;
}

console.log(`Done — ${ok}/${files.length} clip(s) now have an audio track.`);
