import re

with open('src/components/ContentArchive.tsx', 'r') as f:
    text = f.read()

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

text = text.replace("import PosterPreview from './PosterPreview';", "import PosterPreview from './PosterPreview';\n" + strip_func)

# Fix rendering
text = text.replace(
    "dangerouslySetInnerHTML={{ __html: replaceImagePlaceholders(marked.parse(selectedItem.content.trim().startsWith('div ') ? '<' + selectedItem.content : selectedItem.content) as string) }}",
    "dangerouslySetInnerHTML={{ __html: replaceImagePlaceholders(/<\\/?[a-z][\\s\\S]*>/i.test(stripMarkdownWrapper(selectedItem.content)) && stripMarkdownWrapper(selectedItem.content).trim().startsWith('<') ? stripMarkdownWrapper(selectedItem.content) : marked.parse(stripMarkdownWrapper(selectedItem.content)) as string) }}"
)

with open('src/components/ContentArchive.tsx', 'w') as f:
    f.write(text)

