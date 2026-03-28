// Input manager - keyboard, mouse, touch
export class Input {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this.keysJustPressed = {};
        this.keysJustReleased = {};
        this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0 };
        this.mouseButtons = {};
        this.mouseJustPressed = {};
        this.mouseJustReleased = {};
        this._prevKeys = {};
        this._prevMouse = {};

        this._bindEvents();
    }

    _bindEvents() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Tab') e.preventDefault();
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            this.mouseButtons[e.button] = true;
        });

        this.canvas.addEventListener('mouseup', (e) => {
            this.mouseButtons[e.button] = false;
        });

        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Prevent focus loss
        window.addEventListener('blur', () => {
            this.keys = {};
            this.mouseButtons = {};
        });
    }

    update() {
        // Compute just pressed / just released
        this.keysJustPressed = {};
        this.keysJustReleased = {};
        for (const code in this.keys) {
            if (this.keys[code] && !this._prevKeys[code]) this.keysJustPressed[code] = true;
            if (!this.keys[code] && this._prevKeys[code]) this.keysJustReleased[code] = true;
        }
        for (const code in this._prevKeys) {
            if (!this.keys[code] && this._prevKeys[code]) this.keysJustReleased[code] = true;
        }

        this.mouseJustPressed = {};
        this.mouseJustReleased = {};
        for (const btn in this.mouseButtons) {
            if (this.mouseButtons[btn] && !this._prevMouse[btn]) this.mouseJustPressed[btn] = true;
            if (!this.mouseButtons[btn] && this._prevMouse[btn]) this.mouseJustReleased[btn] = true;
        }
        for (const btn in this._prevMouse) {
            if (!this.mouseButtons[btn] && this._prevMouse[btn]) this.mouseJustReleased[btn] = true;
        }

        this._prevKeys = { ...this.keys };
        this._prevMouse = { ...this.mouseButtons };
    }

    isDown(code) {
        return !!this.keys[code];
    }

    justPressed(code) {
        return !!this.keysJustPressed[code];
    }

    isMouseDown(button = 0) {
        return !!this.mouseButtons[button];
    }

    mouseJustDown(button = 0) {
        return !!this.mouseJustPressed[button];
    }

    updateWorldMouse(camera) {
        this.mouse.worldX = this.mouse.x + camera.x;
        this.mouse.worldY = this.mouse.y + camera.y;
    }
}
