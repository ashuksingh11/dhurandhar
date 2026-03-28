# Dhurandhar: Shadows of Lyari

Top-down stealth-action browser game based on the Dhurandhar movie duology. Pure HTML5/Canvas/JS, no frameworks.

## Quick Start
Open `index.html` in a browser. No build step needed.

## Architecture
- `js/engine/` - Core engine (entity, physics, tilemap, camera, particles, pathfinding)
- `js/game/` - Game logic (player, combat, identity, suspicion, enemies, bosses, levels)
- `js/ui/` - HUD, menus, dialogue, briefings
- `data/` - JSON level/dialogue/config data
- `assets/` - Sprites, tiles, audio

## Key Mechanics
- Dual identity (Hamza/Jaskirat) toggled with TAB
- Suspicion meter 0-100% affects NPC behavior
- 8 chapters, 4 boss fights

## Conventions
- 32x32 pixel tiles
- Entity system with Y-sort rendering
- All game state flows through main.js state machine
- Levels defined as JSON in data/levels/
