// OMIKUJI PLUGIN: BELL_MACHINE_v2
// [cite: 2026-01-20] getState/setState implemented for Total Serialization
export default class BellMachine {
    constructor(ctx) {
        this.ctx = ctx;
        this.input = ctx.createGain();
        this.output = ctx.createGain();
        
        // Internal State
        this.params = {
            wave: 'sine',
            attack: 0.01,
            decay: 0.4,
            release: 0.8,
            detune: 5,
            fmRatio: 2.5,
            fmDepth: 50
        };
    }

    noteOn(freq, time, vel) {
        // Carrier
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.type = this.params.wave;
        osc.frequency.setValueAtTime(freq, time);
        osc.detune.setValueAtTime(this.params.detune, time);

        // Simple FM Modulator for "Bell" metallic tones
        const mod = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();
        mod.type = 'sine';
        mod.frequency.setValueAtTime(freq * this.params.fmRatio, time);
        modGain.gain.setValueAtTime(this.params.fmDepth, time);

        mod.connect(modGain);
        modGain.connect(osc.frequency);

        // Envelope [cite: 2026-01-20] Mono-trigger behavior handled by host
        osc.connect(env);
        env.connect(this.output);

        const atk = parseFloat(this.params.attack);
        const dec = parseFloat(this.params.decay);
        const rel = parseFloat(this.params.release);

        env.gain.setValueAtTime(0, time);
        env.gain.linearRampToValueAtTime(vel, time + atk);
        env.gain.exponentialRampToValueAtTime(0.01, time + atk + dec);
        env.gain.linearRampToValueAtTime(0, time + atk + dec + rel);

        osc.start(time);
        mod.start(time);
        osc.stop(time + atk + dec + rel + 0.1);
        mod.stop(time + atk + dec + rel + 0.1);
    }

    renderUI(container, id) {
        container.innerHTML = `
            <div class="data-font" style="padding:10px; background:#000; color:#000; background:#eee">
                <div style="display:flex; justify-content:space-between">
                    <b>BELL_MACHINE_v2</b>
                    <button onclick="removeFX(${id})">X</button>
                </div>
                <hr style="border-top:1px solid #000">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
                    <div>
                        WAVE: <select onchange="window_fxR[${id}].params.wave = this.value">
                            <option value="sine">SINE</option>
                            <option value="triangle">TRIANGLE</option>
                            <option value="square">SQUARE</option>
                            <option value="sawtooth">SAW</option>
                        </select>
                        <br>ATK: <input type="range" min="0.001" max="0.5" step="0.01" value="${this.params.attack}" oninput="window_fxR[${id}].params.attack = this.value">
                        <br>DEC: <input type="range" min="0.1" max="2" step="0.1" value="${this.params.decay}" oninput="window_fxR[${id}].params.decay = this.value">
                    </div>
                    <div>
                        FM_RATIO: <input type="range" min="0.5" max="10" step="0.1" value="${this.params.fmRatio}" oninput="window_fxR[${id}].params.fmRatio = this.value">
                        <br>FM_DEPTH: <input type="range" min="0" max="500" step="10" value="${this.params.fmDepth}" oninput="window_fxR[${id}].params.fmDepth = this.value">
                        <br>REL: <input type="range" min="0.1" max="3" step="0.1" value="${this.params.release}" oninput="window_fxR[${id}].params.release = this.value">
                    </div>
                </div>
            </div>
        `;
    }

    getState() { return { ...this.params }; }
    setState(state) { this.params = Object.assign(this.params, state); }
}