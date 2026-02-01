/**
 * OMIKUJI // LUSH-REVERB
 * B.A.P C.O.R.E // MOD_REV_01
 * TEMPLATE: BEEP-GENERATOR COMPLIANT
 */

export default class LushReverbPlugin {
    constructor(ctx) {
        this.ctx = ctx;
        this.id = ""; 
        this.name = "LUSH-REVERB";
        
        // Internal Nodes
        this.input = ctx.createGain();
        this.output = ctx.createGain();
        this.reverbNode = ctx.createConvolver();
        this.wetGain = ctx.createGain();
        this.dryGain = ctx.createGain();

        // Parameters [cite: 2026-01-20]
        this.params = {
            roomSize: 2.5,  // Duration in seconds
            damping: 0.5,   // High-end absorption
            wet: 0.4        // Mix ratio
        };

        // Routing
        this.input.connect(this.dryGain);
        this.dryGain.connect(this.output);
        this.input.connect(this.reverbNode);
        this.reverbNode.connect(this.wetGain);
        this.wetGain.connect(this.output);

        this.rebuildImpulse();
        this.updateNodes();
    }

    // DSP Logic
    updateNodes() {
        const now = this.ctx.currentTime;
        this.wetGain.gain.setTargetAtTime(this.params.wet, now, 0.05);
        this.dryGain.gain.setTargetAtTime(1 - this.params.wet, now, 0.05);
    }

    rebuildImpulse() {
        const sampleRate = this.ctx.sampleRate;
        const length = Math.floor(sampleRate * Math.max(0.1, this.params.roomSize));
        const impulse = this.ctx.createBuffer(2, length, sampleRate);
        for (let i = 0; i < 2; i++) {
            const channel = impulse.getChannelData(i);
            for (let j = 0; j < length; j++) {
                const decay = Math.pow(1 - j / length, 1 / (1 - this.params.damping * 0.9));
                channel[j] = (Math.random() * 2 - 1) * decay;
            }
        }
        this.reverbNode.buffer = impulse;
    }

    // Total Serialization [cite: 2026-01-20]
    getState() { return this.params; }
    setState(s) { 
        this.params = s; 
        this.rebuildImpulse();
        this.updateNodes();
        this.renderUI(); 
    }

    renderUI(container) {
        if(container) this.ui = container;
        if(!this.ui) return;
        
        // Match BeepSynth Layout [cite: 2026-01-19]
        this.ui.innerHTML = `
            <div class="panel" style="background:#000;color:#fff;margin:0;display:flex;justify-content:space-between;padding:4px">
                <span class="data-font">${this.id} // ${this.name}</span>
                <span class="data-font" style="cursor:pointer;color:#f44" onclick="removeFX(window_fxR.indexOf(this.closest('.fx-slot').plugin))">DEL</span>
            </div>
            <div class="data-font" style="padding:15px; background:#fff; border:2px solid #000">
                <div style="margin-bottom:10px">ROOM_SIZE: <input type="range" min="0.1" max="8" step="0.1" value="${this.params.roomSize}" 
                    oninput="let p=this.closest('.fx-slot').plugin; p.params.roomSize=parseFloat(this.value); p.rebuildImpulse()"></div>
                
                <div style="margin-bottom:10px">DAMPING: <input type="range" min="0" max="0.95" step="0.01" value="${this.params.damping}" 
                    oninput="let p=this.closest('.fx-slot').plugin; p.params.damping=parseFloat(this.value); p.rebuildImpulse()"></div>
                
                <div>WET_MIX: <input type="range" min="0" max="1" step="0.01" value="${this.params.wet}" 
                    oninput="let p=this.closest('.fx-slot').plugin; p.params.wet=parseFloat(this.value); p.updateNodes()"></div>
            </div>
        `;
        this.ui.plugin = this;
    }
}