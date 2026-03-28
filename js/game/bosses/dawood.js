import { Entity } from '../../engine/entity.js';
import { CONFIG } from '../../config.js';
import { PARTICLES } from '../../engine/particles.js';

// Boss: Dawood's Compound (Ch8) - Final boss
// 3-floor gauntlet, then Dawood who uses traps and deploys bodyguards
// Final choice: capture alive (stealth) or eliminate (action)
export class Dawood extends Entity {
    constructor(x, y) {
        super(x, y, 24, 24);
        this.color = '#8B4513';
        this.faction = CONFIG.FACTIONS.BALOCH;
        this.hp = 150;
        this.maxHp = 150;
        this.speed = 60; // Dawood doesn't fight directly

        this.phase = 'traps'; // 'traps' | 'bodyguards' | 'escape' | 'final_choice'
        this.phaseTimer = 0;
        this.trapCooldown = 0;
        this.escapeProgress = 0;
        this.bodyguardsDeployed = 0;
        this.maxBodyguards = 6;
        this.isEscaping = false;
        this.escaped = false;
        this.captured = false;
        this.eliminated = false;

        // Traps
        this.traps = [];
        this.trapTypes = ['mine', 'gas', 'turret'];

        // Fire system (Ch8 mechanic)
        this.fireTiles = new Set();
        this.fireSpreadTimer = 0;
    }

    update(dt, game) {
        if (!this.alive || this.captured || this.eliminated) return;

        this.phaseTimer += dt * 1000;
        this.trapCooldown -= dt * 1000;
        this.fireSpreadTimer += dt * 1000;

        // Update traps
        this.traps = this.traps.filter(trap => {
            trap.timer -= dt * 1000;
            if (trap.timer <= 0 && !trap.triggered) {
                trap.triggered = true;
                this.triggerTrap(trap, game);
            }
            return trap.timer > -1000; // keep briefly after trigger for visual
        });

        // Fire spread
        if (this.fireSpreadTimer > 2000) {
            this.spreadFire(game);
            this.fireSpreadTimer = 0;
        }

        switch (this.phase) {
            case 'traps':
                this.updateTraps(dt, game);
                break;
            case 'bodyguards':
                this.updateBodyguards(dt, game);
                break;
            case 'escape':
                this.updateEscape(dt, game);
                break;
        }

        game.physics.moveEntity(this, dt);
    }

    updateTraps(dt, game) {
        const player = game.player;

        // Stay away from player
        const dist = this.distanceTo(player);
        if (dist < 200) {
            const awayAngle = this.angleTo(player) + Math.PI;
            this.vel.x = Math.cos(awayAngle) * this.speed;
            this.vel.y = Math.sin(awayAngle) * this.speed;
        } else {
            this.vel.x = 0;
            this.vel.y = 0;
        }

        // Deploy traps
        if (this.trapCooldown <= 0) {
            this.deployTrap(game);
            this.trapCooldown = 2000;
        }

        // Transition at 70% HP
        if (this.hp < this.maxHp * 0.7) {
            this.phase = 'bodyguards';
            this.phaseTimer = 0;
            if (game.hud) game.hud.notify('Dawood deploys bodyguards!', 2000);
        }
    }

    updateBodyguards(dt, game) {
        const player = game.player;

        // Keep running away
        const dist = this.distanceTo(player);
        if (dist < 250) {
            const awayAngle = this.angleTo(player) + Math.PI;
            this.vel.x = Math.cos(awayAngle) * this.speed;
            this.vel.y = Math.sin(awayAngle) * this.speed;
        }

        // Still deploy traps but less frequently
        if (this.trapCooldown <= 0) {
            this.deployTrap(game);
            this.trapCooldown = 3000;
        }

        // Request bodyguards periodically
        if (this.phaseTimer > 3000 && this.bodyguardsDeployed < this.maxBodyguards) {
            this.requestBodyguard = true;
            this.bodyguardsDeployed++;
            this.phaseTimer = 0;
        }

        // Transition at 30% HP
        if (this.hp < this.maxHp * 0.3) {
            this.phase = 'escape';
            this.phaseTimer = 0;
            this.isEscaping = true;
            if (game.hud) game.hud.notify('Dawood is trying to escape! Stop him!', 3000);
        }
    }

    updateEscape(dt, game) {
        // Dawood runs toward exit
        this.escapeProgress += dt * 5; // percentage per second

        // Move toward map edge
        const exitX = game.tilemap.width * CONFIG.TILE_SIZE - 64;
        const exitY = game.tilemap.height * CONFIG.TILE_SIZE / 2;

        const dx = exitX - this.centerX;
        const dy = exitY - this.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 8) {
            this.vel.x = (dx / dist) * this.speed * 1.5;
            this.vel.y = (dy / dist) * this.speed * 1.5;
        }

        if (this.escapeProgress >= 100 || dist < 32) {
            this.escaped = true;
            if (game.hud) game.hud.notify('Dawood escaped! Mission compromised.', 3000);
        }

        // If player gets close enough, trigger final choice
        if (this.distanceTo(game.player) < 50) {
            this.phase = 'final_choice';
            this.vel.x = 0;
            this.vel.y = 0;
        }
    }

    deployTrap(game) {
        const player = game.player;
        const angle = Math.random() * Math.PI * 2;
        const dist = 80 + Math.random() * 60;
        const trapType = this.trapTypes[Math.floor(Math.random() * this.trapTypes.length)];

        // Place trap between player and Dawood
        const midX = (this.centerX + player.centerX) / 2 + Math.cos(angle) * dist * 0.3;
        const midY = (this.centerY + player.centerY) / 2 + Math.sin(angle) * dist * 0.3;

        this.traps.push({
            x: midX, y: midY,
            type: trapType,
            timer: trapType === 'mine' ? 500 : 1500, // mines arm fast
            triggered: false,
            radius: trapType === 'gas' ? 80 : 50,
        });

        game.particles.emit(midX, midY, {
            ...PARTICLES.SPARK,
            count: 3,
        });
    }

    triggerTrap(trap, game) {
        const player = game.player;
        const dx = player.centerX - trap.x;
        const dy = player.centerY - trap.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        switch (trap.type) {
            case 'mine':
                game.particles.emit(trap.x, trap.y, PARTICLES.EXPLOSION);
                game.camera.shake(8);
                if (dist < trap.radius) player.takeDamage(25, this);
                break;
            case 'gas':
                game.particles.emit(trap.x, trap.y, { ...PARTICLES.SMOKE, count: 20, spreadX: 50, spreadY: 50 });
                if (dist < trap.radius) player.takeDamage(5, this); // tick damage
                break;
            case 'turret':
                // Burst of shots toward player
                for (let i = 0; i < 5; i++) {
                    const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.3;
                    game.particles.emit(trap.x, trap.y, { ...PARTICLES.GUNSHOT, angle });
                }
                if (dist < 200 && Math.random() < 0.5) player.takeDamage(10, this);
                game.camera.shake(3);
                break;
        }
    }

    spreadFire(game) {
        // Add new fire tiles near existing ones
        const newFires = [];
        for (const key of this.fireTiles) {
            const [fx, fy] = key.split(',').map(Number);
            const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [ddx, ddy] of dirs) {
                const nx = fx + ddx;
                const ny = fy + ddy;
                const nk = `${nx},${ny}`;
                if (!this.fireTiles.has(nk) && Math.random() < 0.3) {
                    if (!game.tilemap.isCollision(nx, ny)) {
                        newFires.push(nk);
                    }
                }
            }
        }
        newFires.forEach(k => this.fireTiles.add(k));
    }

    // Start fire at a position
    ignite(tileX, tileY) {
        this.fireTiles.add(`${tileX},${tileY}`);
    }

    takeDamage(amount, source) {
        super.takeDamage(amount, source);
    }

    draw(ctx, camera) {
        if (!this.alive) return;
        const sx = Math.floor(this.pos.x - camera.x);
        const sy = Math.floor(this.pos.y - camera.y);

        // Draw fire tiles
        const ts = CONFIG.TILE_SIZE;
        for (const key of this.fireTiles) {
            const [fx, fy] = key.split(',').map(Number);
            const fsx = fx * ts - camera.x;
            const fsy = fy * ts - camera.y;
            const alpha = 0.3 + Math.sin(Date.now() / 200 + fx + fy) * 0.2;
            ctx.fillStyle = `rgba(255,100,0,${alpha})`;
            ctx.fillRect(fsx, fsy, ts, ts);
        }

        // Draw traps
        for (const trap of this.traps) {
            const tx = trap.x - camera.x;
            const ty = trap.y - camera.y;
            if (trap.triggered) continue;

            ctx.strokeStyle = trap.type === 'mine' ? '#ff4444' : trap.type === 'gas' ? '#44ff44' : '#4444ff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(tx, ty, 8, 0, Math.PI * 2);
            ctx.stroke();

            // Warning blink
            if (trap.timer < 1000) {
                const blink = Math.sin(Date.now() / 100) > 0;
                if (blink) {
                    ctx.fillStyle = ctx.strokeStyle;
                    ctx.beginPath();
                    ctx.arc(tx, ty, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(sx + this.size.w / 2, sy + this.size.h + 2, 14, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body (dark suit)
        ctx.fillStyle = this.isEscaping ? '#aa7744' : this.color;
        ctx.fillRect(sx, sy, this.size.w, this.size.h);

        // Sunglasses
        ctx.fillStyle = '#111';
        ctx.fillRect(sx + 4, sy + 4, this.size.w - 8, 4);

        // Name
        ctx.fillStyle = '#aa6633';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('BADE SAHAB', sx + this.size.w / 2, sy - 24);

        // Boss HP bar
        const barW = 60;
        const barH = 5;
        ctx.fillStyle = '#333';
        ctx.fillRect(sx + this.size.w / 2 - barW / 2, sy - 18, barW, barH);
        ctx.fillStyle = '#aa6633';
        ctx.fillRect(sx + this.size.w / 2 - barW / 2, sy - 18, barW * (this.hp / this.maxHp), barH);

        // Escape bar
        if (this.isEscaping) {
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 10px monospace';
            ctx.fillText(`ESCAPING: ${Math.floor(this.escapeProgress)}%`, sx + this.size.w / 2, sy - 32);
        }

        ctx.textAlign = 'left';
    }
}
