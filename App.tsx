import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GameSettings, Stimulus, Screen, StimulusType, UnlockedAchievements, GameStats } from './types';
import { INITIAL_RESOURCES, DEFAULT_SETTINGS } from './constants';
import { ALL_ACHIEVEMENTS } from './achievements';
import { checkAchievements } from './services/achievementService';
import StartScreen from './components/StartScreen';
import SettingsScreen from './components/SettingsScreen';
import GameScreen from './components/GameScreen';
import ResourceBrowser from './components/ResourceBrowser';
import AchievementsScreen from './components/AchievementsScreen';
import { DownloadIcon, UploadIcon } from './components/icons';
import { playSound, setSoundEnabled } from './services/soundService';

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>(Screen.START);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [resources, setResources] = useState<Stimulus[]>(INITIAL_RESOURCES);
  const [lastGameHistory, setLastGameHistory] = useState<Array<{ turn: number; score: number; result: 'correct' | 'incorrect' | 'neutral' }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSoundOn, setIsSoundOn] = useState(true);

  // Achievement State
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievements>({});
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);


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
  }, [settings, resources, unlockedAchievements]);

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
        
        if (data.settings && data.resources) {
          setSettings(data.settings);
          setResources(data.resources);
          if(data.unlockedAchievements) setUnlockedAchievements(data.unlockedAchievements);
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


  const handleStartGame = () => {
    setLastGameHistory([]);
    setScreen(Screen.GAME);
  };

  const renderScreen = () => {
    switch (screen) {
      case Screen.SETTINGS:
        return <SettingsScreen settings={settings} setSettings={setSettings} onBack={() => setScreen(Screen.START)} />;
      case Screen.GAME:
        return <GameScreen 
          settings={settings} 
          resources={resources} 
          onEndGame={handleGameEnd}
          onExit={() => setScreen(Screen.START)} 
        />;
      case Screen.RESOURCES:
        return <ResourceBrowser resources={resources} setResources={setResources} onBack={() => setScreen(Screen.START)} onAIFetch={handleAIFetch}/>;
      case Screen.ACHIEVEMENTS:
        return <AchievementsScreen unlockedAchievements={unlockedAchievements} onBack={() => setScreen(Screen.START)} />;
      case Screen.START:
      default:
        return <StartScreen 
                  setScreen={setScreen} 
                  settings={settings} 
                  onStartGame={handleStartGame}
                  lastGameHistory={lastGameHistory}
                  isSoundOn={isSoundOn}
                  setIsSoundOn={setIsSoundOn}
                  unlockedAchievementsCount={Object.keys(unlockedAchievements).length}
                  totalAchievementsCount={ALL_ACHIEVEMENTS.length}
                  newlyUnlocked={newlyUnlocked}
                  onDismissNotifications={() => setNewlyUnlocked([])}
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
