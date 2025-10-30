import React from 'react';
import { GameSettings, StimulusType } from '../types';
import { ArrowLeftIcon } from './icons';
import { playSound } from '../services/soundService';


interface SettingsScreenProps {
  settings: GameSettings;
  setSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
  onBack: () => void;
}

const stimulusTypeMap: { [key in StimulusType]?: string } = {
    [StimulusType.EMOJI]: '表情',
    [StimulusType.COLOR]: '颜色',
    [StimulusType.SHAPE]: '形状',
    [StimulusType.NUMBER]: '数字',
    [StimulusType.TEXT]: '文字',
    [StimulusType.LETTER]: '字母',
    [StimulusType.RANDOM]: '随机',
};

const SettingsScreen: React.FC<SettingsScreenProps> = ({ settings, setSettings, onBack }) => {
  const handleNLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(s => ({ ...s, nLevel: parseInt(e.target.value, 10) }));
  };

  const handleStimulusTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings(s => ({ ...s, stimulusType: e.target.value as StimulusType }));
  };
  
    const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(s => ({ ...s, speed: parseInt(e.target.value, 10) }));
  };

  const handleBack = () => {
    playSound('click');
    onBack();
  }

  return (
    <div className="flex flex-col h-full p-4 animate-fade-in">
      <div className="flex items-center mb-6">
        <button onClick={handleBack} className="p-2 mr-4 rounded-full hover:bg-gray-200 transition active:scale-90">
          <ArrowLeftIcon />
        </button>
        <h2 className="font-display text-3xl text-purple-700">设置</h2>
      </div>
      <div className="space-y-6 flex-grow">
        <div>
          <label htmlFor="n-level" className="block text-lg font-semibold text-gray-700 mb-2">
            难度 (N-Back 等级): <span className="font-bold text-blue-600">{settings.nLevel}</span>
          </label>
          <input
            id="n-level"
            type="range"
            min="1"
            max="5"
            value={settings.nLevel}
            onChange={handleNLevelChange}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg accent-blue-500"
          />
        </div>
        <div>
          <label htmlFor="stimulus-type" className="block text-lg font-semibold text-gray-700 mb-2">
            刺激类型
          </label>
          <select
            id="stimulus-type"
            value={settings.stimulusType}
            onChange={handleStimulusTypeChange}
            className="w-full p-3 bg-white border-2 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
          >
            {Object.values(StimulusType).map(type => (
              <option key={type} value={type} className="capitalize">{stimulusTypeMap[type]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="speed" className="block text-lg font-semibold text-gray-700 mb-2">
            速度 (毫秒/项目): <span className="font-bold text-blue-600">{settings.speed}ms</span>
          </label>
          <input
            id="speed"
            type="range"
            min="1000"
            max="5000"
            step="250"
            value={settings.speed}
            onChange={handleSpeedChange}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg accent-blue-500"
          />
        </div>
      </div>
      <div className="mt-auto pt-4">
        <button
          onClick={handleBack}
          className="w-full py-3 bg-green-500 text-white font-bold text-lg rounded-lg shadow-md hover:bg-green-600 transition transform hover:scale-105 active:scale-100"
        >
          保存并返回
        </button>
      </div>
    </div>
  );
};

export default SettingsScreen;