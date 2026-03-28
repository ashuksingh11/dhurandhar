import { CONFIG } from '../../config.js';
import { TILE, generateTestLevel } from '../../engine/tilemap.js';

// Level definitions for all 8 chapters
export const CHAPTERS = {
    1: {
        title: 'Ch.1 - The Juice Shop',
        subtitle: 'Where every stranger is a suspect',
        location: 'Lyari District, Karachi',
        dialogueFile: 'data/dialogue/chapter1.json',
        sectorReward: 'market',
        generate: () => generateChapter1(),
    },
    2: {
        title: 'Ch.2 - Blood Oath',
        subtitle: 'Earn trust or earn a grave',
        location: "Rehman's Compound, Lyari",
        dialogueFile: 'data/dialogue/chapter2.json',
        sectorReward: 'compound',
        generate: () => generateChapter2(),
    },
    3: {
        title: 'Ch.3 - Lyari Expressway',
        subtitle: 'When the streets run red',
        location: 'Lyari Gang War Zone',
        dialogueFile: 'data/dialogue/chapter3.json',
        sectorReward: 'slums',
        generate: () => generateChapter3(),
    },
    4: {
        title: 'Ch.4 - The Wedding',
        subtitle: 'A celebration becomes a battlefield',
        location: 'Wedding Hall, Karachi',
        dialogueFile: 'data/dialogue/chapter4.json',
        sectorReward: 'mosque',
        generate: () => generateTestLevel(), // placeholder
    },
    5: {
        title: 'Ch.5 - Rehman\'s Highway',
        subtitle: 'No escape from the highway of death',
        location: 'Karachi-Hyderabad Motorway',
        dialogueFile: 'data/dialogue/chapter5.json',
        sectorReward: 'highway',
        generate: () => generateTestLevel(),
    },
    6: {
        title: 'Ch.6 - The Handler',
        subtitle: 'Trust no one in the city of spies',
        location: 'Kabul, Afghanistan',
        dialogueFile: 'data/dialogue/chapter6.json',
        sectorReward: 'bridge',
        generate: () => generateTestLevel(),
    },
    7: {
        title: 'Ch.7 - Bade Sahab',
        subtitle: 'Strike at the heart of darkness',
        location: 'Mumbai Docks',
        dialogueFile: 'data/dialogue/chapter7.json',
        sectorReward: 'docks',
        generate: () => generateTestLevel(),
    },
    8: {
        title: 'Ch.8 - Dhurandhar',
        subtitle: 'The final blow',
        location: 'Oil Refinery, Karachi',
        dialogueFile: 'data/dialogue/chapter8.json',
        sectorReward: 'tower',
        generate: () => generateTestLevel(),
    },
};

// Chapter 1: Lyari streets - tutorial level
function generateChapter1() {
    const w = 50;
    const h = 40;
    const ground = new Array(w * h).fill(TILE.FLOOR_CONCRETE);
    const collision = new Array(w * h).fill(0);
    const decoration = new Array(w * h).fill(0);
    const overhead = new Array(w * h).fill(0);

    // Helper to set tile
    const set = (layer, x, y, val) => { if (x >= 0 && x < w && y >= 0 && y < h) layer[y * w + x] = val; };
    const rect = (layer, bx, by, bw, bh, val) => {
        for (let y = by; y < by + bh; y++)
            for (let x = bx; x < bx + bw; x++) set(layer, x, y, val);
    };
    const wallRect = (bx, by, bw, bh) => {
        for (let y = by; y < by + bh; y++) {
            for (let x = bx; x < bx + bw; x++) {
                if (x === bx || x === bx + bw - 1 || y === by || y === by + bh - 1) {
                    set(collision, x, y, TILE.WALL_BRICK);
                } else {
                    set(ground, x, y, TILE.FLOOR_CARPET);
                }
            }
        }
    };
    const addDoor = (x, y) => set(collision, x, y, 0);

    // Borders
    rect(collision, 0, 0, w, 1, TILE.WALL);
    rect(collision, 0, h - 1, w, 1, TILE.WALL);
    for (let y = 0; y < h; y++) { set(collision, 0, y, TILE.WALL); set(collision, w - 1, y, TILE.WALL); }

    // Main road (horizontal)
    rect(ground, 1, 18, w - 2, 3, TILE.FLOOR_ROAD);

    // Side road (vertical)
    rect(ground, 24, 1, 3, h - 2, TILE.FLOOR_ROAD);

    // Buildings - North side
    wallRect(3, 2, 8, 6);    addDoor(7, 7);   // Residential
    wallRect(13, 2, 9, 7);   addDoor(17, 8);  // Juice Shop (Aalam's)
    wallRect(29, 2, 8, 6);   addDoor(33, 7);  // Shop
    wallRect(39, 2, 8, 7);   addDoor(43, 8);  // Warehouse

    // Buildings - South side
    wallRect(3, 22, 10, 7);  addDoor(8, 22);  // Large house
    wallRect(15, 22, 7, 6);  addDoor(18, 22); // Small shop
    wallRect(28, 23, 9, 7);  addDoor(32, 23); // Compound entrance
    wallRect(40, 22, 7, 8);  addDoor(43, 22); // Garage

    // Buildings - Far south
    wallRect(5, 32, 12, 6);  addDoor(11, 32);
    wallRect(20, 33, 8, 5);  addDoor(24, 33);
    wallRect(35, 32, 10, 6); addDoor(40, 32);

    // Alleyways with cover
    const covers = [
        { x: 12, y: 10 }, { x: 12, y: 14 }, { x: 27, y: 10 },
        { x: 27, y: 14 }, { x: 38, y: 10 }, { x: 38, y: 14 },
        { x: 8, y: 30 }, { x: 18, y: 30 }, { x: 33, y: 30 },
    ];
    covers.forEach(p => set(collision, p.x, p.y, TILE.COVER_LOW));

    // Dirt patches in alleys
    for (let i = 0; i < 40; i++) {
        const x = 2 + Math.floor(Math.random() * (w - 4));
        const y = 2 + Math.floor(Math.random() * (h - 4));
        if (collision[y * w + x] === 0 && ground[y * w + x] !== TILE.FLOOR_ROAD) {
            ground[y * w + x] = TILE.FLOOR_DIRT;
        }
    }

    return {
        width: w, height: h,
        ground, collision, decoration, overhead,
        spawns: [
            { type: 'player', x: 3, y: 19 },
            // Friendly Baloch gang members (patrol streets)
            { type: 'enemy', x: 10, y: 18, subtype: 'gangster', faction: 'baloch',
              patrol: [{ x: 10, y: 18 }, { x: 20, y: 18 }] },
            { type: 'enemy', x: 30, y: 19, subtype: 'gangster', faction: 'baloch',
              patrol: [{ x: 30, y: 19 }, { x: 40, y: 19 }] },
            // Pathan gang members (hostile area)
            { type: 'enemy', x: 42, y: 5, subtype: 'gangster', faction: 'pathan',
              patrol: [{ x: 42, y: 5 }, { x: 42, y: 8 }, { x: 45, y: 8 }, { x: 45, y: 5 }] },
            { type: 'enemy', x: 38, y: 14, subtype: 'gunner', faction: 'pathan',
              patrol: [{ x: 38, y: 14 }, { x: 44, y: 14 }] },
            // Civilians
            { type: 'npc', x: 16, y: 18, subtype: 'civilian' },
            { type: 'npc', x: 25, y: 19, subtype: 'civilian' },
            { type: 'npc', x: 8, y: 12, subtype: 'civilian' },
            { type: 'npc', x: 32, y: 25, subtype: 'civilian' },
        ],
        triggers: [
            { x: 15, y: 4, w: 5, h: 3, event: 'meet_aalam', once: true },
            { x: 46, y: 37, w: 3, h: 2, event: 'level_end' },
        ]
    };
}

// Chapter 2: Rehman's Compound - infiltration
function generateChapter2() {
    const w = 45;
    const h = 45;
    const ground = new Array(w * h).fill(TILE.FLOOR_DIRT);
    const collision = new Array(w * h).fill(0);
    const decoration = new Array(w * h).fill(0);
    const overhead = new Array(w * h).fill(0);

    const set = (layer, x, y, val) => { if (x >= 0 && x < w && y >= 0 && y < h) layer[y * w + x] = val; };
    const rect = (layer, bx, by, bw, bh, val) => {
        for (let y = by; y < by + bh; y++)
            for (let x = bx; x < bx + bw; x++) set(layer, x, y, val);
    };
    const wallRect = (bx, by, bw, bh) => {
        for (let y = by; y < by + bh; y++) {
            for (let x = bx; x < bx + bw; x++) {
                if (x === bx || x === bx + bw - 1 || y === by || y === by + bh - 1) {
                    set(collision, x, y, TILE.WALL_METAL);
                } else {
                    set(ground, x, y, TILE.FLOOR_CONCRETE);
                }
            }
        }
    };
    const addDoor = (x, y) => set(collision, x, y, 0);

    // Compound walls
    rect(collision, 0, 0, w, 1, TILE.WALL_METAL);
    rect(collision, 0, h - 1, w, 1, TILE.WALL_METAL);
    for (let y = 0; y < h; y++) { set(collision, 0, y, TILE.WALL_METAL); set(collision, w - 1, y, TILE.WALL_METAL); }

    // Compound entrance (south)
    set(collision, 22, h - 1, 0);
    set(collision, 23, h - 1, 0);

    // Central courtyard (concrete)
    rect(ground, 15, 15, 15, 15, TILE.FLOOR_CONCRETE);

    // Cage fight arena (center)
    rect(ground, 18, 18, 9, 9, TILE.FLOOR_ROAD);
    for (let x = 18; x < 27; x++) { set(collision, x, 18, TILE.COVER_LOW); set(collision, x, 26, TILE.COVER_LOW); }
    for (let y = 18; y < 27; y++) { set(collision, 18, y, TILE.COVER_LOW); set(collision, 26, y, TILE.COVER_LOW); }
    // Arena doors
    addDoor(22, 18); addDoor(22, 26);

    // Rehman's office (north, guarded)
    wallRect(16, 2, 13, 8); addDoor(22, 9);
    set(ground, 22, 4, TILE.FLOOR_CARPET); // Rehman's chair

    // Guard barracks (east)
    wallRect(33, 10, 10, 8); addDoor(33, 14);

    // Armory (west)
    wallRect(2, 10, 10, 8); addDoor(11, 14);

    // Storage rooms
    wallRect(2, 25, 8, 6); addDoor(9, 28);
    wallRect(35, 25, 8, 6); addDoor(35, 28);

    // Cover objects
    const covers = [
        { x: 14, y: 12 }, { x: 30, y: 12 }, { x: 14, y: 30 }, { x: 30, y: 30 },
        { x: 22, y: 12 }, { x: 22, y: 32 },
    ];
    covers.forEach(p => set(collision, p.x, p.y, TILE.COVER_LOW));

    return {
        width: w, height: h,
        ground, collision, decoration, overhead,
        spawns: [
            { type: 'player', x: 22, y: h - 3 },
            // Compound guards
            { type: 'enemy', x: 20, y: 10, subtype: 'gangster', faction: 'baloch',
              patrol: [{ x: 20, y: 10 }, { x: 24, y: 10 }] },
            { type: 'enemy', x: 18, y: 5, subtype: 'enforcer', faction: 'baloch',
              patrol: [{ x: 18, y: 5 }, { x: 26, y: 5 }] },
            { type: 'enemy', x: 36, y: 12, subtype: 'gunner', faction: 'baloch',
              patrol: [{ x: 36, y: 12 }, { x: 40, y: 12 }, { x: 40, y: 16 }, { x: 36, y: 16 }] },
            { type: 'enemy', x: 5, y: 12, subtype: 'gangster', faction: 'baloch',
              patrol: [{ x: 5, y: 12 }, { x: 5, y: 16 }] },
            { type: 'enemy', x: 10, y: 20, subtype: 'gangster', faction: 'baloch',
              patrol: [{ x: 10, y: 20 }, { x: 14, y: 20 }, { x: 14, y: 30 }, { x: 10, y: 30 }] },
            { type: 'enemy', x: 34, y: 20, subtype: 'gangster', faction: 'baloch',
              patrol: [{ x: 34, y: 20 }, { x: 34, y: 30 }, { x: 38, y: 30 }, { x: 38, y: 20 }] },
        ],
        triggers: [
            { x: 20, y: 3, w: 5, h: 4, event: 'rehman_office', once: true },
            { x: 19, y: 19, w: 7, h: 7, event: 'cage_fight', once: true },
            { x: 4, y: 12, w: 6, h: 4, event: 'plant_device', once: true },
        ]
    };
}

// Chapter 3: Gang war zone
function generateChapter3() {
    const w = 60;
    const h = 40;
    const ground = new Array(w * h).fill(TILE.FLOOR_ROAD);
    const collision = new Array(w * h).fill(0);
    const decoration = new Array(w * h).fill(0);
    const overhead = new Array(w * h).fill(0);

    const set = (layer, x, y, val) => { if (x >= 0 && x < w && y >= 0 && y < h) layer[y * w + x] = val; };
    const rect = (layer, bx, by, bw, bh, val) => {
        for (let y = by; y < by + bh; y++)
            for (let x = bx; x < bx + bw; x++) set(layer, x, y, val);
    };
    const wallRect = (bx, by, bw, bh) => {
        for (let y = by; y < by + bh; y++) {
            for (let x = bx; x < bx + bw; x++) {
                if (x === bx || x === bx + bw - 1 || y === by || y === by + bh - 1) {
                    set(collision, x, y, TILE.WALL_BRICK);
                }
            }
        }
    };

    // Borders
    rect(collision, 0, 0, w, 1, TILE.WALL);
    rect(collision, 0, h - 1, w, 1, TILE.WALL);
    for (let y = 0; y < h; y++) { set(collision, 0, y, TILE.WALL); set(collision, w - 1, y, TILE.WALL); }

    // Destroyed buildings (war zone)
    const ruins = [
        { x: 5, y: 3, w: 8, h: 6 },   { x: 18, y: 2, w: 10, h: 7 },
        { x: 35, y: 3, w: 7, h: 5 },   { x: 48, y: 2, w: 9, h: 6 },
        { x: 3, y: 25, w: 12, h: 8 },  { x: 20, y: 26, w: 8, h: 7 },
        { x: 35, y: 25, w: 10, h: 8 }, { x: 50, y: 26, w: 7, h: 7 },
    ];
    ruins.forEach(b => {
        wallRect(b.x, b.y, b.w, b.h);
        // Random gaps (battle damage)
        for (let i = 0; i < 3; i++) {
            const side = Math.floor(Math.random() * 4);
            let gx, gy;
            if (side === 0) { gx = b.x + 1 + Math.floor(Math.random() * (b.w - 2)); gy = b.y; }
            else if (side === 1) { gx = b.x + 1 + Math.floor(Math.random() * (b.w - 2)); gy = b.y + b.h - 1; }
            else if (side === 2) { gx = b.x; gy = b.y + 1 + Math.floor(Math.random() * (b.h - 2)); }
            else { gx = b.x + b.w - 1; gy = b.y + 1 + Math.floor(Math.random() * (b.h - 2)); }
            set(collision, gx, gy, 0);
        }
    });

    // Barricades and cover scattered across roads
    for (let i = 0; i < 25; i++) {
        const x = 2 + Math.floor(Math.random() * (w - 4));
        const y = 10 + Math.floor(Math.random() * 15);
        if (collision[y * w + x] === 0) set(collision, x, y, TILE.COVER_LOW);
    }

    // Dirt and debris
    for (let i = 0; i < 80; i++) {
        const x = 1 + Math.floor(Math.random() * (w - 2));
        const y = 1 + Math.floor(Math.random() * (h - 2));
        if (collision[y * w + x] === 0) ground[y * w + x] = TILE.FLOOR_DIRT;
    }

    return {
        width: w, height: h,
        ground, collision, decoration, overhead,
        spawns: [
            { type: 'player', x: 2, y: 20 },
            // Baloch fighters (south side)
            ...Array.from({ length: 6 }, (_, i) => ({
                type: 'enemy', x: 5 + i * 8, y: 28 + Math.floor(Math.random() * 5),
                subtype: i % 3 === 0 ? 'gunner' : 'gangster', faction: 'baloch',
                patrol: [{ x: 5 + i * 8, y: 28 }, { x: 5 + i * 8, y: 18 }]
            })),
            // Pathan fighters (north side)
            ...Array.from({ length: 6 }, (_, i) => ({
                type: 'enemy', x: 8 + i * 8, y: 5 + Math.floor(Math.random() * 5),
                subtype: i % 3 === 0 ? 'gunner' : 'gangster', faction: 'pathan',
                patrol: [{ x: 8 + i * 8, y: 5 }, { x: 8 + i * 8, y: 15 }]
            })),
            // SSP Chaudhary (ally to escort)
            { type: 'npc', x: 55, y: 20, subtype: 'ally' },
        ],
        triggers: [
            { x: 50, y: 18, w: 5, h: 5, event: 'find_chaudhary', once: true },
            { x: 1, y: 18, w: 2, h: 5, event: 'level_end' },
        ]
    };
}

export function loadChapter(chapterNum) {
    const chapter = CHAPTERS[chapterNum];
    if (!chapter) return null;
    return {
        ...chapter,
        levelData: chapter.generate(),
    };
}
