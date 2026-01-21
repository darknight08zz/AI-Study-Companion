
// Advanced Local Summarizer using TF-IDF logic

interface SentenceScore {
    text: string;
    score: number;
    index: number;
}

// Stop words to ignore
const STOP_WORDS = new Set([
    'the', 'is', 'at', 'of', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'with', 'it', 'this', 'that', 'as', 'are', 'was', 'be', 'by',
    'or', 'from', 'but', 'not', 'we', 'you', 'can', 'has', 'have', 'had', 'do', 'should', 'would', 'could', 'if', 'then', 'else',
    'which', 'who', 'what', 'where', 'when', 'why', 'how', 'all', 'any', 'some', 'one', 'no', 'so', 'up', 'out', 'my', 'your', 'its'
]);

/**
 * Tokenizes text into words, removing punctuation and stop words
 */
const tokenize = (text: string): string[] => {
    return text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !STOP_WORDS.has(word));
};

/**
 * Calculates Term Frequency (TF) for a document
 */
const calculateTF = (words: string[]): Record<string, number> => {
    const tf: Record<string, number> = {};
    const totalWords = words.length;

    words.forEach(word => {
        tf[word] = (tf[word] || 0) + 1;
    });

    // Normalize
    Object.keys(tf).forEach(word => {
        tf[word] = tf[word] / totalWords;
    });

    return tf;
};

/**
 * Extract Key Concepts using TF-IDF style scoring (simplified for single doc)
 */
export const extractKeyConcepts = (content: string, limit: number = 10): string[] => {
    const cleanContent = content.replace(/\s+/g, ' ').trim();
    const words = tokenize(cleanContent);
    const wordCounts: Record<string, number> = {};

    words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    // Sort by frequency
    const sortedWords = Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0]);

    // Filter for "concept-like" words (nouns often end in specific suffixes or are longer)
    // This is a heuristic since we don't have a full POS tagger
    const concepts = sortedWords.filter(word => {
        // Boost longer words or technical identifiers
        return word.length > 4;
    });

    return concepts.slice(0, limit);
};

export const generateSummary = (content: string, ratio: number = 0.3): string => {
    const cleanContent = content.replace(/\s+/g, ' ').trim();

    // Split into sentences (handling common abbreviations is hard without NL library, using basic split)
    const sentences = cleanContent.match(/[^.!?]+[.!?]+/g) || [];

    if (sentences.length < 3) return content;

    const allWords = tokenize(cleanContent);
    const wordFreq = calculateTF(allWords);

    // Score sentences based on the sum of frequencies of their words
    const scores: SentenceScore[] = sentences.map((sentence, index) => {
        const sentenceWords = tokenize(sentence);
        let score = 0;

        sentenceWords.forEach(word => {
            score += wordFreq[word] || 0;
        });

        // Normalize by sentence length to prevent bias towards long sentences
        if (sentenceWords.length > 0) {
            score = score / sentenceWords.length;
        }

        // Position Boost: First and Last sentences are often important
        if (index === 0) score *= 1.5;
        if (index === sentences.length - 1) score *= 1.2;

        return { text: sentence.trim(), score, index };
    });

    // determine count
    const count = Math.max(3, Math.ceil(sentences.length * ratio));

    // Get top N sentences
    const topSentences = [...scores]
        .sort((a, b) => b.score - a.score)
        .slice(0, count);

    // Reorder by original appearance
    return topSentences
        .sort((a, b) => a.index - b.index)
        .map(s => s.text)
        .join(' ');
};

export const extractKeyPoints = (content: string): string[] => {
    const summary = generateSummary(content, 0.4);
    // Split summary into bullet points
    return (summary.match(/[^.!?]+[.!?]+/g) || [])
        .map(s => s.trim())
        .filter(s => s.length > 15);
};
