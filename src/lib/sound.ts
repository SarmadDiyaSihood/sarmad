import { CHORD_EVERY, createEcho, createSpace, playSfx, scheduleBell, scheduleChord, type Sfx } from './soundDesign';

export type { Sfx };

export interface SoundSettings {
  music: boolean;
  effects: boolean;
  /** 0 to 1: the position of the volume slider. */
  musicVolume: number;
  effectsVolume: number;
  muted: boolean;
}

export interface SoundState extends SoundSettings {
  /** True once the browser has allowed sound (after the visitor's first click, tap or key press). */
  running: boolean;
}

const STORAGE_KEY = 'sarmad-sound';
const DEFAULTS: SoundSettings = { music: true, effects: true, musicVolume: 0.5, effectsVolume: 0.7, muted: false };

// The sliders move within these ceilings, so even 100% stays comfortable. The music sits far below the effects.
const MUSIC_CEILING = 0.26;
const EFFECTS_CEILING = 1;
/** The music drops to this share of its level while the window is not the one in use. */
const DUCKED = 0.4;

/**
 * When each sound may play.
 *  rank  - a sound is skipped while one of the same or a higher rank started less than `quiet` ms ago,
 *          so two sounds never pile up on one action;
 *  every - the shortest time, in ms, between two sounds of this kind;
 *  hush  - after this sound, the scrolling cues (rank 0 and 1) stay silent for this long, in ms,
 *          because the page is about to move by itself.
 */
const RULES: Record<Sfx, { rank: number; quiet: number; every: number; hush?: number }> = {
  hover: { rank: 0, quiet: 120, every: 140 },
  section: { rank: 1, quiet: 500, every: 1200 },
  edge: { rank: 1, quiet: 500, every: 1500 },
  reveal: { rank: 1, quiet: 400, every: 1200 },
  click: { rank: 2, quiet: 60, every: 50 },
  step: { rank: 2, quiet: 60, every: 70 },
  link: { rank: 3, quiet: 60, every: 150 },
  open: { rank: 3, quiet: 60, every: 120, hush: 900 },
  close: { rank: 3, quiet: 60, every: 120, hush: 900 },
  nav: { rank: 3, quiet: 60, every: 150, hush: 2200 },
  transition: { rank: 4, quiet: 0, every: 300, hush: 2600 },
};
const NAMES = Object.keys(RULES) as Sfx[];

function load(): SoundSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!saved || typeof saved !== 'object') return DEFAULTS;
    const level = (value: unknown, fallback: number) => (typeof value === 'number' && value >= 0 && value <= 1 ? value : fallback);
    return {
      music: typeof saved.music === 'boolean' ? saved.music : DEFAULTS.music,
      effects: typeof saved.effects === 'boolean' ? saved.effects : DEFAULTS.effects,
      musicVolume: level(saved.musicVolume, DEFAULTS.musicVolume),
      effectsVolume: level(saved.effectsVolume, DEFAULTS.effectsVolume),
      muted: typeof saved.muted === 'boolean' ? saved.muted : DEFAULTS.muted,
    };
  } catch {
    return DEFAULTS;
  }
}

// To trace which sound each action asks for, run localStorage.setItem('sarmad-sound-log', '1') in the console and reload.
const trace = (() => {
  try {
    return localStorage.getItem('sarmad-sound-log') === '1';
  } catch {
    return false;
  }
})();

/**
 * The site's sound: quiet background music and the interface sounds.
 * Nothing is created or played until the visitor's first click, tap or key press, which is when browsers allow sound.
 */
class SoundEngine {
  private settings = load();
  private state: SoundState = { ...this.settings, running: false };
  private listeners = new Set<() => void>();

  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private effectsBus: GainNode | null = null;
  private echo: AudioNode | null = null;
  private space: AudioNode | null = null;
  /** The music now playing. Each start gets its own pair of nodes, so a stopped passage can be cut loose cleanly. */
  private session: { dry: GainNode; wet: GainNode } | null = null;
  private timer = 0;
  private nextChordAt = 0;
  private nextBellAt = 0;
  private chord = 0;

  private attached = false;
  private hidden = false;
  private ducked = false;
  private resuming = false;
  private last: Partial<Record<Sfx, number>> = {};
  private hushUntil = 0;
  private askedAt = 0;

  /* ---------------------------------------------------------------- state for the interface */

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.state;

  private emit() {
    this.state = { ...this.settings, running: this.ctx?.state === 'running' };
    this.listeners.forEach((listener) => listener());
  }

  /** Changes settings, applies them with a short fade, and remembers them for the next visit. */
  update(patch: Partial<SoundSettings>) {
    this.settings = { ...this.settings, ...patch };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      /* storage unavailable: the settings simply are not remembered */
    }
    this.apply();
    this.emit();
  }

  /* ---------------------------------------------------------------- the audio graph */

  private get wantsMusic() {
    return this.settings.music && !this.settings.muted;
  }

  private musicLevel() {
    return this.settings.musicVolume * MUSIC_CEILING * (this.ducked ? DUCKED : 1);
  }

  private effectsLevel() {
    return this.settings.effects ? this.settings.effectsVolume * EFFECTS_CEILING : 0;
  }

  private masterLevel() {
    return this.settings.muted || this.hidden ? 0 : 1;
  }

  private fade(param: AudioParam, to: number, seconds: number) {
    const now = this.ctx!.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(to, now + seconds);
  }

  private build() {
    const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass({ latencyHint: 'interactive' });
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.masterLevel();
    this.master.connect(ctx.destination);
    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = this.musicLevel();
    this.musicBus.connect(this.master);
    this.effectsBus = ctx.createGain();
    this.effectsBus.gain.value = this.effectsLevel();
    this.effectsBus.connect(this.master);
    this.echo = createEcho(ctx, this.effectsBus);
    this.space = createSpace(ctx, this.musicBus);
    const onState = () => {
      if (ctx !== this.ctx) return;
      if (ctx.state === 'running') {
        this.resuming = false;
        if (this.wantsMusic && this.attached) this.startMusic(4);
      }
      this.emit();
    };
    ctx.onstatechange = onState;
    onState();
  }

  private apply() {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.musicBus || !this.effectsBus) return;
    this.fade(this.master.gain, this.masterLevel(), 0.25);
    this.musicBus.gain.setTargetAtTime(this.musicLevel(), ctx.currentTime, 0.08);
    this.effectsBus.gain.setTargetAtTime(this.effectsLevel(), ctx.currentTime, 0.05);
    if (!this.wantsMusic) this.stopMusic(1.2);
    else if (ctx.state === 'running' && this.attached) this.startMusic(2.5);
  }

  /* ---------------------------------------------------------------- music */

  private startMusic(fadeIn: number) {
    const ctx = this.ctx;
    if (!ctx || !this.musicBus || !this.space || this.session) return;
    const dry = ctx.createGain();
    const wet = ctx.createGain();
    dry.gain.value = 0;
    wet.gain.value = 0;
    dry.connect(this.musicBus);
    wet.connect(this.space);
    this.session = { dry, wet };
    this.fade(dry.gain, 0.75, fadeIn);
    this.fade(wet.gain, 0.6, fadeIn);
    this.nextChordAt = ctx.currentTime + 0.3;
    this.nextBellAt = ctx.currentTime + 10;
    this.chord = 0;
    this.pump();
    this.timer = window.setInterval(this.pump, 1000);
  }

  private stopMusic(fadeOut: number) {
    const session = this.session;
    if (!session || !this.ctx) return;
    this.session = null;
    window.clearInterval(this.timer);
    this.fade(session.dry.gain, 0, fadeOut);
    this.fade(session.wet.gain, 0, fadeOut);
    // Chords are scheduled a few seconds ahead: once the fade is over, cut the old passage loose so none of it returns.
    window.setTimeout(() => {
      session.dry.disconnect();
      session.wet.disconnect();
    }, fadeOut * 1000 + 200);
  }

  /** Keeps the next few seconds of music scheduled. */
  private pump = () => {
    const ctx = this.ctx;
    const session = this.session;
    if (!ctx || !session || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    // If the timer was held back (a background tab), carry on from now instead of catching up.
    if (this.nextChordAt < now) this.nextChordAt = now + 0.2;
    while (this.nextChordAt < now + 4) {
      scheduleChord(ctx, session.dry, session.wet, this.nextChordAt, this.chord);
      this.nextChordAt += CHORD_EVERY;
      this.chord += 1;
    }
    if (this.nextBellAt < now) this.nextBellAt = now + 3;
    while (this.nextBellAt < now + 4) {
      scheduleBell(ctx, session.dry, session.wet, this.nextBellAt, Math.random(), Math.random());
      this.nextBellAt += 8 + Math.random() * 10;
    }
  };

  /* ---------------------------------------------------------------- called by the page */

  /** The public site is on screen: sound may start with the visitor's next click, tap or key press. */
  attach() {
    this.attached = true;
  }

  /** The public site has left the screen (for example, the owner's Studio is open): fade out and rest. */
  detach() {
    this.attached = false;
    this.stopMusic(0.3);
    const ctx = this.ctx;
    if (ctx) {
      window.setTimeout(() => {
        if (!this.attached) void ctx.suspend().catch(() => {});
      }, 500);
    }
  }

  /** Call on a click, tap or key press. Creates the audio the first time, and wakes it if the browser has paused it. */
  unlock() {
    if (!this.attached || this.hidden) return;
    if (!this.ctx) this.build();
    const ctx = this.ctx;
    if (!ctx || ctx.state === 'running') return;
    this.resuming = true;
    void ctx.resume().catch(() => {
      this.resuming = false;
    });
  }

  /** The tab was hidden or shown: fade out and pause while hidden, come back gently when shown. */
  setHidden(hidden: boolean) {
    if (hidden === this.hidden) return;
    this.hidden = hidden;
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    if (hidden) {
      this.fade(this.master.gain, 0, 0.4);
      window.setTimeout(() => {
        if (this.hidden) void ctx.suspend().catch(() => {});
      }, 450);
    } else if (this.attached) {
      void ctx.resume().catch(() => {});
      this.fade(this.master.gain, this.masterLevel(), 1.2);
    }
  }

  /** The window lost or regained focus: lower the music while the visitor is working somewhere else. */
  duck(on: boolean) {
    this.ducked = on;
    if (this.ctx && this.musicBus) this.musicBus.gain.setTargetAtTime(this.musicLevel(), this.ctx.currentTime, 0.35);
  }

  /** Starts the audio afresh, for when sound has stopped responding (for example, after the output device changed). */
  restart() {
    const old = this.ctx;
    window.clearInterval(this.timer);
    this.ctx = null;
    this.session = null;
    this.last = {};
    this.hushUntil = 0;
    if (old) void old.close().catch(() => {});
    this.build();
    this.unlock();
    this.emit();
  }

  /** True if code has asked for an interface sound since `time` (a performance.now() value). */
  askedSince(time: number) {
    return this.askedAt >= time;
  }

  /** Plays an interface sound, unless sound is off or another sound has only just played. Returns true if it played. */
  play(name: Sfx): boolean {
    const rule = RULES[name];
    const now = performance.now();
    if (rule.rank >= 2) this.askedAt = now;
    const skip = (why: string) => {
      if (trace) console.debug(`[sound] ${name}: skipped (${why})`);
      return false;
    };

    const ctx = this.ctx;
    if (!ctx || !this.effectsBus || !this.echo) return skip('not started');
    if (this.hidden || this.settings.muted || !this.settings.effects) return skip('off');
    if (ctx.state !== 'running' && !this.resuming) return skip('paused');
    if (rule.rank <= 1 && now < this.hushUntil) return skip('page is moving');
    if (now - (this.last[name] ?? -Infinity) < rule.every) return skip('repeat');
    for (const other of NAMES) {
      if (RULES[other].rank >= rule.rank && now - (this.last[other] ?? -Infinity) < rule.quiet) return skip(`after ${other}`);
    }

    this.last[name] = now;
    if (rule.hush) this.hushUntil = now + rule.hush;
    playSfx(ctx, this.effectsBus, this.echo, name, ctx.currentTime + 0.005);
    if (trace) console.debug(`[sound] ${name}: played`);
    return true;
  }
}

export const sound = new SoundEngine();
