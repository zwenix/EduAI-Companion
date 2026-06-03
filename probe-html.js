import fs from 'fs';

function main() {
  const html = fs.readFileSync('raw-qwen-page.html', 'utf8');

  // Find all matches for API URLs
  const regex = /https?:\/\/[^\s"'`<>]+/g;
  const urls = html.match(regex) || [];
  const apiUrls = urls.filter(url => url.includes('api') || url.includes('/v2/') || url.includes('share'));
  console.log('API-related URLs found in HTML:', [...new Set(apiUrls)]);

  // Let's search if the ID itself exists in the source HTML
  const pos = html.indexOf('t_7d825e28');
  console.log('Position of ID t_7d825e28:', pos);
  if (pos !== -1) {
    console.log('Surrounding string of ID in HTML:', html.substring(pos - 100, pos + 200));
  }
}

main();
