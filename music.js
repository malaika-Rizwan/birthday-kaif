// Festive Birthday Music Engine (Web Audio API)
// Cheerful, upbeat instrumental music-box & marimba style loop.

(function () {
  let audioCtx = null;
  let masterGain = null;
  let isMuted = false;
  let isPlaying = false;
  let timerId = null;

  // Retrieve saved mute preference
  try {
    const saved = localStorage.getItem("birthday_music_muted");
    if (saved !== null) {
      isMuted = saved === "true";
    }
  } catch (e) {}

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      audioCtx = new AudioContextClass();
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(isMuted ? 0 : 0.22, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
    }
    return audioCtx;
  }

  // Frequencies for Happy Birthday in C major
  const NOTES = {
    G3: 196.00, A3: 220.00, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00,
    REST: 0
  };

  // Melody: [note, durationInBeats]
  const MELODY = [
    // Measure 1 & 2
    ["G4", 0.75], ["G4", 0.25], ["A4", 1.0], ["G4", 1.0], ["C5", 1.0], ["B4", 2.0],
    // Measure 3 & 4
    ["G4", 0.75], ["G4", 0.25], ["A4", 1.0], ["G4", 1.0], ["D5", 1.0], ["C5", 2.0],
    // Measure 5 & 6
    ["G4", 0.75], ["G4", 0.25], ["G5", 1.0], ["E5", 1.0], ["C5", 1.0], ["B4", 1.0], ["A4", 1.5],
    // Measure 7 & 8
    ["F5", 0.75], ["F5", 0.25], ["E5", 1.0], ["C5", 1.0], ["D5", 1.0], ["C5", 2.5],
    ["REST", 0.5]
  ];

  // Accompaniment chords (bass roots & harmonies): [timeInBeats, [rootNote, harmonyNote]]
  const CHORDS = [
    [0, ["C3", "E4"]],
    [3, ["G3", "D4"]],
    [6, ["G3", "F4"]],
    [9, ["C3", "E4"]],
    [12, ["C3", "G4"]],
    [15, ["F3", "A4"]],
    [18, ["C3", "G4"]],
    [21, ["G3", "B4"]],
    [22.5, ["C4", "C5"]]
  ];

  function playTone(freq, startTime, duration, type = "triangle", vol = 0.3) {
    if (!audioCtx || freq <= 0) return;

    // Dual-oscillator for a bright, rich music-box / marimba pluck
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const noteGain = audioCtx.createGain();

    osc1.type = type; // "triangle" or "sine"
    osc1.frequency.setValueAtTime(freq, startTime);

    // Overtone for bell-like chime
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq * 2, startTime);

    // Envelope: quick attack, natural exponential decay
    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.exponentialRampToValueAtTime(vol, startTime + 0.015);
    noteGain.gain.exponentialRampToValueAtTime(vol * 0.45, startTime + duration * 0.5);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration + 0.15);

    osc1.connect(noteGain);
    osc2.connect(noteGain);
    noteGain.connect(masterGain);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration + 0.2);
    osc2.stop(startTime + duration + 0.2);
  }

  function playBass(freq, startTime, duration) {
    if (!audioCtx || freq <= 0) return;
    const osc = audioCtx.createOscillator();
    const noteGain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, startTime);

    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.exponentialRampToValueAtTime(0.22, startTime + 0.03);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(noteGain);
    noteGain.connect(masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  function scheduleLoop() {
    const ctx = getAudioContext();
    if (!ctx) return;

    const tempo = 126; // BPM
    const secondsPerBeat = 60 / tempo;
    const startTime = ctx.currentTime + 0.05;

    let currentBeat = 0;

    // Schedule melody
    for (const item of MELODY) {
      const noteName = item[0];
      const beats = item[1];
      const freq = NOTES[noteName] || 0;
      const noteDuration = beats * secondsPerBeat * 0.92;

      if (freq > 0) {
        playTone(freq, startTime + (currentBeat * secondsPerBeat), noteDuration, "triangle", 0.35);
      }
      currentBeat += beats;
    }

    // Schedule chords
    const chordNotes = {
      C3: 130.81, G3: 196.00, F3: 174.61, C4: 261.63,
      E4: 329.63, D4: 293.66, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88, C5: 523.25
    };

    for (const chord of CHORDS) {
      const chordBeat = chord[0];
      const chordList = chord[1];
      const time = startTime + (chordBeat * secondsPerBeat);

      if (chordNotes[chordList[0]]) {
        playBass(chordNotes[chordList[0]], time, secondsPerBeat * 2.2);
      }
      if (chordNotes[chordList[1]]) {
        playTone(chordNotes[chordList[1]], time, secondsPerBeat * 1.5, "sine", 0.15);
      }
    }

    const totalDuration = currentBeat * secondsPerBeat;
    timerId = setTimeout(scheduleLoop, (totalDuration - 0.15) * 1000);
  }

  function start() {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().then(() => {
        if (!isPlaying) {
          isPlaying = true;
          scheduleLoop();
        }
      });
    } else {
      if (!isPlaying) {
        isPlaying = true;
        scheduleLoop();
      }
    }
  }

  function toggleMute() {
    const ctx = getAudioContext();
    isMuted = !isMuted;
    try {
      localStorage.setItem("birthday_music_muted", String(isMuted));
    } catch (e) {}

    if (ctx && masterGain) {
      const now = ctx.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(masterGain.gain.value, now);
      masterGain.gain.linearRampToValueAtTime(isMuted ? 0 : 0.22, now + 0.08);
    }

    if (!isPlaying && !isMuted) {
      start();
    }
    updateMuteUI();
  }

  function updateMuteUI() {
    const btns = document.querySelectorAll(".music-toggle-btn");
    btns.forEach(btn => {
      btn.setAttribute("aria-pressed", isMuted ? "true" : "false");
      btn.innerHTML = isMuted 
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg><span>Music: OFF</span>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg><span>Music: ON</span>`;
      btn.classList.toggle("is-muted", isMuted);
    });
  }

  // Auto unlock on first user gesture
  const unlockEvents = ["pointerdown", "click", "touchstart", "keydown"];
  function onFirstInteraction() {
    start();
    unlockEvents.forEach(evt => window.removeEventListener(evt, onFirstInteraction));
  }
  unlockEvents.forEach(evt => window.addEventListener(evt, onFirstInteraction, { passive: true }));

  // Auto-start immediately if browser permits
  window.addEventListener("DOMContentLoaded", () => {
    updateMuteUI();
    document.querySelectorAll(".music-toggle-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleMute();
      });
    });
    start();
  });

  window.BirthdayMusic = {
    start,
    toggleMute,
    isMuted: () => isMuted,
    getAudioContext
  };
})();
