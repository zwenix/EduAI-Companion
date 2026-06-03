import fs from 'fs';

function main() {
  const html = fs.readFileSync('raw-qwen-page.html', 'utf8');
  console.log('Analyzing HTML of size:', html.length);

  // Look for any large JSON blocks or inline script assignments
  const lines = html.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('window.') || line.includes('history') || line.includes('JSON.parse') || line.includes('bootstrap')) {
      if (line.length > 500) {
        console.log(`Line ${i} is long (${line.length} chars) and matches dynamic keywords.`);
        fs.writeFileSync('extracted_long_line.txt', line);
      }
    }
  }

  // Simple HTML tag stripper to get visible text
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/\s+/g, ' ').trim();

  fs.writeFileSync('extracted_text.txt', text.substring(0, 100000));
  console.log('Stripped text length:', text.length);
  console.log('Written to extracted_text.txt');
}

main();
