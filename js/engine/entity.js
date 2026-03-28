// Base entity class
export class Entity {
    constructor(x, y, w, h) {
        this.pos = { x, y };
        this.vel = { x: 0, y: 0 };
        this.size = { w: w || 24, h: h || 24 };
        this.facing = 0; // angle in radians
        this.faction = 'neutral';
        this.hp = 100;
        this.maxHp = 100;
        this.alive = true;
        this.active = true;
        this.sprite = null;
        this.color = '#fff'; // fallback color when no sprite
        this.zIndex = 0;
    }

    get centerX() { return this.pos.x + this.size.w / 2; }
    get centerY() { return this.pos.y + this.size.h / 2; }
    get left() { return this.pos.x; }
    get right() { return this.pos.x + this.size.w; }
    get top() { return this.pos.y; }
    get bottom() { return this.pos.y + this.size.h; }

    takeDamage(amount, source) {
        if (!this.alive) return;
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
            this.onDeath(source);
        }
    }

    onDeath(source) {
        // Override in subclasses
    }

    update(dt, game) {
        // Override in subclasses
        this.pos.x += this.vel.x * dt;
        this.pos.y += this.vel.y * dt;
    }

    draw(ctx, camera) {
        const sx = Math.floor(this.pos.x - camera.x);
        const sy = Math.floor(this.pos.y - camera.y);

        if (this.sprite) {
            // TODO: sprite rendering
        } else {
            // Fallback colored rectangle
            ctx.fillStyle = this.color;
            ctx.fillRect(sx, sy, this.size.w, this.size.h);
        }
    }

    // AABB collision check
    collidesWith(other) {
        return this.left < other.right &&
               this.right > other.left &&
               this.top < other.bottom &&
               this.bottom > other.top;
    }

    distanceTo(other) {
        const dx = this.centerX - other.centerX;
        const dy = this.centerY - other.centerY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    angleTo(other) {
        return Math.atan2(other.centerY - this.centerY, other.centerX - this.centerX);
    }
}
