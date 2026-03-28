import { CONFIG } from '../config.js';

export class BriefingScreen {
    constructor() {
        this.active = false;
        this.chapter = 0;
        this.title = '';
        this.subtitle = '';
        this.objectives = [];
        this.location = '';
        this.briefingText = '';
        this.onComplete = null;
        this.animTimer = 0;
        this.fadeIn = 0;
    }

    show(data, onComplete) {
        this.active = true;
        this.chapter = data.chapter || 1;
        this.title = data.title || '';
        this.subtitle = data.subtitle || '';
        this.objectives = data.objectives || [];
        this.location = data.location || '';
        this.briefingText = data.briefingText || '';
        this.onComplete = onComplete;
        this.animTimer = 0;
        this.fadeIn = 0;
    }

    update(dt, input) {
        if (!this.active) return;

        this.animTimer += dt;
        this.fadeIn = Math.min(1, this.animTimer / 1.5);

        // Skip after 2 seconds
        if (this.animTimer > 2 && (input.mouseJustDown(0) || input.justPressed('Space') || input.justPressed('Enter'))) {
            this.active = false;
            if (this.onComplete) this.onComplete();
        }
    }

    draw(ctx) {
        if (!this.active) return;

        const W = CONFIG.CANVAS_WIDTH;
        const H = CONFIG.CANVAS_HEIGHT;

        // Background
        ctx.fillStyle = '#0a0a15';
        ctx.fillRect(0, 0, W, H);

        // Scan lines effect
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        for (let y = 0; y < H; y += 3) {
            ctx.fillRect(0, y, W, 1);
        }

        const alpha = this.fadeIn;
        ctx.globalAlpha = alpha;

        // Chapter number
        ctx.textAlign = 'center';
        ctx.fillStyle = '#555';
        ctx.font = '14px monospace';
        ctx.fillText(`CHAPTER ${this.chapter}`, W / 2, H * 0.2);

        // Title
        ctx.fillStyle = CONFIG.COLOR_SAFFRON;
        ctx.font = 'bold 36px monospace';
        ctx.fillText(this.title.toUpperCase(), W / 2, H * 0.3);

        // Subtitle
        ctx.fillStyle = '#888';
        ctx.font = '14px monospace';
        ctx.fillText(this.subtitle, W / 2, H * 0.3 + 30);

        // Location
        ctx.fillStyle = '#666';
        ctx.font = '12px monospace';
        ctx.fillText(`Location: ${this.location}`, W / 2, H * 0.45);

        // Divider
        ctx.strokeStyle = 'rgba(255,153,51,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(W * 0.3, H * 0.5);
        ctx.lineTo(W * 0.7, H * 0.5);
        ctx.stroke();

        // Briefing text
        ctx.fillStyle = CONFIG.COLOR_TEXT;
        ctx.font = '12px monospace';
        ctx.fillText(this.briefingText, W / 2, H * 0.56);

        // Objectives
        ctx.textAlign = 'left';
        ctx.fillStyle = CONFIG.COLOR_SAFFRON;
        ctx.font = 'bold 12px monospace';
        ctx.fillText('OBJECTIVES:', W * 0.25, H * 0.65);

        ctx.fillStyle = '#ccc';
        ctx.font = '12px monospace';
        let oy = H * 0.65 + 22;
        for (const obj of this.objectives) {
            ctx.fillText(`[ ] ${obj}`, W * 0.25 + 10, oy);
            oy += 20;
        }

        // Continue prompt
        if (this.animTimer > 2) {
            const blink = Math.sin(Date.now() / 400) > 0;
            if (blink) {
                ctx.textAlign = 'center';
                ctx.fillStyle = '#666';
                ctx.font = '11px monospace';
                ctx.fillText('Press SPACE to begin mission', W / 2, H * 0.9);
            }
        }

        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
    }
}
