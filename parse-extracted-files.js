import fs from 'fs';
import path from 'path';

function run() {
  const content = fs.readFileSync('assistant_msg_18d8044c-72b3-48ce-b8b7-12de191315c5_item_2.txt', 'utf8');
  console.log('Parsing file...');

  // Regex to match "### 📄 File X: `path`" followed by "```typescript\n code \n```" or similar
  // Let's use a robust approach: split by "### 📄 File" or "### 📄 "
  const fileBlocks = content.split(/### 📄 File \d+:\s*`|### 📄 File:\s*`/gi);
  console.log(`Split into ${fileBlocks.length} parts.`);

  fileBlocks.forEach((block, idx) => {
    if (idx === 0) return; // leading text before first file
    
    // The path should be at the start until the closing backtick
    const closingBacktickIdx = block.indexOf('`');
    if (closingBacktickIdx === -1) {
      console.log(`Block #${idx}: could not find closing backtick of path`);
      return;
    }
    const filePath = block.substring(0, closingBacktickIdx).trim();
    console.log(`\nBlock #${idx}: extracted path -> ${filePath}`);
    
    // Find the next code block starting with ```typescript or ```json or ```
    const codeBlockStartRx = /```(typescript|ts|json|javascript|js|css|html)?\n/i;
    const match = codeBlockStartRx.exec(block);
    if (!match) {
      console.log(`Block #${idx}: could not find code block start`);
      return;
    }
    
    const codeStartIdx = match.index + match[0].length;
    const codeEndIdx = block.indexOf('```', codeStartIdx);
    if (codeEndIdx === -1) {
      console.log(`Block #${idx}: could not find code block end`);
      return;
    }
    
    const codeContent = block.substring(codeStartIdx, codeEndIdx).trim();
    console.log(`Block #${idx}: parsed code block of length ${codeContent.length}`);
    
    // Write codeContent to filePath!
    const targetPath = path.join(process.cwd(), filePath.startsWith('/') ? filePath.substring(1) : filePath);
    // Since our sandbox uses paths starting with / or relative, let's make sure parent directories exist
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetPath, codeContent);
    console.log(`Wrote code content to ${targetPath}`);
  });
}

run();
