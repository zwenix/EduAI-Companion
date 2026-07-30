import re

with open('src/components/ReaderModeModal.tsx', 'r') as f:
    text = f.read()

old_html = """  // Parse HTML for rendering
  const activeHTML = useMemo(() => {
    if (!content) return '';
    try {
      const parsed = marked.parse(content) as string;
      return renderMathInHtml(replaceImagePlaceholders(parsed));
    } catch (e) {
      return renderMathInHtml(content);
    }
  }, [content]);"""

new_html = """  // Parse HTML for rendering
  const activeHTML = useMemo(() => {
    if (!content) return '';
    try {
      // If content is primarily HTML, avoid marked.parse to prevent treating indents as code blocks
      const isHTML = /<\\/?[a-z][\\s\\S]*>/i.test(content) && content.trim().startsWith('<');
      const parsed = isHTML ? content : (marked.parse(content) as string);
      return renderMathInHtml(replaceImagePlaceholders(parsed));
    } catch (e) {
      return renderMathInHtml(content);
    }
  }, [content]);"""

text = text.replace(old_html, new_html)

with open('src/components/ReaderModeModal.tsx', 'w') as f:
    f.write(text)

