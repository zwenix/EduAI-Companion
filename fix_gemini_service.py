import re

with open('src/services/geminiService.ts', 'r') as f:
    text = f.read()

old_fn = """export const generateEducationalContent = async (type: string, details: string) => {
  try {
    const response = await axios.post("/api/gemini/action", {
      action: "generate-educational",
      input: { type, details }
    });
    return response.data.text;
  } catch (error: any) {
    console.error("Express /api/gemini/action failed:", error.message || error);
    checkAndReportApiError(error, "Gemini");
    throw error;
  }
};"""

new_fn = """export const generateEducationalContent = async (type: string, details: string) => {
  try {
    const response = await axios.post("/api/gemini/action", {
      action: "generate-educational",
      input: { type, details }
    });
    
    let resultText = response.data.text || "";
    // Clean up any top-level markdown wrappers if the AI wrapped the entire response in a code block
    resultText = resultText.trim();
    if (resultText.startsWith('```')) {
      const lines = resultText.split('\\n');
      if (lines.length > 1 && lines[0].startsWith('```')) {
        lines.shift();
      }
      if (lines.length > 0 && lines[lines.length - 1].startsWith('```')) {
        lines.pop();
      }
      resultText = lines.join('\\n').trim();
    }
    
    return resultText;
  } catch (error: any) {
    console.error("Express /api/gemini/action failed:", error.message || error);
    checkAndReportApiError(error, "Gemini");
    throw error;
  }
};"""

text = text.replace(old_fn, new_fn)

with open('src/services/geminiService.ts', 'w') as f:
    f.write(text)

