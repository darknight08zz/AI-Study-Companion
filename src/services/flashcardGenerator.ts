
import { generateContent } from './gemini';

export interface Flashcard {
    id: string;
    term: string;
    definition: string;
}

export const generateFlashcardsFromContent = async (content: string): Promise<Flashcard[]> => {
    const prompt = `Generate 10 flashcards (term and definition) from the following text.
    
    Return the response strictly as a JSON array of objects with the following structure:
    [
        {
            "id": "card-1",
            "term": "Term to learn",
            "definition": "Clear and concise definition"
        }
    ]

    Text: ${content.substring(0, 20000)}`;

    try {
        const result = await generateContent(prompt);
        // Clean up markdown code blocks if present
        const jsonStr = result.replace(/```json|```/g, '').trim();
        const cards = JSON.parse(jsonStr);

        return cards.map((card: any, index: number) => ({
            ...card,
            id: `card-${Date.now()}-${index}`
        }));
    } catch (e) {
        console.error("Failed to generate flashcards", e);
        throw new Error("Failed to generate flashcards");
    }
};
