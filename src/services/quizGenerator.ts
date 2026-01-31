
import { generateContent } from './gemini';

export interface GeneratedQuestion {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

export const generateQuizFromContent = async (content: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<GeneratedQuestion[]> => {
    const prompt = `You are an expert tutor. Create a ${difficulty} difficulty quiz with 5 multiple-choice questions based strictly on the provided text.
    
    Guidelines:
    1. Questions should test understanding, not just recall.
    2. Options (A, B, C, D) must be unique.
    3. The "correctAnswer" index must be correct (0=A, 1=B, 2=C, 3=D).
    4. Distractors (wrong answers) should be plausible but clearly incorrect.
    
    Output Format:
    Return ONLY a raw JSON array (no markdown, no backticks).
    Structure:
    [
        {
            "id": 1,
            "question": "Question text?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0,
            "explanation": "Brief explanation."
        }
    ]

    Text Content:
    ${content.substring(0, 25000)}`;

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
