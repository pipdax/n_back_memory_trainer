// A simple sound service using the Web Audio API to avoid needing audio files.

let audioContext: AudioContext;
let isSoundEnabled = true;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

export const setSoundEnabled = (enabled: boolean) => {
  isSoundEnabled = enabled;
};

type SoundType = 'click' | 'correct' | 'incorrect';

export const playSound = (type: SoundType) => {
  if (!isSoundEnabled) return;
  
  try {
    const context = getAudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.connect(gain);
    gain.connect(context.destination);

    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.01);

    switch (type) {
      case 'click':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, context.currentTime); // A4 note
        break;
      case 'correct':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, context.currentTime); // C5 note
        gain.gain.linearRampToValueAtTime(0.5, context.currentTime + 0.01);
        break;
      case 'incorrect':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(220, context.currentTime); // A3 note
        break;
    }

    oscillator.start(context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.1);
    oscillator.stop(context.currentTime + 0.1);

  } catch (error) {
    console.warn("Could not play sound:", error);
  }
};
