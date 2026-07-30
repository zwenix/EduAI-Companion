import re

with open('src/components/StudentNotes.tsx', 'r') as f:
    text = f.read()

# Make sure we have the strip function available
strip_func = """
const stripMarkdownWrapper = (text: string) => {
  if (!text) return text;
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    const lines = cleaned.split('\\n');
    if (lines.length > 1 && lines[0].startsWith('```')) {
      lines.shift();
    }
    if (lines.length > 0 && lines[lines.length - 1].startsWith('```')) {
      lines.pop();
    }
    cleaned = lines.join('\\n').trim();
  }
  return cleaned;
};
"""

# Insert strip_func after imports
text = text.replace("import ReaderModeModal from './ReaderModeModal';", "import ReaderModeModal from './ReaderModeModal';\n" + strip_func)

# When setting result from history
text = text.replace(
    "setResult(item.content || item);",
    "setResult(stripMarkdownWrapper(item.content || item));"
)

# When setting result from generation
text = text.replace(
    "setResult(content);",
    "setResult(stripMarkdownWrapper(content));"
)

with open('src/components/StudentNotes.tsx', 'w') as f:
    f.write(text)

