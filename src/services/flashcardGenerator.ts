import { extractKeyConcepts } from './summarizer';

export interface Flashcard {
    id: string;
    term: string;
    definition: string;
}

export const generateFlashcardsFromContent = (content: string): Flashcard[] => {
    // 1. Clean content
    const cleanContent = content.replace(/\s+/g, ' ').trim();
    const sentences = cleanContent.match(/[^.!?]+[.!?]+/g) || [];

    if (sentences.length < 5) {
        // Fallback for very short content: just try to split by colons
        return simpleHeuristic(cleanContent);
    }

    // 2. Extract Key Concepts
    const concepts = extractKeyConcepts(cleanContent, 20); // Get top 20 concepts
    const flashcards: Flashcard[] = [];
    let idCounter = 1;

    const usedSentences = new Set<string>();

    // 3. Find definition sentences for each concept
    concepts.forEach(concept => {
        if (flashcards.length >= 20) return;

        // Find the best sentence that defines this concept
        // Criteria: Contains the concept, is not too long, not used yet
        const regex = new RegExp(`\\b${concept}\\b`, 'i');

        const bestSentence = sentences.find(sentence => {
            if (usedSentences.has(sentence)) return false;

            const isMatch = regex.test(sentence);
            const isLengthOk = sentence.length > 20 && sentence.length < 200;

            // Boost "is" definitions
            const isDefinition = /\bis\b|\brefers to\b|\bmeans\b/i.test(sentence);

            return isMatch && isLengthOk && isDefinition;
        });

        if (bestSentence) {
            flashcards.push({
                id: `card-${idCounter++}`,
                term: capitalize(concept),
                definition: bestSentence.trim()
            });
            usedSentences.add(bestSentence);
        }
    });

    // 4. Fill gaps if we don't have enough cards
    if (flashcards.length < 5) {
        const extraCards = simpleHeuristic(cleanContent, 10 - flashcards.length);
        flashcards.push(...extraCards);
    }

    return flashcards;
};

const simpleHeuristic = (content: string, limit: number = 10): Flashcard[] => {
    const flashcards: Flashcard[] = [];
    let idCounter = 100;

    const definitionRegex = /^([A-Z][a-zA-Z\s]+)[:\-\—]\s+([A-Z].+?)[.!?]/gm;
    let match;

    while ((match = definitionRegex.exec(content)) !== null) {
        if (flashcards.length >= limit) break;
        if (match[1].length < 50 && match[2].length > 10) {
            flashcards.push({
                id: `card-fallback-${idCounter++}`,
                term: match[1].trim(),
                definition: match[2].trim(),
            });
        }
    }
    return flashcards;
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
