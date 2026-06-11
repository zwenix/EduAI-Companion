import fs from 'fs';

const info = {};
for (const [key, val] of Object.entries(process.env)) {
  // skip standard secrets or credentials
  if (/key|secret|token|password|auth|credential|api/i.test(key)) {
    info[key] = '[REDACTED]';
  } else {
    info[key] = val;
  }
}

fs.writeFileSync('env-info.json', JSON.stringify(info, null, 2));
console.log('Done');
