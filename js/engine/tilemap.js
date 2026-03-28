import { CONFIG } from '../config.js';

// Tile types
export const TILE = {
    EMPTY: 0,
    FLOOR_CONCRETE: 1,
    FLOOR_DIRT: 2,
    FLOOR_CARPET: 3,
    FLOOR_ROAD: 4,
    WALL: 10,
    WALL_BRICK: 11,
    WALL_METAL: 12,
    COVER_LOW: 20, // half-height, can shoot over
    DESTRUCTIBLE: 30,
    DOOR: 40,
    DOOR_LOCKED: 41,
    TRIGGER: 50,
    SPAWN_PLAYER: 60,
    SPAWN_ENEMY: 61,
    SPAWN_NPC: 62,
};

// Tile colors for rendering (until we have sprites)
const TILE_COLORS = {
    [TILE.EMPTY]: '#0e0e1a',
    [TILE.FLOOR_CONCRETE]: '#4a4a5a',
    [TILE.FLOOR_DIRT]: '#6b5b45',
    [TILE.FLOOR_CARPET]: '#5a3a3a',
    [TILE.FLOOR_ROAD]: '#3a3a4a',
    [TILE.WALL]: '#2a2a3e',
    [TILE.WALL_BRICK]: '#6b4040',
    [TILE.WALL_METAL]: '#5a5a6e',
    [TILE.COVER_LOW]: '#4a4a3a',
    [TILE.DESTRUCTIBLE]: '#5a4a3a',
    [TILE.DOOR]: '#7a6a4a',
    [TILE.DOOR_LOCKED]: '#8a5a3a',
};

export class TileMap {
    constructor() {
        this.width = 0;
        this.height = 0;
        this.ground = [];
        this.collision = [];
        this.decoration = [];
        this.overhead = [];
        this.triggers = [];
        this.spawns = [];
    }

    loadFromData(data) {
        this.width = data.width;
        this.height = data.height;
        this.ground = data.ground || [];
        this.collision = data.collision || [];
        this.decoration = data.decoration || [];
        this.overhead = data.overhead || [];
        this.triggers = data.triggers || [];
        this.spawns = data.spawns || [];
    }

    getTile(layer, tx, ty) {
        if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return TILE.WALL;
        return layer[ty * this.width + tx] || TILE.EMPTY;
    }

    isCollision(tx, ty) {
        if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return true;
        const tile = this.collision[ty * this.width + tx] || 0;
        return tile === TILE.WALL || tile === TILE.WALL_BRICK || tile === TILE.WALL_METAL;
    }

    isCover(tx, ty) {
        if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return false;
        const tile = this.collision[ty * this.width + tx] || 0;
        return tile === TILE.COVER_LOW;
    }

    getSpawns(type) {
        return this.spawns.filter(s => s.type === type);
    }

    // Draw ground and collision layers
    drawGround(ctx, camera) {
        const ts = CONFIG.TILE_SIZE;
        const startCol = Math.max(0, Math.floor(camera.x / ts));
        const startRow = Math.max(0, Math.floor(camera.y / ts));
        const endCol = Math.min(this.width, Math.ceil((camera.x + camera.viewW) / ts));
        const endRow = Math.min(this.height, Math.ceil((camera.y + camera.viewH) / ts));

        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                const groundTile = this.getTile(this.ground, col, row);
                const collTile = this.getTile(this.collision, col, row);
                const sx = Math.floor(col * ts - camera.x);
                const sy = Math.floor(row * ts - camera.y);

                // Draw ground
                const gColor = TILE_COLORS[groundTile] || TILE_COLORS[TILE.EMPTY];
                ctx.fillStyle = gColor;
                ctx.fillRect(sx, sy, ts, ts);

                // Draw grid lines (subtle)
                ctx.strokeStyle = 'rgba(255,255,255,0.03)';
                ctx.strokeRect(sx, sy, ts, ts);

                // Draw collision tiles on top
                if (collTile >= TILE.WALL && collTile <= TILE.WALL_METAL) {
                    ctx.fillStyle = TILE_COLORS[collTile] || TILE_COLORS[TILE.WALL];
                    ctx.fillRect(sx, sy, ts, ts);

                    // Wall top highlight
                    ctx.fillStyle = 'rgba(255,255,255,0.08)';
                    ctx.fillRect(sx, sy, ts, 3);
                }

                // Draw cover
                if (collTile === TILE.COVER_LOW) {
                    ctx.fillStyle = TILE_COLORS[TILE.COVER_LOW];
                    ctx.fillRect(sx, sy + ts / 2, ts, ts / 2);
                    ctx.fillStyle = 'rgba(255,255,255,0.1)';
                    ctx.fillRect(sx, sy + ts / 2, ts, 2);
                }

                // Draw decoration
                const decoTile = this.getTile(this.decoration, col, row);
                if (decoTile) {
                    const dColor = TILE_COLORS[decoTile] || '#555';
                    ctx.fillStyle = dColor;
                    ctx.fillRect(sx + 4, sy + 4, ts - 8, ts - 8);
                }
            }
        }
    }

    // Draw overhead layer (rooftops, awnings - semi-transparent if player nearby)
    drawOverhead(ctx, camera, playerX, playerY) {
        const ts = CONFIG.TILE_SIZE;
        const startCol = Math.max(0, Math.floor(camera.x / ts));
        const startRow = Math.max(0, Math.floor(camera.y / ts));
        const endCol = Math.min(this.width, Math.ceil((camera.x + camera.viewW) / ts));
        const endRow = Math.min(this.height, Math.ceil((camera.y + camera.viewH) / ts));

        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                const tile = this.getTile(this.overhead, col, row);
                if (!tile) continue;

                const sx = Math.floor(col * ts - camera.x);
                const sy = Math.floor(row * ts - camera.y);

                // Check if player is nearby - make semi-transparent
                const dx = col * ts + ts / 2 - playerX;
                const dy = row * ts + ts / 2 - playerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const alpha = dist < ts * 3 ? 0.3 : 0.9;

                ctx.globalAlpha = alpha;
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(sx, sy, ts, ts);
                ctx.globalAlpha = 1;
            }
        }
    }
}

// Generate a simple test level
export function generateTestLevel() {
    const w = 40;
    const h = 30;
    const ground = new Array(w * h).fill(TILE.FLOOR_CONCRETE);
    const collision = new Array(w * h).fill(0);
    const decoration = new Array(w * h).fill(0);
    const overhead = new Array(w * h).fill(0);

    // Borders
    for (let x = 0; x < w; x++) {
        collision[0 * w + x] = TILE.WALL_BRICK;
        collision[(h - 1) * w + x] = TILE.WALL_BRICK;
    }
    for (let y = 0; y < h; y++) {
        collision[y * w + 0] = TILE.WALL_BRICK;
        collision[y * w + (w - 1)] = TILE.WALL_BRICK;
    }

    // Lyari-style buildings (rooms)
    const buildings = [
        { x: 5, y: 3, w: 6, h: 5 },
        { x: 15, y: 2, w: 8, h: 6 },
        { x: 28, y: 3, w: 7, h: 5 },
        { x: 5, y: 14, w: 5, h: 7 },
        { x: 14, y: 12, w: 10, h: 8 },
        { x: 30, y: 14, w: 6, h: 6 },
        { x: 6, y: 24, w: 8, h: 4 },
        { x: 20, y: 22, w: 7, h: 6 },
    ];

    buildings.forEach(b => {
        for (let y = b.y; y < b.y + b.h; y++) {
            for (let x = b.x; x < b.x + b.w; x++) {
                if (x === b.x || x === b.x + b.w - 1 || y === b.y || y === b.y + b.h - 1) {
                    collision[y * w + x] = TILE.WALL_BRICK;
                } else {
                    ground[y * w + x] = TILE.FLOOR_CARPET;
                }
            }
        }
        // Door (gap in bottom wall)
        const doorX = b.x + Math.floor(b.w / 2);
        collision[(b.y + b.h - 1) * w + doorX] = 0;
    });

    // Roads (horizontal and vertical)
    for (let x = 1; x < w - 1; x++) {
        for (let r = 10; r <= 11; r++) {
            if (collision[r * w + x] === 0) ground[r * w + x] = TILE.FLOOR_ROAD;
        }
    }
    for (let y = 1; y < h - 1; y++) {
        for (let c = 12; c <= 13; c++) {
            if (collision[y * w + c] === 0) ground[y * w + c] = TILE.FLOOR_ROAD;
        }
    }

    // Dirt patches
    for (let i = 0; i < 30; i++) {
        const x = 2 + Math.floor(Math.random() * (w - 4));
        const y = 2 + Math.floor(Math.random() * (h - 4));
        if (collision[y * w + x] === 0) ground[y * w + x] = TILE.FLOOR_DIRT;
    }

    // Cover objects (crates, barrels)
    const coverPositions = [
        { x: 3, y: 10 }, { x: 26, y: 10 }, { x: 12, y: 6 },
        { x: 20, y: 20 }, { x: 8, y: 22 }, { x: 35, y: 10 },
    ];
    coverPositions.forEach(p => {
        if (collision[p.y * w + p.x] === 0) collision[p.y * w + p.x] = TILE.COVER_LOW;
    });

    return {
        width: w,
        height: h,
        ground,
        collision,
        decoration,
        overhead,
        spawns: [
            { type: 'player', x: 2, y: 2 },
            { type: 'enemy', x: 20, y: 5, subtype: 'gangster', faction: 'baloch',
              patrol: [{ x: 20, y: 5 }, { x: 25, y: 5 }, { x: 25, y: 9 }, { x: 20, y: 9 }] },
            { type: 'enemy', x: 10, y: 15, subtype: 'gangster', faction: 'baloch',
              patrol: [{ x: 10, y: 15 }, { x: 10, y: 20 }] },
            { type: 'enemy', x: 32, y: 8, subtype: 'gunner', faction: 'pathan',
              patrol: [{ x: 32, y: 8 }, { x: 36, y: 8 }, { x: 36, y: 12 }, { x: 32, y: 12 }] },
            { type: 'enemy', x: 25, y: 18, subtype: 'enforcer', faction: 'baloch',
              patrol: [{ x: 25, y: 18 }, { x: 25, y: 24 }] },
            { type: 'npc', x: 18, y: 10, subtype: 'civilian' },
            { type: 'npc', x: 8, y: 11, subtype: 'civilian' },
        ],
        triggers: [
            { x: 37, y: 1, w: 2, h: 2, event: 'level_end' },
        ]
    };
}
