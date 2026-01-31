
import { generateContent } from './gemini';

export interface GeneratedQuestion {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

export const generateQuizFromContent = async (content: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<GeneratedQuestion[]> => {
    const prompt = `Generate 5 multiple-choice questions based on the following text. The difficulty should be ${difficulty}.
    
    Return the response strictly as a JSON array of objects with the following structure:
    [
        {
            "id": 1,
            "question": "Question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0, // Index of the correct option (0-3)
            "explanation": "Explanation of why this is correct"
        }
    ]

    Text: ${content.substring(0, 20000)}`;

    try {
        const result = await generateContent(prompt);
        // Clean up markdown code blocks if present
        const jsonStr = result.replace(/```json|```/g, '').trim();
        const questions = JSON.parse(jsonStr);

        // Ensure IDs are numbers
        return questions.map((q: any, index: number) => ({
            ...q,
            id: index + 1
        }));
    } catch (e) {
        console.error("Failed to generate quiz", e);
        throw new Error("Failed to generate quiz. Please try again.");
    }
};
