
import { ReactNode } from 'react';

export type TileType = 'GRASS' | 'DIRT' | 'WATER' | 'HOUSE_FLOOR' | 'STONE_FLOOR' | 'DARK_DIRT';

export type SceneName = 'FARM' | 'TOWN' | 'MINE' | 'HOUSE';

export type UIMode = 'PLAYING' | 'INVENTORY' | 'CHEST' | 'SHOP' | 'DIALOGUE';

export interface ItemDefinition {
  name: string;
  type: 'tool' | 'seed' | 'crop' | 'resource' | 'obstacle' | 'interactive' | 'placeable' | 'weapon' | 'fish' | 'container' | 'machine' | 'warp';
  sprite?: string; // Filename in R2 bucket
  pos?: [number, number]; // [x, y] coordinates in spritesheet
  color?: string; // Fallback color
  description?: string;

  // Economy
  price?: number;
  sellPrice?: number;

  // Tools
  action?: 'till' | 'water' | 'clear' | 'break' | 'fish' | 'attack';
  energy?: number;
  tier?: number;
  minDmg?: number;
  maxDmg?: number;
  icon?: ReactNode;

  // Crops
  cropId?: number; // For seeds, pointing to the produce ID
  daysToGrow?: number;
  stages?: number;
  seasons?: string[];
  regrow?: number;
  minHarvest?: number;
  chanceForExtra?: number;
  row?: number; // Row in crops.png

  // Objects
  drop?: number; // ID of item dropped when broken
  solid?: boolean; // Collision
  slots?: number; // For containers

  // Food
  edible?: boolean;
  energyRestore?: number;
}

export interface ItemInstance {
  id: number;
  count: number;
}

export interface CropState {
  id: number; // The produce ID
  stage: number; // Visual stage
  daysGrown: number; // Logic counter
  isWatered: boolean;
  dead: boolean;
}

export interface TileData {
  x: number;
  y: number;
  type: TileType;
  objectId: number | null; // references ITEM_DB key
  crop?: CropState;
  tree?: { id: number; stage: number };
  isTilled: boolean;
  isWatered: boolean;
  canWalk: boolean;
  warp?: { target: SceneName; x: number; y: number };
}

export interface PlayerState {
  x: number;
  y: number;
  facing: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  energy: number;
  maxEnergy: number;
  hp: number;
  maxHp: number;
  money: number;
  inventory: (ItemInstance | null)[];
  selectedSlot: number;
  cursorItem: ItemInstance | null; // Item being dragged
}

export interface NPC {
  id: string;
  name: string;
  variant: 'MAYOR' | 'GRANNY';
  scene: SceneName;
  x: number;
  y: number;
  facing: 'LEFT' | 'RIGHT';
}

export interface Monster {
  id: number;
  type: 'SLIME';
  scene: SceneName;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  damage: number;
}

export interface GameState {
  day: number;
  time: number; // Minutes from midnight (0-1599)
  seasonIdx: number; // 0=Spring, 1=Summer...
  weather: 'SUNNY' | 'RAINY' | 'STORMY';
  isPaused: boolean;
}
