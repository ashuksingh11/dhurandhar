import { CONFIG } from '../config.js';

// Physics: collision detection, raycasting, noise
export class Physics {
    constructor(tilemap) {
        this.tilemap = tilemap;
    }

    // Check if a point is inside a solid tile
    isSolid(x, y) {
        const tx = Math.floor(x / CONFIG.TILE_SIZE);
        const ty = Math.floor(y / CONFIG.TILE_SIZE);
        return this.tilemap.isCollision(tx, ty);
    }

    // Check if entity can move to position
    canMoveTo(entity, nx, ny) {
        // Check all four corners of the entity bounding box
        const pad = 2; // small inset to prevent edge sticking
        return !this.isSolid(nx + pad, ny + pad) &&
               !this.isSolid(nx + entity.size.w - pad, ny + pad) &&
               !this.isSolid(nx + pad, ny + entity.size.h - pad) &&
               !this.isSolid(nx + entity.size.w - pad, ny + entity.size.h - pad);
    }

    // Move entity with wall sliding
    moveEntity(entity, dt) {
        const nx = entity.pos.x + entity.vel.x * dt;
        const ny = entity.pos.y + entity.vel.y * dt;

        // Try full move
        if (this.canMoveTo(entity, nx, ny)) {
            entity.pos.x = nx;
            entity.pos.y = ny;
            return;
        }

        // Try X only (wall slide)
        if (this.canMoveTo(entity, nx, entity.pos.y)) {
            entity.pos.x = nx;
            return;
        }

        // Try Y only (wall slide)
        if (this.canMoveTo(entity, entity.pos.x, ny)) {
            entity.pos.y = ny;
        }
    }

    // DDA Raycast on tile grid
    // Returns { hit: bool, x, y, tileX, tileY, distance }
    raycast(ox, oy, angle, maxDist) {
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        const ts = CONFIG.TILE_SIZE;

        let tileX = Math.floor(ox / ts);
        let tileY = Math.floor(oy / ts);

        const stepX = dx > 0 ? 1 : -1;
        const stepY = dy > 0 ? 1 : -1;

        const tDeltaX = dx !== 0 ? Math.abs(ts / dx) : Infinity;
        const tDeltaY = dy !== 0 ? Math.abs(ts / dy) : Infinity;

        let tMaxX = dx !== 0
            ? ((dx > 0 ? (tileX + 1) * ts - ox : ox - tileX * ts)) / Math.abs(dx)
            : Infinity;
        let tMaxY = dy !== 0
            ? ((dy > 0 ? (tileY + 1) * ts - oy : oy - tileY * ts)) / Math.abs(dy)
            : Infinity;

        let dist = 0;

        while (dist < maxDist) {
            if (tMaxX < tMaxY) {
                dist = tMaxX;
                tMaxX += tDeltaX;
                tileX += stepX;
            } else {
                dist = tMaxY;
                tMaxY += tDeltaY;
                tileY += stepY;
            }

            if (dist > maxDist) break;

            if (this.tilemap.isCollision(tileX, tileY)) {
                return {
                    hit: true,
                    x: ox + dx * dist,
                    y: oy + dy * dist,
                    tileX,
                    tileY,
                    distance: dist
                };
            }
        }

        return {
            hit: false,
            x: ox + dx * maxDist,
            y: oy + dy * maxDist,
            distance: maxDist
        };
    }

    // Check if entity A can see entity B (line of sight)
    hasLineOfSight(a, b) {
        const angle = a.angleTo(b);
        const dist = a.distanceTo(b);
        const result = this.raycast(a.centerX, a.centerY, angle, dist);
        return !result.hit;
    }

    // AABB overlap check between two entities
    checkCollision(a, b) {
        return a.collidesWith(b);
    }

    // Get all entities within radius
    entitiesInRadius(entities, x, y, radius) {
        const r2 = radius * radius;
        return entities.filter(e => {
            const dx = e.centerX - x;
            const dy = e.centerY - y;
            return dx * dx + dy * dy <= r2;
        });
    }
}
