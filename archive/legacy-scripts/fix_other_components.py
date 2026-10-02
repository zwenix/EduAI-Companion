import os
import re

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

# 1. StudentPractice.tsx
with open('src/components/StudentPractice.tsx', 'r') as f:
    text = f.read()

text = text.replace("import ReaderModeModal from './ReaderModeModal';", "import ReaderModeModal from './ReaderModeModal';\n" + strip_func)
text = text.replace("bodyHtml = marked.parse(bodyHtml) as string;", "bodyHtml = marked.parse(stripMarkdownWrapper(bodyHtml)) as string;")
text = text.replace("memoHtml = marked.parse(memoHtml) as string;", "memoHtml = marked.parse(stripMarkdownWrapper(memoHtml)) as string;")
text = text.replace("marked.parse(result.content || result)", "(/<\\/?[a-z][\\s\\S]*>/i.test(stripMarkdownWrapper(result.content || result)) && stripMarkdownWrapper(result.content || result).trim().startsWith('<')) ? stripMarkdownWrapper(result.content || result) : marked.parse(stripMarkdownWrapper(result.content || result))")
text = text.replace("marked.parse(result.memo)", "(/<\\/?[a-z][\\s\\S]*>/i.test(stripMarkdownWrapper(result.memo)) && stripMarkdownWrapper(result.memo).trim().startsWith('<')) ? stripMarkdownWrapper(result.memo) : marked.parse(stripMarkdownWrapper(result.memo))")

with open('src/components/StudentPractice.tsx', 'w') as f:
    f.write(text)


# 2. App.tsx (for selectedOfflineMaterial)
with open('src/App.tsx', 'r') as f:
    text = f.read()

# Add strip_func near the top of App.tsx, but there are imports, so let's put it right after imports
text = text.replace("import ReaderModeModal from './components/ReaderModeModal';", "import ReaderModeModal from './components/ReaderModeModal';\n" + strip_func)

text = text.replace("marked.parse(selectedOfflineMaterial.content || '')", "(/<\\/?[a-z][\\s\\S]*>/i.test(stripMarkdownWrapper(selectedOfflineMaterial.content || '')) && stripMarkdownWrapper(selectedOfflineMaterial.content || '').trim().startsWith('<')) ? stripMarkdownWrapper(selectedOfflineMaterial.content || '') : marked.parse(stripMarkdownWrapper(selectedOfflineMaterial.content || ''))")
text = text.replace("marked.parse(selectedOfflineMaterial.content || '*No content available for this study guide. Try sync again.*')", "(/<\\/?[a-z][\\s\\S]*>/i.test(stripMarkdownWrapper(selectedOfflineMaterial.content || '')) && stripMarkdownWrapper(selectedOfflineMaterial.content || '').trim().startsWith('<')) ? stripMarkdownWrapper(selectedOfflineMaterial.content || '') : marked.parse(stripMarkdownWrapper(selectedOfflineMaterial.content || '*No content available for this study guide. Try sync again.*'))")

with open('src/App.tsx', 'w') as f:
    f.write(text)


# 3. StudentDashboard.tsx
with open('src/components/StudentDashboard.tsx', 'r') as f:
    text = f.read()
text = text.replace("import { replaceImagePlaceholders } from '../lib/imageReplacer';", "import { replaceImagePlaceholders } from '../lib/imageReplacer';\n" + strip_func)
text = text.replace("marked.parse(selectedAssignment.content || '')", "(/<\\/?[a-z][\\s\\S]*>/i.test(stripMarkdownWrapper(selectedAssignment.content || '')) && stripMarkdownWrapper(selectedAssignment.content || '').trim().startsWith('<')) ? stripMarkdownWrapper(selectedAssignment.content || '') : marked.parse(stripMarkdownWrapper(selectedAssignment.content || ''))")
with open('src/components/StudentDashboard.tsx', 'w') as f:
    f.write(text)

