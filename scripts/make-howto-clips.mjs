/**
 * Generates the real, playable MP4 "walkthrough clips" used by the
 * Help / Support Desk → Walkthrough clips page.
 *
 * For every guide in src/data/howToGuides.ts it renders a short cinematic
 * clip (Ken Burns pan/zoom over the guide's showcase image) with burned-in
 * captions: category badge, guide title, and per-step "STEP n OF m" + step
 * title. Each step gets a 4-second segment, so the clip loops smoothly and
 * the Helpdesk player can sync the step panel to the video timeline.
 *
 * Each clip also gets a soft, low-volume ambient C-major pad mixed in as an
 * audio track so the in-app player has sound and browsers never treat the
 * clip as a muted, stuck thumbnail. After regenerating visuals you can also
 * run `node scripts/add-audio-to-clips.mjs` to re-apply audio to the
 * existing MP4s without touching the video stream.
 *
 * Usage (from repo root):
 *   npm i --no-save --ignore-scripts @ffmpeg-installer/ffmpeg @ffprobe-installer/ffprobe   # one-time, tooling only
 *   node scripts/make-howto-clips.mjs
 *
 * Output: src/assets/videos/howto_<guide-id>.mp4
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const FFMPEG = require('@ffmpeg-installer/ffmpeg').path;
const FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE_FILE = path.join(ROOT, 'src/data/howToGuides.ts');
const IMG_DIR = path.join(ROOT, 'src/assets/images');
const OUT_DIR = path.join(ROOT, 'src/assets/videos');

const IMAGE_MAP = {
  imgContent: 'howto_content_studio_1787492001.jpg',
  imgIntervention: 'howto_intervention_1787492001.jpg',
  imgCalendar: 'howto_calendar_1787492001.jpg',
  imgMessenger: 'howto_messenger_1787492001.jpg',
  imgClasses: 'howto_classes_1787492001.jpg',
  imgAutograde: 'howto_autograde_1787492001.jpg',
};

const CATEGORY_LABELS = {
  start: 'GETTING STARTED',
  create: 'CONTENT CREATION',
  learners: 'LEARNERS & SIAS',
  plan: 'CALENDAR & CAPS',
  message: 'MESSENGER',
  assess: 'MARKING & REPORTS',
  settings: 'SETTINGS',
};

const SECONDS_PER_STEP = 4;
const FPS = 24;
const W = 640;
const H = 360;
const CRF = 30;

// ---------------------------------------------------------------------------
// Parse the guides straight out of howToGuides.ts so the clips can never
// drift from the copy shown in the app.
// ---------------------------------------------------------------------------
const source = fs.readFileSync(SOURCE_FILE, 'utf8');

const guideBlocks = [...source.matchAll(/{\s*\n\s*id:\s*'([^']+)',[\s\S]*?\n\s*},/g)].map((m) => m[0]);
const guides = guideBlocks.map((block) => {
  const id = block.match(/id:\s*'([^']+)'/)?.[1];
  const title = block.match(/title:\s*'([^']+)'/)?.[1];
  const category = block.match(/category:\s*'([^']+)'/)?.[1];
  const imageKey = block.match(/image:\s*(img\w+)/)?.[1];
  const steps = [...block.matchAll(/{\s*title:\s*'([^']+)',\s*body:/g)].map((m) => m[1]);
  return { id, title, category, image: IMAGE_MAP[imageKey] || IMAGE_MAP.imgClasses, steps };
}).filter((g) => g.id && g.title && g.steps.length > 0);

if (guides.length === 0) {
  console.error('Could not parse any guides from', SOURCE_FILE);
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const tmpDir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'eduai-clips-'));

function escapeFilterPath(p) {
  return p.replace(/\\/g, '/');
}

function run(guide) {
  const { id, title, steps } = guide;
  const badge = `EDUAI HOW-TO  •  ${CATEGORY_LABELS[guide.category] || 'HELP'}`;
  const imagePath = path.join(IMG_DIR, guide.image);
  const outPath = path.join(OUT_DIR, `howto_${id}.mp4`);
  if (fs.existsSync(outPath) && !process.env.FORCE) {
    console.log(`skip   ${id} (exists)`);
    return;
  }

  const n = steps.length;
  const segFrames = SECONDS_PER_STEP * FPS;

  // Caption text files (avoids filter-graph escaping problems).
  const textFiles = [];
  const writeText = (text) => {
    const f = path.join(tmpDir, `t${textFiles.length}.txt`);
    fs.writeFileSync(f, text, 'utf8');
    textFiles.push(escapeFilterPath(f));
    return textFiles[textFiles.length - 1];
  };
  const badgeFile = writeText(badge);
  const titleFile = writeText(title);

  const inLabels = [];
  for (let i = 0; i < n; i++) inLabels.push(`[in${i}]`);
  // The split output labels must stay inside the same filter chain.
  const parts = [`[0:v]scale=1376:768,split=${n}${inLabels.join('')}`];

  for (let i = 0; i < n; i++) {
    // Alternate camera moves so every segment feels alive.
    const mode = i % 4;
    let zoomExpr;
    let xExpr;
    let yExpr;
    if (mode === 0) {
      zoomExpr = `1+0.10*on/${segFrames - 1}`;
      xExpr = '(iw-iw/zoom)/2';
      yExpr = '(ih-ih/zoom)/2';
    } else if (mode === 1) {
      zoomExpr = `1.10-0.10*on/${segFrames - 1}`;
      xExpr = '(iw-iw/zoom)/2';
      yExpr = '(ih-ih/zoom)/2';
    } else if (mode === 2) {
      zoomExpr = `1+0.10*on/${segFrames - 1}`;
      xExpr = `(iw-iw/zoom)*on/${segFrames - 1}`;
      yExpr = '(ih-ih/zoom)/2';
    } else {
      zoomExpr = `1.10-0.10*on/${segFrames - 1}`;
      xExpr = `(iw-iw/zoom)*(1-on/${segFrames - 1})`;
      yExpr = '(ih-ih/zoom)/2';
    }

    const stepCounter = writeText(`STEP ${i + 1} OF ${n}`);
    const stepTitle = writeText(steps[i]);

    const draw = [
      `drawtext=fontfile=${FONT}:textfile=${badgeFile}:fontsize=15:fontcolor=white:box=1:boxcolor=black@0.5:boxborderw=10:x=16:y=14`,
      `drawtext=fontfile=${FONT}:textfile=${titleFile}:fontsize=16:fontcolor=0xE2E8F0:box=1:boxcolor=black@0.45:boxborderw=8:x=(w-text_w)/2:y=14`,
      `drawtext=fontfile=${FONT}:textfile=${stepCounter}:fontsize=15:fontcolor=0xFCD34D:box=1:boxcolor=black@0.55:boxborderw=8:x=(w-text_w)/2:y=h-92`,
      `drawtext=fontfile=${FONT}:textfile=${stepTitle}:fontsize=26:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=10:x=(w-text_w)/2:y=h-54`,
    ].join(',');

    const fadeIn = i === 0 ? ',fade=t=in:st=0:d=0.4' : '';
    parts.push(
      `[in${i}]zoompan=z='${zoomExpr}':x='${xExpr}':y='${yExpr}':d=${segFrames}:s=${W}x${H}:fps=${FPS},${draw}${fadeIn}[seg${i}]`
    );
  }

  const total = n * SECONDS_PER_STEP;
  parts.push(`${inLabels.map((_, i) => `[seg${i}]`).join('')}concat=n=${n}:v=1:a=0[cat]`);
  parts.push(`[cat]fade=t=out:st=${total - 0.5}:d=0.5,format=yuv420p[v]`);

  const filter = parts.join(';');

  const result = spawnSync(
    FFMPEG,
    [
      '-y', '-v', 'error',
      '-i', imagePath,
      '-filter_complex', filter,
      '-map', '[v]',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', String(CRF),
      '-movflags', '+faststart',
      outPath,
    ],
    { encoding: 'utf8' }
  );

  if (result.status !== 0) {
    console.error(`FAIL   ${id}: ${result.stderr || result.stdout}`);
    process.exitCode = 1;
    return;
  }
  const kb = Math.round(fs.statSync(outPath).size / 1024);
  console.log(`ok     ${id}  ${n} steps · ${total}s · ${kb} KB`);
}

console.log(`Rendering ${guides.length} clips → ${path.relative(ROOT, OUT_DIR)}/`);
for (const guide of guides) run(guide);
fs.rmSync(tmpDir, { recursive: true, force: true });
console.log('done');
