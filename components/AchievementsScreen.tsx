import React from 'react';
import { UnlockedAchievements } from '../types';
import { ALL_ACHIEVEMENTS } from '../achievements';
import { ArrowLeftIcon, CheckIcon } from './icons';
import { playSound } from '../services/soundService';

interface AchievementsScreenProps {
  unlockedAchievements: UnlockedAchievements;
  onBack: () => void;
}

const AchievementsScreen: React.FC<AchievementsScreenProps> = ({ unlockedAchievements, onBack }) => {

  const handleBack = () => {
    playSound('click');
    onBack();
  }
  
  const unlockedCount = Object.keys(unlockedAchievements).length;
  const totalCount = ALL_ACHIEVEMENTS.length;
  const progress = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  return (
    <div className="flex flex-col h-full p-4 animate-fade-in">
      <div className="flex items-center mb-4">
        <button onClick={handleBack} className="p-2 mr-4 rounded-full hover:bg-gray-200 transition active:scale-90">
          <ArrowLeftIcon />
        </button>
        <h2 className="font-display text-3xl text-purple-700">成就殿堂</h2>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1 font-semibold text-gray-600">
          <span>总进度</span>
          <span>{unlockedCount} / {totalCount}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-gradient-to-r from-yellow-400 to-amber-500 h-4 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto pr-2 space-y-3">
        {ALL_ACHIEVEMENTS.map(achievement => {
          const isUnlocked = !!unlockedAchievements[achievement.id];
          const unlockedDate = isUnlocked ? new Date(unlockedAchievements[achievement.id]) : null;

          return (
            <div 
              key={achievement.id}
              className={`flex items-center p-4 rounded-lg transition-all ${isUnlocked ? 'bg-yellow-100 border-yellow-300 border-2' : 'bg-gray-100 border-gray-200 border'}`}
            >
              <div className={`text-5xl mr-4 transition-transform ${isUnlocked ? '' : 'grayscale opacity-50 scale-90'}`}>
                {isUnlocked ? achievement.emoji : '❓'}
              </div>
              <div className="flex-grow">
                <h3 className={`font-bold text-lg ${isUnlocked ? 'text-amber-800' : 'text-gray-500'}`}>
                  {achievement.name}
                </h3>
                <p className={`text-sm ${isUnlocked ? 'text-amber-700' : 'text-gray-400'}`}>
                  {achievement.description}
                </p>
                 {isUnlocked && unlockedDate && (
                   <p className="text-xs text-green-600 font-semibold mt-1 flex items-center">
                     <CheckIcon className="w-4 h-4 mr-1"/>
                     {`已于 ${unlockedDate.toLocaleDateString()} 解锁`}
                   </p>
                 )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementsScreen;
