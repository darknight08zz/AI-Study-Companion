
import { generateContent } from './gemini';

/**
 * Extract Key Concepts using GenAI
 */
export const extractKeyConcepts = async (content: string, limit: number = 10): Promise<string[]> => {
    const prompt = `Identify the top ${limit} key concepts or technical terms from the following text. Return them as a JSON array of strings.
    
    Text: ${content.substring(0, 10000)} ...`; // Truncate if too long, though Gemini 1.5 has large context

    try {
        const result = await generateContent(prompt);
        // Clean up markdown code blocks if present
        const jsonStr = result.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed to extract concepts via AI", e);
        return [];
    }
};

export const generateSummary = async (content: string, ratio: number = 0.3): Promise<string> => {
    const prompt = `Summarize the following text in a detailed and comprehensive manner. The summary should capture the main ideas and supporting details.
    
    Text: ${content.substring(0, 30000)}`;

    try {
        return await generateContent(prompt);
    } catch (e) {
        console.error("Failed to generate summary", e);
        return `Failed to generate summary. Error: ${e instanceof Error ? e.message : String(e)}`;
    }
};

export const extractKeyPoints = async (content: string): Promise<string[]> => {
    const prompt = `Extract the key points from the following text. Return them as a JSON array of strings, where each string is a bullet point.
    
    Text: ${content.substring(0, 15000)}`;

    try {
        const result = await generateContent(prompt);
        const jsonStr = result.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed to extract key points", e);
        return ["Could not extract key points."];
    }
};
