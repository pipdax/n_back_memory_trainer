import { ALL_ACHIEVEMENTS } from '../achievements';
import { GameStats, UnlockedAchievements } from '../types';

export const checkAchievements = (
  stats: GameStats,
  unlockedAchievements: UnlockedAchievements
): string[] => {
  const newlyUnlocked: string[] = [];

  ALL_ACHIEVEMENTS.forEach((achievement) => {
    // If already unlocked, skip
    if (unlockedAchievements[achievement.id]) {
      return;
    }

    let isUnlocked = false;
    switch (achievement.type) {
      case 'generic':
        if (typeof achievement.goal === 'function') {
          isUnlocked = achievement.goal(stats);
        }
        break;
      case 'score':
        if (typeof achievement.goal === 'number') {
          isUnlocked = stats.score >= achievement.goal;
        }
        break;
      case 'streak':
        if (typeof achievement.goal === 'number') {
          isUnlocked = stats.maxStreak >= achievement.goal;
        }
        break;
      case 'levelComplete':
        if (typeof achievement.goal === 'function') {
          isUnlocked = achievement.goal(stats);
        }
        break;
      case 'precision':
        if (typeof achievement.goal === 'number') {
           isUnlocked = stats.gameCompleted && stats.incorrectPresses === achievement.goal;
        }
        break;
      // 'action' type achievements are handled elsewhere (e.g., in UI interactions)
      case 'action':
        return;
    }

    if (isUnlocked) {
      newlyUnlocked.push(achievement.id);
    }
  });

  return newlyUnlocked;
};
