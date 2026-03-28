// Save/Load system using LocalStorage
const SAVE_KEY = 'dhurandhar_save';
const MAX_SLOTS = 3;

export class SaveSystem {
    static save(slot, data) {
        const saves = SaveSystem.getAllSaves();
        saves[slot] = {
            ...data,
            timestamp: Date.now(),
            version: 1,
        };
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
            return true;
        } catch (e) {
            console.warn('Save failed:', e);
            return false;
        }
    }

    static load(slot) {
        const saves = SaveSystem.getAllSaves();
        return saves[slot] || null;
    }

    static getAllSaves() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }

    static deleteSave(slot) {
        const saves = SaveSystem.getAllSaves();
        delete saves[slot];
        localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
    }

    static getSlotSummary(slot) {
        const data = SaveSystem.load(slot);
        if (!data) return null;
        return {
            chapter: data.chapter || 1,
            suspicionBaseline: data.suspicionBaseline || 0,
            territories: data.territories || 0,
            timestamp: data.timestamp,
            dateStr: new Date(data.timestamp).toLocaleDateString(),
        };
    }

    // Auto-save game state
    static autoSave(game) {
        const data = {
            chapter: game.currentChapter || 1,
            suspicionBaseline: game.suspicionSystem ? game.suspicionSystem.baselineIncrease : 0,
            territories: game.territoryMap ? game.territoryMap.sectors.filter(s => s.controlled).map(s => s.id) : [],
            weapons: game.player ? game.player.weapons : ['fists', 'knife'],
            ammo: game.player ? game.player.ammo : {},
            choices: game.choices || {},
            score: game.score || 0,
        };
        return SaveSystem.save('auto', data);
    }
}
