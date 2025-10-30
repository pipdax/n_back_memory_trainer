import { GameStats } from '../types';

/**
 * Calculates the number of stars (0-3) earned based on game performance.
 * The calculation is based on the score achieved relative to the maximum possible
 * base score for the given game settings (excluding combo bonuses).
 * @param stats The statistics from the completed game.
 * @returns The number of stars earned (0, 1, 2, or 3).
 */
export const calculateStars = (stats: GameStats): number => {
    const { score, settings } = stats;
    const { gameLength, nLevel } = settings;
    
    // The base points awarded for a correct match.
    const basePoints = 10 * Math.pow(2, nLevel - 1);
    
    // The maximum score a player can get without any combo bonuses.
    const maxBaseScore = (gameLength - nLevel) * basePoints;

    // If for some reason max score is zero, no stars can be earned.
    if (maxBaseScore <= 0) return 0;

    const scorePercentage = (score / maxBaseScore);

    if (scorePercentage >= 0.8) return 3; // 3 stars for >= 80% of max base score
    if (scorePercentage >= 0.5) return 2; // 2 stars for >= 50%
    if (scorePercentage >= 0.2) return 1; // 1 star for >= 20%
    
    return 0; // 0 stars otherwise
};
