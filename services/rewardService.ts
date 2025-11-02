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
 * This function follows a specific, user-requested order to ensure clarity and correctness:
 * 1. Add bonus gem for a perfect game.
 * 2. Add stars earned from the game.
 * 3. Perform cascading conversions: Stars -> Gems, Gems -> Trophies, Trophies -> Perfect Scores.
 *
 * @param currentRewards The player's rewards before this game.
 * @param starsToAdd The number of stars earned directly from game performance.
 * @param wasPerfectScore Whether the player achieved a perfect score.
 * @returns An object containing the rewards earned in this session and the new total rewards.
 */
export const processRewards = (
  currentRewards: PlayerRewards,
  starsToAdd: number,
  wasPerfectScore: boolean
): { earned: PlayerRewards, newTotal: PlayerRewards } => {

  // --- Initialization ---
  // Start with the player's current reward totals. These will be updated sequentially.
  let totalStars = currentRewards.stars;
  let totalGems = currentRewards.gems;
  let totalTrophies = currentRewards.trophies;
  let totalPerfectScores = currentRewards.perfectScores;

  // Track rewards gained purely within this session for the summary screen.
  // This includes direct earnings (stars, perfect bonus) and conversion earnings.
  let earnedGemsThisSession = 0;
  let earnedTrophiesThisSession = 0;
  let earnedPerfectScoresThisSession = 0;

  // --- Step 1: Add Direct Gem Earnings (Perfect Score Bonus) ---
  if (wasPerfectScore) {
    totalGems += 1;
    earnedGemsThisSession += 1;
  }

  // --- Step 2: Add Direct Star Earnings ---
  totalStars += starsToAdd;

  // --- Step 3: Perform Cascading Conversions on the new totals ---
  
  // Convert Stars to Gems
  if (totalStars >= 10) {
    const gemsFromStars = Math.floor(totalStars / 10);
    totalGems += gemsFromStars;
    earnedGemsThisSession += gemsFromStars; // These gems were also "earned" this session
    totalStars %= 10; // Remainder becomes the new star total
  }
  
  // Convert Gems to Trophies
  if (totalGems >= 10) {
    const trophiesFromGems = Math.floor(totalGems / 10);
    totalTrophies += trophiesFromGems;
    earnedTrophiesThisSession += trophiesFromGems; // Trophies "earned" from gem conversion
    totalGems %= 10;
  }
  
  // Convert Trophies to Perfect Scores (💯)
  if (totalTrophies >= 10) {
      const perfectFromTrophies = Math.floor(totalTrophies / 10);
      totalPerfectScores += perfectFromTrophies;
      earnedPerfectScoresThisSession += perfectFromTrophies; // Perfect Scores "earned" from trophy conversion
      totalTrophies %= 10;
  }
  
  // The 'earned' object is for the summary screen. It should show what the player gained.
  const earnedRewards: PlayerRewards = {
    stars: starsToAdd, // The summary should always show the direct stars won.
    gems: earnedGemsThisSession,
    trophies: earnedTrophiesThisSession,
    perfectScores: earnedPerfectScoresThisSession,
  };

  // The 'newTotal' object is the final state to be saved.
  const newTotalRewards: PlayerRewards = {
    stars: totalStars,
    gems: totalGems,
    trophies: totalTrophies,
    perfectScores: totalPerfectScores,
  };
  
  return {
    earned: earnedRewards,
    newTotal: newTotalRewards,
  };
};
