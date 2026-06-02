import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HF_TOKEN);

async function run() {
  try {
    const response = await hf.textToImage({
      model: 'black-forest-labs/FLUX.1-schnell',
      inputs: 'award winning high resolution photo of a giant tortoise',
      parameters: { negative_prompt: 'blurry' }
    });
    console.log("Success!");
  } catch (err) {
    console.error("Error SDK:", err.message);
  }
}

run();
