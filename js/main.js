import { CONFIG } from './config.js';
import { Input } from './input.js';
import { Renderer } from './renderer.js';
import { Camera } from './engine/camera.js';
import { TileMap, generateTestLevel } from './engine/tilemap.js';
import { Physics } from './engine/physics.js';
import { ParticleSystem } from './engine/particles.js';
import { Player } from './game/player.js';
import { EnemyBase } from './game/enemies/enemy-base.js';
import { HUD } from './ui/hud.js';
import { Menu } from './ui/menu.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.input = new Input(this.canvas);
        this.camera = new Camera(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        this.tilemap = new TileMap();
        this.physics = new Physics(this.tilemap);
        this.particles = new ParticleSystem();
        this.hud = new HUD();
        this.menu = new Menu();

        this.state = CONFIG.STATES.MENU;
        this.player = null;
        this.entities = [];
        this.chapterTitle = 'Ch.1 - The Juice Shop';

        this.lastTime = 0;
        this.running = true;

        // Start
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    loop(timestamp) {
        if (!this.running) return;

        const rawDt = timestamp - this.lastTime;
        this.lastTime = timestamp;
        const dt = Math.min(rawDt, CONFIG.MAX_DELTA) / 1000; // seconds

        this.input.update();

        switch (this.state) {
            case CONFIG.STATES.MENU:
                this.updateMenu(dt);
                break;
            case CONFIG.STATES.PLAY:
                this.updatePlay(dt);
                break;
            case CONFIG.STATES.PAUSED:
                this.updatePaused(dt);
                break;
            case CONFIG.STATES.GAMEOVER:
                this.updateGameOver(dt);
                break;
        }

        requestAnimationFrame(this.loop);
    }

    updateMenu(dt) {
        const action = this.menu.update(this.input);
        if (action === 'new_game' || action === 'continue') {
            this.startGame();
        }
        this.menu.draw(this.renderer.ctx);
    }

    updatePlay(dt) {
        // Pause
        if (this.input.justPressed(CONFIG.KEYS.PAUSE)) {
            this.state = CONFIG.STATES.PAUSED;
            return;
        }

        // Update world mouse position
        this.input.updateWorldMouse(this.camera);

        // Update player
        this.player.update(dt, this);

        // Update enemies
        for (const e of this.entities) {
            if (e !== this.player && e.active) {
                e.update(dt, this);
            }
        }

        // Update particles
        this.particles.update(dt);

        // Update camera
        this.camera.follow(this.player, this.input.mouse.x, this.input.mouse.y);
        this.camera.update(dt);
        this.camera.clamp(this.tilemap.width, this.tilemap.height);

        // Suspicion decay in safe areas
        if (this.player.suspicion > 0) {
            this.player.suspicion = Math.max(0, this.player.suspicion - CONFIG.SUSPICION_DECAY_RATE * dt);
        }

        // Check player death
        if (!this.player.alive) {
            this.state = CONFIG.STATES.GAMEOVER;
            return;
        }

        // Render
        this.renderer.clear();
        this.renderer.drawGame(
            { renderX: this.camera.renderX, renderY: this.camera.renderY,
              viewW: this.camera.viewW, viewH: this.camera.viewH,
              isVisible: this.camera.isVisible.bind(this.camera) },
            this.tilemap,
            this.entities,
            this.particles,
            this.player,
            this.hud,
            this
        );
    }

    updatePaused(dt) {
        if (this.input.justPressed(CONFIG.KEYS.PAUSE)) {
            this.state = CONFIG.STATES.PLAY;
            return;
        }

        // Draw game frozen
        this.renderer.clear();
        this.renderer.drawGame(
            { renderX: this.camera.renderX, renderY: this.camera.renderY,
              viewW: this.camera.viewW, viewH: this.camera.viewH,
              isVisible: this.camera.isVisible.bind(this.camera) },
            this.tilemap,
            this.entities,
            this.particles,
            this.player,
            this.hud,
            this
        );

        // Pause overlay
        const ctx = this.renderer.ctx;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        ctx.textAlign = 'center';
        ctx.fillStyle = CONFIG.COLOR_SAFFRON;
        ctx.font = 'bold 36px monospace';
        ctx.fillText('PAUSED', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 20);

        ctx.fillStyle = '#888';
        ctx.font = '14px monospace';
        ctx.fillText('Press ESC to resume', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 20);
        ctx.textAlign = 'left';
    }

    updateGameOver(dt) {
        const ctx = this.renderer.ctx;
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        ctx.textAlign = 'center';
        ctx.fillStyle = CONFIG.COLOR_DANGER;
        ctx.font = 'bold 36px monospace';
        ctx.fillText('MISSION FAILED', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 40);

        ctx.fillStyle = '#888';
        ctx.font = '14px monospace';
        ctx.fillText('Your cover has been permanently compromised.', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);

        ctx.fillStyle = CONFIG.COLOR_SAFFRON;
        ctx.font = '16px monospace';
        ctx.fillText('Press ENTER to restart', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 40);
        ctx.textAlign = 'left';

        if (this.input.justPressed('Enter') || this.input.justPressed('Space')) {
            this.startGame();
        }
    }

    startGame() {
        // Load test level
        const levelData = generateTestLevel();
        this.tilemap.loadFromData(levelData);
        this.physics = new Physics(this.tilemap);

        // Spawn player
        const playerSpawn = levelData.spawns.find(s => s.type === 'player');
        const ts = CONFIG.TILE_SIZE;
        this.player = new Player(
            playerSpawn.x * ts + ts / 4,
            playerSpawn.y * ts + ts / 4
        );

        // Spawn entities
        this.entities = [this.player];

        for (const spawn of levelData.spawns) {
            if (spawn.type === 'enemy') {
                const factionColors = {
                    baloch: '#cc5555',
                    pathan: '#55aa55',
                    isi: '#5555cc',
                };
                const config = {
                    faction: spawn.faction || 'baloch',
                    color: factionColors[spawn.faction] || '#cc5555',
                    patrol: spawn.patrol || [],
                    hp: spawn.subtype === 'enforcer' ? 80 : spawn.subtype === 'gunner' ? 40 : 30,
                    speed: spawn.subtype === 'enforcer' ? 60 : 80,
                    damage: spawn.subtype === 'enforcer' ? 18 : 10,
                    visionRange: spawn.subtype === 'gunner' ? 256 : CONFIG.ENEMY_VISION_RANGE,
                };
                const enemy = new EnemyBase(
                    spawn.x * ts + ts / 4,
                    spawn.y * ts + ts / 4,
                    config
                );
                this.entities.push(enemy);
            } else if (spawn.type === 'npc') {
                // Simple civilian NPC (passive entity)
                const npc = new EnemyBase(
                    spawn.x * ts + ts / 4,
                    spawn.y * ts + ts / 4,
                    { faction: CONFIG.FACTIONS.NEUTRAL, color: '#aa9977', hp: 10, speed: 30, patrol: [] }
                );
                npc.visionRange = 0; // civilians don't detect
                this.entities.push(npc);
            }
        }

        this.chapterTitle = 'Ch.1 - The Juice Shop';
        this.state = CONFIG.STATES.PLAY;
        this.hud.notify('Operation Dhurandhar begins...', 3000);
        this.hud.notify('Navigate the streets of Lyari', 4000);
    }
}

// Boot
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
