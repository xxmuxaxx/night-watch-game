// Звук игры, синтезированный в браузере (Web Audio): фон и короткие звуки без файлов.
// AudioContext создаётся только после первого нажатия игрока — так требуют браузеры.
// Что и когда звучит, решает soundCues.ts; здесь только как это звучит.
import type { Ambience, Cue } from './soundCues';

type Stop = () => void;

export interface AudioEngine {
  /** Включить фон (прошлый плавно затихает). null — тишина. */
  setAmbience(ambience: Ambience): void;
  play(cue: Cue): void;
  setVolume(volume: number, enabled: boolean): void;
}

export function createAudioEngine(): AudioEngine {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  let current: { ambience: Ambience; stop: Stop } | null = null;
  let wanted: Ambience = null;
  let volume = 0.6;
  let enabled = true;

  /** Контекст появляется после первого жеста игрока; до этого звук молчит. */
  function unlock() {
    if (ctx) return;
    try {
      ctx = new AudioContext();
    } catch {
      return; // Web Audio недоступен — играем без звука
    }
    master = ctx.createGain();
    master.gain.value = enabled ? volume : 0;
    master.connect(ctx.destination);
    noise = createNoise(ctx);
    startAmbience(wanted);
  }
  for (const type of ['pointerdown', 'keydown'] as const) {
    document.addEventListener(type, unlock, { once: false, capture: true });
  }

  function startAmbience(ambience: Ambience) {
    if (current?.ambience === ambience) return;
    current?.stop();
    current = null;
    if (!ctx || !master || !noise || !ambience) return;
    current = { ambience, stop: AMBIENCES[ambience](ctx, master, noise) };
  }

  return {
    setAmbience(ambience) {
      wanted = ambience;
      startAmbience(ambience);
    },
    play(cue) {
      if (!ctx || !master || !noise || !enabled) return;
      CUES[cue](ctx, master, noise);
    },
    setVolume(nextVolume, nextEnabled) {
      volume = nextVolume;
      enabled = nextEnabled;
      if (ctx && master) master.gain.setTargetAtTime(enabled ? volume : 0, ctx.currentTime, 0.1);
    },
  };
}

// --- Строительные блоки ---

/** Две секунды белого шума: из него фильтрами делаются ветер, огонь, удары. */
function createNoise(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function noiseSource(ctx: AudioContext, noise: AudioBuffer, loop = false): AudioBufferSourceNode {
  const source = ctx.createBufferSource();
  source.buffer = noise;
  source.loop = loop;
  return source;
}

function filter(ctx: AudioContext, type: BiquadFilterType, frequency: number, q = 1) {
  const node = ctx.createBiquadFilter();
  node.type = type;
  node.frequency.value = frequency;
  node.Q.value = q;
  return node;
}

/** Громкость с плавным появлением; возвращает узел и функцию плавного затухания. */
function fadeGain(ctx: AudioContext, level: number, fadeIn = 1.5) {
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.gain.setTargetAtTime(level, ctx.currentTime, fadeIn / 3);
  const fadeOut = (then: () => void) => {
    gain.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
    setTimeout(then, 2000);
  };
  return { gain, fadeOut };
}

/** Короткий импульс громкости: быстрая атака и спад. */
function envelope(ctx: AudioContext, peak: number, attack: number, decay: number): GainNode {
  const gain = ctx.createGain();
  const t = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  return gain;
}

// --- Фон ---

type AmbienceFactory = (ctx: AudioContext, out: AudioNode, noise: AudioBuffer) => Stop;

/** Ветер: шум через полосовой фильтр, частота которого медленно гуляет. */
function wind(level: number, center: number): AmbienceFactory {
  return (ctx, out, noise) => {
    const source = noiseSource(ctx, noise, true);
    const band = filter(ctx, 'bandpass', center, 0.8);
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = 0.08;
    depth.gain.value = center * 0.5;
    lfo.connect(depth).connect(band.frequency);
    const { gain, fadeOut } = fadeGain(ctx, level);
    source.connect(band).connect(gain).connect(out);
    source.start();
    lfo.start();
    return () =>
      fadeOut(() => {
        source.stop();
        lfo.stop();
        gain.disconnect();
      });
  };
}

/** Очаг: низкий гул зала и редкие щелчки поленьев. */
const hearth: AmbienceFactory = (ctx, out, noise) => {
  const source = noiseSource(ctx, noise, true);
  const low = filter(ctx, 'lowpass', 260);
  const { gain, fadeOut } = fadeGain(ctx, 0.35);
  source.connect(low).connect(gain).connect(out);
  source.start();
  let timer = 0;
  const crackle = () => {
    const pop = noiseSource(ctx, noise);
    const high = filter(ctx, 'highpass', 1800);
    const env = envelope(ctx, 0.25 * Math.random() + 0.05, 0.002, 0.05);
    pop.connect(high).connect(env).connect(gain);
    pop.start(ctx.currentTime, Math.random() * 1.5, 0.1);
    timer = window.setTimeout(crackle, 150 + Math.random() * 900);
  };
  crackle();
  return () => {
    clearTimeout(timer);
    fadeOut(() => {
      source.stop();
      gain.disconnect();
    });
  };
};

const AMBIENCES: Record<Exclude<Ambience, null>, AmbienceFactory> = {
  wind: wind(0.12, 500),
  storm: wind(0.22, 380),
  room: wind(0.05, 700),
  hearth,
};

// --- Короткие звуки ---

type CueFactory = (ctx: AudioContext, out: AudioNode, noise: AudioBuffer) => void;

/** Глухой удар: шум через фильтр и низкий «тук». */
function thump(level: number, frequency: number): CueFactory {
  return (ctx, out, noise) => {
    const burst = noiseSource(ctx, noise);
    const env = envelope(ctx, level, 0.005, 0.18);
    burst
      .connect(filter(ctx, 'lowpass', frequency))
      .connect(env)
      .connect(out);
    burst.start(ctx.currentTime, Math.random(), 0.3);
    tone(ctx, out, 'sine', 90, level * 0.8, 0.2);
  };
}

function tone(
  ctx: AudioContext,
  out: AudioNode,
  type: OscillatorType,
  frequency: number,
  level: number,
  decay: number,
  delay = 0,
) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = frequency;
  const env = ctx.createGain();
  const t = ctx.currentTime + delay;
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(level, t + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  osc.connect(env).connect(out);
  osc.start(t);
  osc.stop(t + decay + 0.05);
}

const CUES: Record<Cue, CueFactory> = {
  hit: thump(0.7, 900),
  hurt: thump(0.9, 400),
  // звон стали: несколько негармоничных обертонов с долгим спадом
  parry: (ctx, out) => {
    for (const [f, level] of [
      [1180, 0.25],
      [1710, 0.15],
      [2630, 0.1],
    ] as const) {
      tone(ctx, out, 'triangle', f, level, 0.9);
    }
  },
  // свист замаха: шум с растущей частотой фильтра
  windup: (ctx, out, noise) => {
    const source = noiseSource(ctx, noise);
    const band = filter(ctx, 'bandpass', 400, 2);
    band.frequency.exponentialRampToValueAtTime(2200, ctx.currentTime + 0.35);
    source
      .connect(band)
      .connect(envelope(ctx, 0.4, 0.2, 0.2))
      .connect(out);
    source.start(ctx.currentTime, Math.random(), 0.5);
  },
  // рог тревоги: три низких протяжных сигнала
  horn: (ctx, out) => {
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 110;
      const low = filter(ctx, 'lowpass', 600);
      const env = ctx.createGain();
      const t = ctx.currentTime + i * 1.6;
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.35, t + 0.3);
      env.gain.setValueAtTime(0.35, t + 1);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      osc.connect(low).connect(env).connect(out);
      osc.start(t);
      osc.stop(t + 1.5);
    }
  },
  win: (ctx, out) => {
    tone(ctx, out, 'triangle', 392, 0.2, 0.5);
    tone(ctx, out, 'triangle', 523, 0.2, 0.8, 0.15);
  },
  lose: (ctx, out) => {
    tone(ctx, out, 'sine', 196, 0.25, 0.9);
    tone(ctx, out, 'sine', 147, 0.25, 1.4, 0.3);
  },
  success: (ctx, out) => tone(ctx, out, 'triangle', 660, 0.15, 0.4),
  fail: (ctx, out) => tone(ctx, out, 'sine', 180, 0.2, 0.4),
  levelup: (ctx, out) => {
    [523, 659, 784].forEach((f, i) => tone(ctx, out, 'triangle', f, 0.18, 0.7, i * 0.12));
  },
};
