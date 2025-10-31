import { GameStats, PlayerRewards } from '../types';

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
    // A perfect game without combos.
    const perfectBaseScore = (gameLength - nLevel) * basePoints;

    // A more realistic 'max' score including some combos. Assume an average combo of 2 for half the correct answers.
    // This provides a better ceiling for star calculation.
    const estimatedMaxScore = perfectBaseScore * 1.5;

    // If for some reason max score is zero, no stars can be earned.
    if (estimatedMaxScore <= 0) return 0;

    const scorePercentage = (score / estimatedMaxScore);

    if (scorePercentage >= 0.7) return 3; // 3 stars for >= 70% of estimated max score
    if (scorePercentage >= 0.4) return 2; // 2 stars for >= 40%
    if (scorePercentage >= 0.15) return 1; // 1 star for >= 15%
    
    return 0; // 0 stars otherwise
};


/**
 * Processes rewards after a game, calculating earned rewards and new totals.
 * Handles the cascading conversion of stars -> gems -> trophies.
 * A perfect game now awards 1 trophy directly instead of a perfect score.
 * @param currentRewards The player's rewards before this game.
 * @param starsToAdd The number of stars earned in this game.
 * @param wasPerfectScore Whether the player achieved a perfect score.
 * @returns An object containing the rewards earned in this session and the new total rewards.
 */
export const processRewards = (
  currentRewards: PlayerRewards, 
  starsToAdd: number, 
  wasPerfectScore: boolean
): { earned: PlayerRewards, newTotal: PlayerRewards } => {
  
  let stars = currentRewards.stars + starsToAdd;
  let gems = currentRewards.gems;
  let trophies = currentRewards.trophies;
  let perfectScores = currentRewards.perfectScores;
  
  let earnedGems = 0;
  let earnedTrophies = 0;
  let earnedPerfectScores = 0;

  // A perfect game now awards 1 Trophy instead of 1 Perfect Score.
  const earnedTrophyFromPerformance = wasPerfectScore ? 1 : 0;
  if (wasPerfectScore) {
      trophies += 1;
  }

  // Cascade stars to gems
  if (stars >= 10) {
    const gemsFromStars = Math.floor(stars / 10);
    earnedGems += gemsFromStars;
    gems += gemsFromStars;
    stars %= 10;
  }

  // Cascade gems to trophies
  if (gems >= 10) {
    const trophiesFromGems = Math.floor(gems / 10);
    earnedTrophies += trophiesFromGems;
    trophies += trophiesFromGems;
    gems %= 10;
  }
  
  // Cascade trophies to perfect scores
  if (trophies >= 10) {
      const perfectFromTrophies = Math.floor(trophies / 10);
      earnedPerfectScores += perfectFromTrophies;
      perfectScores += perfectFromTrophies;
      trophies %= 10;
  }
  
  return {
    earned: { 
      stars: starsToAdd, 
      gems: earnedGems, 
      trophies: earnedTrophies + earnedTrophyFromPerformance, 
      perfectScores: earnedPerfectScores 
    },
    newTotal: { 
      stars, 
      gems, 
      trophies, 
      perfectScores 
    }
  };
};