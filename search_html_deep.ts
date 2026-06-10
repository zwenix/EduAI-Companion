import fs from 'fs';

try {
  const content = fs.readFileSync('claude-page.html', 'utf-8');
  console.log('HTML Total Length:', content.length);

  // Check if there is some JSON inside any element or script
  // Let's search for "types", "server.ts", "import" or similar keywords in the entire file
  const searchTerms = ['server.ts', 'import', 'express', 'gemini-3.5-flash', 'cebf65b8-9782-44bb-9c30-82188aa21a35'];
  searchTerms.forEach(term => {
    const hasTerm = content.toLowerCase().includes(term.toLowerCase());
    console.log(`Contains "${term}":`, hasTerm);
  });

  // Print script tags
  const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
  console.log(`Found ${scriptMatch.length} script tags.`);
  
} catch (err) {
  console.error(err);
}
