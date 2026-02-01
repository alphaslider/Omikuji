/**
 * OMIKUJI // CHORUS-MODULATOR
 * B.A.P C.O.R.E // MOD_CHO_01
 * TEMPLATE: BEEP-GENERATOR COMPLIANT [cite: 2026-01-25]
 */

export default class ChorusPlugin {
    constructor(ctx) {
        this.ctx = ctx;
        this.id = ""; 
        this.name = "CHORUS-MOD";
        
        this.input = ctx.createGain();
        this.output = ctx.createGain();

        // Parameters [cite: 2026-01-20]
        this.params = {
            speed: 1.5,   // LFO Frequency (Hz)
            depth: 0.002, // Modulation depth (Seconds)
            width: 0.5,   // Stereo spread/offset
            mix: 0.5      // Wet/Dry
        };

        // Internal Nodes
        this.dryGain = ctx.createGain();
        this.wetGain = ctx.createGain();
        
        // Dual delay lines for thick chorus
        this.delayL = ctx.createDelay(0.1);
        this.delayR = ctx.createDelay(0.1);
        
        // LFOs
        this.lfo = ctx.createOscillator();
        this.lfoGainL = ctx.createGain();
        this.lfoGainR = ctx.createGain();

        // Routing
        this.input.connect(this.dryGain);
        this.dryGain.connect(this.output);

        this.input.connect(this.delayL);
        this.input.connect(this.delayR);
        
        this.delayL.connect(this.wetGain);
        this.delayR.connect(this.wetGain);
        this.wetGain.connect(this.output);

        // LFO Modulation (Phase offset for stereo width)
        this.lfo.connect(this.lfoGainL);
        this.lfo.connect(this.lfoGainR);
        this.lfoGainL.connect(this.delayL.delayTime);
        this.lfoGainR.connect(this.delayR.delayTime);

        this.lfo.start();
        this.updateNodes();
    }

    updateNodes() {
        const now = this.ctx.currentTime;
        const ramp = 0.05;

        this.lfo.frequency.setTargetAtTime(this.params.speed, now, ramp);
        
        // LFO Depth
        this.lfoGainL.gain.setTargetAtTime(this.params.depth, now, ramp);
        // Phase inversion/offset for R channel width
        this.lfoGainR.gain.setTargetAtTime(this.params.depth * (1 - this.params.width), now, ramp);

        this.wetGain.gain.setTargetAtTime(this.params.mix, now, ramp);
        this.dryGain.gain.setTargetAtTime(1 - this.params.mix, now, ramp);
    }

    // Total Serialization [cite: 2026-01-20]
    getState() { return this.params; }
    setState(s) { 
        this.params = Object.assign(this.params, s); 
        this.updateNodes();
        this.renderUI(); 
    }

    renderUI(container) {
        if(container) this.ui = container;
        if(!this.ui) return;
        
        // Mint Template with Data Font [cite: 2026-01-19, 2026-01-25]
        this.ui.innerHTML = `
            <div class="panel" style="background:#000;color:#fff;margin:0;display:flex;justify-content:space-between;padding:4px">
                <span class="data-font">${this.id} // ${this.name}</span>
                <span class="data-font" style="cursor:pointer;color:#f44" onclick="removeFX(window_fxR.indexOf(this.closest('.fx-slot').plugin))">DEL</span>
            </div>
            <div class="data-font" style="padding:15px; background:#fff; border:2px solid #000">
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <div>SPEED: <input type="range" min="0.1" max="10" step="0.01" value="${this.params.speed}" 
                        oninput="let p=this.closest('.fx-slot').plugin; p.params.speed=parseFloat(this.value); p.updateNodes()" style="width:100%"></div>
                    
                    <div>DEPTH: <input type="range" min="0" max="0.02" step="0.0001" value="${this.params.depth}" 
                        oninput="let p=this.closest('.fx-slot').plugin; p.params.depth=parseFloat(this.value); p.updateNodes()" style="width:100%"></div>
                    
                    <div>WIDTH: <input type="range" min="0" max="1" step="0.01" value="${this.params.width}" 
                        oninput="let p=this.closest('.fx-slot').plugin; p.params.width=parseFloat(this.value); p.updateNodes()" style="width:100%"></div>
                    
                    <div>WET_MIX: <input type="range" min="0" max="1" step="0.01" value="${this.params.mix}" 
                        oninput="let p=this.closest('.fx-slot').plugin; p.params.mix=parseFloat(this.value); p.updateNodes()" style="width:100%"></div>
                </div>
            </div>
        `;
        this.ui.plugin = this;
    }
}