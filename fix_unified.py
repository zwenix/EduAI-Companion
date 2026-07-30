import re

with open('src/services/unifiedAiService.ts', 'r') as f:
    text = f.read()

text = text.replace(
    "const result = await makeCompletionRequest(provider, messages);\n    return result.content;",
    "const result = await makeCompletionRequest(provider, messages);\n    let resultText = result.content || \"\";\n    resultText = resultText.trim();\n    if (resultText.startsWith('```')) {\n      const lines = resultText.split('\\n');\n      if (lines.length > 1 && lines[0].startsWith('```')) {\n        lines.shift();\n      }\n      if (lines.length > 0 && lines[lines.length - 1].startsWith('```')) {\n        lines.pop();\n      }\n      resultText = lines.join('\\n').trim();\n    }\n    return resultText;"
)

with open('src/services/unifiedAiService.ts', 'w') as f:
    f.write(text)

