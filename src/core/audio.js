/**
 * audio.js — Shared, asset-free sound engine.
 *
 * Everything here is synthesized with the Web Audio API (so there are no
 * copyrighted sound files to host) plus the browser's built-in speech
 * synthesis for spoken words. Browsers block audio until the user interacts,
 * so call `audio.unlock()` on the first click/keypress (the app does this).
 */

const NOTES = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0,
  A4: 440.0, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25,
  F5: 698.46, G5: 783.99, A5: 880.0, C6: 1046.5,
};

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.voice = null;
  }

  /** Lazily create the AudioContext after a user gesture. Safe to call often. */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.6;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this._pickVoice();
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.6;
    if (muted) window.speechSynthesis?.cancel();
  }

  /** Play a single tone. type: sine|square|triangle|sawtooth. */
  tone(freq, { duration = 0.3, type = 'sine', volume = 0.5, when = 0, glide = 0 } = {}) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glide) osc.frequency.exponentialRampToValueAtTime(freq * glide, t0 + duration);
    // Quick attack, smooth release — gentle on little ears.
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  /** Look up a note name (e.g. 'C4') or accept a raw frequency. */
  freq(noteOrHz) {
    return typeof noteOrHz === 'string' ? (NOTES[noteOrHz] || 440) : noteOrHz;
  }

  /** Play a note by name or frequency. */
  note(noteOrHz, opts = {}) {
    this.tone(this.freq(noteOrHz), opts);
  }

  /** Play several notes together as a chord. */
  chord(notes, opts = {}) {
    notes.forEach((n) => this.note(n, opts));
  }

  /** Play a sequence of notes. `seq` = [['C4', 0.2], ['E4', 0.2], ...]. */
  melody(seq, { type = 'triangle', volume = 0.4, gap = 0 } = {}) {
    let when = 0;
    for (const [note, dur] of seq) {
      this.note(note, { duration: dur, type, volume, when });
      when += dur + gap;
    }
  }

  /** Happy little reward jingle. */
  cheer() {
    this.melody([['C5', 0.12], ['E5', 0.12], ['G5', 0.12], ['C6', 0.22]], { type: 'triangle' });
  }

  /** Gentle "try again" sound (never harsh — toddlers are sensitive). */
  oops() {
    this.melody([['E4', 0.14], ['C4', 0.2]], { type: 'sine', volume: 0.35 });
  }

  /** Soft pop/click for hits and pops. */
  pop({ pitch = 1 } = {}) {
    this.tone(520 * pitch, { duration: 0.12, type: 'sine', volume: 0.45, glide: 1.8 });
  }

  /**
   * Sharp noise "bang" — a balloon burst. A short band-passed white-noise
   * transient plus a low thump for body. Bigger balloons -> lower, fatter bang.
   */
  burst({ pitch = 1, volume = 0.5 } = {}) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const dur = 0.14;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      // White noise with a fast quadratic decay -> a crisp snap.
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const band = this.ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 1100 * pitch;
    band.Q.value = 0.7;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(band).connect(gain).connect(this.master);
    src.start(t0);
    // A short low thump gives the bang some weight.
    this.tone(150 * pitch, { duration: 0.1, type: 'sine', volume: volume * 0.5, glide: 0.5 });
  }

  _pickVoice() {
    if (this.voice || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    // Prefer a clear English voice; fall back to whatever exists.
    this.voice =
      voices.find((v) => /en[-_]?(US|GB|AU)/i.test(v.lang) && /female|samantha|karen|moira|google/i.test(v.name)) ||
      voices.find((v) => /^en/i.test(v.lang)) ||
      voices[0] || null;
  }

  /** Speak text aloud in a slow, friendly, slightly higher voice. */
  speak(text, { rate = 0.9, pitch = 1.25, volume = 1 } = {}) {
    if (this.muted || !('speechSynthesis' in window)) return;
    this._pickVoice();
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (this.voice) u.voice = this.voice;
    u.rate = rate;
    u.pitch = pitch;
    u.volume = volume;
    window.speechSynthesis.speak(u);
  }
}

// Some browsers populate voices asynchronously.
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => audio._pickVoice();
}

export const audio = new AudioEngine();
