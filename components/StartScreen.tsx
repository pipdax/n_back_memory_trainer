import React from 'react';
import { GameSettings, Screen, StimulusType } from '../types';
import { PlayIcon, CogIcon, CollectionIcon, VolumeUpIcon, VolumeOffIcon, CheckIcon, XIcon } from './icons';
import { playSound, setSoundEnabled } from '../services/soundService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


interface StartScreenProps {
  setScreen: (screen: Screen) => void;
  settings: GameSettings;
  onStartGame: () => void;
  lastGameHistory: Array<{ turn: number; score: number; result: 'correct' | 'incorrect' | 'neutral' }>;
  isSoundOn: boolean;
  setIsSoundOn: React.Dispatch<React.SetStateAction<boolean>>;
}

const stimulusTypeToChinese = (type: StimulusType) => {
    const map = {
      [StimulusType.IMAGE]: '图片',
      [StimulusType.EMOJI]: '表情',
      [StimulusType.COLOR]: '颜色',
      [StimulusType.SHAPE]: '形状',
      [StimulusType.NUMBER]: '数字',
      [StimulusType.TEXT]: '文字',
      [StimulusType.RANDOM]: '随机',
    };
    return map[type] || type;
};

const CustomizedDot: React.FC<any> = (props) => {
  const { cx, cy, payload } = props;

  // Don't render a dot for the first point (turn 0)
  if (payload.turn === 0) {
    return null;
  }

  const iconProps = {
    x: cx - 8,
    y: cy - 8,
    width: 16,
    height: 16,
  };

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

  // Default dot for neutral or other cases
  return <circle cx={cx} cy={cy} r={3} stroke="#8884d8" fill="#fff" strokeWidth={2}/>;
};


const StartScreen: React.FC<StartScreenProps> = ({ setScreen, settings, onStartGame, lastGameHistory, isSoundOn, setIsSoundOn }) => {
  const handleSettingsClick = () => {
    playSound('click');
    setScreen(Screen.SETTINGS);
  };
  
  const handleResourcesClick = () => {
    playSound('click');
    setScreen(Screen.RESOURCES);
  };

  const handleStartGameClick = () => {
    playSound('click');
    onStartGame();
  }
  
  const handleToggleSound = () => {
    const newSoundState = !isSoundOn;
    setIsSoundOn(newSoundState);
    if (newSoundState) {
        setSoundEnabled(true);
    }
    playSound('click');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in relative">
      <button 
        onClick={handleToggleSound} 
        className="absolute top-0 right-0 p-2 text-gray-400 hover:text-gray-700 transition-colors"
        title={isSoundOn ? "静音" : "取消静音"}
        aria-label={isSoundOn ? "Mute sound" : "Unmute sound"}
      >
        {isSoundOn ? <VolumeUpIcon className="w-8 h-8"/> : <VolumeOffIcon className="w-8 h-8"/>}
      </button>

      <h2 className="font-display text-4xl md:text-6xl text-blue-600 mb-4">欢迎！</h2>
      <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-md">
        准备好提升你的脑力了吗？选择一个选项开始吧。
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg">
        <button
          onClick={handleStartGameClick}
          className="group flex flex-col items-center justify-center p-6 bg-green-500 text-white rounded-xl shadow-lg hover:bg-green-600 transition-all transform hover:-translate-y-1 active:scale-95"
        >
          <PlayIcon className="w-12 h-12 mb-2" />
          <span className="font-bold text-xl">开始游戏</span>
          <span className="text-sm opacity-80">N={settings.nLevel}</span>
        </button>
        <button
          onClick={handleSettingsClick}
          className="group flex flex-col items-center justify-center p-6 bg-yellow-500 text-white rounded-xl shadow-lg hover:bg-yellow-600 transition-all transform hover:-translate-y-1 active:scale-95"
        >
          <CogIcon className="w-12 h-12 mb-2" />
          <span className="font-bold text-xl">设置</span>
          <span className="text-sm opacity-80 capitalize">{stimulusTypeToChinese(settings.stimulusType)}</span>
        </button>
        <button
          onClick={handleResourcesClick}
          className="group flex flex-col items-center justify-center p-6 bg-purple-500 text-white rounded-xl shadow-lg hover:bg-purple-600 transition-all transform hover:-translate-y-1 active:scale-95"
        >
          <CollectionIcon className="w-12 h-12 mb-2" />
          <span className="font-bold text-xl">资源库</span>
           <span className="text-sm opacity-80">查看和添加</span>
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