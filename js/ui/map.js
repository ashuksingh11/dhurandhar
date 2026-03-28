import { CONFIG } from '../config.js';

// Territory control meta-map (Lyari district)
export class TerritoryMap {
    constructor() {
        this.active = false;
        this.onComplete = null;
        this.selectedSector = 0;
        this.animTimer = 0;

        // 12 sectors of Lyari
        this.sectors = [
            { id: 'market', name: 'Lyari Market', x: 0.35, y: 0.3, controlled: false, bonus: 'Buy ammo & gadgets between chapters', faction: 'baloch' },
            { id: 'mosque', name: 'Masjid Al-Noor', x: 0.5, y: 0.2, controlled: false, bonus: 'Suspicion decays 20% faster', faction: 'neutral' },
            { id: 'safehouse', name: 'Safe House', x: 0.2, y: 0.5, controlled: false, bonus: 'Extra checkpoint in missions', faction: 'neutral' },
            { id: 'docks', name: 'Lyari Docks', x: 0.75, y: 0.7, controlled: false, bonus: 'Unlock heavy weapons', faction: 'pathan' },
            { id: 'police', name: 'Police Station', x: 0.6, y: 0.4, controlled: false, bonus: 'Intel: enemy positions revealed at start', faction: 'neutral' },
            { id: 'compound', name: "Rehman's Compound", x: 0.4, y: 0.55, controlled: false, bonus: 'Access to inner circle missions', faction: 'baloch' },
            { id: 'highway', name: 'Lyari Expressway', x: 0.8, y: 0.3, controlled: false, bonus: 'Fast travel between sectors', faction: 'pathan' },
            { id: 'slums', name: 'Slum Quarter', x: 0.15, y: 0.3, controlled: false, bonus: 'Recruit informants', faction: 'baloch' },
            { id: 'bazaar', name: 'Old Bazaar', x: 0.55, y: 0.65, controlled: false, bonus: 'Disguise kit restocks', faction: 'baloch' },
            { id: 'warehouse', name: 'Warehouse District', x: 0.3, y: 0.75, controlled: false, bonus: 'Weapon cache access', faction: 'pathan' },
            { id: 'bridge', name: 'Canal Bridge', x: 0.65, y: 0.15, controlled: false, bonus: 'Escape route available', faction: 'neutral' },
            { id: 'tower', name: 'Radio Tower', x: 0.85, y: 0.5, controlled: false, bonus: 'Wiretap enemy comms', faction: 'isi' },
        ];

        // News ticker
        this.news = [
            'BREAKING: Gang violence erupts in Lyari district...',
            'Police increase patrols following recent shootings...',
            'Local businesses report extortion by unknown group...',
            'Intelligence agencies monitoring situation in Karachi...',
        ];
        this.newsIndex = 0;
        this.newsScroll = 0;
    }

    show(onComplete) {
        this.active = true;
        this.onComplete = onComplete;
        this.animTimer = 0;
    }

    claimSector(sectorId) {
        const sector = this.sectors.find(s => s.id === sectorId);
        if (sector) sector.controlled = true;
    }

    update(dt, input) {
        if (!this.active) return;

        this.animTimer += dt;
        this.newsScroll += dt * 60;

        // Navigate sectors
        if (input.justPressed('ArrowLeft') || input.justPressed('KeyA')) {
            this.selectedSector = (this.selectedSector - 1 + this.sectors.length) % this.sectors.length;
        }
        if (input.justPressed('ArrowRight') || input.justPressed('KeyD')) {
            this.selectedSector = (this.selectedSector + 1) % this.sectors.length;
        }

        // Continue
        if (input.justPressed('Enter') || input.justPressed('Space')) {
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

        // Title
        ctx.textAlign = 'center';
        ctx.fillStyle = CONFIG.COLOR_SAFFRON;
        ctx.font = 'bold 20px monospace';
        ctx.fillText('LYARI DISTRICT - TERRITORY MAP', W / 2, 30);

        // Map area
        const mapX = 50;
        const mapY = 50;
        const mapW = W - 100;
        const mapH = H - 140;

        // Map background
        ctx.fillStyle = '#151520';
        ctx.fillRect(mapX, mapY, mapW, mapH);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(mapX, mapY, mapW, mapH);

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        for (let gx = mapX; gx < mapX + mapW; gx += 40) {
            ctx.beginPath();
            ctx.moveTo(gx, mapY);
            ctx.lineTo(gx, mapY + mapH);
            ctx.stroke();
        }
        for (let gy = mapY; gy < mapY + mapH; gy += 40) {
            ctx.beginPath();
            ctx.moveTo(mapX, gy);
            ctx.lineTo(mapX + mapW, gy);
            ctx.stroke();
        }

        // Draw connections between sectors
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        const connections = [
            [0, 1], [0, 5], [1, 4], [2, 0], [2, 7], [3, 8], [3, 11],
            [4, 5], [4, 6], [5, 8], [6, 10], [7, 9], [8, 9], [10, 11]
        ];
        for (const [a, b] of connections) {
            const sa = this.sectors[a];
            const sb = this.sectors[b];
            ctx.beginPath();
            ctx.moveTo(mapX + sa.x * mapW, mapY + sa.y * mapH);
            ctx.lineTo(mapX + sb.x * mapW, mapY + sb.y * mapH);
            ctx.stroke();
        }

        // Draw sectors
        for (let i = 0; i < this.sectors.length; i++) {
            const s = this.sectors[i];
            const sx = mapX + s.x * mapW;
            const sy = mapY + s.y * mapH;
            const selected = i === this.selectedSector;
            const radius = selected ? 14 : 10;

            // Pulsing for contested
            const pulse = !s.controlled ? Math.sin(this.animTimer * 3 + i) * 0.3 + 0.7 : 1;

            // Color based on faction/control
            let color;
            if (s.controlled) {
                color = CONFIG.COLOR_SAFFRON;
            } else {
                const factionColors = { baloch: '#cc5555', pathan: '#55aa55', isi: '#5555cc', neutral: '#888' };
                color = factionColors[s.faction] || '#888';
            }

            ctx.globalAlpha = pulse;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(sx, sy, radius, 0, Math.PI * 2);
            ctx.fill();

            if (selected) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            ctx.globalAlpha = 1;

            // Label
            ctx.fillStyle = selected ? '#fff' : '#aaa';
            ctx.font = selected ? 'bold 9px monospace' : '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(s.name, sx, sy + radius + 12);
        }

        // Selected sector info
        const sel = this.sectors[this.selectedSector];
        const infoY = H - 80;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(mapX, infoY, mapW, 40);

        ctx.textAlign = 'left';
        ctx.fillStyle = sel.controlled ? CONFIG.COLOR_SAFFRON : '#cc4444';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`${sel.name} — ${sel.controlled ? 'CONTROLLED' : 'CONTESTED'}`, mapX + 10, infoY + 16);

        ctx.fillStyle = '#aaa';
        ctx.font = '10px monospace';
        ctx.fillText(`Bonus: ${sel.bonus}`, mapX + 10, infoY + 32);

        // News ticker
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, H - 25, W, 25);
        ctx.fillStyle = '#666';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        const newsText = this.news.join('   |||   ');
        const textWidth = ctx.measureText(newsText).width;
        const scrollX = -((this.newsScroll) % (textWidth + W)) + W;
        ctx.fillText(newsText, scrollX, H - 9);

        // Continue prompt
        ctx.textAlign = 'center';
        ctx.fillStyle = '#666';
        ctx.font = '10px monospace';
        ctx.fillText('A/D: Navigate sectors | SPACE: Continue to next chapter', W / 2, infoY - 8);
        ctx.textAlign = 'left';
    }
}
