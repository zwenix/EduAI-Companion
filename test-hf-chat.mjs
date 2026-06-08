import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = (process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_TOKEN || "").trim().replace(/^['"\s]+|['"\s]+$/, "");
console.log("API Key length:", apiKey.length);

if (!apiKey || apiKey === "dummy" || apiKey === "undefined") {
  console.log("No valid API Key found in env.");
  process.exit(0);
}

const client = new OpenAI({
  apiKey: apiKey,
  baseURL: "https://api-inference.huggingface.co/v1",
});

async function main() {
  try {
    console.log("Attempting call...");
    const response = await client.chat.completions.create({
      model: "Qwen/Qwen3.5-397B-A17B",
      messages: [{ role: "user", content: "Hello" }],
      max_tokens: 10,
    });
    console.log("Success:", JSON.stringify(response));
  } catch (err) {
    console.log("Error status:", err.status);
    console.log("Error message:", err.message);
    console.log("Error full:", err);
  }
}

main();
