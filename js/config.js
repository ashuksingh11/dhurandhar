// Game configuration and constants
export const CONFIG = {
    // Display
    CANVAS_WIDTH: 960,
    CANVAS_HEIGHT: 640,
    TILE_SIZE: 32,
    PIXEL_SCALE: 1,

    // Physics
    MAX_DELTA: 33, // ms cap to prevent spiral of death
    GRAVITY: 0,

    // Player
    PLAYER_SPEED: 150, // pixels/sec
    PLAYER_SPRINT_SPEED: 220,
    PLAYER_DODGE_SPEED: 350,
    PLAYER_DODGE_DURATION: 250, // ms
    PLAYER_DODGE_COOLDOWN: 500, // ms
    PLAYER_HP: 100,
    PLAYER_HP_REGEN: 2, // per sec, out of combat
    PLAYER_REGEN_DELAY: 3000, // ms after last hit

    // Combat
    MELEE_RANGE: 40,
    MELEE_LIGHT_DAMAGE: 8,
    MELEE_HEAVY_DAMAGE: 20,
    MELEE_HEAVY_CHARGE: 400, // ms
    PARRY_WINDOW: 200, // ms
    COMBO_WINDOW: 400, // ms
    TAKEDOWN_RANGE: 48,

    // Suspicion
    SUSPICION_MAX: 100,
    SUSPICION_DECAY_RATE: 2, // per sec in safe areas
    SUSPICION_HOSTILE_THRESHOLD: 50,
    SUSPICION_TEST_THRESHOLD: 75,
    SUSPICION_BLOWN_THRESHOLD: 100,
    SUSPICION_KILL_ALLY: 25,
    SUSPICION_RESTRICTED_AREA: 0.5, // per sec
    SUSPICION_SPY_SPOTTED: 15,
    SUSPICION_CIVILIAN_KILL: 15,
    SUSPICION_COVER_ACTION: -10,
    SUSPICION_DISGUISE_KIT: -20,

    // Enemy AI
    ENEMY_VISION_RANGE: 192, // 6 tiles
    ENEMY_VISION_ANGLE: 60, // degrees
    ENEMY_PERIPHERAL_RANGE: 96, // 3 tiles
    ENEMY_PERIPHERAL_ANGLE: 120,
    ENEMY_CURIOUS_TIME: 4000, // ms
    ENEMY_SEARCH_TIME: 10000,
    ENEMY_ALERT_RADIUS: 256, // 8 tiles
    ENEMY_PATH_RECALC: 500, // ms

    // Camera
    CAMERA_LERP: 0.08,
    CAMERA_LOOK_AHEAD: 64, // pixels
    CAMERA_SHAKE_DECAY: 0.9,

    // Particles
    PARTICLE_POOL_SIZE: 500,

    // Colors
    COLOR_BG: '#1a1a2e',
    COLOR_BG_DARK: '#16213e',
    COLOR_SAFFRON: '#ff9933',
    COLOR_BLOOD: '#8b0000',
    COLOR_DANGER: '#dc143c',
    COLOR_SUSPICION_LOW: '#ffbf00',
    COLOR_SUSPICION_HIGH: '#dc143c',
    COLOR_TEXT: '#e0e0e0',
    COLOR_LYARI_BROWN: '#8b7355',
    COLOR_CONCRETE: '#696969',
    COLOR_LYARI_BLUE: '#2c3e50',

    // Keybindings
    KEYS: {
        UP: 'KeyW',
        DOWN: 'KeyS',
        LEFT: 'KeyA',
        RIGHT: 'KeyD',
        DODGE: 'Space',
        INTERACT: 'KeyE',
        IDENTITY_TOGGLE: 'Tab',
        WEAPON_1: 'Digit1',
        WEAPON_2: 'Digit2',
        WEAPON_3: 'Digit3',
        WEAPON_4: 'Digit4',
        PAUSE: 'Escape',
        RELOAD: 'KeyR',
        SPRINT: 'ShiftLeft',
    },

    // Game states
    STATES: {
        BOOT: 'BOOT',
        MENU: 'MENU',
        BRIEFING: 'BRIEFING',
        PLAY: 'PLAY',
        DIALOGUE: 'DIALOGUE',
        PAUSED: 'PAUSED',
        GAMEOVER: 'GAMEOVER',
        RESULTS: 'RESULTS',
    },

    // Entity factions
    FACTIONS: {
        PLAYER: 'player',
        BALOCH: 'baloch',
        PATHAN: 'pathan',
        ISI: 'isi',
        NEUTRAL: 'neutral',
    },
};
