# Dhurandhar: Shadows of Lyari - Implementation Plan

## Phases

### Phase 1: Engine Foundation [DONE]
- Game loop, state machine (main.js)
- Input manager (input.js)
- Config/constants (config.js)
- Tile-based level renderer (tilemap.js)
- AABB collision + raycasting (physics.js)
- Smooth-follow camera with shake (camera.js)
- Base entity class (entity.js)
- Canvas rendering pipeline (renderer.js)

### Phase 2: Player & Combat [DONE]
- Player controller with movement (player.js)
- Melee: light/heavy attacks, combos, parry, dodge roll (combat.js)
- Ranged: aim, fire, recoil, noise radius (combat.js)
- Weapon definitions (weapons.js)
- Sprite animation state machine (animation.js)
- Particle system with object pooling (particles.js)
- Screen shake integration

### Phase 3: Enemy AI [DONE]
- Base enemy AI with 5-state machine (enemy-base.js)
- Vision cone rendering + detection
- A* pathfinding (pathfinding.js)
- Enemy types: gangster, enforcer, gunner
- Faction awareness, coordinated alerts

### Phase 4: Identity & Suspicion [DONE]
- Dual identity system (identity.js)
- Suspicion meter with triggers/decay/thresholds (suspicion.js)
- HUD: health, suspicion, identity portrait, minimap, weapon bar (hud.js)
- Cover actions system

### Phase 5: Narrative System [DONE]
- Dialogue engine with typewriter text + choices (dialogue.js)
- Mission briefing screens (briefing.js)
- Main menu, pause menu (menu.js)
- Timed dialogue choices

### Phase 6: Levels & Chapters [PENDING]
- JSON level format + loader (level-loader.js)
- Trigger/event system
- Build chapters 1-8 with tile data, spawns, triggers, dialogues
- Territory meta-map between chapters (map.js)

### Phase 7: Bosses & Setpieces [PENDING]
- Rehman Dakait: vehicle chase + 3-phase fight
- Major Iqbal: tactical 2-phase warehouse fight
- Dawood: compound gauntlet + capture/kill choice
- Uzair Baloch: arena brawl
- Fire propagation (Ch8), wedding defense timer (Ch4)

### Phase 8: Polish [PENDING]
- Web Audio API integration (audio.js)
- Save/load system (LocalStorage)
- Scoring + grade system (S/A/B/C/D)
- Difficulty tuning
- Mobile touch controls

## Verification
- Phase 1: Player moves on tiled map with collision and camera
- Phase 2: Player fights, shoots, dodges with particles and shake
- Phase 3: Enemies patrol with vision cones, detect and chase
- Phase 4: Identity toggle + suspicion meter fully functional
- Phase 5: Full chapter playable start-to-finish
- Final: All 8 chapters, bosses, save/load, 60fps
