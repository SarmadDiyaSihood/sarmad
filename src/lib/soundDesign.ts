/**
 * The site's sound design. Every sound is synthesised with the Web Audio API: there are no audio files
 * to download or to license. The functions here only schedule nodes on the context they are given,
 * so they behave the same on a live AudioContext and on an OfflineAudioContext.
 */

export type Sfx = 'hover' | 'click' | 'step' | 'open' | 'close' | 'nav' | 'link' | 'transition' | 'section' | 'edge' | 'reveal';

type Ctx = BaseAudioContext;

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

const noiseBuffers = new WeakMap<Ctx, AudioBuffer>();
function noiseBuffer(ctx: Ctx) {
  let buffer = noiseBuffers.get(ctx);
  if (!buffer) {
    buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 1.2), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    noiseBuffers.set(ctx, buffer);
  }
  return buffer;
}

/** Fades in over `attack`, then dies away to silence by `dur`. Starting and ending at zero keeps every sound free of clicks. */
function envelope(ctx: Ctx, start: number, dur: number, peak: number, attack: number) {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  return gain;
}

interface Tone {
  type?: OscillatorType;
  /** Frequency in Hz at the start, and (for a glide) at the end. */
  from: number;
  to?: number;
  /** Delay after the sound's start, in seconds. */
  at?: number;
  dur: number;
  peak: number;
  attack?: number;
}

function tone(ctx: Ctx, out: AudioNode, t: number, { type = 'sine', from, to = from, at = 0, dur, peak, attack = 0.004 }: Tone) {
  const start = t + at;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, start + dur);
  osc.connect(envelope(ctx, start, dur, peak, attack)).connect(out);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

interface Air {
  kind?: BiquadFilterType;
  /** Filter frequency in Hz at the start, and (for a sweep) at the end. */
  from: number;
  to?: number;
  q?: number;
  at?: number;
  dur: number;
  peak: number;
  attack?: number;
}

/** A breath of filtered noise. */
function air(ctx: Ctx, out: AudioNode, t: number, { kind = 'bandpass', from, to = from, q = 1, at = 0, dur, peak, attack = 0.005 }: Air) {
  const start = t + at;
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx);
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = kind;
  filter.Q.value = q;
  filter.frequency.setValueAtTime(from, start);
  if (to !== from) filter.frequency.exponentialRampToValueAtTime(to, start + dur);
  source.connect(filter).connect(envelope(ctx, start, dur, peak, attack)).connect(out);
  source.start(start, Math.random());
  source.stop(start + dur + 0.02);
}

/** A short, dark echo that gives the interface sounds a sense of space. Returns the node to send sound into. */
export function createEcho(ctx: Ctx, out: AudioNode) {
  const input = ctx.createGain();
  const delay = ctx.createDelay(1);
  delay.delayTime.value = 0.17;
  const damp = ctx.createBiquadFilter();
  damp.type = 'lowpass';
  damp.frequency.value = 2400;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.28;
  input.connect(delay);
  delay.connect(damp);
  damp.connect(feedback);
  feedback.connect(delay);
  damp.connect(out);
  return input;
}

/** A repeatable stream of numbers between 0 and 1. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SPACE_RATE = 24000;

/**
 * A long, soft reverb for the music: a burst of darkened noise that dies away, used as the room's response.
 * The noise is always the same (seeded, and built at one fixed rate), so the room, and with it the level of
 * the music, is the same in every session and on every device.
 */
export function createSpace(ctx: Ctx, out: AudioNode, seconds = 3) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const response = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const random = seeded(1769 + channel);
    const base = new Float32Array(Math.ceil(SPACE_RATE * seconds) + 2);
    let smooth = 0;
    for (let i = 0; i < base.length; i += 1) {
      smooth += 0.5 * (random() * 2 - 1 - smooth);
      base[i] = smooth;
    }
    const data = response.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      const at = (i * SPACE_RATE) / ctx.sampleRate;
      const k = Math.floor(at);
      data[i] = (base[k] + (base[k + 1] - base[k]) * (at - k)) * (1 - i / length) ** 3;
    }
  }
  const convolver = ctx.createConvolver();
  convolver.buffer = response;
  convolver.connect(out);
  return convolver;
}

/* ------------------------------------------------------------------ interface sounds */

/**
 * Plays one interface sound at time `t`.
 * `dry` is the effects bus; `echo` is the node returned by createEcho.
 */
export function playSfx(ctx: Ctx, dry: AudioNode, echo: AudioNode, name: Sfx, t: number) {
  // Sounds that should ring a little go through `voice`, which also feeds the echo.
  const spaced = (amount: number) => {
    const voice = ctx.createGain();
    const send = ctx.createGain();
    send.gain.value = amount;
    voice.connect(dry);
    voice.connect(send).connect(echo);
    return voice;
  };

  switch (name) {
    // A very light electronic tick.
    case 'hover':
      tone(ctx, dry, t, { from: 2100, to: 1700, dur: 0.045, peak: 0.035, attack: 0.003 });
      break;

    // A clear, refined click: a tiny breath, a falling note and a soft body under it.
    case 'click':
      air(ctx, dry, t, { kind: 'highpass', from: 2600, dur: 0.014, peak: 0.09, attack: 0.001 });
      tone(ctx, dry, t, { type: 'triangle', from: 1150, to: 620, dur: 0.075, peak: 0.16, attack: 0.002 });
      tone(ctx, dry, t, { from: 240, to: 180, dur: 0.05, peak: 0.07, attack: 0.003 });
      break;

    // Moving between pictures and filters: a soft double tick.
    case 'step':
      tone(ctx, dry, t, { from: 880, to: 830, dur: 0.075, peak: 0.075, attack: 0.003 });
      tone(ctx, dry, t, { from: 1320, dur: 0.05, peak: 0.03, attack: 0.003 });
      break;

    // Opening: a gentle rise.
    case 'open': {
      const voice = spaced(0.5);
      tone(ctx, voice, t, { from: 392, to: 587, dur: 0.28, peak: 0.1, attack: 0.02 });
      tone(ctx, voice, t, { from: 784, to: 1175, dur: 0.34, peak: 0.045, attack: 0.04 });
      air(ctx, voice, t, { from: 900, to: 3200, q: 1.2, dur: 0.3, peak: 0.03, attack: 0.08 });
      break;
    }

    // Closing: a light fall.
    case 'close': {
      const voice = spaced(0.3);
      tone(ctx, voice, t, { from: 587, to: 330, dur: 0.2, peak: 0.09, attack: 0.008 });
      air(ctx, voice, t, { from: 2400, to: 600, q: 1.2, dur: 0.2, peak: 0.025, attack: 0.01 });
      break;
    }

    // Navigation: the site's two-note signature, D then A.
    case 'nav': {
      const voice = spaced(0.3);
      tone(ctx, voice, t, { from: hz(74), dur: 0.42, peak: 0.075, attack: 0.006 });
      tone(ctx, voice, t, { type: 'triangle', from: hz(74), dur: 0.3, peak: 0.02, attack: 0.006 });
      tone(ctx, voice, t, { from: hz(81), at: 0.09, dur: 0.5, peak: 0.07, attack: 0.006 });
      break;
    }

    // Contact links: the signature turned upwards, A then D.
    case 'link': {
      const voice = spaced(0.3);
      tone(ctx, voice, t, { from: hz(81), dur: 0.3, peak: 0.07, attack: 0.005 });
      tone(ctx, voice, t, { from: hz(86), at: 0.075, dur: 0.45, peak: 0.065, attack: 0.005 });
      break;
    }

    // Page transition: a short cinematic swell of air over a low note.
    case 'transition': {
      const voice = spaced(0.6);
      air(ctx, voice, t, { from: 180, to: 2400, q: 0.9, dur: 0.95, peak: 0.1, attack: 0.32 });
      tone(ctx, voice, t, { from: 72, to: 50, dur: 0.9, peak: 0.12, attack: 0.25 });
      tone(ctx, voice, t, { from: hz(91), dur: 0.9, peak: 0.016, attack: 0.3 });
      break;
    }

    // Scrolling into a new section: a very faint low pulse.
    case 'section':
      tone(ctx, dry, t, { from: 196, to: 185, dur: 0.24, peak: 0.05, attack: 0.03 });
      tone(ctx, dry, t, { from: 784, dur: 0.18, peak: 0.01, attack: 0.02 });
      break;

    // Reaching the top or the bottom of the page: a soft, settling low note.
    case 'edge': {
      const voice = spaced(0.3);
      tone(ctx, voice, t, { from: 147, to: 131, dur: 0.42, peak: 0.065, attack: 0.04 });
      break;
    }

    // An important moment arriving on screen: three high notes, like light on glass.
    case 'reveal': {
      const voice = spaced(0.7);
      tone(ctx, voice, t, { from: hz(86), dur: 1.1, peak: 0.045, attack: 0.01 });
      tone(ctx, voice, t, { from: hz(93), at: 0.06, dur: 1, peak: 0.028, attack: 0.01 });
      tone(ctx, voice, t, { from: hz(98), at: 0.12, dur: 0.9, peak: 0.014, attack: 0.01 });
      break;
    }
  }
}

/* ------------------------------------------------------------------ background music */

/** Seconds from one chord to the next. Each chord fades in under the one before it, so there is never a beat. */
export const CHORD_EVERY = 16;
const CHORD_ATTACK = 6;
const CHORD_RELEASE = 9;

// Dm9, B♭maj9, Fmaj9, Cmaj9: open voicings, low and wide.
const CHORDS = [
  [38, 45, 53, 60, 64],
  [34, 41, 50, 57, 60],
  [41, 48, 57, 64, 67],
  [36, 43, 52, 59, 62],
];
// Notes for the occasional high bell. Each one sits comfortably over all four chords.
const BELLS = [74, 76, 79, 81, 84, 86];
const PAN = [0, 0.35, -0.45, 0.5, -0.3];
// The room answers some notes more strongly than others. These trims bring the four chords to the same loudness.
const CHORD_TRIM = [0.83, 0.97, 0.6, 1.19];

function panned(ctx: Ctx, pan: number) {
  if (!ctx.createStereoPanner) return ctx.createGain();
  const node = ctx.createStereoPanner();
  node.pan.value = pan;
  return node;
}

/** Schedules one chord of the pad, starting at `t`. `dry` and `wet` are the music bus and its reverb. */
export function scheduleChord(ctx: Ctx, dry: AudioNode, wet: AudioNode, t: number, index: number) {
  const end = t + CHORD_EVERY + CHORD_RELEASE;
  CHORDS[index % CHORDS.length].forEach((midi, i) => {
    const frequency = hz(midi);
    const level = (i === 0 ? 0.17 : 0.13 - i * 0.012) * CHORD_TRIM[index % CHORDS.length];

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(level, t + CHORD_ATTACK);
    gain.gain.setValueAtTime(level, t + CHORD_EVERY);
    gain.gain.linearRampToValueAtTime(0, end);

    // The filter opens and closes slowly, so the chord breathes.
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 0.5;
    filter.frequency.setValueAtTime(frequency * 2.5, t);
    filter.frequency.linearRampToValueAtTime(frequency * 5.5, t + (end - t) / 2);
    filter.frequency.linearRampToValueAtTime(frequency * 2.5, end);

    // Two oscillators per note. The upper notes are slightly detuned against each other, which gives the pad
    // its width; the bass is left in tune, because detuning down there is heard as a slow throb.
    const spread = i === 0 ? 0 : i === 1 ? 2 : 4.5;
    (['sine', 'triangle'] as const).forEach((type, voice) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = frequency;
      osc.detune.value = voice ? spread : -spread;
      osc.connect(filter);
      osc.start(t);
      osc.stop(end + 0.1);
    });

    const place = panned(ctx, PAN[i]);
    filter.connect(gain).connect(place);
    place.connect(dry);
    place.connect(wet);
  });
}

/** Schedules one soft, high bell at `t`. `pick` and `side` are numbers between 0 and 1 that choose its note and its place. */
export function scheduleBell(ctx: Ctx, dry: AudioNode, wet: AudioNode, t: number, pick: number, side: number) {
  const frequency = hz(BELLS[Math.min(BELLS.length - 1, Math.floor(pick * BELLS.length))]);
  const place = panned(ctx, side * 1.2 - 0.6);
  const far = ctx.createGain();
  far.gain.value = 0.25;
  place.connect(wet);
  place.connect(far).connect(dry);
  tone(ctx, place, t, { from: frequency, dur: 5, peak: 0.05, attack: 0.03 });
  tone(ctx, place, t, { from: frequency * 2, dur: 2.5, peak: 0.012, attack: 0.03 });
}
