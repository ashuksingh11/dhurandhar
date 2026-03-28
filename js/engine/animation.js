// Sprite animation state machine
export class Animation {
    constructor(frames, frameDuration, loop = true) {
        this.frames = frames; // array of frame data
        this.frameDuration = frameDuration; // seconds per frame
        this.loop = loop;
        this.timer = 0;
        this.frameIndex = 0;
        this.finished = false;
    }

    update(dt) {
        if (this.finished) return;
        this.timer += dt;
        if (this.timer >= this.frameDuration) {
            this.timer -= this.frameDuration;
            this.frameIndex++;
            if (this.frameIndex >= this.frames.length) {
                if (this.loop) {
                    this.frameIndex = 0;
                } else {
                    this.frameIndex = this.frames.length - 1;
                    this.finished = true;
                }
            }
        }
    }

    get currentFrame() {
        return this.frames[this.frameIndex];
    }

    reset() {
        this.frameIndex = 0;
        this.timer = 0;
        this.finished = false;
    }
}

// Animation state machine for entities
export class AnimationController {
    constructor() {
        this.states = {};
        this.currentState = null;
        this.currentAnim = null;
    }

    addState(name, animation) {
        this.states[name] = animation;
        if (!this.currentState) this.setState(name);
    }

    setState(name) {
        if (this.currentState === name) return;
        if (this.states[name]) {
            this.currentState = name;
            this.currentAnim = this.states[name];
            this.currentAnim.reset();
        }
    }

    update(dt) {
        if (this.currentAnim) this.currentAnim.update(dt);
    }

    get frame() {
        return this.currentAnim ? this.currentAnim.currentFrame : null;
    }

    get finished() {
        return this.currentAnim ? this.currentAnim.finished : true;
    }
}
