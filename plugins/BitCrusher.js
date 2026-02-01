/**
 * OMIKUJI // BIT-CRUSHER
 * B.A.P C.O.R.E // MOD_CRUSH_01
 * TEMPLATE: BEEP-GENERATOR COMPLIANT [cite: 2026-01-25]
 */

export default class BitCrusherPlugin {
    constructor(ctx) {
        this.ctx = ctx;
        this.id = ""; 
        this.name = "BIT-CRUSHER";
        this.input = ctx.createGain();
        this.output = ctx.createGain();
        
        // Parameters [cite: 2026-01-20]
        this.params = { amount: 1.0, bitDepth: 8, sampleRate: 0.5, mix: 1.0 };

        // Processing Logic
        this.phasor = 0;
        this.lastL = 0;
        this.lastR = 0;

        // ScriptProcessor for procedural crushing
        this.node = ctx.createScriptProcessor(1024, 2, 2);
        this.node.onaudioprocess = (e) => {
            const inL = e.inputBuffer.getChannelData(0);
            const inR = e.inputBuffer.getChannelData(1);
            const outL = e.outputBuffer.getChannelData(0);
            const outR = e.outputBuffer.getChannelData(1);

            const step = Math.pow(0.5, this.params.bitDepth);
            const sr = this.params.sampleRate;

            for (let i = 0; i < inL.length; i++) {
                this.phasor += sr;
                if (this.phasor >= 1.0) {
                    this.phasor -= 1.0;
                    this.lastL = step * Math.floor((inL[i] * this.params.amount) / step + 0.5);
                    this.lastR = step * Math.floor((inR[i] * this.params.amount) / step + 0.5);
                }
                outL[i] = (this.lastL * this.params.mix) + (inL[i] * (1 - this.params.mix));
                outR[i] = (this.lastR * this.params.mix) + (inR[i] * (1 - this.params.mix));
            }
        };

        this.input.connect(this.node);
        this.node.connect(this.output);
    }

    // Total Serialization [cite: 2026-01-20]
    getState() { return this.params; }
    setState(s) { 
        this.params = Object.assign(this.params, s); 
        this.renderUI(); 
    }

    renderUI(container) {
        if(container) this.ui = container;
        if(!this.ui) return;
        
        // Apply consistent Data font and Beep template layout [cite: 2026-01-19, 2026-01-25]
        this.ui.innerHTML = `
            <div class="panel" style="background:#000;color:#fff;margin:0;display:flex;justify-content:space-between;padding:4px">
                <span class="data-font">${this.id} // ${this.name}</span>
                <span class="data-font" style="cursor:pointer;color:#f44" onclick="removeFX(window_fxR.indexOf(this.closest('.fx-slot').plugin))">DEL</span>
            </div>
            <div class="data-font" style="padding:15px; background:#fff; border:2px solid #000">
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <div>DRIVE: <input type="range" min="1" max="10" step="0.1" value="${this.params.amount}" 
                        oninput="this.closest('.fx-slot').plugin.params.amount=parseFloat(this.value)" style="width:100%"></div>
                    
                    <div>BITS: <input type="range" min="1" max="16" step="1" value="${this.params.bitDepth}" 
                        oninput="this.closest('.fx-slot').plugin.params.bitDepth=parseFloat(this.value)" style="width:100%"></div>
                    
                    <div>SR_RED: <input type="range" min="0.01" max="1" step="0.01" value="${this.params.sampleRate}" 
                        oninput="this.closest('.fx-slot').plugin.params.sampleRate=parseFloat(this.value)" style="width:100%"></div>
                    
                    <div>MIX: <input type="range" min="0" max="1" step="0.01" value="${this.params.mix}" 
                        oninput="this.closest('.fx-slot').plugin.params.mix=parseFloat(this.value)" style="width:100%"></div>
                </div>
            </div>
        `;
        this.ui.plugin = this;
    }
}