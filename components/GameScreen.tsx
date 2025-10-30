import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GameSettings, Stimulus, StimulusType, GameStats } from '../types';
import { useGameLogic } from '../hooks/useGameLogic';
import { calculateStars } from '../services/rewardService';
import { CheckIcon, XIcon, PauseIcon, HomeIcon, PlayIcon } from './icons';
import { playSound } from '../services/soundService';


interface GameScreenProps {
  settings: GameSettings;
  resources: Stimulus[];
  onEndGame: (stats: GameStats, history: Array<{ turn: number; score: number; result: 'correct' | 'incorrect' | 'neutral' }>) => void;
  onExit: () => void;
}

const StimulusDisplay: React.FC<{ stimulus: Stimulus | null, turn: number }> = React.memo(({ stimulus, turn }) => {
    if (!stimulus) {
        return <div className="w-48 h-48 sm:w-64 sm:h-64"></div>;
    }

    const baseClasses = "w-48 h-48 sm:w-64 sm:h-64 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 animate-bounce-in";

    return (
      <div key={turn}>
        {(() => {
          switch (stimulus.type) {
              case StimulusType.COLOR:
                  return <div className={baseClasses} style={{ backgroundColor: stimulus.value }}></div>;
              case StimulusType.EMOJI:
              case StimulusType.SHAPE:
                  return <div className={`${baseClasses} bg-white text-8xl sm:text-9xl`}>{stimulus.value}</div>;
              case StimulusType.NUMBER:
              case StimulusType.TEXT:
              case StimulusType.LETTER:
                  return <div className={`${baseClasses} bg-white text-8xl sm:text-9xl font-bold text-gray-800`}>{stimulus.value}</div>;
              default:
                  return <div className={baseClasses}></div>;
          }
        })()}
      </div>
    )
});

const MiniStimulusDisplay: React.FC<{ stimulus: Stimulus | null; size: number; }> = ({ stimulus, size }) => {
    if (!stimulus) return <div className="w-full h-full bg-gray-200 rounded-md"></div>;

    const baseClasses = "w-full h-full rounded-md flex items-center justify-center shadow-sm";
    const dynamicStyle = {
      fontSize: `${size * 0.5}px`,
      lineHeight: '1',
    };

    switch (stimulus.type) {
        case StimulusType.COLOR:
            return <div className={baseClasses} style={{ backgroundColor: stimulus.value }}></div>;
        case StimulusType.EMOJI:
        case StimulusType.SHAPE:
            return <div className={`${baseClasses} bg-white`} style={dynamicStyle}>{stimulus.value}</div>;
        case StimulusType.NUMBER:
        case StimulusType.TEXT:
        case StimulusType.LETTER:
            return <div className={`${baseClasses} bg-white font-bold text-gray-800`} style={dynamicStyle}>{stimulus.value}</div>;
        default:
            return <div className={baseClasses}></div>;
    }
};


const GameScreen: React.FC<GameScreenProps> = ({ settings, resources, onEndGame, onExit }) => {
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'over' | 'paused'>('ready');
  const [countdown, setCountdown] = useState(3);
  const [comboDisplay, setComboDisplay] = useState(0);
  const [showComboEffect, setShowComboEffect] = useState(false);
  const [starsEarned, setStarsEarned] = useState(0);

  const availableStimuli = useMemo(() => {
    if (settings.stimulusType === StimulusType.RANDOM) {
      return resources;
    }
    return resources.filter(r => r.type === settings.stimulusType);
  }, [settings.stimulusType, resources]);

  const onResponse = useCallback((correct: boolean, comboCount: number) => {
    if (correct) {
      if (comboCount > 1) {
        playSound('combo', comboCount);
        setComboDisplay(comboCount);
        setShowComboEffect(true);
        setTimeout(() => setShowComboEffect(false), 1000);
      } else {
        playSound('correct');
      }
    } else {
      playSound('incorrect');
    }
    setFeedback(correct ? 'correct' : 'incorrect');
    setTimeout(() => setFeedback(null), 500);
  }, []);
  
  const {
    currentStimulus,
    score,
    turn,
    isGameOver,
    handleMatch,
    progress,
    history,
    showReviewHistory,
    scoreHistory,
    gameStats,
    currentStreak,
  } = useGameLogic({ settings, stimuli: availableStimuli, onResponse, isPaused: gameState !== 'playing' });

  const reviewStimuli = history.slice(-settings.nLevel);
  
  const calculateReviewItemSize = (nLevel: number) => {
    const maxWidth = 400;
    const gap = 16;
    const maxSize = 120; 
    const minSize = 64; 

    const availableWidth = maxWidth - (nLevel - 1) * gap;
    const calculatedSize = Math.floor(availableWidth / nLevel);
    
    return Math.max(minSize, Math.min(maxSize, calculatedSize));
  };
  
  const reviewItemSize = calculateReviewItemSize(settings.nLevel);

  useEffect(() => {
    if (gameState === 'ready') {
      const timer = setInterval(() => {
        setCountdown(c => {
          if (c > 1) {
            playSound('click');
            return c - 1;
          } else {
            clearInterval(timer);
            playSound('correct');
            setGameState('playing');
            return 0;
          }
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState]);

  useEffect(() => {
    if (isGameOver) {
      setGameState('over');
      const earned = calculateStars(gameStats);
      setStarsEarned(earned);
      // Give user time to see their stars
      setTimeout(() => onEndGame(gameStats, scoreHistory), 3000);
    }
  }, [isGameOver, onEndGame, gameStats, scoreHistory]);

  const handlePause = () => {
    playSound('click');
    setGameState('paused');
  }

  const handleResume = () => {
    playSound('click');
    setGameState('playing');
  }

  const handleExit = () => {
    playSound('click');
    onExit();
  }

  const handleUserMatch = (match: boolean) => {
    if (gameState !== 'playing') return;
    handleMatch(match);
  }

  const getEndGameMessage = () => {
    if (starsEarned === 3) return "太棒了，你是记忆大师！";
    if (starsEarned >= 1) return "很棒的成绩！";
    return "继续努力，下次会更好！";
  }

  const getTutorialText = (nLevel: number) => {
    const nLevelMap: { [key: number]: string } = {
        1: '上一个',
        2: '上上个',
        3: '前第 3 个',
        4: '前第 4 个',
        5: '前第 5 个',
    };
    const nText = nLevelMap[nLevel] || `前第 ${nLevel} 个`;
    return (
        <p className="text-lg md:text-xl text-center text-gray-600 mt-6 max-w-md px-4">
            任务：如果当前项目与 <strong className="text-purple-600 font-bold">{nText}</strong> 出现的项目【相同】，请按“匹配”。
        </p>
    );
  };

  if (gameState === 'ready') {
    return (
        <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <h2 className="font-display text-4xl text-blue-600 mb-4">准备好了吗？</h2>
            <p className="text-8xl font-bold text-purple-600 animate-bounce-in">{countdown}</p>
            {getTutorialText(settings.nLevel)}
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-between h-full p-4 relative">
        {gameState === 'paused' && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-30 animate-fade-in">
                <h2 className="font-display text-5xl text-white mb-8">已暂停</h2>
                <div className="flex space-x-4">
                    <button onClick={handleResume} className="flex items-center gap-2 py-3 px-6 bg-green-500 text-white font-bold text-xl rounded-lg shadow-lg hover:bg-green-600 transition transform hover:scale-105 active:scale-100">
                        <PlayIcon className="w-6 h-6" />
                        继续游戏
                    </button>
                    <button onClick={handleExit} className="flex items-center gap-2 py-3 px-6 bg-red-500 text-white font-bold text-xl rounded-lg shadow-lg hover:bg-red-600 transition transform hover:scale-105 active:scale-100">
                        <HomeIcon className="w-6 h-6" />
                        返回主页
                    </button>
                </div>
            </div>
        )}

      <div className="w-full grid grid-cols-5 gap-2 items-center text-center text-base sm:text-lg font-semibold z-10">
         <button onClick={handlePause} className="p-2 rounded-full hover:bg-gray-200 transition active:scale-90 flex justify-center" title="暂停">
            <PauseIcon className="w-8 h-8 text-gray-500 hover:text-gray-700" />
        </button>
        <div className="text-purple-700">N-Back: <span className="font-bold">{settings.nLevel}</span></div>
        <div className="text-blue-700">分数: <span className="font-bold">{score}</span></div>
        <div className={`text-orange-500 transition-opacity duration-300 ${currentStreak > 1 ? 'opacity-100' : 'opacity-0'}`}>
            连击: <span className="font-bold">x{currentStreak}</span>🔥
        </div>
        <div className="text-gray-600">回合: <span className="font-bold">{turn}/{settings.gameLength}</span></div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 my-4">
        <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
      </div>
      
      <div className="my-auto flex flex-col items-center justify-center w-full">
        {/* Combo Animation Container - placed above the stimulus */}
        <div className="h-20 flex items-end justify-center pointer-events-none z-20">
          {showComboEffect && (
              <div className="text-5xl md:text-6xl font-display text-orange-500 animate-bounce-in" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5), 0 0 10px #ff8c00' }}>
                  x{comboDisplay} 连击! 🔥
              </div>
          )}
        </div>
        
        {/* Stimulus Container */}
        <div className="relative flex items-center justify-center h-64 w-full">
          <div className={`transition-transform duration-500 ${gameState === 'over' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}>
            <StimulusDisplay stimulus={currentStimulus} turn={turn} />
          </div>
          
          {showReviewHistory && (
              <div className="absolute inset-0 flex items-center justify-center z-20 animate-fade-in">
                  <div className="bg-white/95 backdrop-blur-sm border-2 border-red-400 text-red-800 p-4 sm:p-6 rounded-2xl shadow-2xl w-full max-w-lg">
                      <p className="text-center text-lg font-bold mb-4">回顾 (最近 {settings.nLevel} 个)</p>
                      <div className="flex justify-center items-center gap-4">
                          {reviewStimuli.map((stim, index) => (
                             <div 
                               key={index} 
                               style={{ width: `${reviewItemSize}px`, height: `${reviewItemSize}px` }}
                               className="border-2 border-gray-300 rounded-lg overflow-hidden"
                             >
                                 <MiniStimulusDisplay stimulus={stim} size={reviewItemSize} />
                             </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}
          
          {gameState === 'over' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center animate-bounce-in text-center">
              <h2 className="font-display text-4xl sm:text-5xl text-green-600">{getEndGameMessage()}</h2>
              <p className="text-2xl mt-2">最终得分: {score}</p>
               <div className="flex mt-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span key={i} className={`text-5xl transition-all duration-300 transform ${i < starsEarned ? 'text-yellow-400 scale-110' : 'text-gray-300'}`} style={{transitionDelay: `${i * 150}ms`}}>✨</span>
                ))}
              </div>
            </div>
          )}

          {feedback && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`rounded-full p-8 ${feedback === 'correct' ? 'bg-green-500/80' : 'bg-red-500/80'} animate-bounce-in`}>
                {feedback === 'correct' ? <CheckIcon className="w-16 h-16 text-white" /> : <XIcon className="w-16 h-16 text-white" />}
              </div>
            </div>
          )}
        </div>
      </div>


      <div className={`grid grid-cols-2 gap-4 w-full max-w-sm mt-auto ${gameState !== 'playing' || showReviewHistory ? 'pointer-events-none opacity-50' : ''}`}>
        <button
          onClick={() => handleUserMatch(true)}
          disabled={turn <= settings.nLevel}
          className="py-4 px-6 bg-green-500 text-white font-bold text-2xl rounded-lg shadow-lg hover:bg-green-600 transition transform hover:scale-105 active:scale-100 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          匹配
        </button>
        <button
          onClick={() => handleUserMatch(false)}
          disabled={turn <= settings.nLevel}
          className="py-4 px-6 bg-red-500 text-white font-bold text-2xl rounded-lg shadow-lg hover:bg-red-600 transition transform hover:scale-105 active:scale-100 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          不匹配
        </button>
      </div>
    </div>
  );
};

export default GameScreen;