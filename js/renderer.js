import { CONFIG } from './config.js';

// Canvas rendering pipeline
export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;
        this.ctx.imageSmoothingEnabled = false;
    }

    clear() {
        this.ctx.fillStyle = CONFIG.COLOR_BG;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Draw all game layers in order
    drawGame(camera, tilemap, entities, particles, player, hud, game) {
        const ctx = this.ctx;
        const cam = { x: camera.renderX, y: camera.renderY, viewW: camera.viewW, viewH: camera.viewH };

        // 1. Ground + walls
        tilemap.drawGround(ctx, cam);

        // 2. Entity shadows
        for (const e of entities) {
            if (!e.active || !e.alive) continue;
            if (!camera.isVisible(e.pos.x, e.pos.y, e.size.w, e.size.h)) continue;
            this.drawShadow(ctx, cam, e);
        }

        // 3. Entities sorted by Y (painter's algorithm for depth)
        const sortedEntities = entities
            .filter(e => e.active && camera.isVisible(e.pos.x, e.pos.y, e.size.w, e.size.h))
            .sort((a, b) => a.bottom - b.bottom);

        for (const e of sortedEntities) {
            e.draw(ctx, cam);
        }

        // 4. Particles
        particles.draw(ctx, cam);

        // 5. Overhead tiles
        tilemap.drawOverhead(ctx, cam, player.centerX, player.centerY);

        // 6. Lighting overlay
        this.drawLighting(ctx, cam, player, entities);

        // 7. HUD
        if (hud) hud.draw(ctx, game);
    }

    drawShadow(ctx, camera, entity) {
        const sx = entity.centerX - camera.x;
        const sy = entity.bottom - camera.y + 2;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(sx, sy, entity.size.w * 0.4, entity.size.h * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawLighting(ctx, camera, player, entities) {
        // Dark overlay with radial gradient for player light
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Player ambient light
        const px = player.centerX - camera.x;
        const py = player.centerY - camera.y;
        const gradient = ctx.createRadialGradient(px, py, 0, px, py, 180);
        gradient.addColorStop(0, 'rgba(0,0,0,0.4)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.globalCompositeOperation = 'source-over';
    }

    // Draw noise radius ring (for gunshots)
    drawNoiseRing(ctx, camera, x, y, radius, alpha) {
        const sx = x - camera.x;
        const sy = y - camera.y;
        ctx.strokeStyle = `rgba(255, 153, 51, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}
