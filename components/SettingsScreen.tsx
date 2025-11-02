import React from 'react';
import { GameSettings, StimulusType } from '../types';
import { ArrowLeftIcon, DownloadIcon, UploadIcon } from './icons';
import { playSound } from '../services/soundService';


interface SettingsScreenProps {
  settings: GameSettings;
  setSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
  onBack: () => void;
  onClearAllProgress: () => void;
  onExport: () => void;
  onImportClick: () => void;
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

const SettingsScreen: React.FC<SettingsScreenProps> = ({ settings, setSettings, onBack, onClearAllProgress, onExport, onImportClick }) => {
  const handleNLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(s => ({ ...s, nLevel: parseInt(e.target.value, 10) }));
  };

  const handleStimulusTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings(s => ({ ...s, stimulusType: e.target.value as StimulusType }));
  };
  
    const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(s => ({ ...s, speed: parseInt(e.target.value, 10) }));
  };

  const handleGameLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(s => ({ ...s, gameLength: parseInt(e.target.value, 10) }));
  };

  const handleClearProgressClick = () => {
    playSound('click');
    const isConfirmed = window.confirm(
        "警告：您确定要清除所有的奖励（星星、宝石、奖杯、完美得分）和已解锁的成就吗？\n\n此操作无法撤销！"
    );
    if (isConfirmed) {
        playSound('incorrect');
        onClearAllProgress();
        alert("所有奖励和成就数据已被清除。");
    }
  };

  const handleBack = () => {
    playSound('click');
    onBack();
  }

  return (
    <div className="flex flex-col h-full p-4 animate-fade-in">
      <div className="flex items-center mb-6 flex-shrink-0">
        <button onClick={handleBack} className="p-2 mr-4 rounded-full hover:bg-gray-200 transition active:scale-90">
          <ArrowLeftIcon />
        </button>
        <h2 className="font-display text-3xl text-purple-700">设置</h2>
      </div>

      <div className="flex-grow overflow-y-auto pr-2">
        <div className="space-y-6">
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
            <label htmlFor="game-length" className="block text-lg font-semibold text-gray-700 mb-2">
              游戏回合数: <span className="font-bold text-blue-600">{settings.gameLength}</span>
            </label>
            <input
              id="game-length"
              type="range"
              min="10"
              max="50"
              step="5"
              value={settings.gameLength}
              onChange={handleGameLengthChange}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg accent-blue-500"
            />
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

        <div className="my-6 py-6 border-t-2 border-dashed border-gray-300">
            <h3 className="text-lg font-semibold text-gray-700 mb-2 text-center">数据管理</h3>
            <p className="text-sm text-center text-gray-500 mb-4 px-2">
                您的游戏进度保存在浏览器中。为防止因更换浏览器、清理缓存或应用更新导致数据丢失，建议您定期导出进度进行备份。
            </p>
            <div className="flex gap-4">
                <button
                    onClick={onExport}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-blue-500 text-white font-bold rounded-lg shadow-lg hover:bg-blue-600 transition active:scale-95"
                >
                    <DownloadIcon />
                    导出进度
                </button>
                <button
                    onClick={onImportClick}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-green-500 text-white font-bold rounded-lg shadow-lg hover:bg-green-600 transition active:scale-95"
                >
                    <UploadIcon />
                    导入进度
                </button>
            </div>
        </div>

        <div className="mt-6 pt-6 border-t-2 border-dashed border-red-300">
            <h3 className="text-lg font-semibold text-red-700 mb-2 text-center">危险区域</h3>
            <button
                onClick={handleClearProgressClick}
                className="w-full py-2 bg-red-600 text-white font-bold rounded-lg shadow-lg hover:bg-red-700 transition active:scale-95"
            >
                一键清除所有奖励和成就
            </button>
        </div>
      </div>

      <div className="mt-auto pt-4 flex-shrink-0">
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
