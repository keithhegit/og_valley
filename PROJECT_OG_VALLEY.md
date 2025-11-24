# Og Valley: Project Documentation

## 1. Product Requirement Document (PRD)

### 1.1 Product Overview
**Og Valley** is a web-based farming RPG inspired by Stardew Valley, built with React and modern web technologies. It aims to provide an instant-play experience with no downloads, featuring farming, exploration, combat, and economic systems.

### 1.2 Core Gameplay Loop
1.  **Gather**: Use tools to collect wood, stone, and fiber.
2.  **Farm**: Till soil, plant seeds, water crops, and harvest produce.
3.  **Trade**: Ship crops for gold or buy seeds/items from shops.
4.  **Explore**: Travel between the Farm, Town, and Mines.
5.  **Combat**: Fight monsters in the mines to survive and loot.

### 1.3 Key Features
-   **Character System**: HP, Energy, Money, and Inventory management.
-   **Inventory & Storage**:
    -   24-slot backpack (expandable UI).
    -   Placeable Chests for item storage.
    -   Drag-and-drop item management.
-   **World System**:
    -   **Farm**: Main base for building and farming.
    -   **Town**: Social hub with NPCs (Mayor Lewis, Granny).
    -   **Mine**: Dangerous area with monsters (Slimes) and resources.
-   **Interaction**:
    -   Tool usage (Hoe, Watering Can, Axe, Pickaxe, Sword).
    -   Object interaction (Chests, Shipping Bin, Mailbox).
    -   NPC Dialogue system.

---

## 2. Technical Architecture

### 2.1 Tech Stack
-   **Frontend**: React 18 (Hooks + Functional Components)
-   **Build Tool**: Vite
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS + Inline Styles for dynamic positioning
-   **Icons**: Lucide React

### 2.2 Core Architecture
-   **Game Loop**: React State-driven pseudo-realtime loop. `useEffect` handles timers (monsters, floating text) while user input triggers immediate state updates.
-   **Data Model**:
    -   **ID-Driven**: All objects, items, and tiles are referenced by integer IDs defined in `ITEM_DB`.
    -   **Grid System**: `TileData[][]` represents the map.
    -   **Multi-Scene**: State holds a record of grids `Record<SceneName, TileData[][]>`.
-   **Rendering**:
    -   **Hybrid Renderer**: Uses CSS-based pixel art components (`PixelArt.tsx`) mapped from Item IDs.
    -   **Virtual DOM**: React efficiently updates only changed tiles.

### 2.3 Data Structures
**Item Database (`ITEM_DB`)**:
Static configuration mapping IDs to properties (name, type, sprite, stats).
```typescript
const ITEM_DB = {
  2: { name: 'Stone Node', type: 'obstacle', drop: 390, ... },
  130: { name: 'Chest', type: 'container', slots: 9, ... },
  // ...
}
```

**State Management**:
-   `player`: Position, stats, inventory.
-   `grids`: Map data for all scenes.
-   `containers`: Persistent storage for chests (`Scene_X_Y` keys).
-   `monsters`: Array of active entities.

---

## 3. Roadmap & Status

### ✅ Phase 1: Foundation (Completed)
-   Core Engine (Grid, Player Movement)
-   Basic Farming (Till, Water, Harvest)
-   Resource Gathering (Trees, Rocks)

### ✅ Phase 2: Economy & Data (Completed)
-   ID-based Item System (`ITEM_DB`)
-   Shipping Bin & Mailbox Shop
-   Floating Text Feedback

### ✅ Phase 3: Inventory & Storage (Completed)
-   [x] Full Backpack UI ('E' key)
-   [x] Chest System (Place/Open/Store)
-   [x] Drag & Drop Item Management
-   [x] Trash Can functionality

### ✅ Phase 4: World & Combat (Completed)
-   [x] Multi-Scene Architecture (Farm, Town, Mine)
-   [x] Warp Points (Scene transitions)
-   [x] Basic Combat (Sword vs Slimes)
-   [x] Monster AI (Simple chase)

### 🚧 Phase 5: Polish & Persistence (Next Steps)
-   [ ] **Save System**: Persist `grids`, `player`, and `containers` to `localStorage`.
-   [ ] **Audio**: Implement sound effects for actions and background music.
-   [ ] **Visuals**: Add tool animations and player walking frames.
-   [ ] **Mobile Support**: Touch controls for movement and interaction.

### 🔮 Future Phases
-   **Phase 6**: Advanced Farming (Seasons, more crops).
-   **Phase 7**: Social (NPC schedules, relationship hearts).
-   **Phase 8**: House Customization (Furniture, upgrades).
