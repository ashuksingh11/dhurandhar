// Web Audio API manager
export class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.ambientGain = null;
        this.initialized = false;
        this.currentMusic = null;

        // Procedural sound generators
        this.sounds = {};
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = 0.5;

            this.musicGain = this.ctx.createGain();
            this.musicGain.connect(this.masterGain);
            this.musicGain.gain.value = 0.3;

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.connect(this.masterGain);
            this.sfxGain.gain.value = 0.6;

            this.ambientGain = this.ctx.createGain();
            this.ambientGain.connect(this.masterGain);
            this.ambientGain.gain.value = 0.2;

            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio not available:', e);
        }
    }

    // Generate procedural sounds (no audio files needed)
    playSFX(type) {
        if (!this.initialized) this.init();
        if (!this.ctx) return;

        switch (type) {
            case 'punch': this._playNoise(0.05, 200, 80, this.sfxGain); break;
            case 'hit': this._playNoise(0.08, 150, 60, this.sfxGain); break;
            case 'gunshot': this._playNoise(0.1, 400, 100, this.sfxGain); break;
            case 'explosion': this._playNoise(0.4, 100, 30, this.sfxGain); break;
            case 'dodge': this._playTone(0.05, 300, 600, 'sine', this.sfxGain); break;
            case 'parry': this._playTone(0.08, 800, 400, 'square', this.sfxGain); break;
            case 'identity_switch': this._playTone(0.15, 200, 500, 'sine', this.sfxGain); break;
            case 'suspicion_up': this._playTone(0.1, 300, 500, 'sawtooth', this.sfxGain); break;
            case 'alert': this._playTone(0.2, 600, 800, 'square', this.sfxGain); break;
            case 'death': this._playTone(0.5, 400, 100, 'sawtooth', this.sfxGain); break;
            case 'pickup': this._playTone(0.1, 400, 800, 'sine', this.sfxGain); break;
            case 'menu_select': this._playTone(0.05, 500, 700, 'sine', this.sfxGain); break;
            case 'footstep': this._playNoise(0.02, 100, 50, this.sfxGain, 0.1); break;
        }
    }

    // Play a tension drone for stealth sections
    playAmbientDrone() {
        if (!this.initialized) this.init();
        if (!this.ctx || this.currentMusic) return;

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.value = 55; // Low A
        osc2.type = 'sine';
        osc2.frequency.value = 82.5; // Low E

        lfo.type = 'sine';
        lfo.frequency.value = 0.2; // Slow modulation
        lfoGain.gain.value = 5;

        lfo.connect(lfoGain);
        lfoGain.connect(osc1.frequency);
        lfoGain.connect(osc2.frequency);

        osc1.connect(this.musicGain);
        osc2.connect(this.musicGain);

        osc1.start();
        osc2.start();
        lfo.start();

        this.currentMusic = { osc1, osc2, lfo };
    }

    stopMusic() {
        if (this.currentMusic) {
            try {
                this.currentMusic.osc1.stop();
                this.currentMusic.osc2.stop();
                this.currentMusic.lfo.stop();
            } catch (e) {}
            this.currentMusic = null;
        }
    }

    _playTone(duration, startFreq, endFreq, type, destination) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    _playNoise(duration, highFreq, lowFreq, destination, volume = 0.3) {
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(highFreq, this.ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(lowFreq, this.ctx.currentTime + duration);
        filter.Q.value = 1;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(destination);
        source.start();
    }

    setMasterVolume(v) { if (this.masterGain) this.masterGain.gain.value = v; }
    setMusicVolume(v) { if (this.musicGain) this.musicGain.gain.value = v; }
    setSFXVolume(v) { if (this.sfxGain) this.sfxGain.gain.value = v; }
}
