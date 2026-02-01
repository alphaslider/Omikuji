/** * OMIKUJI MACHINE: MASTERING_LIMITER_V3
 * NO LEAKS. NO GHOST LOOPS. 
 */
export default class MasteringMachine {
    constructor(ctx) {
        this.ctx = ctx;
        this.id = "FX_" + Math.random().toString(36).substr(2, 4).toUpperCase();
        this.name = "LIMITER_V3";
        this._alive = true;
        this._raf = null;

        // 1. DSP NODES
        this.input = ctx.createAnalyser();
        this.input.fftSize = 64; // Low-overhead for high-speed response
        
        this.comp = ctx.createDynamicsCompressor();
        // Hard Limiter Settings
        this.comp.threshold.value = -1.0;
        this.comp.knee.value = 0;
        this.comp.ratio.value = 20;
        this.comp.attack.value = 0.001;
        this.comp.release.value = 0.1;

        this.output = ctx.createGain();

        // 2. ROUTING
        this.input.connect(this.comp);
        this.comp.connect(this.output);

        // 3. STATE
        this.params = { thresh: -1.0, makeup: 1.0 };
    }

    getState() { return this.params; }
    
    setState(s) {
        if(!s) return;
        this.params = s;
        this.comp.threshold.setTargetAtTime(s.thresh, this.ctx.currentTime, 0.01);
        this.output.gain.setTargetAtTime(s.makeup, this.ctx.currentTime, 0.01);
    }

    // MANDATORY PURGE: Hard-kills nodes and animation
    purge() {
        this._alive = false;
        if (this._raf) cancelAnimationFrame(this._raf);
        this.input.disconnect();
        this.comp.disconnect();
        this.output.disconnect();
        console.log(`${this.id} PURGED.`);
    }

    renderUI(container, idx) {
        const canvId = `canv-${this.id}`;
        container.innerHTML = `
            <div style="padding:12px; background:#000; border:2px solid #fff; color:#fff; font-family:'DATA';">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px">
                    <span>${this.name} // ${this.id}</span>
                    <button onclick="window.removeFX(${idx})" style="background:#fff; color:#000; border:none; padding:2px 6px; font-weight:bold; cursor:pointer">KILL</button>
                </div>
                <canvas id="${canvId}" width="300" height="50" style="width:100%; height:50px; background:#111; display:block"></canvas>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-top:10px">
                    <div>
                        <div style="font-size:8px">THRESHOLD (dB)</div>
                        <input type="range" class="sl-t" min="-48" max="0" step="0.1" value="${this.params.thresh}" style="width:100%">
                    </div>
                    <div>
                        <div style="font-size:8px">MAKEUP GAIN</div>
                        <input type="range" class="sl-m" min="0" max="4" step="0.01" value="${this.params.makeup}" style="width:100%">
                    </div>
                </div>
            </div>
        `;

        // SLIDER BINDING
        container.querySelector('.sl-t').oninput = e => {
            this.params.thresh = parseFloat(e.target.value);
            this.comp.threshold.setTargetAtTime(this.params.thresh, this.ctx.currentTime, 0.01);
        };
        container.querySelector('.sl-m').oninput = e => {
            this.params.makeup = parseFloat(e.target.value);
            this.output.gain.setTargetAtTime(this.params.makeup, this.ctx.currentTime, 0.01);
        };

        // VISUALIZER LOOP
        const canv = container.querySelector(`#${canvId}`);
        const c = canv.getContext('2d');
        const buffer = new Uint8Array(this.input.frequencyBinCount);

        const draw = () => {
            if (!this._alive || !document.getElementById(canvId)) {
                cancelAnimationFrame(this._raf);
                return;
            }
            this._raf = requestAnimationFrame(draw);
            this.input.getByteFrequencyData(buffer);

            c.fillStyle = '#111';
            c.fillRect(0, 0, canv.width, canv.height);
            
            c.fillStyle = '#fff';
            const barW = (canv.width / buffer.length);
            for (let i = 0; i < buffer.length; i++) {
                const h = (buffer[i] / 255) * canv.height;
                c.fillRect(i * barW, canv.height - h, barW - 1, h);
            }
        };
        draw();
    }
}