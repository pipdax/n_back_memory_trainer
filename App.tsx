import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GameSettings, Stimulus, Screen, PlayerRewards, UnlockedAchievements, GameStats } from './types';
import { DEFAULT_SETTINGS, INITIAL_RESOURCES } from './constants';
import { ALL_ACHIEVEMENTS } from './achievements';
import { checkAchievements } from './services/achievementService';
import { calculateStars, processRewards } from './services/rewardService';
import { loadState, saveState } from './services/storageService';
import StartScreen from './components/StartScreen';
import SettingsScreen from './components/SettingsScreen';
import GameScreen from './components/GameScreen';
import ResourceBrowser from './components/ResourceBrowser';
import AchievementsScreen from './components/AchievementsScreen';
import { DownloadIcon, UploadIcon } from './components/icons';
import { playSound, setSoundEnabled } from './services/soundService';
import { usePrevious } from './hooks/usePrevious';


const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>(Screen.START);
  
  // Load initial state from localStorage or use defaults
  const [settings, setSettings] = useState<GameSettings>(() => loadState()?.settings || DEFAULT_SETTINGS);
  const [resources, setResources] = useState<Stimulus[]>(() => loadState()?.resources || INITIAL_RESOURCES);
  const [playerRewards, setPlayerRewards] = useState<PlayerRewards>(() => loadState()?.playerRewards || { stars: 0, gems: 0, trophies: 0, perfectScores: 0 });
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievements>(() => loadState()?.unlockedAchievements || {});
  const [isSoundOn, setIsSoundOn] = useState<boolean>(() => loadState()?.isSoundOn ?? true);
  
  const [lastGameHistory, setLastGameHistory] = useState<Array<{ turn: number; score: number; result: 'correct' | 'incorrect' | 'neutral' }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Achievement State
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);
  
  // Animation control state
  const [justFinishedGame, setJustFinishedGame] = useState(false);
  const previousPlayerRewards = usePrevious(playerRewards);


  // Effect to save state to localStorage whenever it changes
  useEffect(() => {
    saveState({
      settings,
      resources,
      playerRewards,
      unlockedAchievements,
      isSoundOn,
    });
  }, [settings, resources, playerRewards, unlockedAchievements, isSoundOn]);

  useEffect(() => {
    setSoundEnabled(isSoundOn);
  }, [isSoundOn]);

  const handleExport = useCallback(() => {
    playSound('click');
    try {
      const dataToExport = JSON.stringify({
        settings,
        resources,
        unlockedAchievements,
        playerRewards,
        isSoundOn,
      }, null, 2);
      const blob = new Blob([dataToExport], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'n-back-progress.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('导出数据失败。请查看控制台了解详情。');
    }
  }, [settings, resources, unlockedAchievements, playerRewards, isSoundOn]);

  const handleImportClick = () => {
    playSound('click');
    fileInputRef.current?.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error('Invalid file content');
        const data = JSON.parse(text);
        
        // Validate imported data structure before setting state
        if (data.settings && data.resources) {
          setSettings(data.settings);
          setResources(data.resources);
          if(data.unlockedAchievements) setUnlockedAchievements(data.unlockedAchievements);
          if(data.playerRewards) setPlayerRewards(data.playerRewards);
          if(typeof data.isSoundOn === 'boolean') setIsSoundOn(data.isSoundOn);
          alert('游戏数据导入成功！');
          setScreen(Screen.START);
        } else {
          throw new Error('Invalid data structure in JSON file.');
        }
      } catch (error) {
        console.error('Failed to import data:', error);
        alert('导入数据失败。请检查文件格式。');
      }
    };
    reader.readAsText(file);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleGameEnd = (stats: GameStats, history: Array<{ turn: number; score: number; result: 'correct' | 'incorrect' | 'neutral' }>) => {
    setLastGameHistory(history);

    // Handle achievements
    const justUnlocked = checkAchievements(stats, unlockedAchievements);
    if (justUnlocked.length > 0) {
      const now = new Date().toISOString();
      const newAchievementsRecord = { ...unlockedAchievements };
      justUnlocked.forEach(id => {
        newAchievementsRecord[id] = now;
      });
      setUnlockedAchievements(newAchievementsRecord);
      setNewlyUnlocked(justUnlocked);
      playSound('achievement');
    }

    // Handle rewards
    const starsEarned = calculateStars(stats);
    const wasPerfect = stats.incorrectPresses === 0 && stats.score > 0 && stats.gameCompleted;
    
    if (starsEarned > 0 || wasPerfect) {
      setPlayerRewards(prevRewards => {
        const { newTotal } = processRewards(prevRewards, starsEarned, wasPerfect);
        return newTotal;
      });
    }

    setJustFinishedGame(true);
    setScreen(Screen.START);
  };
  
  const handleAIFetch = () => {
    if (!unlockedAchievements['ai_explorer']) {
        const now = new Date().toISOString();
        setUnlockedAchievements(prev => ({ ...prev, 'ai_explorer': now }));
        setNewlyUnlocked(['ai_explorer']);
        playSound('achievement');
    }
  };

  const handleClearAllProgress = () => {
    setPlayerRewards({ stars: 0, gems: 0, trophies: 0, perfectScores: 0 });
    setUnlockedAchievements({});
  };


  const handleStartGame = () => {
    setJustFinishedGame(false);
    setLastGameHistory([]);
    setScreen(Screen.GAME);
  };
  
  const handleNavigate = (screen: Screen) => {
    setJustFinishedGame(false);
    setScreen(screen);
  }

  const renderScreen = () => {
    switch (screen) {
      case Screen.SETTINGS:
        return <SettingsScreen 
                  settings={settings} 
                  setSettings={setSettings} 
                  onBack={() => handleNavigate(Screen.START)} 
                  onClearAllProgress={handleClearAllProgress}
                />;
      case Screen.GAME:
        return <GameScreen 
          settings={settings} 
          resources={resources} 
          playerRewards={playerRewards}
          onEndGame={handleGameEnd}
          onExit={() => handleNavigate(Screen.START)} 
        />;
      case Screen.RESOURCES:
        return <ResourceBrowser resources={resources} setResources={setResources} onBack={() => handleNavigate(Screen.START)} onAIFetch={handleAIFetch}/>;
      case Screen.ACHIEVEMENTS:
        return <AchievementsScreen unlockedAchievements={unlockedAchievements} onBack={() => handleNavigate(Screen.START)} />;
      case Screen.START:
      default:
        return <StartScreen 
                  onNavigate={handleNavigate}
                  settings={settings} 
                  onStartGame={handleStartGame}
                  lastGameHistory={lastGameHistory}
                  isSoundOn={isSoundOn}
                  setIsSoundOn={setIsSoundOn}
                  unlockedAchievementsCount={Object.keys(unlockedAchievements).length}
                  totalAchievementsCount={ALL_ACHIEVEMENTS.length}
                  newlyUnlocked={newlyUnlocked}
                  onDismissNotifications={() => setNewlyUnlocked([])}
                  playerRewards={playerRewards}
                  previousPlayerRewards={previousPlayerRewards}
                  justFinishedGame={justFinishedGame}
                  onAnimationComplete={() => setJustFinishedGame(false)}
                />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-100 to-purple-200 min-h-screen text-gray-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 flex flex-col min-h-[90vh]">
        <header className="flex justify-between items-center pb-4 border-b-2 border-purple-200">
            <h1 className="font-display text-2xl sm:text-4xl text-purple-700 tracking-wider">
                记忆力训练
            </h1>
            <div className="flex items-center space-x-2">
                <button onClick={handleExport} className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-transform transform hover:scale-110 active:scale-95" title="导出进度">
                    <DownloadIcon />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
                <button onClick={handleImportClick} className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-transform transform hover:scale-110 active:scale-95" title="导入进度">
                    <UploadIcon />
                </button>
            </div>
        </header>
        <main className="flex-grow flex flex-col justify-center">
            {renderScreen()}
        </main>
      </div>
    </div>
  );
};

export default App;