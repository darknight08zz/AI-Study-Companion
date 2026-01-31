
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("Missing Gemini API Key in .env file");
}

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

const getModel = () => {
  if (!API_KEY) {
    throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file.");
  }
  return model!;
};

export const generateContent = async (prompt: string): Promise<string> => {
  try {
    const aiModel = getModel();
    const result = await aiModel.generateContent(prompt);
    return result.response.text();
  } catch (error: any) {
    console.error("Gemini API Error:", error);

    // Try to list models to see what's available
    try {
      if (API_KEY) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();
        const modelNames = data.models?.map((m: any) => m.name) || [];
        console.log("Available Models:", modelNames);
        throw new Error((error.message || "Failed") + ` | Available models: ${modelNames.join(", ")}`);
      } else {
        throw error;
      }
    } catch (listError) {
      console.error("Failed to list models", listError);
      throw new Error(error.message || "Failed to generate content with Gemini.");
    }
  }
};

export interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
}

export const chatWithMaterial = async (history: ChatMessage[], message: string, context: string, persona: string = 'friendly'): Promise<string> => {
  const aiModel = getModel();

  const personaPrompts: Record<string, string> = {
    friendly: "You are a friendly and encouraging study assistant. Use emojis occasionally and keep the tone light and helpful.",
    strict: "You are a strict and disciplined tutor. Focus purely on facts, correct any mistakes directly, and avoid pleasantries.",
    concise: "You are a concise expert. Provide extremely brief, high-density information. Bullet points are preferred.",
    socratic: "You are a Socratic guide. Do not give answers directly; instead, ask guiding questions to help the student find the answer."
  };

  const systemInstruction = personaPrompts[persona] || personaPrompts.friendly;

  try {
    const chat = aiModel.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: `${systemInstruction}\n\nAnswer questions based ONLY on the following context:\n\n${context.substring(0, 25000)}\n\nIf the answer is not in the context, say so.` }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I will adopt this persona and answer based on the context." }],
        },
        ...history.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.parts }]
        }))
      ],
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    throw new Error("Failed to send message to Gemini.");
  }
};
