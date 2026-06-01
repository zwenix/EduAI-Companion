import fs from 'fs';

function run() {
  const content = fs.readFileSync('extracted_qwen_text.txt', 'utf8');
  console.log('Original content length:', content.length);
  
  // Format the text by adding line breaks at paragraphs or bullets or html boundaries
  let formatted = content;
  
  // Replace typical escaped characters
  formatted = formatted.replace(/\\n/g, '\n');
  formatted = formatted.replace(/\\t/g, '\t');
  formatted = formatted.replace(/\\"/g, '"');
  
  // Add some extra line breaks for readability
  formatted = formatted.replace(/([.!?])\s+(?=[A-Z0-9])/g, '$1\n');
  formatted = formatted.replace(/(<div|<div|<section|<h[1-6]|<p|<ul|<ol|<li)/gi, '\n$1');
  formatted = formatted.replace(/(<\/div>|<\/section>|<\/p>|<\/li>)/gi, '$1\n');
  
  fs.writeFileSync('formatted_qwen_text.txt', formatted);
  console.log('Formatted content written to formatted_qwen_text.txt');
  
  // Let's print out the first 20 lines from the top
  const lines = formatted.split('\n');
  console.log(`Formatted total lines: ${lines.length}`);
  for (let i = 0; i < Math.min( lines.length, 100 ); i++) {
    console.log(`${i+1}: ${lines[i].substring(0, 120)}`);
  }
}

run();
