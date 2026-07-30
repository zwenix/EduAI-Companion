function stripMarkdownWrapper(text) {
  if (!text) return text;
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    const lines = cleaned.split('\n');
    if (lines.length > 1 && lines[0].startsWith('```')) {
      lines.shift(); // remove the first line
    }
    if (lines.length > 0 && lines[lines.length - 1].startsWith('```')) {
      lines.pop(); // remove the last line
    }
    cleaned = lines.join('\n').trim();
  }
  return cleaned;
}

console.log(stripMarkdownWrapper("```html\n<div>hello</div>\n```"));
