// Web Audio API procedural preview synthesizer for fallback audio preview

let audioCtx: AudioContext | null = null;
let activeSourceNode: AudioNode | null = null;
let stopCallback: (() => void) | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Creates a unique musical chord progression based on the track title and artist
 * to give every song a distinct 15-second melodic preview even without a remote mp3 file.
 */
export function playSynthesizedPreview(
  trackTitle: string,
  artistName: string,
  onEnded?: () => void,
  onTimeUpdate?: (currentTime: number, duration: number) => void
): () => void {
  stopSynthesizedPreview();

  const ctx = getAudioContext();
  const duration = 15; // 15 seconds synthesized melody preview

  // Derive root notes from text hash
  const hash = (trackTitle + artistName).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const scales = [
    [261.63, 293.66, 329.63, 392.0, 440.0], // C Pentatonic
    [220.0, 246.94, 261.63, 293.66, 329.63], // A Minor
    [293.66, 329.63, 369.99, 440.0, 493.88], // D Major
    [196.0, 220.0, 246.94, 293.66, 329.63], // G Major
  ];
  const chosenScale = scales[hash % scales.length];

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.25, ctx.currentTime);
  masterGain.connect(ctx.destination);

  activeSourceNode = masterGain;

  const notesCount = 16;
  const noteDuration = 0.8;
  const oscillators: OscillatorNode[] = [];

  for (let i = 0; i < notesCount; i++) {
    const noteFreq = chosenScale[(hash + i * 3) % chosenScale.length] * ((i % 4 === 0) ? 0.5 : 1);
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();

    osc.type = i % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(noteFreq, ctx.currentTime);

    const startTime = ctx.currentTime + i * noteDuration;
    noteGain.gain.setValueAtTime(0.001, startTime);
    noteGain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.05);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + noteDuration - 0.05);

    osc.connect(noteGain);
    noteGain.connect(masterGain);

    osc.start(startTime);
    osc.stop(startTime + noteDuration);
    oscillators.push(osc);
  }

  // Periodic time updates
  const startTimestamp = Date.now();
  const timer = setInterval(() => {
    const elapsed = (Date.now() - startTimestamp) / 1000;
    if (elapsed >= duration) {
      clearInterval(timer);
      stopSynthesizedPreview();
      onEnded?.();
    } else {
      onTimeUpdate?.(elapsed, duration);
    }
  }, 250);

  const stopFn = () => {
    clearInterval(timer);
    try {
      oscillators.forEach((osc) => {
        try {
          osc.stop();
        } catch {}
      });
      masterGain.disconnect();
    } catch {}
    activeSourceNode = null;
    stopCallback = null;
  };

  stopCallback = stopFn;
  return stopFn;
}

export function stopSynthesizedPreview() {
  if (stopCallback) {
    stopCallback();
    stopCallback = null;
  }
}
