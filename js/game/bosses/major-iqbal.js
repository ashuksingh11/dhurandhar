import { Entity } from '../../engine/entity.js';
import { CONFIG } from '../../config.js';
import { PARTICLES } from '../../engine/particles.js';

// Boss: Major Iqbal (Ch7) - Tactical 2-phase fight
// Phase 1: Commands squads from control room, player disables 4 security nodes
// Phase 2: 1v1 tactical fight, uses smoke grenades, flanks, calls reinforcements via radio
export class MajorIqbal extends Entity {
    constructor(x, y) {
        super(x, y, 24, 24);
        this.color = '#3344aa';
        this.faction = CONFIG.FACTIONS.ISI;
        this.hp = 200;
        this.maxHp = 200;
        this.speed = 110;

        this.phase = 1;
        this.phaseTimer = 0;
        this.attackCooldown = 0;
        this.attackPattern = 0;

        // Phase 1
        this.securityNodes = 4;

        // Phase 2
        this.hasRadio = true; // can call reinforcements; player can shoot the radio
        this.smokeTimer = 0;
        this.smokeActive = false;
        this.smokeClouds = [];
        this.flankAngle = 0;
        this.retreating = false;
        this.retreatTimer = 0;
        this.burstCount = 0;
    }

    update(dt, game) {
        if (!this.alive) return;

        this.attackCooldown -= dt * 1000;
        this.phaseTimer += dt * 1000;

        // Update smoke clouds
        this.smokeClouds = this.smokeClouds.filter(s => {
            s.timer -= dt * 1000;
            return s.timer > 0;
        });

        switch (this.phase) {
            case 1: this.updatePhase1(dt, game); break;
            case 2: this.updatePhase2(dt, game); break;
        }

        game.physics.moveEntity(this, dt);
    }

    updatePhase1(dt, game) {
        // Stay in control room, invulnerable
        // Security nodes handled by chapter script
        this.vel.x = 0;
        this.vel.y = 0;

        if (this.securityNodes <= 0) {
            this.phase = 2;
            this.phaseTimer = 0;
            if (game.hud) game.hud.notify('Major Iqbal descends! Engage!', 2000);
            game.camera.shake(8);
        }
    }

    updatePhase2(dt, game) {
        const player = game.player;
        if (!player.alive) return;

        this.facing = this.angleTo(player);
        const dist = this.distanceTo(player);

        // Retreat behavior
        if (this.retreating) {
            this.retreatTimer -= dt * 1000;
            const awayAngle = this.facing + Math.PI;
            this.vel.x = Math.cos(awayAngle) * this.speed;
            this.vel.y = Math.sin(awayAngle) * this.speed;
            if (this.retreatTimer <= 0) this.retreating = false;
            return;
        }

        if (this.attackCooldown <= 0) {
            this.attackPattern = (this.attackPattern + 1) % 6;

            switch (this.attackPattern) {
                case 0: // Burst fire (3 shots)
                    this.burstFire(game);
                    this.attackCooldown = 800;
                    break;
                case 1: // Flank - move to side
                    this.flank(game);
                    this.attackCooldown = 600;
                    break;
                case 2: // Smoke grenade
                    this.throwSmoke(game);
                    this.attackCooldown = 1500;
                    break;
                case 3: // Precise shot
                    this.preciseShot(game);
                    this.attackCooldown = 500;
                    break;
                case 4: // Call reinforcements (if radio intact)
                    if (this.hasRadio) {
                        this.callReinforcements(game);
                        this.attackCooldown = 3000;
                    } else {
                        this.attackCooldown = 300;
                    }
                    break;
                case 5: // Tactical retreat
                    this.retreating = true;
                    this.retreatTimer = 800;
                    this.attackCooldown = 1000;
                    break;
            }
        } else {
            // Strafe around player
            const strafeAngle = this.facing + Math.PI / 2;
            this.vel.x = Math.cos(strafeAngle) * this.speed * 0.5;
            this.vel.y = Math.sin(strafeAngle) * this.speed * 0.5;
        }
    }

    burstFire(game) {
        const player = game.player;
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                if (!this.alive || !player.alive) return;
                const angle = this.angleTo(player) + (Math.random() - 0.5) * 0.2;
                const hitX = this.centerX + Math.cos(angle) * this.distanceTo(player);
                const hitY = this.centerY + Math.sin(angle) * this.distanceTo(player);

                game.particles.emit(this.centerX + Math.cos(angle) * 16, this.centerY + Math.sin(angle) * 16, {
                    ...PARTICLES.GUNSHOT,
                    angle,
                });

                if (this.distanceTo(player) < 250 && Math.random() < 0.4) {
                    player.takeDamage(8, this);
                    game.particles.emit(player.centerX, player.centerY, PARTICLES.BLOOD);
                }
                game.camera.shake(2);
            }, i * 150);
        }
    }

    flank(game) {
        this.flankAngle += Math.PI * 0.7;
        const player = game.player;
        const flankDist = 120;
        const targetX = player.centerX + Math.cos(this.flankAngle) * flankDist;
        const targetY = player.centerY + Math.sin(this.flankAngle) * flankDist;
        this.vel.x = (targetX - this.centerX) * 2;
        this.vel.y = (targetY - this.centerY) * 2;
    }

    throwSmoke(game) {
        const player = game.player;
        const midX = (this.centerX + player.centerX) / 2;
        const midY = (this.centerY + player.centerY) / 2;

        this.smokeClouds.push({
            x: midX, y: midY, timer: 4000, radius: 60
        });

        game.particles.emit(midX, midY, {
            ...PARTICLES.SMOKE,
            count: 15,
            spreadX: 40,
            spreadY: 40,
        });

        if (game.hud) game.hud.notify('Smoke grenade!', 1500);
    }

    preciseShot(game) {
        const player = game.player;
        const angle = this.angleTo(player);

        game.particles.emit(
            this.centerX + Math.cos(angle) * 16,
            this.centerY + Math.sin(angle) * 16,
            { ...PARTICLES.GUNSHOT, angle }
        );

        if (this.distanceTo(player) < 300) {
            player.takeDamage(15, this);
            game.particles.emit(player.centerX, player.centerY, {
                ...PARTICLES.BLOOD,
                angle: angle,
            });
            game.camera.shake(4);
        }
    }

    callReinforcements(game) {
        if (game.hud) game.hud.notify('Iqbal calls for backup!', 2000);
        // Spawn 2 ISI agents nearby
        // Handled by chapter script checking this.reinforcementRequested
        this.reinforcementRequested = true;
    }

    // Player can shoot the radio to prevent reinforcements
    destroyRadio(game) {
        this.hasRadio = false;
        if (game.hud) game.hud.notify('Radio destroyed! No more reinforcements!', 2500);
    }

    takeDamage(amount, source) {
        // Invulnerable in phase 1
        if (this.phase === 1) return;

        // Check if in smoke - reduced accuracy means player does less damage
        for (const smoke of this.smokeClouds) {
            const dx = this.centerX - smoke.x;
            const dy = this.centerY - smoke.y;
            if (dx * dx + dy * dy < smoke.radius * smoke.radius) {
                amount *= 0.5; // smoke reduces incoming damage
                break;
            }
        }

        super.takeDamage(amount, source);
    }

    draw(ctx, camera) {
        if (!this.alive) return;
        const sx = Math.floor(this.pos.x - camera.x);
        const sy = Math.floor(this.pos.y - camera.y);

        // Draw smoke clouds
        for (const smoke of this.smokeClouds) {
            const smx = smoke.x - camera.x;
            const smy = smoke.y - camera.y;
            const alpha = Math.min(0.4, smoke.timer / 4000 * 0.4);
            const gradient = ctx.createRadialGradient(smx, smy, 0, smx, smy, smoke.radius);
            gradient.addColorStop(0, `rgba(180,180,180,${alpha})`);
            gradient.addColorStop(1, `rgba(100,100,100,0)`);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(smx, smy, smoke.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(sx + this.size.w / 2, sy + this.size.h + 2, 14, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body (military blue)
        ctx.fillStyle = this.phase === 1 ? '#555566' : this.color;
        ctx.fillRect(sx, sy, this.size.w, this.size.h);

        // Beret
        ctx.fillStyle = '#223366';
        ctx.fillRect(sx + 2, sy - 4, this.size.w - 4, 5);

        // Gun line
        if (this.phase >= 2) {
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(sx + this.size.w / 2, sy + this.size.h / 2);
            ctx.lineTo(
                sx + this.size.w / 2 + Math.cos(this.facing) * 20,
                sy + this.size.h / 2 + Math.sin(this.facing) * 20
            );
            ctx.stroke();
        }

        // Radio indicator
        if (this.hasRadio && this.phase >= 2) {
            ctx.fillStyle = '#44ff44';
            ctx.fillRect(sx + this.size.w - 4, sy, 4, 8);
        }

        // Name and HP
        ctx.fillStyle = '#3366cc';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MAJOR IQBAL', sx + this.size.w / 2, sy - 26);

        // Boss HP bar
        const barW = 60;
        const barH = 5;
        ctx.fillStyle = '#333';
        ctx.fillRect(sx + this.size.w / 2 - barW / 2, sy - 20, barW, barH);
        ctx.fillStyle = '#3366cc';
        ctx.fillRect(sx + this.size.w / 2 - barW / 2, sy - 20, barW * (this.hp / this.maxHp), barH);

        // Phase indicator
        ctx.fillStyle = '#666';
        ctx.font = '8px monospace';
        ctx.fillText(this.phase === 1 ? 'COMMANDING' : 'ENGAGED', sx + this.size.w / 2, sy - 32);
        ctx.textAlign = 'left';
    }
}
