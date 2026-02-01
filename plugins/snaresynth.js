// SNAR-E Synth Machine - Template Conformed
export default class SnareSynth {
    constructor(ctx) {
        this.ctx = ctx;
        this.output = ctx.createGain();
        this.id = ""; // Assigned by host
        this.name = ""; // Assigned by host
        
        // Parameters [cite: 2026-01-20]
        this.params = {
            tone: 0.3,   // Body/Thump length
            pitch: 180,  // Base frequency
            snap: 0.5,   // Noise volume
            decay: 0.2   // Snap/Noise tail length
        };
    }

    noteOn(freq, time, vel) {
        // --- THE BODY (Triangle Thump) ---
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(this.params.pitch, time);
        // Fast pitch drop for the "crack"
        osc.frequency.exponentialRampToValueAtTime(0.01, time + (this.params.tone * 0.2));

        oscGain.gain.setValueAtTime(vel * 0.4, time);
        oscGain.gain.exponentialRampToValueAtTime(0.001, time + this.params.tone);

        osc.connect(oscGain);
        oscGain.connect(this.output);

        // --- THE SNAP (High-Passed Noise) ---
        const bufferSize = this.ctx.sampleRate * 2; // 2 sec buffer max
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(1200, time);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(vel * this.params.snap, time);
        // Decay controls the tail of the noise [cite: 2026-01-20]
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + this.params.decay);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.output);

        osc.start(time);
        osc.stop(time + this.params.tone + 0.1);
        noise.start(time);
        noise.stop(time + this.params.decay + 0.1);
    }

    // MONO trigger lock: envelopes handle overlap [cite: 2026-01-20]
    noteOff(time) {}

    getState() { return this.params; }
    
    setState(s) { 
        this.params = s; 
        this.renderUI();
    }

    renderUI(container) {
        if(container) this.ui = container;
        if(!this.ui) return;
        
        // Consistent Layout with Header and DEL button [cite: 2026-01-20]
        this.ui.innerHTML = `
            <div class="panel" style="background:#000;color:#fff;margin:0;display:flex;justify-content:space-between;padding:4px">
                <span class="data-font">${this.id} // ${this.name}</span>
                <span class="data-font" style="cursor:pointer;color:#f44" onclick="removeFX(window_fxR.indexOf(this.closest('.fx-slot').plugin))">DEL</span>
            </div>
            <div class="data-font" style="padding:15px; background:#fff; border:2px solid #000">
                <div style="margin-bottom:10px">TONE_DECAY: <input type="range" min="0.01" max="0.5" step="0.01" value="${this.params.tone}" oninput="this.closest('.fx-slot').plugin.params.tone=parseFloat(this.value)"></div>
                <div style="margin-bottom:10px">PITCH: <input type="range" min="80" max="400" step="1" value="${this.params.pitch}" oninput="this.closest('.fx-slot').plugin.params.pitch=parseFloat(this.value)"></div>
                <div style="margin-bottom:10px">SNAP_LEVEL: <input type="range" min="0" max="1" step="0.01" value="${this.params.snap}" oninput="this.closest('.fx-slot').plugin.params.snap=parseFloat(this.value)"></div>
                <div>SNAP_DECAY: <input type="range" min="0.01" max="1" step="0.01" value="${this.params.decay}" oninput="this.closest('.fx-slot').plugin.params.decay=parseFloat(this.value)"></div>
            </div>
        `;
        this.ui.plugin = this;
    }
}