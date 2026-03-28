import { CONFIG } from '../config.js';

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 0;
        this.maxLife = 0;
        this.size = 2;
        this.color = '#fff';
        this.alpha = 1;
        this.drag = 0.98;
        this.gravity = 0;
        this.shrink = true;
    }

    update(dt) {
        if (!this.active) return;
        this.life -= dt;
        if (this.life <= 0) {
            this.active = false;
            return;
        }
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vx *= this.drag;
        this.vy *= this.drag;
        this.vy += this.gravity * dt;
        this.alpha = this.life / this.maxLife;
        if (this.shrink) this.size *= 0.995;
    }

    draw(ctx, camera) {
        if (!this.active) return;
        const sx = this.x - camera.renderX;
        const sy = this.y - camera.renderY;
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(sx - this.size / 2, sy - this.size / 2, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

export class ParticleSystem {
    constructor() {
        this.pool = [];
        for (let i = 0; i < CONFIG.PARTICLE_POOL_SIZE; i++) {
            this.pool.push(new Particle());
        }
    }

    _getParticle() {
        for (const p of this.pool) {
            if (!p.active) return p;
        }
        return null; // pool exhausted
    }

    emit(x, y, config) {
        const count = config.count || 1;
        for (let i = 0; i < count; i++) {
            const p = this._getParticle();
            if (!p) return;

            p.active = true;
            p.x = x + (config.spreadX || 0) * (Math.random() - 0.5);
            p.y = y + (config.spreadY || 0) * (Math.random() - 0.5);

            const angle = (config.angle || 0) + (config.angleSpread || Math.PI * 2) * (Math.random() - 0.5);
            const speed = (config.speed || 50) + (config.speedVariance || 20) * (Math.random() - 0.5);
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;

            p.life = (config.life || 0.5) + (config.lifeVariance || 0.2) * (Math.random() - 0.5);
            p.maxLife = p.life;
            p.size = (config.size || 3) + (config.sizeVariance || 1) * (Math.random() - 0.5);
            p.color = config.colors
                ? config.colors[Math.floor(Math.random() * config.colors.length)]
                : (config.color || '#fff');
            p.drag = config.drag || 0.98;
            p.gravity = config.gravity || 0;
            p.shrink = config.shrink !== false;
        }
    }

    update(dt) {
        for (const p of this.pool) {
            if (p.active) p.update(dt);
        }
    }

    draw(ctx, camera) {
        for (const p of this.pool) {
            if (p.active) p.draw(ctx, camera);
        }
    }
}

// Preset particle configs
export const PARTICLES = {
    GUNSHOT: {
        count: 8,
        speed: 200,
        speedVariance: 80,
        angleSpread: 0.8,
        life: 0.2,
        lifeVariance: 0.1,
        size: 2,
        sizeVariance: 1,
        colors: ['#ffaa33', '#ff8800', '#ffcc44'],
        drag: 0.92,
        shrink: true,
    },
    BLOOD: {
        count: 6,
        speed: 80,
        speedVariance: 40,
        angleSpread: 1.2,
        life: 0.4,
        lifeVariance: 0.2,
        size: 3,
        sizeVariance: 1.5,
        colors: ['#8b0000', '#a00000', '#cc2222'],
        drag: 0.94,
        gravity: 100,
        shrink: true,
    },
    DUST: {
        count: 4,
        speed: 30,
        speedVariance: 15,
        angleSpread: Math.PI * 2,
        life: 0.6,
        lifeVariance: 0.3,
        size: 4,
        sizeVariance: 2,
        colors: ['#8b7355', '#9b8365', '#7b6345'],
        drag: 0.96,
        shrink: true,
    },
    SMOKE: {
        count: 3,
        speed: 15,
        speedVariance: 8,
        angleSpread: Math.PI * 2,
        life: 1.0,
        lifeVariance: 0.4,
        size: 6,
        sizeVariance: 3,
        colors: ['#555555', '#666666', '#777777'],
        drag: 0.99,
        gravity: -20,
        shrink: false,
    },
    EXPLOSION: {
        count: 30,
        speed: 250,
        speedVariance: 100,
        angleSpread: Math.PI * 2,
        life: 0.5,
        lifeVariance: 0.2,
        size: 5,
        sizeVariance: 3,
        colors: ['#ff4400', '#ff8800', '#ffcc00', '#ff2200'],
        drag: 0.90,
        gravity: 50,
        shrink: true,
    },
    SPARK: {
        count: 5,
        speed: 150,
        speedVariance: 60,
        angleSpread: 0.6,
        life: 0.15,
        lifeVariance: 0.05,
        size: 1.5,
        sizeVariance: 0.5,
        colors: ['#ffdd44', '#ffffff', '#ffaa22'],
        drag: 0.90,
        shrink: true,
    },
};
