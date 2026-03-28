// A* grid pathfinding
export class Pathfinder {
    constructor(tilemap) {
        this.tilemap = tilemap;
    }

    findPath(startX, startY, endX, endY, maxLength = 30) {
        const open = [];
        const closed = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        const key = (x, y) => `${x},${y}`;
        const startKey = key(startX, startY);
        const endKey = key(endX, endY);

        gScore.set(startKey, 0);
        fScore.set(startKey, this._heuristic(startX, startY, endX, endY));
        open.push({ x: startX, y: startY, f: fScore.get(startKey) });

        const dirs = [
            { dx: 0, dy: -1, cost: 1 },
            { dx: 0, dy: 1, cost: 1 },
            { dx: -1, dy: 0, cost: 1 },
            { dx: 1, dy: 0, cost: 1 },
            { dx: -1, dy: -1, cost: 1.414 },
            { dx: 1, dy: -1, cost: 1.414 },
            { dx: -1, dy: 1, cost: 1.414 },
            { dx: 1, dy: 1, cost: 1.414 },
        ];

        while (open.length > 0) {
            // Get lowest fScore
            open.sort((a, b) => a.f - b.f);
            const current = open.shift();
            const currentKey = key(current.x, current.y);

            if (currentKey === endKey) {
                return this._reconstructPath(cameFrom, current.x, current.y);
            }

            closed.add(currentKey);

            for (const dir of dirs) {
                const nx = current.x + dir.dx;
                const ny = current.y + dir.dy;
                const nKey = key(nx, ny);

                if (closed.has(nKey)) continue;
                if (this.tilemap.isCollision(nx, ny)) continue;

                // For diagonal moves, check both cardinal neighbors to prevent corner cutting
                if (dir.dx !== 0 && dir.dy !== 0) {
                    if (this.tilemap.isCollision(current.x + dir.dx, current.y) ||
                        this.tilemap.isCollision(current.x, current.y + dir.dy)) {
                        continue;
                    }
                }

                const tentativeG = gScore.get(currentKey) + dir.cost;

                if (tentativeG > maxLength) continue;

                if (!gScore.has(nKey) || tentativeG < gScore.get(nKey)) {
                    cameFrom.set(nKey, { x: current.x, y: current.y });
                    gScore.set(nKey, tentativeG);
                    const f = tentativeG + this._heuristic(nx, ny, endX, endY);
                    fScore.set(nKey, f);

                    if (!open.find(n => key(n.x, n.y) === nKey)) {
                        open.push({ x: nx, y: ny, f });
                    }
                }
            }
        }

        return null; // No path found
    }

    _heuristic(x1, y1, x2, y2) {
        // Octile distance
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        return Math.max(dx, dy) + 0.414 * Math.min(dx, dy);
    }

    _reconstructPath(cameFrom, endX, endY) {
        const path = [{ x: endX, y: endY }];
        let k = `${endX},${endY}`;
        while (cameFrom.has(k)) {
            const prev = cameFrom.get(k);
            path.unshift(prev);
            k = `${prev.x},${prev.y}`;
        }
        return path;
    }
}
