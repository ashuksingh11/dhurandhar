import { CONFIG } from '../config.js';

// Dual Identity System: Hamza (cover) vs Jaskirat (spy)
export class IdentitySystem {
    constructor(player) {
        this.player = player;
        this.current = 'hamza'; // 'hamza' | 'jaskirat'
        this.switchCooldown = 0;
        this.switchAnimTimer = 0;

        // Hamza-specific
        this.coverActions = ['cigarette', 'greet', 'carry_crates', 'pray'];
        this.activeCoverAction = null;
        this.coverActionTimer = 0;

        // Jaskirat-specific
        this.gadgets = {
            listeningDevice: 3,
            camera: 2,
            lockpick: 5,
            smokeBomb: 2,
            disguiseKit: 1,
        };

        // Available weapons per identity
        this.hamzaWeapons = ['fists', 'knife', 'pistol'];
        this.jaskiratWeapons = ['fists', 'knife', 'pistol', 'ak47'];
    }

    toggle() {
        if (this.switchCooldown > 0) return;

        this.current = this.current === 'hamza' ? 'jaskirat' : 'hamza';
        this.player.identity = this.current;
        this.switchCooldown = 500; // ms
        this.switchAnimTimer = 300;

        // Update available weapons
        this.player.weapons = this.current === 'hamza'
            ? [...this.hamzaWeapons]
            : [...this.jaskiratWeapons];

        // Clamp weapon index
        if (this.player.currentWeapon >= this.player.weapons.length) {
            this.player.currentWeapon = 0;
        }

        return this.current;
    }

    update(dt) {
        if (this.switchCooldown > 0) this.switchCooldown -= dt * 1000;
        if (this.switchAnimTimer > 0) this.switchAnimTimer -= dt * 1000;
        if (this.coverActionTimer > 0) {
            this.coverActionTimer -= dt * 1000;
            if (this.coverActionTimer <= 0) this.activeCoverAction = null;
        }
    }

    // Perform a cover action (Hamza mode only)
    performCoverAction(action) {
        if (this.current !== 'hamza') return false;
        if (!this.coverActions.includes(action)) return false;
        if (this.activeCoverAction) return false;

        this.activeCoverAction = action;
        this.coverActionTimer = 2000; // 2 seconds to perform
        return true;
    }

    // Use a gadget (Jaskirat mode only)
    useGadget(gadget) {
        if (this.current !== 'jaskirat') return false;
        if (!this.gadgets[gadget] || this.gadgets[gadget] <= 0) return false;

        this.gadgets[gadget]--;
        return true;
    }

    get isHamza() { return this.current === 'hamza'; }
    get isJaskirat() { return this.current === 'jaskirat'; }
    get isSwitching() { return this.switchAnimTimer > 0; }
}
