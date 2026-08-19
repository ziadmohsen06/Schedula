// Generate a soft "leaf rustle" sound using Web Audio API
let audioContext = null;

export const playLeafSound = () => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const ctx = audioContext;
    const now = ctx.currentTime;
    
    // Create a noise buffer for leaf rustle
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    
    // Create a filter for softer sound
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    filter.Q.value = 0.5;
    
    // Create gain for volume control
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    // Connect nodes
    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    // Play the sound
    noiseSource.start(now);
    noiseSource.stop(now + 0.3);
    
  } catch (err) {
    console.log('Could not play sound:', err);
  }
};

// Optional: Add a settings toggle
export const isSoundEnabled = () => {
  return localStorage.getItem('soundEnabled') !== 'false';
};

export const toggleSound = () => {
  const current = isSoundEnabled();
  localStorage.setItem('soundEnabled', !current);
  return !current;
};