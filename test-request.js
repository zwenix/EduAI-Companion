import axios from "axios";

async function main() {
  try {
    console.log("Checking /api/health of local server...");
    const health = await axios.get("http://localhost:3000/api/health");
    console.log("HEALTH RESPONSE:", health.data);
    
    console.log("Sending generate-caps request to local server...");
    const response = await axios.post("http://localhost:3000/api/gemini/action", {
      action: "generate-caps",
      input: {
        contentType: "Study Guide / Learning Notes",
        grade: "4",
        subject: "Mathematics",
        topic: "Fractions",
        language: "English",
        objective: "Learn half and quarter",
        learnerProfile: "Diverse learners",
        additionalInstructions: "Focus on diagrams and colors"
      }
    });
    console.log("SERVER SUCCESS RESPONSE:", JSON.stringify(response.data, null, 2).substring(0, 500));
  } catch (error) {
    if (error.response) {
      console.log("SERVER ERROR STATUS:", error.response.status);
      console.log("SERVER ERROR RESPONSE BODY:", error.response.data);
    } else {
      console.error("No response from server:", error.message);
    }
  }
}

main();
