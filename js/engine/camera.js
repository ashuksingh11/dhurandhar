import { CONFIG } from '../config.js';

export class Camera {
    constructor(viewW, viewH) {
        this.x = 0;
        this.y = 0;
        this.viewW = viewW;
        this.viewH = viewH;
        this.targetX = 0;
        this.targetY = 0;
        this.shakeIntensity = 0;
        this.shakeX = 0;
        this.shakeY = 0;
        this.zoom = 1;
        this.lookAheadX = 0;
        this.lookAheadY = 0;
    }

    follow(entity, mouseX, mouseY) {
        // Center on entity
        this.targetX = entity.centerX - this.viewW / 2;
        this.targetY = entity.centerY - this.viewH / 2;

        // Look-ahead toward mouse
        const midX = this.viewW / 2;
        const midY = this.viewH / 2;
        const lookX = (mouseX - midX) / midX; // -1 to 1
        const lookY = (mouseY - midY) / midY;
        this.targetX += lookX * CONFIG.CAMERA_LOOK_AHEAD;
        this.targetY += lookY * CONFIG.CAMERA_LOOK_AHEAD;
    }

    update(dt) {
        // Smooth lerp
        this.x += (this.targetX - this.x) * CONFIG.CAMERA_LERP;
        this.y += (this.targetY - this.y) * CONFIG.CAMERA_LERP;

        // Screen shake
        if (this.shakeIntensity > 0.5) {
            this.shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
            this.shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
            this.shakeIntensity *= CONFIG.CAMERA_SHAKE_DECAY;
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
            this.shakeIntensity = 0;
        }
    }

    shake(intensity) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }

    // Clamp to map bounds
    clamp(mapWidth, mapHeight) {
        const ts = CONFIG.TILE_SIZE;
        const maxX = mapWidth * ts - this.viewW;
        const maxY = mapHeight * ts - this.viewH;
        this.x = Math.max(0, Math.min(this.x, maxX));
        this.y = Math.max(0, Math.min(this.y, maxY));
    }

    // Get render-ready position (includes shake)
    get renderX() { return Math.floor(this.x + this.shakeX); }
    get renderY() { return Math.floor(this.y + this.shakeY); }

    // Convert screen coords to world
    screenToWorld(sx, sy) {
        return { x: sx + this.renderX, y: sy + this.renderY };
    }

    // Check if a world rect is visible
    isVisible(x, y, w, h) {
        return x + w > this.x && x < this.x + this.viewW &&
               y + h > this.y && y < this.y + this.viewH;
    }
}
