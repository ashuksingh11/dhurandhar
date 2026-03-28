import { CONFIG } from '../config.js';

// Suspicion system - manages cover identity integrity
export class SuspicionSystem {
    constructor(player, identitySystem) {
        this.player = player;
        this.identity = identitySystem;
        this.level = 0; // 0-100
        this.baselineIncrease = 0; // permanent increase after each blow
        this.decayRate = CONFIG.SUSPICION_DECAY_RATE;
        this.frozen = false; // stop decay during events
        this.inRestrictedArea = false;
        this.inSafeZone = false;

        // Thresholds
        this.hostileTriggered = false;
        this.testTriggered = false;
        this.blownTriggered = false;

        // Events log for HUD feedback
        this.recentEvents = [];
    }

    // Add suspicion with reason
    add(amount, reason) {
        this.level = Math.min(CONFIG.SUSPICION_MAX, this.level + amount);
        this.player.suspicion = this.level;
        this.recentEvents.push({ amount, reason, time: Date.now() });

        // Keep only recent events
        if (this.recentEvents.length > 5) this.recentEvents.shift();

        this.checkThresholds();
    }

    // Reduce suspicion
    reduce(amount, reason) {
        this.level = Math.max(this.baselineIncrease, this.level - Math.abs(amount));
        this.player.suspicion = this.level;
    }

    update(dt, game) {
        // Natural decay
        if (!this.frozen && !this.inRestrictedArea && this.level > this.baselineIncrease) {
            const rate = this.inSafeZone ? this.decayRate * 2 : this.decayRate;
            this.level = Math.max(this.baselineIncrease, this.level - rate * dt);
            this.player.suspicion = this.level;
        }

        // Restricted area continuous suspicion
        if (this.inRestrictedArea && this.identity.isJaskirat) {
            this.add(CONFIG.SUSPICION_RESTRICTED_AREA * dt * 10, 'restricted area');
        }

        // Clean up old events
        const now = Date.now();
        this.recentEvents = this.recentEvents.filter(e => now - e.time < 3000);

        // Reset threshold triggers when level drops
        if (this.level < CONFIG.SUSPICION_HOSTILE_THRESHOLD) this.hostileTriggered = false;
        if (this.level < CONFIG.SUSPICION_TEST_THRESHOLD) this.testTriggered = false;
    }

    checkThresholds() {
        if (this.level >= CONFIG.SUSPICION_HOSTILE_THRESHOLD && !this.hostileTriggered) {
            this.hostileTriggered = true;
            return 'hostile'; // NPCs become wary
        }
        if (this.level >= CONFIG.SUSPICION_TEST_THRESHOLD && !this.testTriggered) {
            this.testTriggered = true;
            return 'test'; // Loyalty test triggered
        }
        if (this.level >= CONFIG.SUSPICION_BLOWN_THRESHOLD && !this.blownTriggered) {
            this.blownTriggered = true;
            this.baselineIncrease = Math.min(50, this.baselineIncrease + 10);
            return 'blown'; // Cover blown!
        }
        return null;
    }

    // Event handlers - called by game systems
    onKillAlly() {
        this.add(CONFIG.SUSPICION_KILL_ALLY, 'killed an ally');
    }

    onKillCivilian() {
        this.add(CONFIG.SUSPICION_CIVILIAN_KILL, 'killed a civilian');
    }

    onSpyActionSpotted() {
        this.add(CONFIG.SUSPICION_SPY_SPOTTED, 'spy action spotted');
    }

    onCoverAction() {
        this.reduce(CONFIG.SUSPICION_COVER_ACTION, 'cover action');
    }

    onDisguiseUsed() {
        this.reduce(CONFIG.SUSPICION_DISGUISE_KIT, 'disguise kit');
    }

    onEnteredRestrictedArea() {
        this.inRestrictedArea = true;
    }

    onLeftRestrictedArea() {
        this.inRestrictedArea = false;
    }

    onEnteredSafeZone() {
        this.inSafeZone = true;
    }

    onLeftSafeZone() {
        this.inSafeZone = false;
    }

    get isHostile() { return this.level >= CONFIG.SUSPICION_HOSTILE_THRESHOLD; }
    get isTest() { return this.level >= CONFIG.SUSPICION_TEST_THRESHOLD; }
    get isBlown() { return this.level >= CONFIG.SUSPICION_BLOWN_THRESHOLD; }
}
