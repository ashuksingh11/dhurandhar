import { Entity } from '../../engine/entity.js';
import { CONFIG } from '../../config.js';
import { PARTICLES } from '../../engine/particles.js';

// Boss: Rehman Dakait (Ch5) - 3 phase fight
// Phase 1: Vehicle chase (side-scroll) - destroy escort vehicles
// Phase 2: Truck-top melee - fight on moving truck
// Phase 3: Final duel - dual machetes, heavy attacks
export class RehmanDakait extends Entity {
    constructor(x, y) {
        super(x, y, 28, 28);
        this.color = '#aa2222';
        this.faction = CONFIG.FACTIONS.BALOCH;
        this.hp = 250;
        this.maxHp = 250;
        this.speed = 100;

        this.phase = 1;
        this.phaseTimer = 0;
        this.attackCooldown = 0;
        this.attackPattern = 0;
        this.staggered = false;
        this.staggerTimer = 0;
        this.charging = false;
        this.chargeTarget = null;
        this.dialogue = null;

        // Phase 1: Vehicle
        this.vehicleHp = 100;
        this.escortVehicles = 3;

        // Phase 3: Dual machetes
        this.comboCount = 0;
        this.spinAttacking = false;
        this.spinTimer = 0;
        this.enraged = false; // below 30% HP
    }

    update(dt, game) {
        if (!this.alive) return;

        this.attackCooldown -= dt * 1000;
        this.phaseTimer += dt * 1000;

        if (this.staggered) {
            this.staggerTimer -= dt * 1000;
            if (this.staggerTimer <= 0) this.staggered = false;
            this.vel.x = 0;
            this.vel.y = 0;
            game.physics.moveEntity(this, dt);
            return;
        }

        // Enrage check
        if (!this.enraged && this.hp < this.maxHp * 0.3) {
            this.enraged = true;
            this.speed = 140;
            this.color = '#ff2222';
            if (game.hud) game.hud.notify('Rehman is enraged!', 2000);
            game.camera.shake(10);
        }

        switch (this.phase) {
            case 1: this.updatePhase1(dt, game); break;
            case 2: this.updatePhase2(dt, game); break;
            case 3: this.updatePhase3(dt, game); break;
        }

        game.physics.moveEntity(this, dt);
    }

    // Phase 1: Chase - simplified (enemies approach from sides)
    updatePhase1(dt, game) {
        // Phase 1 logic handled by chapter script
        // Auto-transitions to phase 2 when escortVehicles <= 0
        if (this.escortVehicles <= 0) {
            this.phase = 2;
            this.phaseTimer = 0;
            this.hp = Math.max(this.hp, this.maxHp * 0.7);
            if (game.hud) game.hud.notify('Jump to the truck!', 2000);
        }
    }

    // Phase 2: Truck-top melee (close quarters)
    updatePhase2(dt, game) {
        const player = game.player;
        if (!player.alive) return;

        this.facing = this.angleTo(player);
        const dist = this.distanceTo(player);

        if (dist < 50 && this.attackCooldown <= 0) {
            // Alternating punches and shoves
            this.attack(game, 15);
            this.attackCooldown = 600;
        } else if (dist >= 50) {
            this.moveToward(player.centerX, player.centerY, dt);
        }

        // Transition to phase 3 at 50% HP
        if (this.hp < this.maxHp * 0.5) {
            this.phase = 3;
            this.phaseTimer = 0;
            if (game.hud) game.hud.notify('Rehman draws his machetes!', 2000);
            game.camera.shake(8);
        }
    }

    // Phase 3: Dual machete duel
    updatePhase3(dt, game) {
        const player = game.player;
        if (!player.alive) return;

        this.facing = this.angleTo(player);
        const dist = this.distanceTo(player);

        // Spin attack
        if (this.spinAttacking) {
            this.spinTimer -= dt * 1000;
            this.facing += dt * 15; // spin
            // Damage everything nearby
            if (dist < 60) {
                player.takeDamage(25 * dt, this);
            }
            game.particles.emit(this.centerX, this.centerY, {
                ...PARTICLES.SPARK,
                count: 2,
                angle: this.facing,
            });
            if (this.spinTimer <= 0) {
                this.spinAttacking = false;
                this.staggered = true;
                this.staggerTimer = 1000; // vulnerable window
            }
            return;
        }

        if (this.attackCooldown <= 0) {
            this.attackPattern = (this.attackPattern + 1) % (this.enraged ? 4 : 5);

            switch (this.attackPattern) {
                case 0: // Lunge attack
                    this.lunge(game);
                    this.attackCooldown = this.enraged ? 400 : 700;
                    break;
                case 1: // Double slash
                    this.attack(game, 20);
                    this.attackCooldown = 300;
                    break;
                case 2: // Heavy overhead
                    this.attack(game, 30);
                    this.attackCooldown = this.enraged ? 600 : 1000;
                    game.camera.shake(5);
                    break;
                case 3: // Spin attack (telegraphed)
                    this.spinAttacking = true;
                    this.spinTimer = 1500;
                    this.attackCooldown = 2000;
                    break;
                case 4: // Pause (breathe)
                    this.attackCooldown = 1200;
                    break;
            }
        } else {
            // Chase player
            if (dist > 40) {
                this.moveToward(player.centerX, player.centerY, dt);
            }
        }
    }

    lunge(game) {
        const player = game.player;
        const angle = this.angleTo(player);
        this.vel.x = Math.cos(angle) * this.speed * 3;
        this.vel.y = Math.sin(angle) * this.speed * 3;

        // Check hit at end of lunge
        setTimeout(() => {
            if (this.distanceTo(player) < 50) {
                player.takeDamage(18, this);
                game.particles.emit(player.centerX, player.centerY, {
                    ...PARTICLES.BLOOD,
                    angle: angle,
                });
                game.camera.shake(4);
            }
            this.vel.x = 0;
            this.vel.y = 0;
        }, 200);
    }

    attack(game, damage) {
        const player = game.player;
        if (this.distanceTo(player) < 55) {
            player.takeDamage(damage, this);
            game.particles.emit(player.centerX, player.centerY, {
                ...PARTICLES.BLOOD,
                angle: this.facing,
            });
            game.camera.shake(damage > 20 ? 6 : 3);
        }
        game.particles.emit(
            this.centerX + Math.cos(this.facing) * 30,
            this.centerY + Math.sin(this.facing) * 30,
            { ...PARTICLES.SPARK, count: 4, angle: this.facing }
        );
    }

    moveToward(tx, ty, dt) {
        const dx = tx - this.centerX;
        const dy = ty - this.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 4) {
            this.vel.x = (dx / dist) * this.speed;
            this.vel.y = (dy / dist) * this.speed;
        }
    }

    takeDamage(amount, source) {
        if (this.staggered) amount *= 1.5; // bonus damage when staggered
        super.takeDamage(amount, source);
    }

    onDeath() {
        // Trigger cutscene / chapter end
    }

    draw(ctx, camera) {
        if (!this.alive) return;
        const sx = Math.floor(this.pos.x - camera.x);
        const sy = Math.floor(this.pos.y - camera.y);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(sx + this.size.w / 2, sy + this.size.h + 2, 16, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = this.staggered ? '#ff8888' : this.color;
        ctx.fillRect(sx, sy, this.size.w, this.size.h);

        // Machetes (Phase 3)
        if (this.phase >= 3) {
            ctx.strokeStyle = '#cccccc';
            ctx.lineWidth = 3;
            const mAngle1 = this.facing - 0.4;
            const mAngle2 = this.facing + 0.4;
            const len = this.spinAttacking ? 22 : 18;
            ctx.beginPath();
            ctx.moveTo(sx + this.size.w / 2, sy + this.size.h / 2);
            ctx.lineTo(sx + this.size.w / 2 + Math.cos(mAngle1) * len, sy + this.size.h / 2 + Math.sin(mAngle1) * len);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(sx + this.size.w / 2, sy + this.size.h / 2);
            ctx.lineTo(sx + this.size.w / 2 + Math.cos(mAngle2) * len, sy + this.size.h / 2 + Math.sin(mAngle2) * len);
            ctx.stroke();
        }

        // Enrage aura
        if (this.enraged) {
            ctx.strokeStyle = `rgba(255,0,0,${0.3 + Math.sin(Date.now() / 100) * 0.2})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(sx + this.size.w / 2, sy + this.size.h / 2, 20, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Stagger indicator
        if (this.staggered) {
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('STUN', sx + this.size.w / 2, sy - 12);
            ctx.textAlign = 'left';
        }

        // Name and HP
        ctx.fillStyle = '#cc2222';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('REHMAN DAKAIT', sx + this.size.w / 2, sy - 24);

        // Boss HP bar
        const barW = 60;
        const barH = 5;
        ctx.fillStyle = '#333';
        ctx.fillRect(sx + this.size.w / 2 - barW / 2, sy - 18, barW, barH);
        ctx.fillStyle = this.enraged ? '#ff2222' : '#cc4444';
        ctx.fillRect(sx + this.size.w / 2 - barW / 2, sy - 18, barW * (this.hp / this.maxHp), barH);
        ctx.textAlign = 'left';
    }
}
