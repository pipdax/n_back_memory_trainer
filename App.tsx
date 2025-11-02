import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GameSettings, Screen, PlayerRewards, UnlockedAchievements, GameStats } from './types';
import { DEFAULT_SETTINGS, INITIAL_RESOURCES } from './constants';
import { ALL_ACHIEVEMENTS } from './achievements';
import { checkAchievements } from './services/achievementService';
import { calculateStars, processRewards } from './services/rewardService';
import { loadState, saveState, AppState } from './services/storageService';
import StartScreen from './components/StartScreen';
import SettingsScreen from './components/SettingsScreen';
import GameScreen from './components/GameScreen';
import ResourceBrowser from './components/ResourceBrowser';
import AchievementsScreen from './components/AchievementsScreen';
import { playSound, setSoundEnabled } from './services/soundService';

// Centralized initial state logic. It loads from storage or provides a fresh default state.
const getInitialState = (): AppState => {
  const loadedState = loadState();
  if (loadedState) {
    return loadedState;
  }
  // Return a complete default state if nothing is loaded
  return {
    settings: DEFAULT_SETTINGS,
    resources: INITIAL_RESOURCES,
    playerRewards: { stars: 0, gems: 0, trophies: 0, perfectScores: 0 },
    unlockedAchievements: {},
    isSoundOn: true,
  };
};

const App: React.FC = () => {
  // Load initial state only once.
  const [initialState] = useState(getInitialState);

  const [screen, setScreen] = useState<Screen>(Screen.START);
  const [settings, setSettings] = useState<GameSettings>(initialState.settings);
  const [resources, setResources] = useState(initialState.resources);
  const [playerRewards, setPlayerRewards] = useState<PlayerRewards>(initialState.playerRewards);
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievements>(initialState.unlockedAchievements);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(initialState.isSoundOn);
  
  const [lastGameHistory, setLastGameHistory] = useState<Array<{ turn: number; score: number; result: 'correct' | 'incorrect' | 'neutral' }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Achievement State
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);
  
  // Animation control state
  const [isProcessingRewards, setIsProcessingRewards] = useState(false);


  // Effect to save state to localStorage whenever a key piece of state changes.
  useEffect(() => {
    const currentState: AppState = {
      settings,
      resources,
      playerRewards,
      unlockedAchievements,
      isSoundOn,
    };
    saveState(currentState);
  }, [settings, resources, playerRewards, unlockedAchievements, isSoundOn]);

  useEffect(() => {
    setSoundEnabled(isSoundOn);
  }, [isSoundOn]);

  const handleExport = useCallback(() => {
    playSound('click');
    try {
      // We read from localStorage directly to get the versioned wrapper.
      const rawData = localStorage.getItem('n-back-game-data');
      const dataToExport = JSON.stringify(JSON.parse(rawData || '{}'), null, 2);
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
  }, []);

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
        
        // Save the raw imported data to localStorage. Our robust loadState will handle it on next load.
        localStorage.setItem('n-back-game-data', text);

        alert('游戏数据导入成功！应用将重新加载以应用更改。');
        // A full reload is the safest way to ensure all components re-initialize with the new state.
        window.location.reload(); 
        
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

  const applyRewardsWithAnimation = useCallback(async (starsEarned: number, wasPerfect: boolean) => {
    setIsProcessingRewards(true);
  
    // We use a local variable to track the state through the animation,
    // as the `playerRewards` state variable won't update within this async function's scope.
    let currentRewards = { ...playerRewards };
  
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    const STEP_DELAY = 1200; // Delay between each animation step
  
    // Step 1: Add earned stars
    if (starsEarned > 0) {
      currentRewards = { ...currentRewards, stars: currentRewards.stars + starsEarned };
      setPlayerRewards(currentRewards);
      await delay(STEP_DELAY);
    }
  
    // Step 2: Add gem for perfect score
    if (wasPerfect) {
      currentRewards = { ...currentRewards, gems: currentRewards.gems + 1 };
      setPlayerRewards(currentRewards);
      await delay(STEP_DELAY);
    }
  
    // Step 3: Cascade convert Stars to Gems, one conversion at a time
    while (currentRewards.stars >= 10) {
      currentRewards = {
        ...currentRewards,
        stars: currentRewards.stars - 10,
        gems: currentRewards.gems + 1,
      };
      setPlayerRewards(currentRewards);
      await delay(STEP_DELAY);
    }
  
    // Step 4: Cascade convert Gems to Trophies
    while (currentRewards.gems >= 10) {
      currentRewards = {
        ...currentRewards,
        gems: currentRewards.gems - 10,
        trophies: currentRewards.trophies + 1,
      };
      setPlayerRewards(currentRewards);
      await delay(STEP_DELAY);
    }
  
    // Step 5: Cascade convert Trophies to Perfect Scores
    while (currentRewards.trophies >= 10) {
      currentRewards = {
        ...currentRewards,
        trophies: currentRewards.trophies - 10,
        perfectScores: currentRewards.perfectScores + 1,
      };
      setPlayerRewards(currentRewards);
      await delay(STEP_DELAY);
    }
  
    setIsProcessingRewards(false);
  }, [playerRewards]);

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
        applyRewardsWithAnimation(starsEarned, wasPerfect);
    }

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
    setLastGameHistory([]);
    setScreen(Screen.GAME);
  };
  
  const handleNavigate = (screen: Screen) => {
    setScreen(screen);
  }

  const renderScreen = () => {
    switch(screen) {
      case Screen.START:
        return (
          <StartScreen 
            onNavigate={handleNavigate}
            onStartGame={handleStartGame}
            settings={settings}
            lastGameHistory={lastGameHistory}
            isSoundOn={isSoundOn}
            setIsSoundOn={setIsSoundOn}
            unlockedAchievementsCount={Object.keys(unlockedAchievements).length}
            totalAchievementsCount={ALL_ACHIEVEMENTS.length}
            newlyUnlocked={newlyUnlocked}
            onDismissNotifications={() => setNewlyUnlocked([])}
            playerRewards={playerRewards}
            isProcessingRewards={isProcessingRewards}
          />
        );
      case Screen.SETTINGS:
        return (
          <SettingsScreen 
            settings={settings}
            setSettings={setSettings}
            onBack={() => handleNavigate(Screen.START)}
            onClearAllProgress={handleClearAllProgress}
            onExport={handleExport}
            onImportClick={handleImportClick}
          />
        );
      case Screen.GAME:
        return (
          <GameScreen
            settings={settings}
            resources={resources}
            playerRewards={playerRewards}
            onEndGame={handleGameEnd}
            onExit={() => handleNavigate(Screen.START)}
          />
        );
      case Screen.RESOURCES:
        return (
            <ResourceBrowser 
                resources={resources}
                setResources={setResources}
                onBack={() => handleNavigate(Screen.START)}
                onAIFetch={handleAIFetch}
            />
        );
      case Screen.ACHIEVEMENTS:
        return (
            <AchievementsScreen 
                unlockedAchievements={unlockedAchievements}
                onBack={() => handleNavigate(Screen.START)}
            />
        );
      default:
        return null;
    }
  }

  return (
    <div className="h-screen w-screen bg-gray-50 overflow-hidden">
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            className="hidden"
            accept="application/json"
        />
        <main className="container mx-auto h-full p-4 relative">
            {renderScreen()}
        </main>
    </div>
  );
};

export default App;