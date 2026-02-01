// BEEP-GENERATOR Synth Machine
export default class BeepSynth {
    constructor(ctx) {
        this.ctx = ctx;
        this.output = ctx.createGain();
        this.id = ""; 
        this.name = "BEEP-GENERATOR";
        
        // Parameters [cite: 2026-01-20]
        this.params = {
            shape: 0,    // 0: Sine, 0.5: Triangle, 1: Square
            lfo: 0,      // Vibrato speed/depth
            reverb: 0.1  // Tail width and decay
        };
    }

    noteOn(freq, time, vel) {
        const osc = this.ctx.createOscillator();
        const vca = this.ctx.createGain();
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();

        // 1. WAVE SHAPE LOGIC [cite: 2026-01-20]
        const types = ['sine', 'triangle', 'square'];
        let typeIndex = Math.floor(this.params.shape * 2.9);
        osc.type = types[typeIndex];
        osc.frequency.setValueAtTime(freq, time);

        // 2. LFO (VIBRATO) [cite: 2026-01-20]
        lfo.frequency.setValueAtTime(this.params.lfo * 10, time);
        lfoGain.gain.setValueAtTime(this.params.lfo * 20, time);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(time);

        // 3. ENVELOPE (Controlled by Reverb param for tail)
        vca.gain.setValueAtTime(0, time);
        vca.gain.linearRampToValueAtTime(vel * 0.5, time + 0.01);
        // "Tight" reverb = short decay, "Big Wide" = long decay [cite: 2026-01-20]
        vca.gain.exponentialRampToValueAtTime(0.001, time + 0.1 + (this.params.reverb * 3));

        osc.connect(vca);
        vca.connect(this.output);

        osc.start(time);
        osc.stop(time + 0.2 + (this.params.reverb * 3.1));
        lfo.stop(time + 0.2 + (this.params.reverb * 3.1));
    }

    noteOff(time) {} // MONO [cite: 2026-01-20]

    getState() { return this.params; }
    setState(s) { this.params = s; this.renderUI(); }

    renderUI(container) {
        if(container) this.ui = container;
        if(!this.ui) return;
        
        this.ui.innerHTML = `
            <div class="panel" style="background:#000;color:#fff;margin:0;display:flex;justify-content:space-between;padding:4px">
                <span class="data-font">${this.id} // ${this.name}</span>
                <span class="data-font" style="cursor:pointer;color:#f44" onclick="removeFX(window_fxR.indexOf(this.closest('.fx-slot').plugin))">DEL</span>
            </div>
            <div class="data-font" style="padding:15px; background:#fff; border:2px solid #000">
                <div style="margin-bottom:10px">SHAPE (SIN/TRI/SQ): <input type="range" min="0" max="1" step="0.01" value="${this.params.shape}" oninput="this.closest('.fx-slot').plugin.params.shape=parseFloat(this.value)"></div>
                <div style="margin-bottom:10px">LFO_VIBRATO: <input type="range" min="0" max="1" step="0.01" value="${this.params.lfo}" oninput="this.closest('.fx-slot').plugin.params.lfo=parseFloat(this.value)"></div>
                <div>REVERB_TAIL: <input type="range" min="0.01" max="1" step="0.01" value="${this.params.reverb}" oninput="this.closest('.fx-slot').plugin.params.reverb=parseFloat(this.value)"></div>
            </div>
        `;
        this.ui.plugin = this;
    }
}