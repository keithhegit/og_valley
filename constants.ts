
import { ItemDefinition, ItemInstance } from "./types";

export const GRID_W = 16;
export const GRID_H = 12;
export const TILE_SIZE = 48;
export const MAX_ENERGY = 100;
export const INVENTORY_SIZE = 24;
export const ASSET_BASE_URL = ""; // Set this to R2 URL when ready

export const COLORS = {
  GRASS: '#567c2f',
  DIRT: '#f1aa6e',
  TILLED: '#c08152',
  WATERED: '#6c3d28',
  WATER: '#4fa4b8',
  DEAD: '#4a3b32',
  STONE_FLOOR: '#90a4ae',
  DARK_DIRT: '#37474f', // Mine floor
  UI_BG: '#e6c697',
  UI_BORDER: '#8b5e34',
};

export const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];

// --- ITEM DATABASE ---
export const ITEM_DB: Record<number, ItemDefinition> = {
  // Environment
  0:  { name: 'Weed', type: 'obstacle', drop: 771, sprite: 'springobjects.png', pos: [0, 0], color: '#3a5f0b' },
  2:  { name: 'Stone Node', type: 'obstacle', drop: 390, sprite: 'springobjects.png', pos: [16, 0], color: '#757575', solid: true },
  4:  { name: 'Twig', type: 'obstacle', drop: 388, sprite: 'springobjects.png', pos: [32, 0], color: '#5d4037', solid: true },
  18: { name: 'Daffodil', type: 'resource', sellPrice: 30, sprite: 'springobjects.png', pos: [18, 0], color: '#ffeb3b' },
  
  // Resources
  388: { name: 'Wood', type: 'resource', sellPrice: 2, sprite: 'springobjects.png', pos: [388, 0], color: '#795548' },
  390: { name: 'Stone', type: 'resource', sellPrice: 2, sprite: 'springobjects.png', pos: [390, 0], color: '#9e9e9e' },
  771: { name: 'Fiber', type: 'resource', sellPrice: 1, sprite: 'springobjects.png', pos: [771, 0], color: '#558b2f' },

  // Crops & Seeds
  472: { name: 'Parsnip Seeds', type: 'seed', price: 20, cropId: 24, description: 'Spring. 4 Days.', sprite: 'springobjects.png', pos: [496, 0] },
  24:  { name: 'Parsnip', type: 'crop', sellPrice: 35, daysToGrow: 4, stages: 5, seasons: ['Spring'], sprite: 'crops.png', row: 0, color: '#e8cfb3' },
  
  474: { name: 'Potato Seeds', type: 'seed', price: 50, cropId: 192, description: 'Spring. 6 Days.', sprite: 'springobjects.png', pos: [496, 0] },
  192: { name: 'Potato', type: 'crop', sellPrice: 80, daysToGrow: 6, stages: 5, seasons: ['Spring'], chanceForExtra: 0.2, sprite: 'crops.png', row: 6, color: '#d7ccc8' },

  // Tools & Weapons
  101: { name: 'Hoe', type: 'tool', action: 'till', energy: 2, tier: 1 },
  102: { name: 'Watering Can', type: 'tool', action: 'water', energy: 2, tier: 1 },
  103: { name: 'Axe', type: 'tool', action: 'clear', energy: 2, tier: 1 },
  104: { name: 'Pickaxe', type: 'tool', action: 'break', energy: 2, tier: 1 },
  105: { name: 'Rusty Sword', type: 'weapon', action: 'attack', minDmg: 2, maxDmg: 5, energy: 0 },

  // Placeables & Containers
  130: { name: 'Chest', type: 'container', slots: 9, solid: true, description: 'Stores items.', color: '#8d6e63' },
  
  // Mine
  903: { name: 'Ladder Down', type: 'warp', solid: false, color: '#212121' },
  904: { name: 'Ladder Up', type: 'warp', solid: false, color: '#212121' },

  // Interactive
  999: { name: 'Shipping Bin', type: 'interactive', description: 'Ship items.', color: '#8d6e63' },
  998: { name: 'Mailbox', type: 'interactive', description: 'Order seeds.', color: '#3b82f6' },
};

export const SHOP_INVENTORY = [472, 474];

export const INITIAL_INVENTORY: (ItemInstance | null)[] = Array(INVENTORY_SIZE).fill(null);
INITIAL_INVENTORY[0] = { id: 101, count: 1 }; // Hoe
INITIAL_INVENTORY[1] = { id: 102, count: 1 }; // Can
INITIAL_INVENTORY[2] = { id: 103, count: 1 }; // Axe
INITIAL_INVENTORY[3] = { id: 104, count: 1 }; // Pickaxe
INITIAL_INVENTORY[4] = { id: 105, count: 1 }; // Sword
INITIAL_INVENTORY[5] = { id: 472, count: 5 }; // Parsnip Seeds
INITIAL_INVENTORY[6] = { id: 130, count: 1 }; // Free Chest

export const NPC_DIALOGUES: Record<string, Record<string, string[]>> = {
  MAYOR: {
    INTRO: ["Welcome to Og Valley!", "I'm Mayor Lewis. It's great to see new faces."],
    SUNNY: ["A perfect day for farming!", "Keep the valley clean, will you?"],
    RAINY: ["Ah, the rain. Good for the crops, bad for my boots.", "You don't need to water crops today."],
    STORMY: ["Stay safe! The lightning is fierce today.", "I hope the town hall roof holds..."]
  },
  GRANNY: {
    INTRO: ["Oh, hello dearie.", "You remind me of my grandson."],
    SUNNY: ["The flowers look lovely in the sun.", "Make sure to take breaks, dear."],
    RAINY: ["My knees ache when it rains...", "Nothing like a cup of tea on a wet day."],
    STORMY: ["Oh my, what a racket outside!", "I'm staying indoors with my knitting."]
  }
};
