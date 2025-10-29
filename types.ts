
export enum Screen {
  START,
  SETTINGS,
  GAME,
  RESOURCES,
}

export enum StimulusType {
  IMAGE = 'IMAGE',
  EMOJI = 'EMOJI',
  COLOR = 'COLOR',
  SHAPE = 'SHAPE',
  NUMBER = 'NUMBER',
  TEXT = 'TEXT',
  RANDOM = 'RANDOM',
}

export interface Stimulus {
  id: string;
  type: StimulusType;
  value: string; // URL for image, emoji char, hex code, shape name, number, text
  name?: string;
}

export interface GameSettings {
  level: number;
  nLevel: number; // The 'n' in n-back
  stimulusType: StimulusType;
  gameLength: number; // Number of turns
  speed: number; // ms per turn
}
