import fs from 'fs';

function run() {
  const content = fs.readFileSync('message_summaries.txt', 'utf8');
  console.log('Total text length:', content.length);
  
  // Find each section starting with === ROLE:
  const sections = content.split('=== ROLE: ');
  console.log(`Found ${sections.length - 1} sections.`);
  
  sections.forEach((sec, idx) => {
    if (!sec.trim()) return;
    const lines = sec.split('\n');
    const header = lines[0];
    console.log(`Section #${idx}: Header = ${header}, character size = ${sec.length}`);
    
    // Write out the section content if it represents the assistant's long response
    if (header.includes('assistant') && sec.length > 5000) {
      console.log(`Section #${idx} is a long assistant response! Writing to assistant_resp_${idx}.txt`);
      fs.writeFileSync(`assistant_resp_${idx}.txt`, sec);
    }
  });
}

run();
