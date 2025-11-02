import { GameSettings, Stimulus, PlayerRewards, UnlockedAchievements } from '../types';
import { DEFAULT_SETTINGS, INITIAL_RESOURCES } from '../constants';

const STORAGE_KEY = 'n-back-game-data';
const CURRENT_VERSION = '1.1.0'; // Versioning to handle future data structure changes

// This interface represents the data structure of the entire app state
export interface AppState {
    settings: GameSettings;
    resources: Stimulus[];
    playerRewards: PlayerRewards;
    unlockedAchievements: UnlockedAchievements;
    isSoundOn: boolean;
}

// This interface represents the object that is actually stored in localStorage
interface VersionedAppState {
    version: string;
    state: AppState;
}

/**
 * Migrates loaded data to the current application state structure.
 * This is crucial for handling changes in the data format between app versions.
 * @param loadedData The raw data parsed from localStorage.
 * @returns An AppState object conforming to the latest structure.
 */
const migrateState = (loadedData: any): AppState => {
    // Case 1: The data is from the old, un-versioned format.
    if (!loadedData.version) {
        console.log("Migrating legacy (un-versioned) data structure...");
        const migratedState: AppState = {
            settings: loadedData.settings || DEFAULT_SETTINGS,
            resources: loadedData.resources || INITIAL_RESOURCES,
            playerRewards: loadedData.playerRewards || { stars: 0, gems: 0, trophies: 0, perfectScores: 0 },
            unlockedAchievements: loadedData.unlockedAchievements || {},
            isSoundOn: loadedData.isSoundOn ?? true,
        };
        return migratedState;
    }
    
    // Case 2: The data is versioned but needs migration steps.
    // Example: if (loadedData.version === '1.0.0') { ...migrate to 1.1.0... }
    // For now, we assume any versioned data is compatible.
    return loadedData.state;
};

export const saveState = (state: AppState) => {
    try {
        const versionedState: VersionedAppState = {
            version: CURRENT_VERSION,
            state: state,
        };
        const serializedState = JSON.stringify(versionedState);
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
        
        const parsedData = JSON.parse(serializedState);
        
        // If the data is current, no migration needed.
        if (parsedData.version === CURRENT_VERSION) {
            return parsedData.state;
        }

        // If the version is old or missing, migrate it.
        console.log(`Old version detected. Migrating from ${parsedData.version || 'unversioned'} to ${CURRENT_VERSION}.`);
        const migrated = migrateState(parsedData);
        
        // Save the migrated state immediately to prevent re-migration on next load.
        saveState(migrated);
        
        return migrated;

    } catch (error) {
        console.warn("Could not load/migrate game state from local storage:", error);
        // If loading or migration fails, clear the corrupt data to prevent future errors.
        localStorage.removeItem(STORAGE_KEY);
        return undefined;
    }
};
