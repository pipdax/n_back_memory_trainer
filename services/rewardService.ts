import { GameStats, PlayerRewards } from '../types';

/**
 * Calculates the number of stars earned based on game performance.
 * The calculation is now directly tied to the score to better reward high performance,
 * instead of a flat 0-3 star rating.
 * @param stats The statistics from the completed game.
 * @returns The number of stars earned.
 */
export const calculateStars = (stats: GameStats): number => {
    const { score, settings } = stats;

    // If the score is zero or negative, no stars are awarded.
    if (score <= 0) {
        return 0;
    }

    // The base points awarded for a single correct match, used to scale the star rewards.
    const basePoints = 10 * Math.pow(2, settings.nLevel - 1);
    
    // Award 1 star for every 5 * basePoints scored.
    // This makes rewards more granular and scales with difficulty.
    const starConversionRate = 5 * basePoints;
    
    // Ensure the conversion rate is at least 1 to avoid division by zero, though unlikely.
    if (starConversionRate <= 0) return 0;
    
    const starsEarned = Math.floor(score / starConversionRate);
    
    return starsEarned;
};


/**
 * Processes rewards after a game, calculating earned rewards and new totals.
 * A perfect game awards an additional gem *after* star conversions are calculated.
 *
 * The logic follows these steps:
 * 1. Convert any earned stars (including existing ones) into gems.
 * 2. If the game was perfect, add one bonus gem.
 * 3. Cascade all accumulated gems into trophies.
 * 4. Cascade all accumulated trophies into perfect scores.
 *
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
  
  // Temporary variables to hold totals during calculation
  let tempStars = currentRewards.stars + starsToAdd;
  let tempGems = currentRewards.gems;
  let tempTrophies = currentRewards.trophies;
  let tempPerfectScores = currentRewards.perfectScores;
  
  // Track what's earned in this specific game session
  let earnedGemsThisSession = 0;
  let earnedTrophiesThisSession = 0;
  let earnedPerfectScoresThisSession = 0;

  // --- Step 1: Handle rewards from star conversion ---
  if (tempStars >= 10) {
    const gemsFromStars = Math.floor(tempStars / 10);
    earnedGemsThisSession += gemsFromStars;
    tempGems += gemsFromStars;
    tempStars %= 10;
  }

  // --- Step 2: Add bonus gem for a perfect game, AFTER star conversion ---
  if (wasPerfectScore) {
      earnedGemsThisSession += 1;
      tempGems += 1;
  }
  
  // --- Step 3: Cascade all accumulated gems and trophies upwards ---
  
  // Cascade gems to trophies
  if (tempGems >= 10) {
    const trophiesFromGems = Math.floor(tempGems / 10);
    earnedTrophiesThisSession += trophiesFromGems;
    tempTrophies += trophiesFromGems;
    tempGems %= 10;
  }
  
  // Cascade trophies to perfect scores
  if (tempTrophies >= 10) {
      const perfectFromTrophies = Math.floor(tempTrophies / 10);
      earnedPerfectScoresThisSession += perfectFromTrophies;
      tempPerfectScores += perfectFromTrophies;
      tempTrophies %= 10;
  }
  
  return {
    earned: { 
      stars: starsToAdd, 
      gems: earnedGemsThisSession, 
      trophies: earnedTrophiesThisSession, 
      perfectScores: earnedPerfectScoresThisSession
    },
    newTotal: { 
      stars: tempStars, 
      gems: tempGems, 
      trophies: tempTrophies, 
      perfectScores: tempPerfectScores 
    }
  };
};