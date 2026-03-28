import { Entity } from '../engine/entity.js';
import { CONFIG } from '../config.js';
import { PARTICLES } from '../engine/particles.js';

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 20, 20);
        this.color = CONFIG.COLOR_SAFFRON;
        this.faction = CONFIG.FACTIONS.PLAYER;
        this.hp = CONFIG.PLAYER_HP;
        this.maxHp = CONFIG.PLAYER_HP;
        this.speed = CONFIG.PLAYER_SPEED;

        // Identity
        this.identity = 'hamza'; // 'hamza' or 'jaskirat'

        // Combat
        this.attacking = false;
        this.attackTimer = 0;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.heavyCharging = false;
        this.heavyChargeTimer = 0;
        this.blocking = false;
        this.parryTimer = 0;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.lastHitTime = 0;

        // Dodge
        this.dodging = false;
        this.dodgeTimer = 0;
        this.dodgeCooldown = 0;
        this.dodgeDirX = 0;
        this.dodgeDirY = 0;

        // Weapons
        this.currentWeapon = 0;
        this.weapons = ['fists', 'knife'];
        this.ammo = { pistol: 30, ak47: 0, shotgun: 0, sniper: 0 };
        this.grenades = 0;

        // Suspicion
        this.suspicion = 0;

        // Regen
        this.regenTimer = 0;

        // Visual
        this.flashTimer = 0;
    }

    update(dt, game) {
        const input = game.input;
        const physics = game.physics;

        // Timers
        if (this.dodgeCooldown > 0) this.dodgeCooldown -= dt * 1000;
        if (this.attackTimer > 0) this.attackTimer -= dt * 1000;
        if (this.comboTimer > 0) this.comboTimer -= dt * 1000;
        if (this.flashTimer > 0) this.flashTimer -= dt * 1000;
        if (this.invincibleTimer > 0) {
            this.invincibleTimer -= dt * 1000;
            if (this.invincibleTimer <= 0) this.invincible = false;
        }

        // Regen
        this.regenTimer += dt * 1000;
        if (this.regenTimer > CONFIG.PLAYER_REGEN_DELAY && this.hp < this.maxHp) {
            this.hp = Math.min(this.maxHp, this.hp + CONFIG.PLAYER_HP_REGEN * dt);
        }

        if (this.comboTimer <= 0) this.comboCount = 0;
        if (this.attackTimer <= 0) this.attacking = false;

        // Facing (toward mouse)
        this.facing = Math.atan2(
            input.mouse.worldY - this.centerY,
            input.mouse.worldX - this.centerX
        );

        // Dodge roll
        if (this.dodging) {
            this.dodgeTimer -= dt * 1000;
            this.vel.x = this.dodgeDirX * CONFIG.PLAYER_DODGE_SPEED;
            this.vel.y = this.dodgeDirY * CONFIG.PLAYER_DODGE_SPEED;
            physics.moveEntity(this, dt);

            if (this.dodgeTimer <= 0) {
                this.dodging = false;
                this.invincible = false;
                this.vel.x = 0;
                this.vel.y = 0;
            }

            // Dust particles
            if (game.particles && Math.random() < 0.3) {
                game.particles.emit(this.centerX, this.bottom, {
                    ...PARTICLES.DUST,
                    count: 1,
                });
            }
            return;
        }

        // Movement
        let mx = 0, my = 0;
        if (input.isDown(CONFIG.KEYS.LEFT)) mx -= 1;
        if (input.isDown(CONFIG.KEYS.RIGHT)) mx += 1;
        if (input.isDown(CONFIG.KEYS.UP)) my -= 1;
        if (input.isDown(CONFIG.KEYS.DOWN)) my += 1;

        // Normalize diagonal
        if (mx !== 0 && my !== 0) {
            mx *= 0.707;
            my *= 0.707;
        }

        const spd = input.isDown(CONFIG.KEYS.SPRINT) ? CONFIG.PLAYER_SPRINT_SPEED : this.speed;
        this.vel.x = mx * spd;
        this.vel.y = my * spd;

        physics.moveEntity(this, dt);

        // Dodge initiate
        if (input.justPressed(CONFIG.KEYS.DODGE) && this.dodgeCooldown <= 0) {
            this.dodging = true;
            this.dodgeTimer = CONFIG.PLAYER_DODGE_DURATION;
            this.dodgeCooldown = CONFIG.PLAYER_DODGE_COOLDOWN;
            this.invincible = true;
            this.invincibleTimer = CONFIG.PLAYER_DODGE_DURATION;
            // Dodge in movement direction or facing direction
            if (mx !== 0 || my !== 0) {
                const len = Math.sqrt(mx * mx + my * my);
                this.dodgeDirX = mx / len;
                this.dodgeDirY = my / len;
            } else {
                this.dodgeDirX = Math.cos(this.facing);
                this.dodgeDirY = Math.sin(this.facing);
            }
        }

        // Identity toggle
        if (input.justPressed(CONFIG.KEYS.IDENTITY_TOGGLE)) {
            this.identity = this.identity === 'hamza' ? 'jaskirat' : 'hamza';
        }

        // Melee attack (left click)
        if (input.mouseJustDown(0) && !this.attacking) {
            this.attack(game);
        }

        // Block/parry (right click)
        this.blocking = input.isMouseDown(2);
        if (input.mouseJustDown(2)) {
            this.parryTimer = CONFIG.PARRY_WINDOW;
        }
        if (this.parryTimer > 0) this.parryTimer -= dt * 1000;

        // Weapon switch
        if (input.justPressed(CONFIG.KEYS.WEAPON_1)) this.currentWeapon = 0;
        if (input.justPressed(CONFIG.KEYS.WEAPON_2)) this.currentWeapon = 1;
        if (input.justPressed(CONFIG.KEYS.WEAPON_3)) this.currentWeapon = 2;
        if (input.justPressed(CONFIG.KEYS.WEAPON_4)) this.currentWeapon = 3;
    }

    attack(game) {
        this.attacking = true;
        this.attackTimer = 200;
        this.comboTimer = CONFIG.COMBO_WINDOW;
        this.comboCount = (this.comboCount + 1) % 4; // 0,1,2,3 -> 3 is heavy

        const weapon = this.weapons[this.currentWeapon] || 'fists';
        const range = CONFIG.MELEE_RANGE;
        const damage = this.comboCount === 3 ? CONFIG.MELEE_HEAVY_DAMAGE : CONFIG.MELEE_LIGHT_DAMAGE;

        // Check hit on enemies
        const hitX = this.centerX + Math.cos(this.facing) * range;
        const hitY = this.centerY + Math.sin(this.facing) * range;

        if (game.entities) {
            for (const e of game.entities) {
                if (e === this || !e.alive || e.faction === this.faction) continue;
                const dx = e.centerX - hitX;
                const dy = e.centerY - hitY;
                if (dx * dx + dy * dy < range * range) {
                    e.takeDamage(damage, this);
                    game.particles.emit(e.centerX, e.centerY, {
                        ...PARTICLES.BLOOD,
                        angle: this.facing,
                        angleSpread: 0.8,
                    });
                    game.camera.shake(damage > 10 ? 6 : 3);
                }
            }
        }

        // Attack particle
        game.particles.emit(hitX, hitY, {
            ...PARTICLES.SPARK,
            angle: this.facing,
            count: 3,
        });
    }

    shoot(game) {
        const weapon = this.weapons[this.currentWeapon];
        if (!weapon || weapon === 'fists' || weapon === 'knife') return;

        const ammoKey = weapon;
        if (this.ammo[ammoKey] <= 0) return;
        this.ammo[ammoKey]--;

        const bulletX = this.centerX + Math.cos(this.facing) * 16;
        const bulletY = this.centerY + Math.sin(this.facing) * 16;

        // Muzzle flash
        game.particles.emit(bulletX, bulletY, {
            ...PARTICLES.GUNSHOT,
            angle: this.facing,
        });

        game.camera.shake(4);

        // Raycast for hit
        const result = game.physics.raycast(bulletX, bulletY, this.facing, 500);

        // Check entities along ray
        // TODO: proper bullet-entity intersection

        return { x: bulletX, y: bulletY, angle: this.facing, range: result.distance };
    }

    takeDamage(amount, source) {
        if (this.invincible) return;

        // Parry check
        if (this.parryTimer > 0 && source) {
            // Successful parry
            if (source.takeDamage) source.takeDamage(amount * 0.5, this);
            this.parryTimer = 0;
            return;
        }

        // Block reduces damage
        if (this.blocking) {
            amount *= 0.5;
        }

        this.regenTimer = 0;
        this.flashTimer = 100;
        super.takeDamage(amount, source);
    }

    draw(ctx, camera) {
        const sx = Math.floor(this.pos.x - camera.x);
        const sy = Math.floor(this.pos.y - camera.y);

        // Flash on damage
        if (this.flashTimer > 0 && Math.floor(this.flashTimer / 50) % 2 === 0) {
            ctx.fillStyle = '#fff';
        } else if (this.dodging) {
            // Dodge trail effect
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = this.identity === 'hamza' ? '#66aacc' : CONFIG.COLOR_SAFFRON;
        } else {
            ctx.fillStyle = this.identity === 'hamza' ? '#66aacc' : CONFIG.COLOR_SAFFRON;
        }

        // Body
        ctx.fillRect(sx, sy, this.size.w, this.size.h);
        ctx.globalAlpha = 1;

        // Direction indicator
        const fx = sx + this.size.w / 2 + Math.cos(this.facing) * 14;
        const fy = sy + this.size.h / 2 + Math.sin(this.facing) * 14;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(fx, fy, 3, 0, Math.PI * 2);
        ctx.fill();

        // Identity indicator ring
        ctx.strokeStyle = this.identity === 'hamza' ? '#66aacc' : CONFIG.COLOR_SAFFRON;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx + this.size.w / 2, sy + this.size.h / 2, this.size.w * 0.7, 0, Math.PI * 2);
        ctx.stroke();

        // Attack visual
        if (this.attacking) {
            const ax = sx + this.size.w / 2 + Math.cos(this.facing) * 24;
            const ay = sy + this.size.h / 2 + Math.sin(this.facing) * 24;
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.beginPath();
            ctx.arc(ax, ay, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        // Block visual
        if (this.blocking) {
            ctx.strokeStyle = this.parryTimer > 0 ? '#ffff00' : 'rgba(100,150,255,0.5)';
            ctx.lineWidth = 3;
            const blockAngle = this.facing;
            ctx.beginPath();
            ctx.arc(sx + this.size.w / 2, sy + this.size.h / 2,
                this.size.w * 0.9, blockAngle - 0.8, blockAngle + 0.8);
            ctx.stroke();
        }
    }

    onDeath() {
        // Game over
    }
}
