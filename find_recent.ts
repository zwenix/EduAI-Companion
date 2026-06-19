import * as fs from 'fs';
import * as path from 'path';

const searchDirs = ['/app/applet', '/tmp', '/root', '/home', '/workspace', '/www-data-home', '/var', '/opt'];
const found: any[] = [];

function scan(dir: string, depth = 0) {
  if (depth > 8) return;
  try {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      if (f === 'node_modules' || f === 'dist' || f === '.git' || f === '.cache' || f === '.npm') continue;
      const full = path.join(dir, f);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          scan(full, depth + 1);
        } else {
          // Look for any file larger than 100KB or any video extension
          const ext = path.extname(f).toLowerCase();
          const isVideo = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.pdf', '.zip'].includes(ext);
          if (stat.size > 100 * 1024 || isVideo) {
            found.push({
              path: full,
              size: stat.size,
              mtime: stat.mtime
            });
          }
        }
      } catch (e) {}
    }
  } catch (e) {}
}

console.log("Starting scan of key directories...");
for (const d of searchDirs) {
  scan(d);
}

// Sort by modification time descending (most recent first)
found.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

console.log("=== SCAN RESULTS (Top 50 Most Recent >= 100KB or Video) ===");
for (const item of found.slice(0, 50)) {
  console.log(`- ${item.path} (${(item.size / 1024 / 1024).toFixed(2)} MB) - Modified: ${item.mtime.toISOString()}`);
}
console.log("Scan complete.");
