import { GameSettings, Stimulus, PlayerRewards, UnlockedAchievements } from '../types';

const STORAGE_KEY = 'n-back-game-data';

export interface AppState {
    settings: GameSettings;
    resources: Stimulus[];
    playerRewards: PlayerRewards;
    unlockedAchievements: UnlockedAchievements;
    isSoundOn: boolean;
}

export const saveState = (state: AppState) => {
    try {
        const serializedState = JSON.stringify(state);
        localStorage.setItem(STORAGE_KEY, serializedState);
    } catch (error) {
        console.warn("Could not save game state to local storage:", error);
    }
};

export const loadState = (): AppState | undefined => {
    try {
        const serializedState = localStorage.getItem(STORAGE_KEY);
        if (serializedState === null) {
            return undefined;
        }
        return JSON.parse(serializedState);
    } catch (error) {
        console.warn("Could not load game state from local storage:", error);
        return undefined;
    }
};
