import { CONFIG } from '../config.js';

export class HUD {
    constructor() {
        this.notifications = [];
    }

    notify(text, duration = 2000) {
        this.notifications.push({ text, timer: duration, maxTimer: duration });
    }

    draw(ctx, game) {
        const player = game.player;
        if (!player) return;

        const W = CONFIG.CANVAS_WIDTH;
        const H = CONFIG.CANVAS_HEIGHT;

        // ---- Top Left: Identity + Health + Suspicion ----

        // Identity label
        const identity = player.identity === 'hamza' ? 'HAMZA' : 'JASKIRAT';
        const idColor = player.identity === 'hamza' ? '#66aacc' : CONFIG.COLOR_SAFFRON;

        // Identity box
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(10, 10, 130, 60);
        ctx.strokeStyle = idColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 130, 60);

        // Identity portrait placeholder
        ctx.fillStyle = idColor;
        ctx.fillRect(15, 15, 40, 50);
        ctx.fillStyle = '#111';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(player.identity === 'hamza' ? 'H' : 'J', 35, 45);

        // Identity name
        ctx.fillStyle = idColor;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(identity, 62, 28);

        // Health bar
        const hpW = 72;
        const hpH = 8;
        const hpX = 62;
        const hpY = 35;
        ctx.fillStyle = '#333';
        ctx.fillRect(hpX, hpY, hpW, hpH);
        const hpRatio = player.hp / player.maxHp;
        const hpColor = hpRatio > 0.5 ? '#44cc44' : hpRatio > 0.25 ? '#ccaa44' : '#cc4444';
        ctx.fillStyle = hpColor;
        ctx.fillRect(hpX, hpY, hpW * hpRatio, hpH);
        // Pulse when low
        if (hpRatio < 0.25) {
            ctx.fillStyle = `rgba(255,0,0,${0.3 + Math.sin(Date.now() / 200) * 0.2})`;
            ctx.fillRect(hpX, hpY, hpW * hpRatio, hpH);
        }
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(hpX, hpY, hpW, hpH);

        // HP text
        ctx.fillStyle = '#ddd';
        ctx.font = '8px monospace';
        ctx.fillText(`${Math.ceil(player.hp)}/${player.maxHp}`, hpX + 2, hpY + 7);

        // Suspicion bar
        const susW = 72;
        const susH = 8;
        const susX = 62;
        const susY = 50;
        ctx.fillStyle = '#333';
        ctx.fillRect(susX, susY, susW, susH);
        const susRatio = player.suspicion / CONFIG.SUSPICION_MAX;
        const susColor = susRatio < 0.5
            ? CONFIG.COLOR_SUSPICION_LOW
            : this._lerpColor(CONFIG.COLOR_SUSPICION_LOW, CONFIG.COLOR_SUSPICION_HIGH, (susRatio - 0.5) * 2);
        ctx.fillStyle = susColor;
        ctx.fillRect(susX, susY, susW * susRatio, susH);
        if (susRatio >= 0.75) {
            ctx.fillStyle = `rgba(220,20,60,${0.3 + Math.sin(Date.now() / 150) * 0.3})`;
            ctx.fillRect(susX, susY, susW * susRatio, susH);
        }
        ctx.strokeStyle = '#555';
        ctx.strokeRect(susX, susY, susW, susH);

        // Suspicion label
        ctx.fillStyle = '#aaa';
        ctx.font = '8px monospace';
        ctx.fillText(`SUS ${Math.floor(player.suspicion)}%`, susX + 2, susY + 7);

        // ---- Top Right: Chapter + Minimap ----
        const chTitle = game.chapterTitle || 'Lyari Streets';
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(W - 150, 10, 140, 20);
        ctx.fillStyle = CONFIG.COLOR_SAFFRON;
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(chTitle, W - 16, 24);
        ctx.textAlign = 'left';

        // Minimap
        this.drawMinimap(ctx, game, W - 100, 40, 90, 70);

        // ---- Bottom: Weapon bar ----
        this.drawWeaponBar(ctx, game, player);

        // ---- Controls hint ----
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '9px monospace';
        ctx.fillText('WASD:Move  LMB:Attack  RMB:Block  SPACE:Dodge  TAB:Identity', 10, H - 8);

        // ---- Notifications ----
        this.drawNotifications(ctx);

        // ---- Cover blown overlay ----
        if (player.suspicion >= CONFIG.SUSPICION_BLOWN_THRESHOLD) {
            ctx.strokeStyle = `rgba(255,0,0,${0.4 + Math.sin(Date.now() / 100) * 0.3})`;
            ctx.lineWidth = 8;
            ctx.strokeRect(0, 0, W, H);

            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 20px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('COVER BLOWN', W / 2, 90);
            ctx.textAlign = 'left';
        }
    }

    drawMinimap(ctx, game, x, y, w, h) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);

        if (!game.tilemap) return;

        const tm = game.tilemap;
        const scaleX = w / (tm.width * CONFIG.TILE_SIZE);
        const scaleY = h / (tm.height * CONFIG.TILE_SIZE);

        // Draw walls
        for (let row = 0; row < tm.height; row++) {
            for (let col = 0; col < tm.width; col++) {
                if (tm.isCollision(col, row)) {
                    ctx.fillStyle = '#555';
                    ctx.fillRect(
                        x + col * CONFIG.TILE_SIZE * scaleX,
                        y + row * CONFIG.TILE_SIZE * scaleY,
                        Math.max(1, CONFIG.TILE_SIZE * scaleX),
                        Math.max(1, CONFIG.TILE_SIZE * scaleY)
                    );
                }
            }
        }

        // Player dot
        if (game.player) {
            ctx.fillStyle = CONFIG.COLOR_SAFFRON;
            ctx.fillRect(
                x + game.player.centerX * scaleX - 1,
                y + game.player.centerY * scaleY - 1, 3, 3
            );
        }

        // Enemy dots
        if (game.entities) {
            for (const e of game.entities) {
                if (!e.alive || e === game.player) continue;
                if (e.faction === CONFIG.FACTIONS.NEUTRAL) {
                    ctx.fillStyle = '#888';
                } else {
                    ctx.fillStyle = '#cc4444';
                }
                ctx.fillRect(
                    x + e.centerX * scaleX - 1,
                    y + e.centerY * scaleY - 1, 2, 2
                );
            }
        }
    }

    drawWeaponBar(ctx, game, player) {
        const W = CONFIG.CANVAS_WIDTH;
        const H = CONFIG.CANVAS_HEIGHT;
        const barY = H - 45;
        const slotW = 50;
        const slotH = 30;
        const gap = 5;
        const totalW = player.weapons.length * (slotW + gap);
        const startX = (W - totalW) / 2;

        for (let i = 0; i < player.weapons.length; i++) {
            const sx = startX + i * (slotW + gap);
            const selected = i === player.currentWeapon;

            ctx.fillStyle = selected ? 'rgba(255,153,51,0.3)' : 'rgba(0,0,0,0.5)';
            ctx.fillRect(sx, barY, slotW, slotH);
            ctx.strokeStyle = selected ? CONFIG.COLOR_SAFFRON : '#555';
            ctx.lineWidth = selected ? 2 : 1;
            ctx.strokeRect(sx, barY, slotW, slotH);

            // Weapon name
            ctx.fillStyle = selected ? '#fff' : '#aaa';
            ctx.font = '9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(player.weapons[i] || '---', sx + slotW / 2, barY + 13);

            // Key hint
            ctx.fillStyle = '#666';
            ctx.font = '8px monospace';
            ctx.fillText(`${i + 1}`, sx + slotW / 2, barY + 25);
        }

        ctx.textAlign = 'left';
    }

    drawNotifications(ctx) {
        const W = CONFIG.CANVAS_WIDTH;
        let ny = 120;

        this.notifications = this.notifications.filter(n => {
            n.timer -= 16; // approximate
            return n.timer > 0;
        });

        for (const n of this.notifications) {
            const alpha = Math.min(1, n.timer / 500);
            ctx.fillStyle = `rgba(255,153,51,${alpha})`;
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(n.text, W / 2, ny);
            ny += 20;
        }
        ctx.textAlign = 'left';
    }

    _lerpColor(a, b, t) {
        const ah = parseInt(a.slice(1), 16);
        const bh = parseInt(b.slice(1), 16);
        const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
        const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
        const rr = Math.round(ar + (br - ar) * t);
        const rg = Math.round(ag + (bg - ag) * t);
        const rb = Math.round(ab + (bb - ab) * t);
        return `rgb(${rr},${rg},${rb})`;
    }
}
