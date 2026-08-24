// Procedurally generated ambient focus sounds via the Web Audio API — no
// external audio files or licensing concerns, works fully offline.
let audioContext = null;
let sourceNode = null;
let filterNode = null;
let gainNode = null;

const createBrownNoiseBuffer = (ctx) => {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    lastOut = (lastOut + 0.02 * white) / 1.02;
    output[i] = lastOut * 3.5;
  }
  return buffer;
};

const createWhiteNoiseBuffer = (ctx) => {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  return buffer;
};

export const stopFocusSound = () => {
  if (sourceNode) {
    try { sourceNode.stop(); } catch (e) { /* already stopped */ }
    sourceNode.disconnect();
    sourceNode = null;
  }
  if (filterNode) { filterNode.disconnect(); filterNode = null; }
  if (gainNode) { gainNode.disconnect(); gainNode = null; }
  if (audioContext) { audioContext.close(); audioContext = null; }
};

// type: 'brown' (deep rumble) or 'rain' (softer filtered hiss)
export const startFocusSound = (type = 'brown', volume = 0.15) => {
  stopFocusSound();
  audioContext = new (window.AudioContext || window.webkitAudioContext)();

  const buffer = type === 'rain' ? createWhiteNoiseBuffer(audioContext) : createBrownNoiseBuffer(audioContext);
  sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = buffer;
  sourceNode.loop = true;

  gainNode = audioContext.createGain();
  gainNode.gain.value = volume;

  if (type === 'rain') {
    filterNode = audioContext.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.value = 2500;
    sourceNode.connect(filterNode);
    filterNode.connect(gainNode);
  } else {
    sourceNode.connect(gainNode);
  }

  gainNode.connect(audioContext.destination);
  sourceNode.start(0);
};

export const setFocusSoundVolume = (volume) => {
  if (gainNode) gainNode.gain.value = volume;
};
