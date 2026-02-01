/**
 * OMIKUJI // ISO-3_CORE
 * 3-BAND DJ ISOLATOR // FLAT-RESPONSE CALIBRATED
 * TEMPLATE: CHORUS-MOD COMPLIANT [cite: 2026-01-25]
 */

export default class Iso3Isolator {
    constructor(ctx) {
        this.ctx = ctx;
        this.id = ""; 
        this.name = "ISO-3_CORE";
        
        this.input = ctx.createGain();
        this.output = ctx.createGain();

        // CALIBRATED FOR FLAT RESPONSE [cite: 2026-01-20]
        this.params = {
            low: 1.0,    // Unity
            mid: 1.0,    // Unity
            high: 1.0,   // Unity
            lowFreq: 320,
            highFreq: 3200
        };

        // Dual-stacked Biquads for 24dB/oct Linkwitz-Riley
        this.lowLp1 = ctx.createBiquadFilter(); this.lowLp2 = ctx.createBiquadFilter();
        this.highHp1 = ctx.createBiquadFilter(); this.highHp2 = ctx.createBiquadFilter();
        this.midHp1 = ctx.createBiquadFilter(); this.midHp2 = ctx.createBiquadFilter();
        this.midLp1 = ctx.createBiquadFilter(); this.midLp2 = ctx.createBiquadFilter();

        this.gLow = ctx.createGain();
        this.gMid = ctx.createGain();
        this.gHigh = ctx.createGain();

        this.setupRouting();
        this.updateNodes();
    }

    setupRouting() {
        const n = [this.lowLp1, this.lowLp2, this.highHp1, this.highHp2, this.midHp1, this.midHp2, this.midLp1, this.midLp2];
        // Set Q to 0.5 for Linkwitz-Riley alignment (Butterworth squared)
        n.forEach(f => f.Q.value = 0.5);

        this.lowLp1.type = this.lowLp2.type = "lowpass";
        this.highHp1.type = this.highHp2.type = "highpass";
        this.midHp1.type = this.midHp2.type = "highpass";
        this.midLp1.type = this.midLp2.type = "lowpass";

        // Connection Graph
        this.input.connect(this.lowLp1); this.lowLp1.connect(this.lowLp2); this.lowLp2.connect(this.gLow);
        this.input.connect(this.highHp1); this.highHp1.connect(this.highHp2); this.highHp2.connect(this.gHigh);
        this.input.connect(this.midHp1); this.midHp1.connect(this.midHp2); 
        this.midHp2.connect(this.midLp1); this.midLp1.connect(this.midLp2); this.midLp2.connect(this.gMid);

        this.gLow.connect(this.output);
        this.gMid.connect(this.output);
        this.gHigh.connect(this.output);
    }

    updateNodes() {
        const now = this.ctx.currentTime;
        const ramp = 0.02; // Faster ramp for DJ-style performance

        // Precision frequency alignment
        this.lowLp1.frequency.setTargetAtTime(this.params.lowFreq, now, ramp);
        this.lowLp2.frequency.setTargetAtTime(this.params.lowFreq, now, ramp);
        this.midHp1.frequency.setTargetAtTime(this.params.lowFreq, now, ramp);
        this.midHp2.frequency.setTargetAtTime(this.params.lowFreq, now, ramp);

        this.highHp1.frequency.setTargetAtTime(this.params.highFreq, now, ramp);
        this.highHp2.frequency.setTargetAtTime(this.params.highFreq, now, ramp);
        this.midLp1.frequency.setTargetAtTime(this.params.highFreq, now, ramp);
        this.midLp2.frequency.setTargetAtTime(this.params.highFreq, now, ramp);

        // Gain values (1.0 = 0dB/Flat)
        this.gLow.gain.setTargetAtTime(this.params.low, now, ramp);
        this.gMid.gain.setTargetAtTime(this.params.mid, now, ramp);
        this.gHigh.gain.setTargetAtTime(this.params.high, now, ramp);
    }

    getState() { return this.params; }
    setState(s) { 
        this.params = Object.assign(this.params, s); 
        this.updateNodes();
        this.renderUI(); 
    }

    renderUI(container) {
        if(container) this.ui = container;
        if(!this.ui) return;
        this.ui.plugin = this;
        
        this.ui.innerHTML = `
            <div class="panel" style="background:#000;color:#fff;margin:0;display:flex;justify-content:space-between;padding:4px">
                <span class="data-font">${this.id} // ${this.name}</span>
                <span class="data-font" style="cursor:pointer;color:#f44" onclick="removeFX(window_fxR.indexOf(this.closest('.fx-slot').plugin))">DEL</span>
            </div>
            <div class="data-font" style="padding:15px; background:#fff; border:2px solid #000">
                <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:15px; text-align:center;">
                    <div>
                        <input type="range" min="0" max="1" step="0.01" value="${this.params.low}" 
                            oninput="let p=this.closest('.fx-slot').plugin; p.params.low=parseFloat(this.value); p.updateNodes()" 
                            style="appearance: slider-vertical; height:80px; width:25px; accent-color:#000">
                        <div style="margin-top:8px; font-size:9px">LOW</div>
                    </div>
                    <div>
                        <input type="range" min="0" max="1" step="0.01" value="${this.params.mid}" 
                            oninput="let p=this.closest('.fx-slot').plugin; p.params.mid=parseFloat(this.value); p.updateNodes()" 
                            style="appearance: slider-vertical; height:80px; width:25px; accent-color:#000">
                        <div style="margin-top:8px; font-size:9px">MID</div>
                    </div>
                    <div>
                        <input type="range" min="0" max="1" step="0.01" value="${this.params.high}" 
                            oninput="let p=this.closest('.fx-slot').plugin; p.params.high=parseFloat(this.value); p.updateNodes()" 
                            style="appearance: slider-vertical; height:80px; width:25px; accent-color:#000">
                        <div style="margin-top:8px; font-size:9px">HIGH</div>
                    </div>
                </div>
            </div>
        `;
    }
}