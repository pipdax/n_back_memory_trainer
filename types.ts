
export enum Screen {
  START,
  SETTINGS,
  GAME,
  RESOURCES,
  ACHIEVEMENTS,
}

export enum StimulusType {
  IMAGE = 'IMAGE',
  EMOJI = 'EMOJI',
  COLOR = 'COLOR',
  SHAPE = 'SHAPE',
  NUMBER = 'NUMBER',
  TEXT = 'TEXT',
  RANDOM = 'RANDOM',
}

export interface Stimulus {
  id: string;
  type: StimulusType;
  value: string; // URL for image, emoji char, hex code, shape name, number, text
  name?: string;
}

export interface GameSettings {
  level: number;
  nLevel: number; // The 'n' in n-back
  stimulusType: StimulusType;
  gameLength: number; // Number of turns
  speed: number; // ms per turn
}

export type AchievementType = 'score' | 'streak' | 'levelComplete' | 'precision' | 'action' | 'generic';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  type: AchievementType;
  goal: number | ((stats: GameStats) => boolean); // e.g., score to reach, streak length, or a custom function
}

export type UnlockedAchievements = Record<string, string>; // key: achievementId, value: ISO date string

export interface GameStats {
    score: number;
    settings: GameSettings;
    maxStreak: number;
    incorrectPresses: number;
    gameCompleted: boolean;
}

export interface PlayerRewards {
  stars: number;
  gems: number;
  trophies: number;
  perfectScores: number;
}