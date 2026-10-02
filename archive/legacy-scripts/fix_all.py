import re
import os

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

def replace_in_file(filepath, anchor):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Remove any existing stripMarkdownWrapper functions to prevent duplicates
    content = re.sub(r'const stripMarkdownWrapper = \(text: string\) => \{.*?\n\};\n', '', content, flags=re.DOTALL)
    
    # Insert at anchor
    content = content.replace(anchor, anchor + "\n" + strip_func)
    
    with open(filepath, 'w') as f:
        f.write(content)

replace_in_file('src/App.tsx', "import { marked } from 'marked';")
replace_in_file('src/components/ContentArchive.tsx', "import { marked } from 'marked';")
replace_in_file('src/components/StudentPractice.tsx', "import { marked } from 'marked';")
replace_in_file('src/components/StudentDashboard.tsx', "import { marked } from 'marked';")
replace_in_file('src/components/StudentNotes.tsx', "import { marked } from 'marked';")

