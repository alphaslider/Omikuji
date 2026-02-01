// BOOM-808 Synth Machine
export default class Boom808 {
    constructor(ctx) {
        this.ctx = ctx;
        this.output = ctx.createGain();
        this.id = ""; 
        this.name = "";
        
        // Parameters [cite: 2026-01-20]
        this.params = {
            tone: 0.1,    // Initial punch (pitch envelope speed)
            release: 0.8, // Tail length
            pitch: 55,    // Base frequency (A1)
            dist: 0.2     // Symmetical clipping
        };
    }

    noteOn(freq, time, vel) {
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        const shaper = this.ctx.createWaveShaper();

        // 1. DISTORTION CURVE (Soft Clipping) [cite: 2026-01-20]
        const amount = this.params.dist * 100;
        const curve = new Float32Array(44100);
        const deg = Math.PI / 180;
        for (let i = 0; i < 44100; ++i) {
            const x = i * 2 / 44100 - 1;
            curve[i] = (3 + amount) * x * 20 * deg / (Math.PI + amount * Math.abs(x));
        }
        shaper.curve = curve;

        // 2. OSCILLATOR SETUP
        osc.type = 'sine';
        // Pitch Envelope: Starts high for the "knock" and drops to base pitch [cite: 2026-01-20]
        osc.frequency.setValueAtTime(this.params.pitch * 2, time);
        osc.frequency.exponentialRampToValueAtTime(this.params.pitch, time + this.params.tone);

        // 3. AMPLITUDE ENVELOPE (Release)
        oscGain.gain.setValueAtTime(vel, time);
        oscGain.gain.exponentialRampToValueAtTime(0.001, time + this.params.release);

        // 4. SIGNAL CHAIN
        osc.connect(shaper);
        shaper.connect(oscGain);
        oscGain.connect(this.output);

        osc.start(time);
        osc.stop(time + this.params.release + 0.1);
    }

    // MONO trigger lock [cite: 2026-01-20]
    noteOff(time) {}

    getState() { return this.params; }
    
    setState(s) { 
        this.params = s; 
        this.renderUI();
    }

    renderUI(container) {
        if(container) this.ui = container;
        if(!this.ui) return;
        
        this.ui.innerHTML = `
            <div class="panel" style="background:#000;color:#fff;margin:0;display:flex;justify-content:space-between;padding:4px">
                <span class="data-font">${this.id} // ${this.name}</span>
                <span class="data-font" style="cursor:pointer;color:#f44" onclick="removeFX(window_fxR.indexOf(this.closest('.fx-slot').plugin))">DEL</span>
            </div>
            <div class="data-font" style="padding:15px; background:#fff; border:2px solid #000">
                <div style="margin-bottom:10px">TONE_PUNCH: <input type="range" min="0.01" max="0.3" step="0.01" value="${this.params.tone}" oninput="this.closest('.fx-slot').plugin.params.tone=parseFloat(this.value)"></div>
                <div style="margin-bottom:10px">RELEASE: <input type="range" min="0.1" max="2.0" step="0.01" value="${this.params.release}" oninput="this.closest('.fx-slot').plugin.params.release=parseFloat(this.value)"></div>
                <div style="margin-bottom:10px">PITCH: <input type="range" min="30" max="100" step="1" value="${this.params.pitch}" oninput="this.closest('.fx-slot').plugin.params.pitch=parseFloat(this.value)"></div>
                <div>DISTORTION: <input type="range" min="0" max="1" step="0.01" value="${this.params.dist}" oninput="this.closest('.fx-slot').plugin.params.dist=parseFloat(this.value)"></div>
            </div>
        `;
        this.ui.plugin = this;
    }
}