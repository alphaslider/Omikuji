/**
 * OMIKUJI // PLUCK-SYNTH
 * B.A.P C.O.R.E // SYN_PLK_02
 * TEMPLATE: BEEP-GENERATOR COMPLIANT [cite: 2026-01-25]
 */

export default class PluckSynthPlugin {
    constructor(ctx) {
        this.ctx = ctx;
        this.id = ""; 
        this.name = "PLUCK-SYNTH";
        this.output = ctx.createGain();
        
        // Tracking for MONO trigger [cite: 2026-01-20]
        this.activeNodes = [];

        this.params = { 
            decay: 0.15, 
            filter: 1000, 
            mix: 0.8 
        };
    }

    noteOn(freq, time, vel) {
        // MONO trigger: kill previous voices [cite: 2026-01-20]
        this.activeNodes.forEach(node => {
            try { node.stop(time); } catch(e) {}
        });
        this.activeNodes = [];

        const osc = this.ctx.createOscillator();
        const vG = this.ctx.createGain();
        const flt = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        flt.type = 'lowpass';
        flt.frequency.setValueAtTime(this.params.filter, time);
        flt.frequency.exponentialRampToValueAtTime(100, time + this.params.decay);

        vG.gain.setValueAtTime(0, time);
        vG.gain.linearRampToValueAtTime(vel * this.params.mix, time + 0.005);
        vG.gain.exponentialRampToValueAtTime(0.001, time + this.params.decay);

        osc.connect(flt);
        flt.connect(vG);
        vG.connect(this.output);

        osc.start(time);
        osc.stop(time + this.params.decay + 0.1);
        
        this.activeNodes.push(osc);
    }

    noteOff(time) {} // MONO [cite: 2026-01-20]

    // Total Serialization [cite: 2026-01-20]
    getState() { return this.params; }
    setState(s) { 
        this.params = Object.assign(this.params, s); 
        this.renderUI(); 
    }

    renderUI(container) {
        if(container) this.ui = container;
        if(!this.ui) return;
        
        // Consistent Template Layout [cite: 2026-01-25]
        this.ui.innerHTML = `
            <div class="panel" style="background:#000;color:#fff;margin:0;display:flex;justify-content:space-between;padding:4px">
                <span class="data-font">${this.id} // ${this.name}</span>
                <span class="data-font" style="cursor:pointer;color:#f44" onclick="removeFX(window_fxR.indexOf(this.closest('.fx-slot').plugin))">DEL</span>
            </div>
            <div class="data-font" style="padding:15px; background:#fff; border:2px solid #000">
                <div style="margin-bottom:10px">PLUCK_DECAY: <input type="range" min="0.05" max="1" step="0.01" value="${this.params.decay}" 
                    oninput="this.closest('.fx-slot').plugin.params.decay=parseFloat(this.value)"></div>
                
                <div style="margin-bottom:10px">FILTER_CUTOFF: <input type="range" min="100" max="5000" step="1" value="${this.params.filter}" 
                    oninput="this.closest('.fx-slot').plugin.params.filter=parseFloat(this.value)"></div>
                
                <div>MIX_VOLUME: <input type="range" min="0" max="1" step="0.01" value="${this.params.mix}" 
                    oninput="this.closest('.fx-slot').plugin.params.mix=parseFloat(this.value)"></div>
            </div>
        `;
        this.ui.plugin = this;
    }
}