import "dotenv/config";
import { generateEduContent } from "./services/eduAiService";

async function run() {
  const result = await generateEduContent({
    prompt: "Create a 2-question quiz and 2 flashcards on Grade 6 fractions.",
    gradeLevel: "Grade 6",
    enableReasoning: true,
  });
  console.log("✅ Structured Output Validated:\n", JSON.stringify(result, null, 2));
}

run().catch(console.error);
