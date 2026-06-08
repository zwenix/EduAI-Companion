/**
 * Standalone Test script to verify backend image route integration
 * To run: node scripts/test-image-generation.js
 */
async function runTest() {
  console.log("🧪 Diagnostic test initiated for Image Generation backend endpoint...\n");

  const prompt = "highly stylized illustration of space explorers discovering a new planet, educational digital art, high contrast, vibrant colors";
  const engines = [
    "pollinations-flux",
    "pollinations-turbo",
    "pollinations-schnell"
  ];

  for (const provider of engines) {
    try {
      console.log(`📡 [Testing Model] Sending payload for: "${provider}"...`);
      const response = await fetch("http://localhost:3000/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, provider })
      });

      if (response.ok) {
        const body = await response.json();
        console.log(`✅ [Success] Provider "${provider}" returned a perfect image response payload:`);
        console.log(`   URL / Base64 Data: ${body.url ? body.url.substring(0, 120) + "..." : "Missing URL"}\n`);
      } else {
        const text = await response.text();
        console.warn(`⚠️ [HTTP Error] Provider "${provider}" request rejected with code ${response.status}:`);
        console.warn(`   Response Info: "${text}"\n`);
      }
    } catch (err) {
      console.error(`❌ [Connection failure] Exception occurred during fetch test for "${provider}":`, err.message || err, "\n");
    }
  }
}

runTest();
