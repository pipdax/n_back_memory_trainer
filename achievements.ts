import { Achievement, GameStats } from './types';

export const ALL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_game',
    name: '第一步',
    description: '完成你的第一场游戏。',
    emoji: '👣',
    type: 'generic',
    goal: (stats) => stats.gameCompleted,
  },
  {
    id: 'score_500',
    name: '得分高手',
    description: '在单场游戏中获得500分。',
    emoji: '🏆',
    type: 'score',
    goal: 500,
  },
  {
    id: 'streak_5',
    name: '连胜达人',
    description: '连续正确匹配5次。',
    emoji: '🔥',
    type: 'streak',
    goal: 5,
  },
  {
    id: 'streak_10',
    name: '势不可挡',
    description: '连续正确匹配10次。',
    emoji: '🚀',
    type: 'streak',
    goal: 10,
  },
  {
    id: 'n2_master',
    name: 'N=2 大师',
    description: '在 N=2 难度下以400分或以上的成绩完成游戏。',
    emoji: '🧠',
    type: 'levelComplete',
    goal: (stats) => stats.settings.nLevel === 2 && stats.score >= 400 && stats.gameCompleted,
  },
   {
    id: 'n3_pro',
    name: 'N=3 专家',
    description: '在 N=3 难度下以800分或以上的成绩完成游戏。',
    emoji: '🌟',
    type: 'levelComplete',
    goal: (stats) => stats.settings.nLevel === 3 && stats.score >= 800 && stats.gameCompleted,
  },
  {
    id: 'perfect_precision',
    name: '零失误',
    description: '在不犯任何错误的情况下完成一场游戏。',
    emoji: '✨',
    type: 'precision',
    goal: 0,
  },
  {
    id: 'ai_explorer',
    name: 'AI探索者',
    description: '首次使用AI功能生成新资源。',
    emoji: '🤖',
    type: 'action',
    goal: 1,
  }
];