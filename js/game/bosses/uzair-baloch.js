import { Entity } from '../../engine/entity.js';
import { CONFIG } from '../../config.js';
import { PARTICLES } from '../../engine/particles.js';

// Boss: Uzair Baloch (Ch3) - Arena brawl with gang reinforcements
export class UzairBaloch extends Entity {
    constructor(x, y) {
        super(x, y, 26, 26);
        this.color = '#228833';
        this.faction = CONFIG.FACTIONS.PATHAN;
        this.hp = 180;
        this.maxHp = 180;
        this.speed = 95;

        this.attackCooldown = 0;
        this.attackPattern = 0;
        this.reinforcementTimer = 8000; // spawn reinforcements every 8s
        this.reinforcementsSpawned = 0;
        this.maxReinforcements = 8;

        // Grab attack
        this.grabbing = false;
        this.grabTimer = 0;
        this.grabbedTarget = null;

        // Ground pound
        this.pounding = false;
        this.poundTimer = 0;
        this.poundCharge = 0;
    }

    update(dt, game) {
        if (!this.alive) return;

        this.attackCooldown -= dt * 1000;
        this.reinforcementTimer -= dt * 1000;

        // Reinforcement spawning
        if (this.reinforcementTimer <= 0 && this.reinforcementsSpawned < this.maxReinforcements) {
            this.requestReinforcement = true;
            this.reinforcementsSpawned++;
            this.reinforcementTimer = 8000;
            if (game.hud) game.hud.notify('Reinforcements incoming!', 1500);
        }

        const player = game.player;
        if (!player.alive) return;

        this.facing = this.angleTo(player);
        const dist = this.distanceTo(player);

        // Grab attack
        if (this.grabbing) {
            this.grabTimer -= dt * 1000;
            if (this.grabTimer <= 0) {
                // Throw player
                if (this.grabbedTarget) {
                    const throwAngle = this.facing;
                    this.grabbedTarget.vel.x = Math.cos(throwAngle) * 400;
                    this.grabbedTarget.vel.y = Math.sin(throwAngle) * 400;
                    this.grabbedTarget.takeDamage(20, this);
                    game.camera.shake(8);
                    game.particles.emit(player.centerX, player.centerY, PARTICLES.DUST);
                }
                this.grabbing = false;
                this.grabbedTarget = null;
            }
            this.vel.x = 0;
            this.vel.y = 0;
            game.physics.moveEntity(this, dt);
            return;
        }

        // Ground pound
        if (this.pounding) {
            this.poundTimer -= dt * 1000;
            this.poundCharge += dt;
            if (this.poundTimer <= 0) {
                // AOE damage
                game.particles.emit(this.centerX, this.centerY, {
                    ...PARTICLES.EXPLOSION,
                    count: 15,
                    colors: ['#8b7355', '#6b5b45', '#555'],
                });
                game.camera.shake(12);
                if (dist < 80) {
                    player.takeDamage(30, this);
                }
                this.pounding = false;
            }
            this.vel.x = 0;
            this.vel.y = 0;
            game.physics.moveEntity(this, dt);
            return;
        }

        if (this.attackCooldown <= 0) {
            this.attackPattern = (this.attackPattern + 1) % 5;

            switch (this.attackPattern) {
                case 0: // Rush punch
                    if (dist < 50) {
                        player.takeDamage(12, this);
                        game.particles.emit(player.centerX, player.centerY, PARTICLES.BLOOD);
                        game.camera.shake(3);
                    }
                    this.attackCooldown = 600;
                    break;
                case 1: // Grab (telegraphed)
                    if (dist < 45) {
                        this.grabbing = true;
                        this.grabTimer = 1000;
                        this.grabbedTarget = player;
                        player.vel.x = 0;
                        player.vel.y = 0;
                    }
                    this.attackCooldown = 800;
                    break;
                case 2: // Double punch
                    if (dist < 50) {
                        player.takeDamage(8, this);
                        setTimeout(() => {
                            if (this.alive && player.alive && this.distanceTo(player) < 55) {
                                player.takeDamage(8, this);
                                game.camera.shake(4);
                            }
                        }, 200);
                        game.particles.emit(player.centerX, player.centerY, PARTICLES.BLOOD);
                    }
                    this.attackCooldown = 700;
                    break;
                case 3: // Ground pound (telegraphed - 1s charge)
                    this.pounding = true;
                    this.poundTimer = 1000;
                    this.poundCharge = 0;
                    this.attackCooldown = 2000;
                    break;
                case 4: // Shoulder charge
                    const chargeAngle = this.angleTo(player);
                    this.vel.x = Math.cos(chargeAngle) * this.speed * 4;
                    this.vel.y = Math.sin(chargeAngle) * this.speed * 4;
                    setTimeout(() => {
                        if (this.alive) {
                            this.vel.x = 0;
                            this.vel.y = 0;
                            if (this.distanceTo(player) < 40) {
                                player.takeDamage(15, this);
                                game.camera.shake(6);
                            }
                        }
                    }, 300);
                    this.attackCooldown = 1500;
                    break;
            }
        } else if (dist > 40) {
            // Chase
            const dx = player.centerX - this.centerX;
            const dy = player.centerY - this.centerY;
            const d = Math.sqrt(dx * dx + dy * dy);
            this.vel.x = (dx / d) * this.speed;
            this.vel.y = (dy / d) * this.speed;
        } else {
            this.vel.x = 0;
            this.vel.y = 0;
        }

        game.physics.moveEntity(this, dt);
    }

    draw(ctx, camera) {
        if (!this.alive) return;
        const sx = Math.floor(this.pos.x - camera.x);
        const sy = Math.floor(this.pos.y - camera.y);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(sx + this.size.w / 2, sy + this.size.h + 2, 15, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ground pound telegraph
        if (this.pounding) {
            const progress = this.poundCharge;
            ctx.strokeStyle = `rgba(255,100,0,${progress * 0.5})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sx + this.size.w / 2, sy + this.size.h / 2, 80 * progress, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Body (large, green)
        ctx.fillStyle = this.grabbing ? '#44cc44' : this.color;
        ctx.fillRect(sx, sy, this.size.w, this.size.h);

        // Headband
        ctx.fillStyle = '#116622';
        ctx.fillRect(sx + 2, sy, this.size.w - 4, 4);

        // Name
        ctx.fillStyle = '#44aa44';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('UZAIR BALOCH', sx + this.size.w / 2, sy - 24);

        // Boss HP bar
        const barW = 60;
        const barH = 5;
        ctx.fillStyle = '#333';
        ctx.fillRect(sx + this.size.w / 2 - barW / 2, sy - 18, barW, barH);
        ctx.fillStyle = '#44aa44';
        ctx.fillRect(sx + this.size.w / 2 - barW / 2, sy - 18, barW * (this.hp / this.maxHp), barH);
        ctx.textAlign = 'left';
    }
}
