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

export type SoundType = 'click' | 'correct' | 'incorrect' | 'achievement' | 'combo';

const playNote = (context: AudioContext, frequency: number, startTime: number, duration: number, type: OscillatorType = 'triangle') => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.00001, startTime + duration);
  
  oscillator.connect(gain);
  gain.connect(context.destination);
  
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
};


export const playSound = (type: SoundType, ...args: any[]) => {
  if (!isSoundEnabled) return;
  
  try {
    const context = getAudioContext();
    const now = context.currentTime;
    
    if (type === 'achievement') {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        const noteDuration = 0.1;
        notes.forEach((freq, i) => {
            playNote(context, freq, now + i * noteDuration, noteDuration);
        });
        return;
    }

    if (type === 'combo') {
        const comboCount = args[0] as number || 2;
        const baseFreq = 440; // A4
        // Increase pitch by a semitone for each combo, capping it to avoid it getting too high
        const semiToneStep = Math.min(comboCount - 1, 24); // Cap at 2 octaves
        const frequency = baseFreq * Math.pow(2, semiToneStep / 12);
        playNote(context, frequency, now, 0.15, 'sine');
        return;
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.connect(gain);
    gain.connect(context.destination);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.01);

    switch (type) {
      case 'click':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, now); // A4 note
        break;
      case 'correct':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, now); // C5 note
        gain.gain.linearRampToValueAtTime(0.5, now + 0.01);
        break;
      case 'incorrect':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(164.81, now); // E3 note
        break;
    }

    oscillator.start(now);
    gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.1);
    oscillator.stop(now + 0.1);

  } catch (error) {
    console.warn("Could not play sound:", error);
  }
};