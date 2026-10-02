const fs = require('fs');
const path = require('path');
const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

const files = [
  'dashboard.png',
  'toolbox.png',
  'ai-tutor.png',
  'magic-lessons.png',
  'super-worksheets.png',
  'personalized.png',
  'games.png',
  'class-manager.png',
  'resource-library.png',
  'settings.png'
];

files.forEach(f => {
  fs.writeFileSync(path.join('public', 'overlays', f), pixel);
});
console.log('Done');
