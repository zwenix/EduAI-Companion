import fs from 'fs';

function main() {
  const html = fs.readFileSync('raw-qwen-page.html', 'utf8');
  const lines = html.split('\n');

  const lineNumbers = [57, 142, 143, 147];
  for (const lineNum of lineNumbers) {
    if (lines[lineNum]) {
      console.log(`=== LINE ${lineNum} (Length: ${lines[lineNum].length}) ===`);
      console.log(lines[lineNum].substring(0, 1000));
    }
  }
}

main();
