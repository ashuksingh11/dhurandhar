import { CONFIG } from '../config.js';

export class Menu {
    constructor() {
        this.selectedIndex = 0;
        this.items = [
            { label: 'NEW GAME', action: 'new_game' },
            { label: 'CONTINUE', action: 'continue' },
            { label: 'CONTROLS', action: 'controls' },
        ];
        this.showControls = false;
        this.titleFlash = 0;
    }

    update(input) {
        this.titleFlash += 0.02;

        if (this.showControls) {
            if (input.justPressed('Escape') || input.justPressed('Enter') || input.mouseJustDown(0)) {
                this.showControls = false;
            }
            return null;
        }

        if (input.justPressed('ArrowUp') || input.justPressed('KeyW')) {
            this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % this.items.length;
        }
        if (input.justPressed('ArrowDown') || input.justPressed('KeyS')) {
            this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
        }
        if (input.justPressed('Enter') || input.justPressed('Space') || input.mouseJustDown(0)) {
            const action = this.items[this.selectedIndex].action;
            if (action === 'controls') {
                this.showControls = true;
                return null;
            }
            return action;
        }
        return null;
    }

    draw(ctx) {
        const W = CONFIG.CANVAS_WIDTH;
        const H = CONFIG.CANVAS_HEIGHT;

        // Background
        ctx.fillStyle = CONFIG.COLOR_BG;
        ctx.fillRect(0, 0, W, H);

        // Atmospheric gradient
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#0a0a15');
        grad.addColorStop(0.5, '#1a1a2e');
        grad.addColorStop(1, '#0a0a15');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Title
        ctx.textAlign = 'center';
        ctx.fillStyle = CONFIG.COLOR_SAFFRON;
        ctx.font = 'bold 48px monospace';
        ctx.fillText('DHURANDHAR', W / 2, H * 0.25);

        // Subtitle
        ctx.fillStyle = '#888';
        ctx.font = '16px monospace';
        ctx.fillText('SHADOWS OF LYARI', W / 2, H * 0.25 + 35);

        // Tagline
        const alpha = 0.4 + Math.sin(this.titleFlash) * 0.3;
        ctx.fillStyle = `rgba(255,153,51,${alpha})`;
        ctx.font = '11px monospace';
        ctx.fillText('"The line between patriot and monster disappears in the streets of Lyari"', W / 2, H * 0.25 + 60);

        if (this.showControls) {
            this.drawControls(ctx, W, H);
        } else {
            // Menu items
            const startY = H * 0.55;
            for (let i = 0; i < this.items.length; i++) {
                const y = startY + i * 40;
                const selected = i === this.selectedIndex;

                if (selected) {
                    ctx.fillStyle = 'rgba(255,153,51,0.15)';
                    ctx.fillRect(W / 2 - 100, y - 15, 200, 30);
                    ctx.fillStyle = CONFIG.COLOR_SAFFRON;
                    ctx.font = 'bold 18px monospace';
                    ctx.fillText(`> ${this.items[i].label} <`, W / 2, y + 5);
                } else {
                    ctx.fillStyle = '#888';
                    ctx.font = '16px monospace';
                    ctx.fillText(this.items[i].label, W / 2, y + 5);
                }
            }

            // Footer
            ctx.fillStyle = '#444';
            ctx.font = '10px monospace';
            ctx.fillText('Based on Dhurandhar (2025) & Dhurandhar: The Revenge (2026)', W / 2, H - 20);
        }

        ctx.textAlign = 'left';
    }

    drawControls(ctx, W, H) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(W / 2 - 200, H * 0.35, 400, 280);
        ctx.strokeStyle = CONFIG.COLOR_SAFFRON;
        ctx.lineWidth = 2;
        ctx.strokeRect(W / 2 - 200, H * 0.35, 400, 280);

        ctx.fillStyle = CONFIG.COLOR_SAFFRON;
        ctx.font = 'bold 16px monospace';
        ctx.fillText('CONTROLS', W / 2, H * 0.35 + 30);

        const controls = [
            ['WASD', 'Move'],
            ['SHIFT', 'Sprint'],
            ['SPACE', 'Dodge Roll'],
            ['LMB', 'Attack / Shoot'],
            ['RMB', 'Block / Parry'],
            ['TAB', 'Toggle Identity'],
            ['1-4', 'Switch Weapon'],
            ['E', 'Interact'],
            ['ESC', 'Pause'],
            ['R', 'Reload'],
        ];

        ctx.font = '12px monospace';
        let cy = H * 0.35 + 60;
        for (const [key, desc] of controls) {
            ctx.fillStyle = CONFIG.COLOR_SAFFRON;
            ctx.textAlign = 'right';
            ctx.fillText(key, W / 2 - 10, cy);
            ctx.fillStyle = '#ccc';
            ctx.textAlign = 'left';
            ctx.fillText(desc, W / 2 + 10, cy);
            cy += 22;
        }

        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        ctx.font = '10px monospace';
        ctx.fillText('Press any key to return', W / 2, H * 0.35 + 268);
        ctx.textAlign = 'left';
    }
}
