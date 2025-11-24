import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    GRID_W, GRID_H, TILE_SIZE, INITIAL_INVENTORY, ITEM_DB, MAX_ENERGY, NPC_DIALOGUES, COLORS, SHOP_INVENTORY, START_TIME, END_TIME, TIME_TICK_INTERVAL, SEASONS
} from '../constants';
import {
    TileData, PlayerState, GameState, NPC, SceneName, ItemInstance, Monster, UIMode, TileType
} from '../types';
import {
    GrassTile, DirtTile, WaterTile, StoneFloorTile, DarkDirtTile, HouseSprite, NPCSprite, SlimeSprite, RainOverlay, CursorReticle, PlayerSprite, ItemRenderer, ChestSprite
} from './PixelArt';
import { Trash2, Box, ArrowRight } from 'lucide-react';
import { saveGame, loadGame } from '../utils/saveSystem';
import { playSound } from '../utils/audioSystem';

// --- HELPERS ---

interface FloatingText {
    id: number;
    x: number;
    y: number;
    text: string;
    color: string;
    life: number;
}

const generateGrid = (scene: SceneName): TileData[][] => {
    const grid: TileData[][] = [];
    for (let y = 0; y < GRID_H; y++) {
        const row: TileData[] = [];
        for (let x = 0; x < GRID_W; x++) {
            let type: TileType = 'GRASS';
            let objectId: number | null = null;
            let canWalk = true;
            let warp: { target: SceneName; x: number; y: number } | undefined;

            if (scene === 'FARM') {
                if ((x > 12 && y > 8) || (x === 13 && y === 9)) { type = 'WATER'; canWalk = false; }
                if (x >= 1 && x <= 4 && y >= 1 && y <= 3) { type = 'HOUSE_FLOOR'; canWalk = false; }
                if (x === 5 && y === 2) { objectId = 999; canWalk = false; } // Bin
                if (x === 5 && y === 3) { objectId = 998; canWalk = false; } // Mailbox

                // Debris
                if (canWalk && objectId === null && Math.random() < 0.08) objectId = 2; // Rock
                else if (canWalk && objectId === null && Math.random() < 0.05) objectId = 0; // Weed
                else if (canWalk && objectId === null && Math.random() < 0.02) objectId = 18; // Flower

                // Town Warp
                if (x === GRID_W - 1) warp = { target: 'TOWN', x: 1, y: 5 };

                // House Door (front of house)
                if (x === 2 && y === 3) warp = { target: 'HOUSE', x: 7, y: 9 };
            }
            else if (scene === 'TOWN') {
                type = 'STONE_FLOOR';
                if (x === 0) warp = { target: 'FARM', x: GRID_W - 2, y: 5 };
                // Mine Warp
                if (x === GRID_W - 1 && y === 0) warp = { target: 'MINE', x: 2, y: 2 };

                if (x === 8 && y === 5) objectId = 18; // Decorative flower
            }
            else if (scene === 'MINE') {
                type = 'DARK_DIRT';
                if (x === 1 && y === 1) { objectId = 904; warp = { target: 'TOWN', x: GRID_W - 2, y: 1 }; } // Ladder Up

                // Generate ore nodes
                if (x > 2 && Math.random() < 0.15) {
                    const rand = Math.random();
                    if (rand < 0.05) objectId = 77; // Gold (5%)
                    else if (rand < 0.20) objectId = 76; // Iron (15%)
                    else if (rand < 0.50) objectId = 75; // Copper (30%)
                    else objectId = 2; // Stone (50%)
                }
            }
            else if (scene === 'HOUSE') {
                type = 'HOUSE_FLOOR';
                // Exit door
                if (x === 7 && y === 9) warp = { target: 'FARM', x: 2, y: 4 };

                // Furniture
                if (x >= 3 && x <= 5 && y === 2) { canWalk = false; } // Bed
                if (x === 10 && y === 5) { canWalk = false; } // TV
                if (x === 2 && y === 5) objectId = 130; // Chest
            }

            row.push({ x, y, type, objectId, isTilled: false, isWatered: false, canWalk, warp });
        }
        grid.push(row);
    }
    return grid;
};

const initialNPCs: NPC[] = [
    { id: 'may1', name: 'Mayor Lewis', variant: 'MAYOR', scene: 'TOWN', x: 10, y: 5, facing: 'LEFT' },
    { id: 'gra1', name: 'Granny Ella', variant: 'GRANNY', scene: 'TOWN', x: 6, y: 8, facing: 'RIGHT' }
];

const Game: React.FC = () => {
    const [currentScene, setCurrentScene] = useState<SceneName>('FARM');
    const [grids, setGrids] = useState<Record<SceneName, TileData[][]>>({
        FARM: generateGrid('FARM'),
        TOWN: generateGrid('TOWN'),
        MINE: generateGrid('MINE'),
        HOUSE: generateGrid('HOUSE')
    });

    const [player, setPlayer] = useState<PlayerState>({
        x: 8, y: 6, facing: 'DOWN', energy: MAX_ENERGY, maxEnergy: 100, hp: 100, maxHp: 100, money: 50,
        inventory: INITIAL_INVENTORY,
        selectedSlot: 0,
        cursorItem: null
    });

    const [gameState, setGameState] = useState<GameState>({
        day: 1, time: START_TIME, seasonIdx: 0, weather: 'SUNNY', isPaused: false
    });

    const [npcs, setNpcs] = useState<NPC[]>(initialNPCs);
    const [monsters, setMonsters] = useState<Monster[]>([
        { id: 1, type: 'SLIME', scene: 'MINE', x: 8, y: 8, hp: 20, maxHp: 20, damage: 5 },
        { id: 2, type: 'SLIME', scene: 'MINE', x: 12, y: 4, hp: 20, maxHp: 20, damage: 5 }
    ]);
    const [containers, setContainers] = useState<Record<string, (ItemInstance | null)[]>>({}); // Key: "FARM_5_5"
    const [activeContainer, setActiveContainer] = useState<string | null>(null);

    // Version Info
    const BRANCH = "phase5";
    const COMMIT = "1f754bc";

    const [uiMode, setUiMode] = useState<UIMode>('PLAYING');
    const [message, setMessage] = useState<string | null>(null);
    const [dialogue, setDialogue] = useState<{ speaker: string, text: string } | null>(null);
    const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
    const [tooltip, setTooltip] = useState<{ itemId: number, x: number, y: number } | null>(null);
    const [longPressTimer, setLongPressTimer] = useState<number | null>(null);
    const [isSwinging, setIsSwinging] = useState(false);
    const [walkFrame, setWalkFrame] = useState(0);

    const playerRef = useRef(player);
    const gameStateRef = useRef(gameState);
    gameStateRef.current = gameState;
    playerRef.current = player;
    const monstersRef = useRef(monsters);
    monstersRef.current = monsters;

    // --- FLOATING TEXT ---
    useEffect(() => {
        const interval = setInterval(() => {
            setFloatingTexts(prev => prev
                .map(ft => ({ ...ft, y: ft.y - 0.02, life: ft.life - 1 }))
                .filter(ft => ft.life > 0)
            );
        }, 30);
        return () => clearInterval(interval);
    }, []);

    const spawnFloatingText = (x: number, y: number, text: string, color: string) => {
        setFloatingTexts(prev => [...prev, { id: Date.now() + Math.random(), x, y, text, color, life: 40 }]);
    };

    // --- TIME SYSTEM ---
    useEffect(() => {
        const interval = setInterval(() => {
            if (gameStateRef.current.isPaused || uiMode !== 'PLAYING') return;

            setGameState(prev => {
                let newTime = prev.time + 10; // 10 minutes per second
                let newDay = prev.day;
                let newSeasonIdx = prev.seasonIdx;

                // Forced sleep at 2:00 AM
                if (newTime >= END_TIME) {
                    setMessage("你已昏睡... 新的一天开始了!");
                    setTimeout(() => setMessage(null), 3000);

                    newTime = START_TIME; // Reset to 6:00 AM
                    newDay = prev.day + 1;

                    // Season change every 28 days
                    if (newDay > 28) {
                        newDay = 1;
                        newSeasonIdx = (prev.seasonIdx + 1) % 4;
                        setMessage(`${SEASONS[newSeasonIdx]} 到来了！`);
                    }

                    // Reset player position to spawn point (Farm 6, 4) - outside house
                    setPlayer(p => ({ ...p, x: 6, y: 4, energy: p.maxEnergy, hp: p.maxHp }));
                    setCurrentScene('FARM');

                    // Auto-save on sleep
                    setTimeout(() => {
                        saveGame({
                            player: playerRef.current,
                            grids,
                            containers,
                            gameState: { ...prev, time: newTime, day: newDay, seasonIdx: newSeasonIdx },
                            monsters: monstersRef.current,
                            npcs,
                            currentScene: 'FARM'
                        });
                    }, 100);
                }

                return { ...prev, time: newTime, day: newDay, seasonIdx: newSeasonIdx };
            });
        }, TIME_TICK_INTERVAL);

        return () => clearInterval(interval);
    }, [uiMode, grids, containers, npcs]);

    // --- LOAD GAME ON START ---
    useEffect(() => {
        const savedData = loadGame();
        if (savedData) {
            setPlayer(savedData.player);
            setGrids(savedData.grids);
            setContainers(savedData.containers);
            setGameState(savedData.gameState);
            setMonsters(savedData.monsters);
            setNpcs(savedData.npcs);
            setCurrentScene(savedData.currentScene);
            setMessage("游戏加载成功！");
            setTimeout(() => setMessage(null), 2000);
        }
    }, []);

    // --- MONSTER AI ---
    useEffect(() => {
        const interval = setInterval(() => {
            if (uiMode !== 'PLAYING') return;
            setMonsters(prev => prev.map(m => {
                if (m.scene !== currentScene) return m;
                if (Math.random() > 0.3) return m;
                // Simple chase
                const dx = playerRef.current.x - m.x;
                const dy = playerRef.current.y - m.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 1.1) {
                    // Attack player
                    setPlayer(p => {
                        const newHp = Math.max(0, p.hp - m.damage);
                        if (newHp < p.hp) spawnFloatingText(p.x, p.y, `- ${m.damage} `, 'red');

                        // Check for death
                        if (newHp <= 0) {
                            const moneyLost = Math.min(1000, Math.floor(p.money * 0.1)); // Wiki: max 1000g
                            setMessage(`你昏倒了... 失去 ${moneyLost} g`);
                            setTimeout(() => setMessage(null), 3000);

                            // Penalty and reset
                            setCurrentScene('FARM');
                            setGameState(gs => ({ ...gs, time: START_TIME }));

                            return {
                                ...p,
                                hp: p.maxHp,
                                energy: p.maxEnergy,
                                money: Math.max(0, p.money - moneyLost),
                                x: 6,
                                y: 4
                            };
                        }

                        return { ...p, hp: newHp };
                    });
                    return m;
                }

                if (dist < 5) {
                    const mx = m.x + Math.sign(dx);
                    const my = m.y + Math.sign(dy);
                    // Check bounds
                    if (mx >= 0 && mx < GRID_W && my >= 0 && my < GRID_H) {
                        return { ...m, x: mx, y: my };
                    }
                }
                return m;
            }));
        }, 800);
        return () => clearInterval(interval);
    }, [currentScene, uiMode]);

    // --- ACTIONS ---

    const getTargetCoords = useCallback(() => {
        const { x, y, facing } = playerRef.current;
        let tx = x;
        let ty = y;
        if (facing === 'UP') ty -= 1;
        if (facing === 'DOWN') ty += 1;
        if (facing === 'LEFT') tx -= 1;
        if (facing === 'RIGHT') tx += 1;
        return { x: tx, y: ty };
    }, []);

    const handleMove = useCallback((dx: number, dy: number) => {
        if (uiMode !== 'PLAYING') return;
        const { x, y } = playerRef.current;
        const newX = x + dx;
        const newY = y + dy;

        // Auto-face direction of movement (even if can't move)
        let newFacing = playerRef.current.facing;
        if (dx > 0) newFacing = 'RIGHT';
        if (dx < 0) newFacing = 'LEFT';
        if (dy > 0) newFacing = 'DOWN';
        if (dy < 0) newFacing = 'UP';

        if (newX < 0 || newX >= GRID_W || newY < 0 || newY >= GRID_H) {
            // Update facing even if out of bounds
            setPlayer(prev => ({ ...prev, facing: newFacing }));
            return;
        }

        const targetTile = grids[currentScene][newY][newX];

        // Warp
        if (targetTile.warp) {
            setCurrentScene(targetTile.warp.target);
            setPlayer(p => ({ ...p, x: targetTile.warp!.x, y: targetTile.warp!.y, facing: newFacing }));
            return;
        }

        if (!targetTile.canWalk) {
            // Update facing even if blocked
            setPlayer(prev => ({ ...prev, facing: newFacing }));
            return;
        }

        // Collision
        if (targetTile.objectId !== null) {
            const objDef = ITEM_DB[targetTile.objectId];
            if (objDef?.solid || objDef?.type === 'interactive' || objDef?.type === 'container') return;
        }

        // NPC Collision
        if (npcs.some(n => n.scene === currentScene && n.x === newX && n.y === newY)) {
            // Update facing even if NPC blocks
            setPlayer(prev => ({ ...prev, facing: newFacing }));
            return;
        }

        setPlayer(prev => ({ ...prev, x: newX, y: newY, facing: newFacing }));
        setWalkFrame(prev => (prev + 1) % 2);
        playSound('step');
    }, [grids, currentScene, uiMode, npcs]);

    const addToInventory = (itemId: number, count: number) => {
        setPlayer(p => {
            const newInv = [...p.inventory];
            const existingIdx = newInv.findIndex(i => i?.id === itemId);
            if (existingIdx !== -1) {
                newInv[existingIdx]!.count += count;
            } else {
                const emptyIdx = newInv.findIndex(i => i === null);
                if (emptyIdx !== -1) {
                    newInv[emptyIdx] = { id: itemId, count };
                } else {
                    setMessage("Inventory Full!");
                    setTimeout(() => setMessage(null), 1000);
                    return p;
                }
            }
            return { ...p, inventory: newInv };
        });
    };

    const handleInteract = useCallback(() => {
        if (uiMode !== 'PLAYING') {
            if (uiMode === 'DIALOGUE') { setUiMode('PLAYING'); setDialogue(null); }
            if (uiMode === 'SHOP') setUiMode('PLAYING');
            if (uiMode === 'CHEST') { setUiMode('PLAYING'); setActiveContainer(null); }
            return;
        }

        const { x: tx, y: ty } = getTargetCoords();
        const slotItem = playerRef.current.inventory[playerRef.current.selectedSlot];

        // 1. Attack
        if (slotItem && ITEM_DB[slotItem.id].action === 'attack') {
            // Animation trigger could go here
            const hitMonster = monstersRef.current.find(m => m.scene === currentScene && m.x === tx && m.y === ty);
            if (hitMonster) {
                const damage = Math.floor(Math.random() * 3) + 2; // Simple dmg
                spawnFloatingText(tx, ty, `${damage} `, '#fff');
                setMonsters(prev => {
                    return prev.map(m => m.id === hitMonster.id ? { ...m, hp: m.hp - damage } : m)
                        .filter(m => m.hp > 0);
                });
                // Knockback logic optional
                return;
            }
        }

        // 2. NPC Interaction
        const targetNPC = npcs.find(n => n.scene === currentScene && n.x === tx && n.y === ty);
        if (targetNPC) {
            const lines = NPC_DIALOGUES[targetNPC.variant][gameState.weather] || NPC_DIALOGUES[targetNPC.variant]['SUNNY'];

            // Grant affection if not talked today
            const canGainAffection = !targetNPC.lastTalked || targetNPC.lastTalked < gameState.day;
            if (canGainAffection) {
                setNpcs(prev => prev.map(n =>
                    n.id === targetNPC.id
                        ? { ...n, affection: Math.min(250, (n.affection || 0) + 10), lastTalked: gameState.day }
                        : n
                ));
                spawnFloatingText(tx, ty, '+10 💚', 'lime');
            }

            setDialogue({ speaker: targetNPC.name, text: lines[Math.floor(Math.random() * lines.length)] });
            setUiMode('DIALOGUE');
            playSound('pickup');
            return;
        }

        if (tx < 0 || tx >= GRID_W || ty < 0 || ty >= GRID_H) return;
        const targetTile = grids[currentScene][ty][tx];

        // 3. Object Interaction
        if (targetTile.objectId === 998) { setUiMode('SHOP'); playSound('pickup'); return; }
        if (targetTile.objectId === 999) { /* Shipping Logic */
            if (slotItem) {
                const def = ITEM_DB[slotItem.id];
                if (def.sellPrice) {
                    const val = def.sellPrice * slotItem.count;
                    setPlayer(p => {
                        const n = [...p.inventory]; n[p.selectedSlot] = null;
                        return { ...p, money: p.money + val, inventory: n };
                    });
                    spawnFloatingText(tx, ty, `+ ${val} g`, 'gold');
                }
            }
            return;
        }

        // Chest Open
        if (targetTile.objectId === 130) {
            const containerKey = `${currentScene}_${tx}_${ty} `;
            if (!containers[containerKey]) {
                setContainers(prev => ({ ...prev, [containerKey]: Array(9).fill(null) }));
            }
            setActiveContainer(containerKey);
            setUiMode('CHEST');
            return;
        }

        // 4. Grid Modification
        setGrids(prevGrids => {
            const newGrid = [...prevGrids[currentScene]];
            const row = [...newGrid[ty]];
            const tile = { ...row[tx] };
            let success = false;

            // Harvest
            if (tile.crop && tile.crop.stage >= 4 && !tile.crop.dead) {
                const def = ITEM_DB[tile.crop.id];
                setTimeout(() => {
                    addToInventory(tile.crop!.id, 1);
                    spawnFloatingText(tx, ty, `+ 1 ${def.name} `, 'lime');
                }, 0);
                tile.crop = undefined;
                tile.isTilled = false;
                success = true;
            }

            // Tools
            if (!success && slotItem) {
                const tool = ITEM_DB[slotItem.id];

                // Check energy before using tool
                if (tool.energy && playerRef.current.energy < tool.energy) {
                    setTimeout(() => {
                        setMessage("体力不足！");
                        setTimeout(() => setMessage(null), 1000);
                    }, 0);
                    return prevGrids;
                }

                // Place Chest
                if (tool.type === 'container' && !tile.objectId && !tile.crop && tile.canWalk) {
                    tile.objectId = slotItem.id;
                    setTimeout(() => {
                        setPlayer(p => {
                            const n = [...p.inventory]; n[p.selectedSlot]!.count--;
                            if (n[p.selectedSlot]!.count <= 0) n[p.selectedSlot] = null;
                            return { ...p, inventory: n };
                        });
                    }, 0);
                    success = true;
                }

                if (tool.action === 'till' && !tile.objectId && tile.type === 'GRASS') {
                    tile.type = 'DIRT'; tile.isTilled = true; success = true;
                    playSound('dig');
                }
                if (tool.action === 'water' && tile.isTilled) {
                    tile.isWatered = true; success = true;
                    playSound('water');
                }
                if (tool.action === 'break' && tile.objectId && ITEM_DB[tile.objectId]?.type === 'obstacle') {
                    // Drop item
                    const dropId = ITEM_DB[tile.objectId].drop;
                    if (dropId) setTimeout(() => addToInventory(dropId, 1), 0);
                    tile.objectId = null; success = true;
                    playSound('hit');
                }
                if (tool.type === 'seed' && tile.isTilled && !tile.crop && !tile.objectId) {
                    // Check season
                    const cropDef = ITEM_DB[tool.cropId!];
                    if (!cropDef.seasons?.includes(SEASONS[gameStateRef.current.seasonIdx])) {
                        setTimeout(() => {
                            setMessage("不适合当前季节种植！");
                            setTimeout(() => setMessage(null), 1500);
                        }, 0);
                        return prevGrids;
                    }

                    tile.crop = { id: tool.cropId!, stage: 0, daysGrown: 0, isWatered: false, dead: false };
                    setTimeout(() => {
                        setPlayer(p => {
                            const n = [...p.inventory]; n[p.selectedSlot]!.count--;
                            if (n[p.selectedSlot]!.count <= 0) n[p.selectedSlot] = null;
                            return { ...p, inventory: n };
                        });
                    }, 0);
                    success = true;
                    playSound('plant');
                }

                // Deduct energy and trigger animation
                if (success && tool.energy) {
                    setTimeout(() => {
                        setPlayer(p => ({ ...p, energy: Math.max(0, p.energy - tool.energy!) }));
                    }, 0);
                }

                // Trigger swing animation for tools
                if (success && tool.action) {
                    setIsSwinging(true);
                    setTimeout(() => setIsSwinging(false), 300);
                }
            }

            if (success) {
                row[tx] = tile;
                newGrid[ty] = row;
                return { ...prevGrids, [currentScene]: newGrid };
            }
            return prevGrids;
        });

    }, [uiMode, currentScene, npcs, containers, gameState.weather, getTargetCoords]);

    // --- INVENTORY MANIPULATION ---
    const handleSlotClick = (index: number, source: 'PLAYER' | 'CHEST') => {
        setPlayer(p => {
            const cursor = p.cursorItem;
            let newInv = [...p.inventory];
            let newContainer = activeContainer ? [...(containers[activeContainer] || [])] : [];

            const targetArray = source === 'PLAYER' ? newInv : newContainer;
            const targetItem = targetArray[index];

            // 1. Place
            if (cursor && !targetItem) {
                targetArray[index] = cursor;
                const newState = { ...p, cursorItem: null };
                if (source === 'PLAYER') newState.inventory = targetArray;
                else {
                    setContainers(prev => ({ ...prev, [activeContainer!]: targetArray }));
                }
                return newState;
            }
            // 2. Pickup
            if (!cursor && targetItem) {
                const newState = { ...p, cursorItem: targetItem };
                targetArray[index] = null;
                if (source === 'PLAYER') newState.inventory = targetArray;
                else {
                    setContainers(prev => ({ ...prev, [activeContainer!]: targetArray }));
                }
                return newState;
            }
            // 3. Swap
            if (cursor && targetItem) {
                if (cursor.id === targetItem.id) {
                    // Stack
                    targetItem.count += cursor.count;
                    const newState = { ...p, cursorItem: null };
                    if (source === 'PLAYER') newState.inventory = targetArray; // Reference update needed?
                    else setContainers(prev => ({ ...prev, [activeContainer!]: targetArray }));
                    return newState;
                } else {
                    // Swap
                    const temp = targetItem;
                    targetArray[index] = cursor;
                    const newState = { ...p, cursorItem: temp };
                    if (source === 'PLAYER') newState.inventory = targetArray;
                    else setContainers(prev => ({ ...prev, [activeContainer!]: targetArray }));
                    return newState;
                }
            }
            return p;
        });
    };

    const deleteCursorItem = () => {
        setPlayer(p => ({ ...p, cursorItem: null }));
    };

    // --- TOOLTIP SYSTEM ---
    const handleTooltipShow = (itemId: number, x: number, y: number) => {
        setTooltip({ itemId, x, y });
    };

    const handleTooltipHide = () => {
        setTooltip(null);
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };

    const handleLongPressStart = (itemId: number, e: React.TouchEvent) => {
        const touch = e.touches[0];
        const timer = setTimeout(() => {
            handleTooltipShow(itemId, touch.clientX, touch.clientY);
        }, 500); // 500ms long press
        setLongPressTimer(timer);
    };

    // --- FOOD SYSTEM ---
    const handleRightClick = (index: number) => {
        const item = player.inventory[index];
        if (!item) return;

        const def = ITEM_DB[item.id];
        if (def.edible && def.energyRestore) {
            setPlayer(p => {
                const newEnergy = Math.min(p.maxEnergy, p.energy + def.energyRestore!);
                const newInv = [...p.inventory];
                newInv[index]!.count -= 1;
                if (newInv[index]!.count <= 0) newInv[index] = null;

                spawnFloatingText(p.x, p.y, `+ ${def.energyRestore} Energy`, 'lime');
                return { ...p, energy: newEnergy, inventory: newInv };
            });
        } else {
            setMessage("此物品不可食用");
            setTimeout(() => setMessage(null), 1000);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'e' || e.key === 'E') {
                if (uiMode === 'PLAYING') setUiMode('INVENTORY');
                else if (uiMode === 'INVENTORY' || uiMode === 'CHEST') {
                    setUiMode('PLAYING');
                    setActiveContainer(null);
                    // If cursor has item, dump it back or drop? For now, keep in cursor (buggy) or dump to first empty
                }
            }
            if (uiMode !== 'PLAYING') {
                if (e.key === 'Escape') {
                    setUiMode('PLAYING'); setActiveContainer(null);
                }
                return;
            }
            switch (e.key) {
                case 'w': case 'ArrowUp': handleMove(0, -1); break;
                case 's': case 'ArrowDown': handleMove(0, 1); break;
                case 'a': case 'ArrowLeft': handleMove(-1, 0); break;
                case 'd': case 'ArrowRight': handleMove(1, 0); break;
                case ' ': case 'Enter': handleInteract(); break;
                case '1': setPlayer(p => ({ ...p, selectedSlot: 0 })); break;
                case '2': setPlayer(p => ({ ...p, selectedSlot: 1 })); break;
                case '3': setPlayer(p => ({ ...p, selectedSlot: 2 })); break;
                case '4': setPlayer(p => ({ ...p, selectedSlot: 3 })); break;
                case '5': setPlayer(p => ({ ...p, selectedSlot: 4 })); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleMove, handleInteract, uiMode]);

    // --- RENDER HELPERS ---
    const targetX = player.x + (player.facing === 'RIGHT' ? 1 : player.facing === 'LEFT' ? -1 : 0);
    const targetY = player.y + (player.facing === 'DOWN' ? 1 : player.facing === 'UP' ? -1 : 0);

    // --- RENDER ---
    const grid = grids[currentScene];
    const bgColor = currentScene === 'MINE' ? '#1a1a1a' : (gameState.weather === 'RAINY' ? '#1e293b' : '#1a1a1a');

    return (
        <div className={`w - full h - full flex flex - col items - center justify - center relative select - none transition - colors duration - 1000`} style={{ backgroundColor: bgColor }}>

            {/* UI LAYERS */}
            {(uiMode === 'INVENTORY' || uiMode === 'CHEST') && (
                <div className="absolute inset-0 z-50 bg-black/70 flex items-center justify-center">
                    <div className="bg-[#e6c697] border-4 border-[#8b5e34] p-4 rounded shadow-2xl flex flex-col gap-4">
                        <h2 className="text-[#5d4a2e] font-bold text-center border-b border-[#8b5e34] pb-2">
                            {uiMode === 'CHEST' ? 'CHEST STORAGE' : 'BACKPACK'}
                        </h2>

                        {/* Chest Grid */}
                        {uiMode === 'CHEST' && activeContainer && (
                            <div className="bg-[#d7ccc8] p-2 rounded border-2 border-[#8d6e63]">
                                <div className="grid grid-cols-9 gap-1 mb-4">
                                    {containers[activeContainer]?.map((item, i) => (
                                        <div key={`c - ${i} `}
                                            onClick={() => handleSlotClick(i, 'CHEST')}
                                            className="w-10 h-10 border border-[#8b5e34] bg-[#a1887f] flex items-center justify-center cursor-pointer hover:bg-[#8d6e63]">
                                            {item && <ItemRenderer id={item.id} className="w-8 h-8" />}
                                            {item && item.count > 1 && <span className="text-[8px] text-white absolute font-bold">{item.count}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Player Grid */}
                        <div className="grid grid-cols-6 gap-2">
                            {player.inventory.map((item, i) => (
                                <div key={i}
                                    onClick={() => handleSlotClick(i, 'PLAYER')}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        if (uiMode === 'INVENTORY' || uiMode === 'CHEST') handleRightClick(i);
                                    }}
                                    className={`w - 12 h - 12 border - 2 ${i === player.selectedSlot ? 'border-red-500 bg-[#ffccbc]' : 'border-[#8b5e34] bg-[#d4a373]'} flex items - center justify - center cursor - pointer hover: brightness - 110 relative`}>
                                    {item && <ItemRenderer id={item.id} className="w-8 h-8 pointer-events-none" />}
                                    {item && item.count > 1 && <span className="absolute bottom-0 right-0 text-[10px] bg-black/50 text-white px-1 pointer-events-none">{item.count}</span>}
                                </div>
                            ))}
                        </div>

                        {/* Trash */}
                        <div className="flex justify-end pt-2 border-t border-[#8b5e34]">
                            <div onClick={deleteCursorItem} className="w-12 h-12 border-2 border-red-800 bg-red-400 flex items-center justify-center cursor-pointer hover:bg-red-500">
                                <Trash2 size={24} color="white" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CURSOR ITEM DRAG */}
            {player.cursorItem && (
                <div className="fixed pointer-events-none z-[100] w-10 h-10" style={{ left: 'calc(50% + 200px)', top: '50%' }}>
                    {/* Note: Real mouse tracking requires global mouse move listener. For simplified version, we just show it in a static slot or assume user knows. 
                  Actually, let's just render it fixed for now or attach to mouse if we added mouse tracking.
                  Since I didn't add mouse tracking to state, I will render it inside the inventory modal near the trash can as "Holding".
              */}
                    {/* Better: Just rely on the visual feedback in the slot? No, drag needs visual. */}
                </div>
            )}
            {uiMode !== 'PLAYING' && player.cursorItem && (
                <div className="absolute top-20 right-20 z-[60] bg-white/20 p-2 rounded border border-white">
                    <span className="text-white text-xs block">Holding:</span>
                    <ItemRenderer id={player.cursorItem.id} className="w-8 h-8 animate-pulse" />
                </div>
            )}

            {/* RENDER GRID */}
            <div
                className="relative overflow-hidden shadow-2xl bg-black"
                style={{ width: GRID_W * TILE_SIZE, height: GRID_H * TILE_SIZE, maxWidth: '100vw', maxHeight: '80vh' }}
            >
                <div className="relative w-full h-full">
                    {grid.map((row, y) => (
                        row.map((tile, x) => (
                            <div
                                key={`${x} -${y} `}
                                className="absolute cursor-pointer"
                                style={{ left: x * TILE_SIZE, top: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}
                                onClick={() => {
                                    if (uiMode !== 'PLAYING') return;
                                    // Only allow adjacent tiles
                                    const dx = x - player.x;
                                    const dy = y - player.y;
                                    if (Math.abs(dx) + Math.abs(dy) === 1) {
                                        // Update facing
                                        let newFacing = player.facing;
                                        if (dx > 0) newFacing = 'RIGHT';
                                        if (dx < 0) newFacing = 'LEFT';
                                        if (dy > 0) newFacing = 'DOWN';
                                        if (dy < 0) newFacing = 'UP';
                                        setPlayer(p => ({ ...p, facing: newFacing }));
                                        // Trigger interaction after a short delay
                                        setTimeout(() => handleInteract(), 50);
                                    }
                                }}
                            >
                                {tile.type === 'GRASS' && <GrassTile className="w-full h-full" />}
                                {tile.type === 'DIRT' && <DirtTile className="w-full h-full" wet={tile.isWatered} />}
                                {tile.type === 'WATER' && <WaterTile className="w-full h-full" />}
                                {tile.type === 'STONE_FLOOR' && <StoneFloorTile className="w-full h-full" />}
                                {tile.type === 'DARK_DIRT' && <DarkDirtTile className="w-full h-full" />}

                                {tile.objectId !== null && <ItemRenderer id={tile.objectId} className="absolute inset-0 w-full h-full z-10" />}
                                {tile.crop && <ItemRenderer id={tile.crop.id} className="absolute inset-0 w-full h-full z-10" />}

                                {/* House Overlay */}
                                {currentScene === 'FARM' && x === 1 && y === 1 && (
                                    <div className="absolute top-0 left-0 w-[192px] h-[144px] z-10 pointer-events-none">
                                        <HouseSprite className="w-full h-full" />
                                    </div>
                                )}

                                {/* Smart Cursor Highlight */}
                                {uiMode === 'PLAYING' && x === targetX && y === targetY && (
                                    <CursorReticle valid={true} className="absolute inset-0 z-30 w-full h-full" />
                                )}
                            </div>
                        ))
                    ))}

                    {npcs.filter(n => n.scene === currentScene).map(npc => (
                        <div key={npc.id} className="absolute transition-all duration-[2000ms] ease-linear z-20" style={{ left: npc.x * TILE_SIZE, top: npc.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}>
                            <NPCSprite className="w-full h-full scale-90" variant={npc.variant} facing={npc.facing} />
                        </div>
                    ))}

                    {monsters.filter(m => m.scene === currentScene).map(m => (
                        <div key={m.id} className="absolute transition-all duration-300 ease-linear z-20" style={{ left: m.x * TILE_SIZE, top: m.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}>
                            <SlimeSprite className="w-full h-full" />
                            <div className="absolute -top-2 left-0 w-full h-1 bg-red-900"><div className="h-full bg-red-500" style={{ width: `${(m.hp / m.maxHp) * 100}% ` }}></div></div>
                        </div>
                    ))}

                    <div className="absolute transition-all duration-200 z-20" style={{ left: player.x * TILE_SIZE, top: player.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}>
                        <PlayerSprite
                            className={`w - full h - full scale - 110 - translate - y - 2 ${isSwinging ? 'animate-bounce' : ''} `}
                            facing={player.facing}
                            walking={walkFrame === 1}
                        />
                    </div>

                    {floatingTexts.map(ft => (
                        <div key={ft.id} className="absolute z-40 text-xs font-bold pointer-events-none whitespace-nowrap" style={{ left: ft.x * TILE_SIZE, top: ft.y * TILE_SIZE, color: ft.color, textShadow: '1px 1px 0 #000' }}>
                            {ft.text}
                        </div>
                    ))}

                    {(gameState.weather === 'RAINY' || gameState.weather === 'STORMY') && currentScene !== 'MINE' && <RainOverlay />}
                </div>
            </div>

            {/* DIALOGUE BOX */}
            {uiMode === 'DIALOGUE' && dialogue && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-96 bg-[#fff8e1] border-4 border-[#5d4037] p-4 z-50 rounded shadow-2xl">
                    <h3 className="font-bold text-[#3e2723] mb-1">{dialogue.speaker}</h3>
                    <p className="text-[#5d4037]">{dialogue.text}</p>
                    <div className="text-[10px] text-right mt-2 text-gray-500">PRESS SPACE</div>
                </div>
            )}

            {/* HOTBAR */}
            {uiMode === 'PLAYING' && (
                <div className="absolute bottom-6 z-20 bg-[#e6c697] border-4 border-[#8b5e34] p-2 flex gap-2 rounded shadow-xl">
                    {player.inventory.slice(0, 6).map((item, index) => (
                        <div
                            key={index}
                            onClick={() => setPlayer(p => ({ ...p, selectedSlot: index }))}
                            onMouseEnter={(e) => item && handleTooltipShow(item.id, e.clientX, e.clientY)}
                            onMouseLeave={handleTooltipHide}
                            onTouchStart={(e) => item && handleLongPressStart(item.id, e)}
                            onTouchEnd={handleTooltipHide}
                            className={`w - 12 h - 12 border - 2 relative cursor - pointer flex items - center justify - center bg - [#d4a373] hover: bg - [#c99056]
                    ${player.selectedSlot === index ? 'border-red-500 scale-110 shadow-lg' : 'border-[#8b5e34] opacity-80'} transition - all`}
                        >
                            {item && <ItemRenderer id={item.id} className="w-8 h-8 pointer-events-none" />}
                            {item && item.count > 1 && <span className="absolute bottom-0 right-0 text-[8px] bg-blue-600 text-white px-1 rounded-bl font-bold shadow-sm pointer-events-none">{item.count}</span>}
                            <span className="absolute top-0 left-0 text-[8px] text-black/40 px-1 pointer-events-none">{index + 1}</span>
                        </div>
                    ))}
                    <div className="ml-2 flex items-center justify-center text-[10px] text-[#5d4a2e] font-bold opacity-50">
                        PRESS 'E'
                    </div>
                </div>
            )}

            {/* TIME & SCENE INDICATOR */}
            <div className="absolute top-4 left-4 z-30 pointer-events-none">
                <h1 className="text-white font-bold text-shadow text-xl uppercase tracking-widest opacity-80">{currentScene}</h1>
                <div className="text-white font-bold text-shadow mt-1 opacity-90">
                    Day {gameState.day}, {SEASONS[gameState.seasonIdx]} | {Math.floor(gameState.time / 60)}:{(gameState.time % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-white/50 text-[10px] font-mono mt-1">
                    {BRANCH}@{COMMIT}
                </div>
            </div>

            {/* PLAYER STATS */}
            <div className="absolute top-4 right-4 z-30 bg-[#e6c697]/90 border-2 border-[#8b5e34] p-2 rounded">
                <div className="text-[#5d4a2e] text-sm font-bold">HP: {player.hp}/{player.maxHp}</div>
                <div className="text-[#5d4a2e] text-sm font-bold">Energy: {player.energy}/{player.maxEnergy}</div>
                <div className="text-[#5d4a2e] text-sm font-bold">Gold: {player.money}g</div>
            </div>

            {/* TOOLTIP */}
            {tooltip && ITEM_DB[tooltip.itemId] && (
                <div
                    className="absolute z-[9999] bg-black/90 text-white px-3 py-2 rounded pointer-events-none border border-white/20 shadow-xl"
                    style={{ left: tooltip.x + 15, top: tooltip.y - 40 }}
                >
                    <div className="font-bold text-sm text-yellow-200">{ITEM_DB[tooltip.itemId].name}</div>
                    {ITEM_DB[tooltip.itemId].description && (
                        <div className="text-xs text-gray-300 mt-1 max-w-[200px]">{ITEM_DB[tooltip.itemId].description}</div>
                    )}
                    {ITEM_DB[tooltip.itemId].edible && ITEM_DB[tooltip.itemId].energyRestore && (
                        <div className="text-xs text-green-400 mt-1">+{ITEM_DB[tooltip.itemId].energyRestore} Energy</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Game;
