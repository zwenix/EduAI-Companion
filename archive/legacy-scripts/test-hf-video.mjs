import 'dotenv/config';

async function testHF() {
  const token = process.env.HUGGINGFACE_API_KEY;
  console.log("Token exists:", !!token);
  const response = await fetch("https://api-inference.huggingface.co/models/damo-vilab/text-to-video-ms-1.7b", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    method: "POST",
    body: JSON.stringify({ inputs: "A cat playing piano" })
  });
  
  if (response.ok) {
    console.log("Success! Content-Type:", response.headers.get('content-type'));
  } else {
    console.log("Failed:", response.status, await response.text());
  }
}
testHF();
