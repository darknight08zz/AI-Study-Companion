
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("Missing Gemini API Key in .env file");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const generateContent = async (prompt: string): Promise<string> => {
  if (!API_KEY) {
    throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file.");
  }

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error: any) {
    console.error("Gemini API Error:", error);

    // Try to list models to see what's available
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
      const data = await response.json();
      const modelNames = data.models?.map((m: any) => m.name) || [];
      console.log("Available Models:", modelNames);
      throw new Error((error.message || "Failed") + ` | Available models: ${modelNames.join(", ")}`);
    } catch (listError) {
      console.error("Failed to list models", listError);
      throw new Error(error.message || "Failed to generate content with Gemini.");
    }
  }
};
