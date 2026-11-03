// Small synthesized sound effects (Web Audio API), so there are no audio files.

type Wave = OscillatorType;

let context: AudioContext | null = null;

const audio = (): AudioContext | null => {
    if (!context) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return null;
        try { context = new AudioCtx(); } catch { return null; }
    }
    // Browsers start audio suspended until the user interacts with the page.
    if (context.state === 'suspended') context.resume().catch(() => { /* still blocked */ });
    return context;
};

const tone = (freq: number, start: number, duration: number, { wave = 'sine' as Wave, volume = 0.12, slideTo = 0 } = {}) => {
    const ctx = audio();
    if (!ctx) return;
    const t = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.02);
};

export const sounds = {
    /** A piece going down; the two sides sound slightly different. */
    place(side: 'X' | 'O') {
        const base = side === 'X' ? 620 : 500;
        tone(base, 0, 0.09, { wave: 'triangle', volume: 0.14, slideTo: base * 0.55 });
        tone(base * 2.4, 0, 0.03, { wave: 'sine', volume: 0.04 });
    },
    win() {
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.09, 0.28, { wave: 'triangle', volume: 0.11 }));
        tone(1318.5, 0.36, 0.45, { wave: 'sine', volume: 0.06 });
    },
    loss() {
        [392, 329.63, 261.63].forEach((f, i) => tone(f, i * 0.13, 0.32, { wave: 'sine', volume: 0.1, slideTo: f * 0.97 }));
    },
    draw() {
        tone(440, 0, 0.2, { wave: 'triangle', volume: 0.08 });
        tone(440, 0.18, 0.3, { wave: 'triangle', volume: 0.08 });
    },
    /** A short, low blip for moves that aren't allowed. */
    nope() {
        tone(180, 0, 0.12, { wave: 'square', volume: 0.03, slideTo: 140 });
    },
};
