import type { PlayerState, GameState, TileData, NPC, Monster, ItemInstance, SceneName } from '../types';

export const SAVE_KEY = 'OG_VALLEY_SAVE_V2';

export interface SaveData {
    player: PlayerState;
    grids: Record<SceneName, TileData[][]>;
    containers: Record<string, (ItemInstance | null)[]>;
    gameState: GameState;
    monsters: Monster[];
    npcs: NPC[];
    currentScene: SceneName;
}

export const saveGame = (data: SaveData): void => {
    try {
        const json = JSON.stringify(data);
        localStorage.setItem(SAVE_KEY, json);
        console.log('[SaveSystem] Game saved successfully');
    } catch (error) {
        console.error('[SaveSystem] Failed to save game:', error);
    }
};

export const loadGame = (): SaveData | null => {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return null;

        const data = JSON.parse(raw) as SaveData;
        console.log('[SaveSystem] Game loaded successfully');
        return data;
    } catch (error) {
        console.error('[SaveSystem] Failed to load game:', error);
        return null;
    }
};

export const deleteSave = (): void => {
    localStorage.removeItem(SAVE_KEY);
    console.log('[SaveSystem] Save deleted');
};
