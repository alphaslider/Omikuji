export default class SlicerPlugin {
    constructor(ctx) {
        this.ctx = ctx;
        this.output = ctx.createGain();
        // Unique ID ensures multiple slicers don't clash
        this.id = "SLC_" + Math.floor(Math.random()*10000); 
        this.name = "SLICER-PRO";
        this.buffer = null;
        this.chops = [0]; 
        this.params = { volume: 0.8 };
        
        // Playback State
        this.mode = 'PLAY'; 
        this.activeSource = null; 
        this.isPlaying = false;
        this.playStartTime = 0;
        this.playOffset = 0;
        this.playDuration = 0;
        
        // UI & System State
        this.dragIdx = -1;
        this.animID = null;
        this.ui = null;
        this.resizeOb = null; // Store observer to clean it up later
        
        // Graphics Cache
        this.cacheCanvas = document.createElement('canvas');
        this.cacheCtx = this.cacheCanvas.getContext('2d');
        this.isDirty = true; 
    }

    // --- CLEANUP (Prevents bugs when deleting/reloading) ---
    destroy() {
        if(this.animID) cancelAnimationFrame(this.animID);
        if(this.resizeOb) this.resizeOb.disconnect();
        this.ui = null;
        this.buffer = null;
        this.isPlaying = false;
    }

    async loadSample(file) {
        if(!file) return;
        if(this.ui) this.ui.querySelector('.status-text').innerText = "DECODING...";

        try {
            const arrayBuffer = await file.arrayBuffer();
            this.buffer = await this.ctx.decodeAudioData(arrayBuffer);
            this.chops = [0]; 
            
            if(this.ui) this.ui.querySelector('.status-text').innerText = "READY // " + this.buffer.duration.toFixed(2) + "s";
            
            this.isDirty = true; 
            this.updateCache(400, 60); 
            this.drawFrame();
        } catch(e) {
            console.error(e);
            if(this.ui) this.ui.querySelector('.status-text').innerText = "ERROR";
        }
    }

    noteOn(freq, time, vel) {
        if (!this.buffer) return;

        // 1. MONO CHOKE
        if (this.activeSource) {
            try { this.activeSource.stop(time); } catch(e){}
        }

        // 2. MIDI MAPPING (C2 = Slice 1)
        const baseNote = 36; 
        const midi = Math.round(12 * Math.log2(freq / 440) + 69);
        const count = this.chops.length;
        let sliceIndex = (midi - baseNote) % count;
        if (sliceIndex < 0) sliceIndex += count;

        // 3. TIMING
        const startTime = this.chops[sliceIndex];
        let stopTime = this.buffer.duration;
        if (sliceIndex < this.chops.length - 1) {
            stopTime = this.chops[sliceIndex + 1];
        }
        const duration = stopTime - startTime;

        // 4. AUDIO GRAPH
        const source = this.ctx.createBufferSource();
        source.buffer = this.buffer;
        
        const env = this.ctx.createGain();
        env.gain.setValueAtTime(0, time);
        env.gain.linearRampToValueAtTime(vel * this.params.volume, time + 0.005);
        env.gain.setValueAtTime(vel * this.params.volume, time + duration - 0.01);
        env.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        source.connect(env);
        env.connect(this.output);
        source.start(time, startTime);
        source.stop(time + duration + 0.05);

        this.activeSource = source;

        // 5. ANIMATION START
        this.playStartTime = this.ctx.currentTime;
        this.playOffset = startTime;
        this.playDuration = duration; 
        this.isPlaying = true;
        
        if(!this.animID) this.loop();
    }

    loop() {
        if(!this.ui || !this.ui.isConnected) {
            this.animID = null;
            return;
        }

        this.drawFrame();

        if (this.isPlaying || this.dragIdx > -1) {
            this.animID = requestAnimationFrame(() => this.loop());
        } else {
            this.animID = null;
            this.drawFrame(); // Final clear
        }
    }

    handleMouseDown(e) {
        if(!this.buffer) return;
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const clickTime = (x / rect.width) * this.buffer.duration;
        const threshold = (10 / rect.width) * this.buffer.duration;

        let closestIdx = -1;
        let minDist = Infinity;

        this.chops.forEach((t, i) => {
            if (i === 0) return; 
            const dist = Math.abs(t - clickTime);
            if(dist < minDist && dist < threshold) {
                minDist = dist;
                closestIdx = i;
            }
        });

        if (this.mode === 'DEL') {
            if (closestIdx > -1) {
                this.chops.splice(closestIdx, 1);
                this.isDirty = true; 
                this.drawFrame();
            }
        } else {
            if (closestIdx > -1) {
                this.dragIdx = closestIdx;
                const moveFn = (ev) => {
                    const mx = ev.clientX - rect.left;
                    let newT = (mx / rect.width) * this.buffer.duration;
                    if(newT > 0.01 && newT < this.buffer.duration) {
                        this.chops[this.dragIdx] = newT;
                        this.isDirty = true; 
                        this.drawFrame();
                    }
                };
                const upFn = () => {
                    window.removeEventListener('mousemove', moveFn);
                    window.removeEventListener('mouseup', upFn);
                    this.dragIdx = -1;
                    this.chops.sort((a,b)=>a-b);
                    this.isDirty = true; 
                    this.drawFrame();
                };
                window.addEventListener('mousemove', moveFn);
                window.addEventListener('mouseup', upFn);
            } else {
                this.chops.push(clickTime);
                this.chops.sort((a,b)=>a-b);
                this.isDirty = true; 
                this.drawFrame();
            }
        }
    }

    renderUI(container) {
        if(this.resizeOb) this.resizeOb.disconnect(); // Clear old observer
        
        this.ui = container;
        this.ui.plugin = this;
        
        this.ui.innerHTML = `
            <div style="background:var(--panel-bg); border:1px solid var(--ice-bright); padding:10px;">
                <div class="data-font" style="color:var(--ice-bright); margin-bottom:5px; display:flex; justify-content:space-between">
                    <span>${this.id} // SLICER</span>
                    <span class="status-text" style="color:#fff">NO SAMPLE</span>
                    <button class="del-btn tiny-btn">X</button>
                </div>
                
                <div style="display:flex; gap:5px; margin-bottom:5px">
                    <button class="tiny-btn load-btn" style="flex:1">LOAD WAV</button>
                    <input type="file" class="file-loader" style="display:none">
                    <button class="tiny-btn mode-btn" style="width:60px; background:#151a21; color:#00e5ff">EDIT</button>
                </div>

                <div class="cvs-wrap" style="height:60px; background:#000; border:1px solid var(--ice-dim); cursor:crosshair; position:relative">
                    <canvas width="400" height="60" style="width:100%; height:100%"></canvas>
                </div>
                
                <div class="data-font" style="font-size:8px; margin-top:4px; color:#546e7a">
                    <span class="mode-text">CLICK TO ADD / DRAG</span>
                </div>
            </div>
        `;

        const fileInput = this.ui.querySelector('.file-loader');
        const loadBtn = this.ui.querySelector('.load-btn');
        const modeBtn = this.ui.querySelector('.mode-btn');
        const delBtn = this.ui.querySelector('.del-btn');
        const canvas = this.ui.querySelector('canvas');

        loadBtn.onclick = () => fileInput.click();
        
        // FIX: Reset input value here too, just in case
        fileInput.onclick = (e) => { e.target.value = ''; };
        fileInput.onchange = (e) => this.loadSample(e.target.files[0]);
        
        delBtn.onclick = () => { 
            this.destroy(); // CLEANUP BEFORE REMOVAL
            if(window.removeFX) window.removeFX(window.window_fxR.indexOf(this)); 
        };

        modeBtn.onclick = () => {
            this.mode = this.mode === 'DEL' ? 'EDIT' : 'DEL';
            modeBtn.innerText = this.mode;
            modeBtn.style.background = this.mode === 'DEL' ? '#f44' : '#151a21';
            modeBtn.style.color = this.mode === 'DEL' ? '#fff' : '#00e5ff';
            this.ui.querySelector('.mode-text').innerText = this.mode === 'DEL' ? 'DELETE MODE' : 'EDIT MODE';
            this.isDirty = true;
            this.drawFrame();
        };

        canvas.onmousedown = (e) => this.handleMouseDown(e);

        // Robust Observer
        this.resizeOb = new ResizeObserver(() => {
            this.isDirty = true; 
            this.drawFrame();
        });
        this.resizeOb.observe(canvas);
        
        this.isDirty = true;
        this.drawFrame();
    }

    updateCache(w, h) {
        if(w < 1 || h < 1) return;
        this.cacheCanvas.width = w;
        this.cacheCanvas.height = h;
        const ctx = this.cacheCtx;

        ctx.fillStyle = "#020205";
        ctx.fillRect(0, 0, w, h);

        if (!this.buffer) return;

        const dur = this.buffer.duration;
        const data = this.buffer.getChannelData(0);
        const step = Math.ceil(data.length / w);
        const amp = h / 2;
        
        ctx.beginPath();
        ctx.strokeStyle = "#1c2530";
        for(let i=0; i < w; i++) {
            let min = 1.0, max = -1.0;
            for (let j=0; j<step; j++) {
                const val = data[(i*step)+j];
                if (val < min) min = val;
                if (val > max) max = val;
            }
            ctx.moveTo(i, (1+min)*amp);
            ctx.lineTo(i, (1+max)*amp);
        }
        ctx.stroke();

        ctx.font = "10px monospace";
        this.chops.forEach((t, i) => {
            const x = (t / dur) * w;
            const isDel = this.mode === 'DEL' && i !== 0;
            ctx.strokeStyle = isDel ? "#f44" : "#00e5ff";
            ctx.fillStyle = isDel ? "#f44" : "#00e5ff";
            ctx.lineWidth = 1;
            
            ctx.beginPath();
            ctx.moveTo(x, 0); ctx.lineTo(x, h);
            ctx.stroke();
            ctx.fillText(i+1, x + 2, 10);
        });

        this.isDirty = false; 
    }

    drawFrame() {
        if (!this.ui) return;
        const canvas = this.ui.querySelector('canvas');
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        if(rect.width === 0 || rect.height === 0) return;

        if(canvas.width !== rect.width || canvas.height !== rect.height) {
            canvas.width = rect.width;
            canvas.height = rect.height;
            this.isDirty = true;
        }

        const ctx = canvas.getContext('2d');
        
        if(this.isDirty) {
            this.updateCache(canvas.width, canvas.height);
        }

        ctx.drawImage(this.cacheCanvas, 0, 0);

        if (this.isPlaying && this.buffer) {
            const dur = this.buffer.duration;
            const elapsed = this.ctx.currentTime - this.playStartTime;
            
            if (elapsed < this.playDuration) {
                const pos = this.playOffset + elapsed;
                const px = (pos / dur) * canvas.width;

                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(px, 0); ctx.lineTo(px, canvas.height);
                ctx.stroke();
            } else {
                this.isPlaying = false; 
                ctx.drawImage(this.cacheCanvas, 0, 0); 
            }
        }
    }

    getState() { return { params: this.params, chops: this.chops }; }
    setState(s) { 
        this.params = s.params; 
        this.chops = s.chops || [0]; 
        this.isDirty = true;
        setTimeout(() => this.drawFrame(), 100); 
    }
}
