// HI-HAT Synth Machine - Metallic FM Source
export default class HiHatSynth {
    constructor(ctx) {
        this.ctx = ctx;
        this.output = ctx.createGain();
        this.id = ""; 
        this.name = "";
        
        // Parameters [cite: 2026-01-20]
        this.params = {
            decay: 0.05,  // Length of the hat
            sizzle: 0.5,  // Resonance/High-frequency ring
            pitch: 4000,  // Filter center frequency
            volume: 0.7   // Gain staging
        };

        // Ratios for the metallic sound (TR-808 style)
        this.ratios = [2, 3, 4.16, 5.43, 6.79, 8.21];
    }

    noteOn(freq, time, vel) {
        const oscs = [];
        const masterGain = this.ctx.createGain();
        const highPass = this.ctx.createBiquadFilter();
        const sizzleFilter = this.ctx.createBiquadFilter();

        // 1. METALLIC SOURCE [cite: 2026-01-20]
        // Six square wave oscillators at non-harmonic ratios create the "clink"
        this.ratios.forEach(r => {
            const osc = this.ctx.createOscillator();
            osc.type = "square";
            osc.frequency.setValueAtTime(300 * r, time);
            osc.connect(masterGain);
            oscs.push(osc);
        });

        // 2. SIZZLE LOGIC [cite: 2026-01-20]
        // High-pass to remove low thump
        highPass.type = "highpass";
        highPass.frequency.setValueAtTime(7000, time);

        // Band-pass with high Q controlled by 'Sizzle' to add resonance
        sizzleFilter.type = "bandpass";
        sizzleFilter.frequency.setValueAtTime(this.params.pitch, time);
        sizzleFilter.Q.setValueAtTime(this.params.sizzle * 20, time); // Sizzle slider drives Q

        // 3. ENVELOPE [cite: 2026-01-20]
        masterGain.gain.setValueAtTime(0, time);
        masterGain.gain.linearRampToValueAtTime(vel * this.params.volume, time + 0.002);
        masterGain.gain.exponentialRampToValueAtTime(0.001, time + this.params.decay);

        // 4. SIGNAL CHAIN
        masterGain.connect(highPass);
        highPass.connect(sizzleFilter);
        sizzleFilter.connect(this.output);

        oscs.forEach(o => {
            o.start(time);
            o.stop(time + this.params.decay + 0.1);
        });
    }

    noteOff(time) {} // MONO trigger: envelopes handle sound [cite: 2026-01-20]

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
                <div style="margin-bottom:10px">DECAY: <input type="range" min="0.01" max="0.5" step="0.01" value="${this.params.decay}" oninput="this.closest('.fx-slot').plugin.params.decay=parseFloat(this.value)"></div>
                <div style="margin-bottom:10px">SIZZLE: <input type="range" min="0" max="1" step="0.01" value="${this.params.sizzle}" oninput="this.closest('.fx-slot').plugin.params.sizzle=parseFloat(this.value)"></div>
                <div style="margin-bottom:10px">BRIGHTNESS: <input type="range" min="2000" max="12000" step="10" value="${this.params.pitch}" oninput="this.closest('.fx-slot').plugin.params.pitch=parseFloat(this.value)"></div>
                <div>LEVEL: <input type="range" min="0" max="1.5" step="0.01" value="${this.params.volume}" oninput="this.closest('.fx-slot').plugin.params.volume=parseFloat(this.value)"></div>
            </div>
        `;
        this.ui.plugin = this;
    }
}