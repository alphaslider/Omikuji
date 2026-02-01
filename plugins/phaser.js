/**
 * OMIKUJI // PHASE-6_CORE
 * 6-STAGE ANALOG-MODELED PHASER
 * TEMPLATE: ISO-3_CORE COMPLIANT [cite: 2026-01-25]
 */

export default class Phase6Phaser {
    constructor(ctx) {
        this.ctx = ctx;
        this.id = ""; 
        this.name = "PHASE-6_CORE";
        
        this.input = ctx.createGain();
        this.output = ctx.createGain();
        this.dryGain = ctx.createGain();
        this.wetGain = ctx.createGain();
        this.feedbackGain = ctx.createGain();

        this.params = {
            rate: 0.5,      // LFO Speed (Hz)
            depth: 1000,    // Sweep Range (Hz)
            baseFreq: 600,  // Center Frequency
            feedback: 0.7,  // Resonance
            mix: 0.5        // Wet/Dry balance
        };

        // 6-Stage All-pass Chain [cite: 2026-01-20]
        this.stages = [];
        for (let i = 0; i < 6; i++) {
            let filter = ctx.createBiquadFilter();
            filter.type = "allpass";
            filter.Q.value = 0.5;
            this.stages.push(filter);
        }

        // Modulation Engine
        this.lfo = ctx.createOscillator();
        this.lfoGain = ctx.createGain();
        this.lfo.type = "sine";
        
        this.setupRouting();
        this.updateNodes();
        this.lfo.start();
    }

    setupRouting() {
        // Parallel Dry Path
        this.input.connect(this.dryGain);
        this.dryGain.connect(this.output);

        // Wet Path (Chain)
        this.input.connect(this.stages[0]);
        for (let i = 0; i < 5; i++) {
            this.stages[i].connect(this.stages[i + 1]);
        }
        
        // Feedback loop
        this.stages[5].connect(this.feedbackGain);
        this.feedbackGain.connect(this.stages[0]);

        // Wet Mix
        this.stages[5].connect(this.wetGain);
        this.wetGain.connect(this.output);

        // LFO connections to filter frequencies
        this.lfo.connect(this.lfoGain);
        this.stages.forEach(f => {
            this.lfoGain.connect(f.frequency);
        });
    }

    updateNodes() {
        const now = this.ctx.currentTime;
        const ramp = 0.05;

        this.lfo.frequency.setTargetAtTime(this.params.rate, now, ramp);
        this.lfoGain.gain.setTargetAtTime(this.params.depth, now, ramp);

        this.stages.forEach(f => {
            f.frequency.setTargetAtTime(this.params.baseFreq, now, ramp);
        });

        this.feedbackGain.gain.setTargetAtTime(this.params.feedback, now, ramp);
        
        // Equal Power Crossfade
        this.dryGain.gain.setTargetAtTime(1 - this.params.mix, now, ramp);
        this.wetGain.gain.setTargetAtTime(this.params.mix, now, ramp);
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
                <span class="data-font" style="cursor:pointer;color:#f44" onclick="let idx=window_fxR.indexOf(this.closest('.fx-slot').plugin); window_fxR.splice(idx,1); renderFX(); updateTD();">DEL</span>
            </div>
            <div class="data-font" style="padding:15px; background:#fff; border:2px solid #000">
                <div style="display:grid; grid-template-columns: repeat(5, 1fr); gap:10px; text-align:center;">
                    <div>
                        <input type="range" min="0.1" max="10" step="0.01" value="${this.params.rate}" 
                            oninput="let p=this.closest('.fx-slot').plugin; p.params.rate=parseFloat(this.value); p.updateNodes()" 
                            style="appearance: slider-vertical; height:70px; width:15px; accent-color:#000">
                        <div style="margin-top:8px; font-size:7px">RATE</div>
                    </div>
                    <div>
                        <input type="range" min="0" max="2000" step="1" value="${this.params.depth}" 
                            oninput="let p=this.closest('.fx-slot').plugin; p.params.depth=parseFloat(this.value); p.updateNodes()" 
                            style="appearance: slider-vertical; height:70px; width:15px; accent-color:#000">
                        <div style="margin-top:8px; font-size:7px">DEPTH</div>
                    </div>
                    <div>
                        <input type="range" min="100" max="5000" step="1" value="${this.params.baseFreq}" 
                            oninput="let p=this.closest('.fx-slot').plugin; p.params.baseFreq=parseFloat(this.value); p.updateNodes()" 
                            style="appearance: slider-vertical; height:70px; width:15px; accent-color:#000">
                        <div style="margin-top:8px; font-size:7px">FREQ</div>
                    </div>
                    <div>
                        <input type="range" min="0" max="0.95" step="0.01" value="${this.params.feedback}" 
                            oninput="let p=this.closest('.fx-slot').plugin; p.params.feedback=parseFloat(this.value); p.updateNodes()" 
                            style="appearance: slider-vertical; height:70px; width:15px; accent-color:#000">
                        <div style="margin-top:8px; font-size:7px">FEED</div>
                    </div>
                    <div>
                        <input type="range" min="0" max="1" step="0.01" value="${this.params.mix}" 
                            oninput="let p=this.closest('.fx-slot').plugin; p.params.mix=parseFloat(this.value); p.updateNodes()" 
                            style="appearance: slider-vertical; height:70px; width:15px; accent-color:#000">
                        <div style="margin-top:8px; font-size:7px">MIX</div>
                    </div>
                </div>
            </div>
        `;
    }
}