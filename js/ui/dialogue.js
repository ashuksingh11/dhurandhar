import { CONFIG } from '../config.js';

export class DialogueSystem {
    constructor() {
        this.active = false;
        this.lines = [];
        this.lineIndex = 0;
        this.charIndex = 0;
        this.typewriterTimer = 0;
        this.typewriterSpeed = 30; // ms per char
        this.currentText = '';
        this.displayText = '';
        this.speaker = '';
        this.speakerColor = '#fff';
        this.choices = null;
        this.selectedChoice = 0;
        this.choiceTimer = 0;
        this.choiceTimeout = 0;
        this.onComplete = null;
        this.onChoice = null;

        // Portraits
        this.portraits = {
            hamza: { color: '#66aacc', label: 'HAMZA' },
            jaskirat: { color: CONFIG.COLOR_SAFFRON, label: 'JASKIRAT' },
            sanyal: { color: '#44aa88', label: 'SANYAL' },
            rehman: { color: '#cc4444', label: 'REHMAN' },
            aalam: { color: '#8888aa', label: 'AALAM' },
            chaudhary: { color: '#aa8844', label: 'CHAUDHARY' },
            yalina: { color: '#cc88aa', label: 'YALINA' },
            iqbal: { color: '#5555cc', label: 'MAJOR IQBAL' },
            narrator: { color: '#888', label: '' },
        };
    }

    start(dialogueData, onComplete) {
        this.active = true;
        this.lines = dialogueData.lines || [];
        this.lineIndex = 0;
        this.onComplete = onComplete;
        this.onChoice = dialogueData.onChoice || null;
        this._loadLine();
    }

    _loadLine() {
        if (this.lineIndex >= this.lines.length) {
            this.end();
            return;
        }

        const line = this.lines[this.lineIndex];
        this.speaker = line.speaker || 'narrator';
        this.currentText = line.text || '';
        this.displayText = '';
        this.charIndex = 0;
        this.typewriterTimer = 0;

        const portrait = this.portraits[this.speaker] || this.portraits.narrator;
        this.speakerColor = portrait.color;

        // Choices
        if (line.choices) {
            this.choices = line.choices;
            this.selectedChoice = 0;
            this.choiceTimeout = line.choiceTimeout || 0;
            this.choiceTimer = this.choiceTimeout;
        } else {
            this.choices = null;
        }
    }

    update(dt, input) {
        if (!this.active) return;

        // Typewriter effect
        if (this.charIndex < this.currentText.length) {
            this.typewriterTimer += dt * 1000;
            while (this.typewriterTimer >= this.typewriterSpeed && this.charIndex < this.currentText.length) {
                this.typewriterTimer -= this.typewriterSpeed;
                this.charIndex++;
                this.displayText = this.currentText.substring(0, this.charIndex);
            }

            // Skip typewriter on click
            if (input.mouseJustDown(0) || input.justPressed('Space') || input.justPressed('Enter')) {
                this.charIndex = this.currentText.length;
                this.displayText = this.currentText;
            }
            return;
        }

        // Text fully displayed
        if (this.choices) {
            // Choice mode
            if (input.justPressed('ArrowUp') || input.justPressed('KeyW')) {
                this.selectedChoice = Math.max(0, this.selectedChoice - 1);
            }
            if (input.justPressed('ArrowDown') || input.justPressed('KeyS')) {
                this.selectedChoice = Math.min(this.choices.length - 1, this.selectedChoice + 1);
            }

            // Timed choice countdown
            if (this.choiceTimeout > 0) {
                this.choiceTimer -= dt * 1000;
                if (this.choiceTimer <= 0) {
                    // Default to last (worst) option
                    this.selectChoice(this.choices.length - 1);
                    return;
                }
            }

            if (input.justPressed('Enter') || input.justPressed('Space') || input.mouseJustDown(0)) {
                this.selectChoice(this.selectedChoice);
            }
        } else {
            // Advance on click
            if (input.mouseJustDown(0) || input.justPressed('Space') || input.justPressed('Enter')) {
                this.lineIndex++;
                this._loadLine();
            }
        }
    }

    selectChoice(index) {
        const choice = this.choices[index];
        if (this.onChoice) this.onChoice(choice.id || index, choice);
        this.choices = null;
        this.lineIndex++;
        this._loadLine();
    }

    end() {
        this.active = false;
        if (this.onComplete) this.onComplete();
    }

    draw(ctx) {
        if (!this.active) return;

        const W = CONFIG.CANVAS_WIDTH;
        const H = CONFIG.CANVAS_HEIGHT;
        const boxH = 160;
        const boxY = H - boxH;

        // Darken top
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(0, 0, W, boxY);

        // Dialogue box
        ctx.fillStyle = 'rgba(10,10,20,0.92)';
        ctx.fillRect(0, boxY, W, boxH);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, boxY);
        ctx.lineTo(W, boxY);
        ctx.stroke();

        // Portrait
        const portrait = this.portraits[this.speaker] || this.portraits.narrator;
        const portX = 20;
        const portY = boxY + 15;
        const portSize = 60;

        ctx.fillStyle = portrait.color;
        ctx.fillRect(portX, portY, portSize, portSize);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.strokeRect(portX, portY, portSize, portSize);

        // Speaker initial
        ctx.fillStyle = '#111';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(portrait.label.charAt(0) || '?', portX + portSize / 2, portY + portSize / 2 + 8);

        // Speaker name
        ctx.fillStyle = portrait.color;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(portrait.label, portX + portSize + 15, boxY + 28);

        // Dialogue text
        ctx.fillStyle = CONFIG.COLOR_TEXT;
        ctx.font = '13px monospace';
        this._wrapText(ctx, this.displayText, portX + portSize + 15, boxY + 48, W - portX - portSize - 40, 18);

        // Choices
        if (this.choices && this.charIndex >= this.currentText.length) {
            const choiceX = portX + portSize + 15;
            let choiceY = boxY + 90;

            for (let i = 0; i < this.choices.length; i++) {
                const selected = i === this.selectedChoice;
                ctx.fillStyle = selected ? CONFIG.COLOR_SAFFRON : '#888';
                ctx.font = selected ? 'bold 12px monospace' : '12px monospace';
                const prefix = selected ? '> ' : '  ';
                ctx.fillText(`${prefix}${this.choices[i].text}`, choiceX, choiceY);
                choiceY += 20;
            }

            // Timer
            if (this.choiceTimeout > 0) {
                const secs = Math.ceil(this.choiceTimer / 1000);
                ctx.fillStyle = secs <= 2 ? CONFIG.COLOR_DANGER : CONFIG.COLOR_SUSPICION_LOW;
                ctx.font = 'bold 14px monospace';
                ctx.textAlign = 'right';
                ctx.fillText(`${secs}s`, W - 20, boxY + 95);
                ctx.textAlign = 'left';
            }
        }

        // Continue indicator
        if (!this.choices && this.charIndex >= this.currentText.length) {
            const blink = Math.sin(Date.now() / 300) > 0;
            if (blink) {
                ctx.fillStyle = '#666';
                ctx.font = '10px monospace';
                ctx.textAlign = 'right';
                ctx.fillText('Click to continue...', W - 20, H - 10);
                ctx.textAlign = 'left';
            }
        }
    }

    _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let cy = y;

        for (const word of words) {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && line.length > 0) {
                ctx.fillText(line.trim(), x, cy);
                line = word + ' ';
                cy += lineHeight;
            } else {
                line = testLine;
            }
        }
        if (line.trim()) ctx.fillText(line.trim(), x, cy);
    }
}
