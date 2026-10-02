import * as fs from 'fs';
import * as path from 'path';

function checkFile(filePath: string) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size < 1000) return;
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(16);
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);
    
    // Check magic numbers for common video formats:
    // MP4/MOV: contains ftyp
    // MKV/WEBM: starts with 1A 45 DF A3
    const hex = buffer.toString('hex');
    const ftypIndex = buffer.toString('ascii').indexOf('ftyp');
    if (ftypIndex !== -1 || hex.startsWith('1a45dfa3')) {
      console.log(`FOUND VIDEO! Path: ${filePath}, Hex: ${hex}, Size: ${stat.size} bytes`);
    } else {
      console.log(`Path: ${filePath}, Hex: ${hex}, Size: ${stat.size} bytes`);
    }
  } catch (err: any) {
    console.log(`Error reading ${filePath}: ${err.message}`);
  }
}

console.log("Checking potential files...");
checkFile('/serve');
checkFile('/start');

// Let's search inside /public, /tmp, and / for any binary files
function recurse(dir: string) {
  try {
    const list = fs.readdirSync(dir);
    for (const f of list) {
      if (f === 'node_modules' || f === 'dist' || f === '.git' || f === 'proc' || f === 'sys' || f === 'dev') continue;
      const full = path.join(dir, f);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          recurse(full);
        } else if (stat.size > 50000) {
          checkFile(full);
        }
      } catch (e) {}
    }
  } catch (e) {}
}

recurse('.');
recurse('/tmp');
console.log("Done checking.");
