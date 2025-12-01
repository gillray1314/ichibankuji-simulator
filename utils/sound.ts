class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    } catch (e) {
      console.warn("Web Audio API not supported");
    }
  }

  private initCtx() {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  // --- Organic Synth Methods ---

  // Hyoshigi (Wooden Clappers) - High pitched wood click
  playClick() {
    if (this.isMuted || !this.ctx) return;
    this.initCtx();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);

    // Hard attack for wood sound
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Soft Paper/Brush sound
  playHover() {
    if (this.isMuted || !this.ctx) return;
    this.initCtx();
    const t = this.ctx.currentTime;
    
    // Noise buffer for paper texture
    const bufferSize = this.ctx.sampleRate * 0.1; // 0.1 sec
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);
  }

  // Drum Roll / Rattle
  playDrawStart() {
    if (this.isMuted || !this.ctx) return;
    this.initCtx();
    const t = this.ctx.currentTime;
    
    // Create multiple low thuds
    for(let i=0; i<3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = t + (i * 0.08);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, start);
        osc.frequency.exponentialRampToValueAtTime(80, start + 0.1);

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.1);
    }
  }

  // Snap / Bell (Reveal)
  playReveal() {
    if (this.isMuted || !this.ctx) return;
    this.initCtx();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Bell-like partials could be better, but simple sine works for "clean" sound
    osc.frequency.setValueAtTime(1200, t); 
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.02); // softened attack
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  // Festival Chord (Grand Prize)
  playGrandWin() {
    if (this.isMuted || !this.ctx) return;
    this.initCtx();
    const t = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.connect(this.ctx.destination);
    masterGain.gain.value = 0.3;

    // Pentatonic scaleish chord
    const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C E G C E
    
    freqs.forEach((f, i) => {
        const osc = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.value = f;
        
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.1, t + 0.1 + (i*0.05));
        g.gain.exponentialRampToValueAtTime(0.001, t + 2.0);

        osc.connect(g);
        g.connect(masterGain);
        osc.start(t);
        osc.stop(t + 2.0);
    });
  }

  // Dull Wood Thud (Trash)
  playTrash() {
    if (this.isMuted || !this.ctx) return;
    this.initCtx();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(100, t);
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  }
}

export const soundEngine = new SoundEngine();