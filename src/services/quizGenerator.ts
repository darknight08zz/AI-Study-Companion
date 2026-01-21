import { extractKeyConcepts } from './summarizer';

interface GeneratedQuestion {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

export const generateQuizFromContent = (content: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): GeneratedQuestion[] => {
    const cleanContent = content.replace(/\s+/g, ' ').trim();
    const sentences = cleanContent.match(/[^.!?]+[.!?]+/g) || [];

    if (sentences.length < 5) {
        throw new Error("Not enough content to generate a quiz. Please provide more text.");
    }

    // 1. Extract Key Concepts (Context-aware targets)
    const concepts = extractKeyConcepts(cleanContent, 20);
    const questions: GeneratedQuestion[] = [];
    const usedSentences = new Set<string>();

    // 2. Determine number of questions (Max 10)
    const numQuestions = Math.min(10, concepts.length);

    for (let i = 0; i < numQuestions; i++) {
        const concept = concepts[i];

        // Find a suitable sentence for this concept
        const regex = new RegExp(`\\b${concept}\\b`, 'i');
        const sentence = sentences.find(s =>
            !usedSentences.has(s) &&
            regex.test(s) &&
            s.length > 30 &&
            s.length < 250
        );

        if (sentence) {
            usedSentences.add(sentence);

            // Generate question by blanking the concept
            const question = createQuestionFromConcept(sentence, concept, i + 1, concepts);
            if (question) {
                questions.push(question);
            }
        }
    }

    return questions;
};

const createQuestionFromConcept = (sentence: string, concept: string, id: number, allConcepts: string[]): GeneratedQuestion | null => {
    // Create the blanked sentence (Case insensitive replacement)
    const regex = new RegExp(`\\b${concept}\\b`, 'gi');
    const questionText = sentence.replace(regex, '_______');

    // Generate distractors using other real concepts from the text (High quality distractors)
    const distractors = allConcepts
        .filter(c => c.toLowerCase() !== concept.toLowerCase())
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

    // If we don't have enough concepts, pad with generic fallback words
    while (distractors.length < 3) {
        const fallbacks = ['analysis', 'system', 'method', 'variable', 'function', 'theory'];
        const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        if (!distractors.includes(fallback) && fallback !== concept) {
            distractors.push(fallback);
        }
    }

    // Shuffle options including the correct one
    const correctAnswer = concept; // Preserving case from concept extraction might be safer, or taken from sentence match
    const allOptions = [...distractors, correctAnswer].sort(() => Math.random() - 0.5);
    const correctIndex = allOptions.indexOf(correctAnswer);

    return {
        id,
        question: questionText,
        options: allOptions,
        correctAnswer: correctIndex,
        explanation: `The component '${concept}' fits in the context: "${sentence}"`
    };
};
