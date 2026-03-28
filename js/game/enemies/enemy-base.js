import { Entity } from '../../engine/entity.js';
import { CONFIG } from '../../config.js';
import { PARTICLES } from '../../engine/particles.js';

// Enemy AI States
export const AI_STATE = {
    PATROL: 'PATROL',
    CURIOUS: 'CURIOUS',
    ALERT: 'ALERT',
    SEARCH: 'SEARCH',
    ATTACK: 'ATTACK',
    DEAD: 'DEAD',
};

export class EnemyBase extends Entity {
    constructor(x, y, config = {}) {
        super(x, y, 20, 20);
        this.color = config.color || '#cc4444';
        this.faction = config.faction || CONFIG.FACTIONS.BALOCH;
        this.hp = config.hp || 30;
        this.maxHp = this.hp;
        this.speed = config.speed || 80;
        this.damage = config.damage || 10;

        // AI
        this.aiState = AI_STATE.PATROL;
        this.stateTimer = 0;
        this.target = null;
        this.lastKnownPos = null;
        this.alertLevel = 0; // 0-1, influences detection speed

        // Vision
        this.visionRange = config.visionRange || CONFIG.ENEMY_VISION_RANGE;
        this.visionAngle = (config.visionAngle || CONFIG.ENEMY_VISION_ANGLE) * Math.PI / 180;

        // Patrol
        this.patrol = config.patrol || [];
        this.patrolIndex = 0;
        this.patrolWaitTimer = 0;

        // Pathfinding
        this.path = null;
        this.pathIndex = 0;
        this.pathRecalcTimer = 0;

        // Combat
        this.attackCooldown = 0;
        this.attackRange = config.attackRange || 36;
    }

    update(dt, game) {
        if (!this.alive) return;

        this.attackCooldown -= dt * 1000;
        this.pathRecalcTimer -= dt * 1000;

        switch (this.aiState) {
            case AI_STATE.PATROL: this.updatePatrol(dt, game); break;
            case AI_STATE.CURIOUS: this.updateCurious(dt, game); break;
            case AI_STATE.ALERT: this.updateAlert(dt, game); break;
            case AI_STATE.SEARCH: this.updateSearch(dt, game); break;
            case AI_STATE.ATTACK: this.updateAttack(dt, game); break;
        }

        game.physics.moveEntity(this, dt);
    }

    // Check if player is in vision cone
    canSeePlayer(game) {
        const player = game.player;
        if (!player.alive) return false;

        const dist = this.distanceTo(player);
        if (dist > this.visionRange) return false;

        // Check angle
        const angleToPlayer = this.angleTo(player);
        let angleDiff = angleToPlayer - this.facing;
        // Normalize to -PI to PI
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        if (Math.abs(angleDiff) > this.visionAngle / 2) {
            // Check peripheral
            if (dist > CONFIG.ENEMY_PERIPHERAL_RANGE) return false;
            const periphAngle = (CONFIG.ENEMY_PERIPHERAL_ANGLE * Math.PI / 180) / 2;
            if (Math.abs(angleDiff) > periphAngle) return false;
        }

        // Line of sight check
        return game.physics.hasLineOfSight(this, player);
    }

    // Patrol: follow waypoints
    updatePatrol(dt, game) {
        if (this.canSeePlayer(game)) {
            this.transitionTo(AI_STATE.ALERT, game);
            return;
        }

        if (this.patrol.length === 0) {
            this.vel.x = 0;
            this.vel.y = 0;
            return;
        }

        if (this.patrolWaitTimer > 0) {
            this.patrolWaitTimer -= dt * 1000;
            this.vel.x = 0;
            this.vel.y = 0;
            return;
        }

        const target = this.patrol[this.patrolIndex];
        const ts = CONFIG.TILE_SIZE;
        const tx = target.x * ts + ts / 2;
        const ty = target.y * ts + ts / 2;
        const dx = tx - this.centerX;
        const dy = ty - this.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 8) {
            this.patrolIndex = (this.patrolIndex + 1) % this.patrol.length;
            this.patrolWaitTimer = 1000 + Math.random() * 1000;
            this.vel.x = 0;
            this.vel.y = 0;
        } else {
            this.facing = Math.atan2(dy, dx);
            this.vel.x = (dx / dist) * this.speed * 0.5;
            this.vel.y = (dy / dist) * this.speed * 0.5;
        }
    }

    // Curious: investigate a point
    updateCurious(dt, game) {
        if (this.canSeePlayer(game)) {
            this.transitionTo(AI_STATE.ALERT, game);
            return;
        }

        this.stateTimer -= dt * 1000;
        if (this.stateTimer <= 0) {
            this.transitionTo(AI_STATE.PATROL, game);
            return;
        }

        if (this.lastKnownPos) {
            const dx = this.lastKnownPos.x - this.centerX;
            const dy = this.lastKnownPos.y - this.centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 8) {
                this.facing = Math.atan2(dy, dx);
                this.vel.x = (dx / dist) * this.speed * 0.7;
                this.vel.y = (dy / dist) * this.speed * 0.7;
            } else {
                this.vel.x = 0;
                this.vel.y = 0;
                // Look around
                this.facing += dt * 2;
            }
        }
    }

    // Alert: confirmed hostile, call allies
    updateAlert(dt, game) {
        this.target = game.player;

        // Alert nearby allies
        if (game.entities) {
            for (const e of game.entities) {
                if (e === this || !(e instanceof EnemyBase) || !e.alive) continue;
                if (this.distanceTo(e) < CONFIG.ENEMY_ALERT_RADIUS) {
                    if (e.aiState === AI_STATE.PATROL || e.aiState === AI_STATE.CURIOUS) {
                        e.lastKnownPos = { x: game.player.centerX, y: game.player.centerY };
                        e.transitionTo(AI_STATE.ALERT, game);
                    }
                }
            }
        }

        this.transitionTo(AI_STATE.ATTACK, game);
    }

    // Search: lost visual, sweep area
    updateSearch(dt, game) {
        if (this.canSeePlayer(game)) {
            this.transitionTo(AI_STATE.ALERT, game);
            return;
        }

        this.stateTimer -= dt * 1000;
        if (this.stateTimer <= 0) {
            this.transitionTo(AI_STATE.PATROL, game);
            return;
        }

        // Move toward last known position using pathfinding
        if (this.lastKnownPos) {
            this.moveToward(this.lastKnownPos.x, this.lastKnownPos.y, dt, game);
        }
    }

    // Attack: engage the player
    updateAttack(dt, game) {
        const player = game.player;
        if (!player.alive) {
            this.transitionTo(AI_STATE.PATROL, game);
            return;
        }

        if (!this.canSeePlayer(game)) {
            this.lastKnownPos = { x: player.centerX, y: player.centerY };
            this.transitionTo(AI_STATE.SEARCH, game);
            return;
        }

        this.lastKnownPos = { x: player.centerX, y: player.centerY };
        const dist = this.distanceTo(player);
        this.facing = this.angleTo(player);

        if (dist <= this.attackRange) {
            // Attack
            this.vel.x = 0;
            this.vel.y = 0;
            if (this.attackCooldown <= 0) {
                this.performAttack(game);
                this.attackCooldown = 800 + Math.random() * 400;
            }
        } else {
            // Chase
            this.moveToward(player.centerX, player.centerY, dt, game);
        }
    }

    performAttack(game) {
        const player = game.player;
        const dist = this.distanceTo(player);
        if (dist <= this.attackRange + 10) {
            player.takeDamage(this.damage, this);
            game.particles.emit(player.centerX, player.centerY, {
                ...PARTICLES.BLOOD,
                angle: this.facing,
                count: 3,
            });
            game.camera.shake(3);
        }
    }

    moveToward(tx, ty, dt, game) {
        const dx = tx - this.centerX;
        const dy = ty - this.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 4) {
            this.facing = Math.atan2(dy, dx);
            this.vel.x = (dx / dist) * this.speed;
            this.vel.y = (dy / dist) * this.speed;
        } else {
            this.vel.x = 0;
            this.vel.y = 0;
        }
    }

    transitionTo(state, game) {
        this.aiState = state;
        switch (state) {
            case AI_STATE.PATROL:
                this.target = null;
                this.alertLevel = 0;
                break;
            case AI_STATE.CURIOUS:
                this.stateTimer = CONFIG.ENEMY_CURIOUS_TIME;
                break;
            case AI_STATE.ALERT:
                // play alert sound
                break;
            case AI_STATE.SEARCH:
                this.stateTimer = CONFIG.ENEMY_SEARCH_TIME;
                break;
            case AI_STATE.ATTACK:
                break;
        }
    }

    onDeath(source) {
        this.aiState = AI_STATE.DEAD;
        this.vel.x = 0;
        this.vel.y = 0;
        this.active = false;
    }

    draw(ctx, camera) {
        if (!this.alive) return;

        const sx = Math.floor(this.pos.x - camera.x);
        const sy = Math.floor(this.pos.y - camera.y);

        // Vision cone
        this.drawVisionCone(ctx, camera);

        // Body
        ctx.fillStyle = this.color;
        ctx.fillRect(sx, sy, this.size.w, this.size.h);

        // Direction indicator
        const fx = sx + this.size.w / 2 + Math.cos(this.facing) * 12;
        const fy = sy + this.size.h / 2 + Math.sin(this.facing) * 12;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(fx, fy, 2, 0, Math.PI * 2);
        ctx.fill();

        // State indicator
        if (this.aiState === AI_STATE.CURIOUS) {
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 14px monospace';
            ctx.fillText('?', sx + this.size.w / 2 - 4, sy - 8);
        } else if (this.aiState === AI_STATE.ALERT || this.aiState === AI_STATE.ATTACK) {
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 14px monospace';
            ctx.fillText('!', sx + this.size.w / 2 - 3, sy - 8);
        } else if (this.aiState === AI_STATE.SEARCH) {
            ctx.fillStyle = '#ff8800';
            ctx.font = 'bold 14px monospace';
            ctx.fillText('??', sx + this.size.w / 2 - 7, sy - 8);
        }

        // HP bar (when damaged)
        if (this.hp < this.maxHp) {
            const barW = this.size.w;
            const barH = 3;
            const bx = sx;
            const by = sy - 6;
            ctx.fillStyle = '#333';
            ctx.fillRect(bx, by, barW, barH);
            ctx.fillStyle = '#cc0000';
            ctx.fillRect(bx, by, barW * (this.hp / this.maxHp), barH);
        }
    }

    drawVisionCone(ctx, camera) {
        const cx = this.centerX - camera.x;
        const cy = this.centerY - camera.y;
        const range = this.visionRange;
        const halfAngle = this.visionAngle / 2;

        let coneColor;
        switch (this.aiState) {
            case AI_STATE.PATROL: coneColor = 'rgba(0,200,0,0.08)'; break;
            case AI_STATE.CURIOUS: coneColor = 'rgba(255,255,0,0.12)'; break;
            case AI_STATE.ALERT:
            case AI_STATE.ATTACK: coneColor = 'rgba(255,0,0,0.12)'; break;
            case AI_STATE.SEARCH: coneColor = 'rgba(255,140,0,0.10)'; break;
            default: coneColor = 'rgba(0,200,0,0.08)';
        }

        ctx.fillStyle = coneColor;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, range, this.facing - halfAngle, this.facing + halfAngle);
        ctx.closePath();
        ctx.fill();
    }
}
