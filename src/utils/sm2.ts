export interface SM2Flashcard {
    interval: number;
    repetition: number;
    efactor: number;
    nextReviewDate: number;
}


export function calculateSM2(
    currentInterval: number,
    currentRepetition: number,
    currentEF: number,
    quality: number
): SM2Flashcard {
    let nextInterval: number;
    let nextRepetition: number;
    let nextEF: number;

    if (quality >= 3) {

        if (currentRepetition === 0) {
            nextInterval = 1;
        } else if (currentRepetition === 1) {
            nextInterval = 6;
        } else {
            nextInterval = Math.round(currentInterval * currentEF);
        }
        nextRepetition = currentRepetition + 1;
    } else {

        nextRepetition = 0;
        nextInterval = 1;
    }

    nextEF = currentEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));


    if (nextEF < 1.3) {
        nextEF = 1.3;
    }

    const nextReviewDate = Date.now() + nextInterval * 24 * 60 * 60 * 1000;

    return {
        interval: nextInterval,
        repetition: nextRepetition,
        efactor: nextEF,
        nextReviewDate: nextReviewDate
    };
}

export const initialSM2State = {
    interval: 0,
    repetition: 0,
    efactor: 2.5,
    nextReviewDate: Date.now()
};
