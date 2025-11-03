import React, { useState, useEffect, useRef } from 'react';
import { GameSettings, Screen, StimulusType, PlayerRewards } from '../types';
import { ALL_ACHIEVEMENTS } from '../achievements';
import { PlayIcon, CogIcon, CollectionIcon, VolumeUpIcon, VolumeOffIcon, CheckIcon, XIcon, TrophyIcon } from './icons';
import { playSound, setSoundEnabled } from '../services/soundService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';


interface StartScreenProps {
  onNavigate: (screen: Screen) => void;
  settings: GameSettings;
  onStartGame: () => void;
  lastGameHistory: Array<{ turn: number; score: number; result: 'correct' | 'incorrect' | 'neutral' }>;
  isSoundOn: boolean;
  setIsSoundOn: React.Dispatch<React.SetStateAction<boolean>>;
  unlockedAchievementsCount: number;
  totalAchievementsCount: number;
  newlyUnlocked: string[];
  onDismissNotifications: () => void;
  playerRewards: PlayerRewards;
  isProcessingRewards: boolean;
  onRewardClick: (rewardType: keyof PlayerRewards) => void;
  tierRefs: { [key in keyof PlayerRewards]: React.RefObject<HTMLDivElement> };
}

const stimulusTypeToChinese = (type: StimulusType) => {
    const map = {
      [StimulusType.EMOJI]: '表情',
      [StimulusType.COLOR]: '颜色',
      [StimulusType.SHAPE]: '形状',
      [StimulusType.NUMBER]: '数字',
      [StimulusType.TEXT]: '文字',
      [StimulusType.LETTER]: '字母',
      [StimulusType.RANDOM]: '随机',
    };
    return map[type] || type;
};

const CustomizedDot: React.FC<any> = (props) => {
  const { cx, cy, payload } = props;
  if (payload.turn === 0) return null;
  const iconProps = { x: cx - 8, y: cy - 8, width: 16, height: 16 };
  if (payload.result === 'correct') {
    return (
      <g>
        <circle cx={cx} cy={cy} r={10} fill="rgba(76, 175, 80, 0.3)" />
        <CheckIcon {...iconProps} className="text-green-600" strokeWidth={3} />
      </g>
    );
  }
  if (payload.result === 'incorrect') {
    return (
      <g>
        <circle cx={cx} cy={cy} r={10} fill="rgba(244, 67, 54, 0.3)" />
        <XIcon {...iconProps} className="text-red-600" strokeWidth={3} />
      </g>
    );
  }
  return <circle cx={cx} cy={cy} r={3} stroke="#8884d8" fill="#fff" strokeWidth={2}/>;
};

const AchievementToast: React.FC<{ achievementId: string, onDismiss: () => void }> = ({ achievementId, onDismiss }) => {
    const achievement = ALL_ACHIEVEMENTS.find(a => a.id === achievementId);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true); // Trigger fade in
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onDismiss, 300); // Wait for fade out before calling dismiss
        }, 4000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    if (!achievement) return null;

    return (
        <div 
          onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
          className={`flex items-center p-3 rounded-lg shadow-2xl cursor-pointer transition-all duration-300 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}
          style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' }}
        >
            <div className="text-4xl mr-3">{achievement.emoji}</div>
            <div>
                <p className="font-bold text-amber-900">解锁成就！</p>
                <p className="text-sm text-amber-800">{achievement.name}</p>
            </div>
        </div>
    );
};

interface RewardPodiumProps {
  rewards: PlayerRewards;
  onRewardClick: (rewardType: keyof PlayerRewards) => void;
  isDisabled: boolean;
  tierRefs: { [key in keyof PlayerRewards]: React.RefObject<HTMLDivElement> };
}

const RewardPodium: React.FC<RewardPodiumProps> = ({ rewards, onRewardClick, isDisabled, tierRefs }) => {
    const animatedStars = useAnimatedCounter(rewards.stars, 1000);
    const animatedGems = useAnimatedCounter(rewards.gems, 1000);
    const animatedTrophies = useAnimatedCounter(rewards.trophies, 1000);
    const animatedPerfectScores = useAnimatedCounter(rewards.perfectScores, 1000);

    const clickStateRef = useRef({
      counts: { stars: 0, gems: 0, trophies: 0, perfectScores: 0 },
      lastClick: { stars: 0, gems: 0, trophies: 0, perfectScores: 0 },
    });
    
    const CLICK_THRESHOLD = 6;
    const TIMEOUT_MS = 1000;

    const handleTierClick = (rewardType: keyof PlayerRewards) => {
      if (isDisabled) return;

      const now = Date.now();
      const state = clickStateRef.current;
      const lastClickTime = state.lastClick[rewardType];
      
      if (now - lastClickTime > TIMEOUT_MS) {
        state.counts[rewardType] = 1;
      } else {
        state.counts[rewardType]++;
      }
      state.lastClick[rewardType] = now;

      if (state.counts[rewardType] === CLICK_THRESHOLD) {
        onRewardClick(rewardType);
        state.counts[rewardType] = 0;
      }
    };
    
    const tiers = [
        { key: 'stars' as keyof PlayerRewards, ref: tierRefs.stars, icon: '✨', count: animatedStars, name: '星星', color: 'from-purple-400 to-purple-600', height: 'h-20' },
        { key: 'gems' as keyof PlayerRewards, ref: tierRefs.gems, icon: '💎', count: animatedGems, name: '宝石', color: 'from-blue-400 to-blue-600', height: 'h-24' },
        { key: 'trophies' as keyof PlayerRewards, ref: tierRefs.trophies, icon: '🏆', count: animatedTrophies, name: '奖杯', color: 'from-amber-400 to-amber-600', height: 'h-28' },
        { key: 'perfectScores' as keyof PlayerRewards, ref: tierRefs.perfectScores, icon: '💯', count: animatedPerfectScores, name: '完美', color: 'from-red-400 to-red-600', height: 'h-32' },
    ];

    return (
        <div className="w-full max-w-lg p-4 bg-white/80 rounded-xl shadow-lg animate-fade-in">
            <h3 className="font-display text-2xl text-gray-700 mb-4 text-center">我的奖励</h3>
            <div className="flex justify-around items-end text-center text-white space-x-2">
                {tiers.map((tier) => (
                    <div 
                        key={tier.name} 
                        ref={tier.ref}
                        className="flex-1 flex flex-col items-center justify-end"
                        onClick={() => handleTierClick(tier.key)}
                    >
                        <div className={`w-full ${tier.height} bg-gradient-to-b ${tier.color} rounded-t-lg flex flex-col items-center justify-center p-1 shadow-md transition-transform duration-150 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1 active:scale-95'}`}>
                            <span className="text-3xl md:text-4xl drop-shadow-lg">{tier.icon}</span>
                            <span className="text-xl md:text-2xl font-bold drop-shadow-md">{tier.count}</span>
                            <span className="text-xs font-semibold hidden sm:block">{tier.name}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StartScreen: React.FC<StartScreenProps> = ({ 
  onNavigate, settings, onStartGame, lastGameHistory, isSoundOn, setIsSoundOn, 
  unlockedAchievementsCount, totalAchievementsCount, newlyUnlocked, onDismissNotifications,
  playerRewards, isProcessingRewards, onRewardClick, tierRefs
}) => {

  const handleNavigation = (screen: Screen) => {
    playSound('click');
    onNavigate(screen);
  };

  const handleStartGameClick = () => {
    playSound('click');
    onStartGame();
  }
  
  const handleToggleSound = () => {
    const newSoundState = !isSoundOn;
    setIsSoundOn(newSoundState);
    if (newSoundState) setSoundEnabled(true);
    playSound('click');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in relative">
      <div className="absolute top-0 right-0 p-2 z-20 space-y-2">
         {newlyUnlocked.map((id, index) => (
             <AchievementToast key={`${id}-${index}`} achievementId={id} onDismiss={onDismissNotifications} />
         ))}
      </div>
      
      <button 
        onClick={handleToggleSound} 
        className="absolute top-0 left-0 p-2 text-gray-400 hover:text-gray-700 transition-colors"
        title={isSoundOn ? "静音" : "取消静音"}
        disabled={isProcessingRewards}
      >
        {isSoundOn ? <VolumeUpIcon className="w-8 h-8"/> : <VolumeOffIcon className="w-8 h-8"/>}
      </button>

      <h2 className="font-display text-4xl md:text-6xl text-blue-600 mb-4">欢迎！</h2>
      <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-md">
        准备好提升你的脑力了吗？选择一个选项开始吧。
      </p>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-lg mb-8">
        <button
          onClick={handleStartGameClick}
          disabled={isProcessingRewards}
          className="group col-span-2 flex flex-col items-center justify-center p-6 bg-green-500 text-white rounded-xl shadow-lg hover:bg-green-600 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <PlayIcon className="w-12 h-12 mb-2" />
          <span className="font-bold text-xl">开始游戏</span>
          <span className="text-sm opacity-80">N={settings.nLevel}</span>
        </button>
        <button
          onClick={() => handleNavigation(Screen.SETTINGS)}
          disabled={isProcessingRewards}
          className="group flex flex-col items-center justify-center p-6 bg-yellow-500 text-white rounded-xl shadow-lg hover:bg-yellow-600 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <CogIcon className="w-12 h-12 mb-2" />
          <span className="font-bold text-xl">设置</span>
          <span className="text-sm opacity-80 capitalize">{stimulusTypeToChinese(settings.stimulusType)}</span>
        </button>
        <button
          onClick={() => handleNavigation(Screen.RESOURCES)}
          disabled={isProcessingRewards}
          className="group flex flex-col items-center justify-center p-6 bg-purple-500 text-white rounded-xl shadow-lg hover:bg-purple-600 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <CollectionIcon className="w-12 h-12 mb-2" />
          <span className="font-bold text-xl">资源库</span>
           <span className="text-sm opacity-80">查看/添加</span>
        </button>
      </div>
      
      {/* Reward Podium */}
      <div className="w-full max-w-lg mb-8">
        <RewardPodium 
          rewards={playerRewards}
          onRewardClick={onRewardClick}
          isDisabled={isProcessingRewards}
          tierRefs={tierRefs}
        />
      </div>
      
      {/* Achievements Button */}
      <div className="w-full max-w-lg">
        <button
          onClick={() => handleNavigation(Screen.ACHIEVEMENTS)}
          disabled={isProcessingRewards}
          className="group w-full flex flex-col items-center justify-center p-6 bg-blue-500 text-white rounded-xl shadow-lg hover:bg-blue-600 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <TrophyIcon className="w-12 h-12 mb-2" />
          <span className="font-bold text-xl">成就</span>
          <span className="text-sm opacity-80">{unlockedAchievementsCount} / {totalAchievementsCount}</span>
        </button>
      </div>

      {lastGameHistory && lastGameHistory.length > 1 && (
        <div className="w-full max-w-lg mt-8 p-4 bg-white/80 rounded-xl shadow-lg">
          <h3 className="font-display text-2xl text-gray-700 mb-4 text-center">上次游戏表现</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lastGameHistory} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="turn" name="回合" />
              <YAxis name="得分" allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" name="得分" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} dot={<CustomizedDot />} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default StartScreen;