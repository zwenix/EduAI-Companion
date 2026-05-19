import 'dotenv/config';
async function testHF2() {
  const model = "ali-vilab/text-to-video-ms-1.7b";
  const token = process.env.HUGGINGFACE_API_KEY;
  const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    method: "POST",
    body: JSON.stringify({ inputs: "A cat playing piano" })
  });
  console.log(response.status, response.headers.get('content-type'));
}
testHF2();
