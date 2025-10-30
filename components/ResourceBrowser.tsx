import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Stimulus, StimulusType } from '../types';
import { fetchNewResources } from '../services/geminiService';
import { ArrowLeftIcon, SparklesIcon } from './icons';
import { playSound } from '../services/soundService';

interface ResourceBrowserProps {
  resources: Stimulus[];
  setResources: React.Dispatch<React.SetStateAction<Stimulus[]>>;
  onBack: () => void;
  onAIFetch: () => void;
}

const StimulusCard: React.FC<{ stimulus: Stimulus }> = ({ stimulus }) => {
    const baseClasses = "w-full h-32 rounded-lg flex items-center justify-center shadow-md transition-transform transform hover:scale-105";
    const nameClasses = "absolute bottom-1 right-2 text-xs font-semibold bg-black/50 text-white px-1.5 py-0.5 rounded";

    switch (stimulus.type) {
        case StimulusType.IMAGE:
            return <div className={`${baseClasses} bg-gray-200 relative`}><img src={stimulus.value} alt={stimulus.name} className="w-full h-full object-cover rounded-lg" /><span className={nameClasses}>{stimulus.name}</span></div>;
        case StimulusType.COLOR:
            return <div className={`${baseClasses} relative`} style={{ backgroundColor: stimulus.value }}><span className={nameClasses}>{stimulus.name}</span></div>;
        case StimulusType.EMOJI:
        case StimulusType.SHAPE:
            return <div className={`${baseClasses} bg-white text-5xl relative`}><span className="text-5xl">{stimulus.value}</span><span className={nameClasses}>{stimulus.name}</span></div>;
        case StimulusType.NUMBER:
        case StimulusType.TEXT:
            return <div className={`${baseClasses} bg-white text-5xl font-bold text-gray-800 relative`}><span className="truncate max-w-full px-2">{stimulus.value}</span><span className={nameClasses}>{stimulus.name}</span></div>;
        default:
            return <div className={baseClasses}></div>;
    }
};

const categoryMap: { [key: string]: string } = {
  'animals': '动物',
  'foods': '食物',
  'nature': '自然',
  'travel': '旅行地点',
  'sports': '运动',
  'objects': '物品',
  'clothing': '服装',
  'shapes': '形状',
  'symbols': '符号',
};

const stimulusTypeToChinese = (type: StimulusType): string => {
    switch (type) {
        case StimulusType.EMOJI: return '表情';
        case StimulusType.IMAGE: return '图片';
        case StimulusType.SHAPE: return '形状与符号';
        case StimulusType.COLOR: return '颜色';
        case StimulusType.NUMBER: return '数字';
        case StimulusType.TEXT: return '文字';
        default: return '未知';
    }
};

const ResourceBrowser: React.FC<ResourceBrowserProps> = ({ resources, setResources, onBack, onAIFetch }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('animals');

  const handleFetchResources = async () => {
    playSound('click');
    setIsLoading(true);
    setError(null);
    try {
      const newItems = await fetchNewResources(categoryMap[selectedCategory]);
      
      const newStimuli: Stimulus[] = newItems.map(item => ({
        id: uuidv4(),
        type: item.type as StimulusType,
        name: item.name,
        value: item.type === 'IMAGE' 
          ? `https://picsum.photos/seed/${item.name.replace(/\s+/g, '-')}/200`
          : item.emoji || item.name,
      }));

      const existingNames = new Set(resources.map(r => r.name));
      const filteredNewStimuli = newStimuli.filter(s => !existingNames.has(s.name || ''));
      
      setResources(prev => [...prev, ...filteredNewStimuli]);
      onAIFetch();
    } catch (err) {
      setError((err as Error).message || '获取新资源失败，请重试。');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    playSound('click');
    onBack();
  }

  const groupedResources = resources.reduce((acc, resource) => {
    (acc[resource.type] = acc[resource.type] || []).push(resource);
    return acc;
  }, {} as Record<StimulusType, Stimulus[]>);

  const orderedTypes = [
    StimulusType.EMOJI,
    StimulusType.IMAGE,
    StimulusType.SHAPE,
    StimulusType.COLOR,
    StimulusType.NUMBER,
    StimulusType.TEXT,
  ];

  return (
    <div className="flex flex-col h-full p-4 animate-fade-in">
      <div className="flex items-center mb-4">
        <button onClick={handleBack} className="p-2 mr-4 rounded-full hover:bg-gray-200 transition active:scale-90">
          <ArrowLeftIcon />
        </button>
        <h2 className="font-display text-3xl text-purple-700">资源库</h2>
      </div>

      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-1/2 p-2 border border-gray-300 rounded-md"
              disabled={isLoading}
            >
              {Object.entries(categoryMap).map(([value, label]) => (
                 <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button
              onClick={handleFetchResources}
              disabled={isLoading}
              className="w-full sm:w-1/2 flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-md shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              <SparklesIcon className="w-5 h-5 mr-2"/>
              {isLoading ? 'AI获取并校验中...' : 'AI获取新资源'}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      <div className="flex-grow overflow-y-auto pr-2">
        {orderedTypes.map(type => {
          const items = groupedResources[type];
          if (!items || items.length === 0) return null;
          return (
            <div key={type} className="mb-6">
              <h3 className="font-display text-xl text-gray-600 mb-3 border-b pb-2">
                {stimulusTypeToChinese(type)} ({items.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {items.map(stimulus => (
                  <StimulusCard key={stimulus.id} stimulus={stimulus} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResourceBrowser;
