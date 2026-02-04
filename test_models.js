import { GoogleGenerativeAI } from "@google/generative-ai";

// Manually hardcoding the key for this test script to ensure we use the right one
const API_KEY = "AIzaSyDWK3iOhDp1sf8MCYVCUdM8NJvXmk2NfxQ";
const genAI = new GoogleGenerativeAI(API_KEY);

const modelsToTest = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-1.0-pro",
    "gemini-pro"
];

async function test() {
    console.log("Testing models...");
    for (const modelName of modelsToTest) {
        try {
            console.log(`\nTesting ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say 'ok' in one word.");
            const response = await result.response;
            console.log(`SUCCESS: ${modelName} responded: ${response.text()}`);
            return; // Stop after finding one working model
        } catch (error) {
            console.log(`FAILED: ${modelName} - ${error.message}`);
        }
    }
    console.log("\nNo working models found.");
}

test();
