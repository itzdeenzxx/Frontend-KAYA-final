import { useCallback, useRef, useEffect } from 'react';

interface SoundManagerReturn {
  playBgMusic: () => void;
  stopBgMusic: () => void;
  playGreenLight: () => void;
  playYellowLight: () => void;
  playRedLight: () => void;
  playStep: () => void;
  playHit: () => void;
  playWin: () => void;
  playClick: () => void;
  setVolume: (volume: number) => void;
  setLevel: (levelId: string) => void;
  isMuted: boolean;
  toggleMute: () => void;
}

// Enhanced Web Audio API based sound generator with better effects
class SoundGenerator {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted = false;
  private currentLevel: string = 'medium';

  constructor() {
    this.init();
  }

  private init() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.6;
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  private ensureContext() {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  setLevel(levelId: string) {
    this.currentLevel = levelId;
  }

  setVolume(volume: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = volume;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : 0.6;
    }
  }

  getMuted() {
    return this.isMuted;
  }

  // Enhanced tone with filter
  private playTone(
    frequency: number, 
    duration: number, 
    type: OscillatorType = 'sine', 
    volume = 0.3,
    filterFreq?: number
  ) {
    if (!this.audioContext || !this.masterGain || this.isMuted) return;
    
    this.ensureContext();
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    
    let lastNode: AudioNode = oscillator;
    
    // Add filter for richer sound
    if (filterFreq) {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = filterFreq;
      filter.Q.value = 2;
      oscillator.connect(filter);
      lastNode = filter;
    }
    
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    lastNode.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Play arpeggio (notes played quickly in sequence)
  private playArpeggio(frequencies: number[], duration: number, type: OscillatorType = 'sine', delay = 50) {
    frequencies.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, duration, type, 0.25, 2000), i * delay);
    });
  }

  // Create noise buffer
  private createNoiseBuffer(duration: number, decay: number = 0.1): AudioBuffer | null {
    if (!this.audioContext) return null;
    
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * decay));
    }
    
    return buffer;
  }

  // Background music patterns per level
  private bgMusicInterval: NodeJS.Timeout | null = null;
  private bgMusicPlaying = false;

  private getMusicPattern() {
    switch (this.currentLevel) {
      case 'easy':
        return {
          notes: [
            { freq: 262, dur: 0.2 }, // C4
            { freq: 294, dur: 0.2 }, // D4
            { freq: 330, dur: 0.2 }, // E4
            { freq: 294, dur: 0.2 }, // D4
          ],
          tempo: 500,
          type: 'sine' as OscillatorType,
          volume: 0.1
        };
      case 'hard':
        return {
          notes: [
            { freq: 147, dur: 0.15 }, // D3
            { freq: 165, dur: 0.15 }, // E3
            { freq: 147, dur: 0.15 }, // D3
            { freq: 131, dur: 0.15 }, // C3
            { freq: 147, dur: 0.15 }, // D3
            { freq: 196, dur: 0.15 }, // G3
          ],
          tempo: 250,
          type: 'sawtooth' as OscillatorType,
          volume: 0.08
        };
      case 'party':
        return {
          notes: [
            { freq: 392, dur: 0.1 }, // G4
            { freq: 440, dur: 0.1 }, // A4
            { freq: 494, dur: 0.1 }, // B4
            { freq: 523, dur: 0.1 }, // C5
            { freq: 494, dur: 0.1 }, // B4
            { freq: 440, dur: 0.1 }, // A4
            { freq: 392, dur: 0.1 }, // G4
            { freq: 349, dur: 0.1 }, // F4
          ],
          tempo: 180,
          type: 'square' as OscillatorType,
          volume: 0.07
        };
      default: // medium
        return {
          notes: [
            { freq: 262, dur: 0.15 }, // C4
            { freq: 330, dur: 0.15 }, // E4
            { freq: 392, dur: 0.15 }, // G4
            { freq: 330, dur: 0.15 }, // E4
          ],
          tempo: 350,
          type: 'triangle' as OscillatorType,
          volume: 0.09
        };
    }
  }

  playBgMusic() {
    if (this.bgMusicPlaying || this.isMuted) return;
    this.bgMusicPlaying = true;
    
    const pattern = this.getMusicPattern();
    let i = 0;
    
    const playNext = () => {
      if (!this.bgMusicPlaying || this.isMuted) return;
      const note = pattern.notes[i % pattern.notes.length];
      this.playTone(note.freq, note.dur, pattern.type, pattern.volume, 1500);
      i++;
    };
    
    playNext();
    this.bgMusicInterval = setInterval(playNext, pattern.tempo);
  }

  stopBgMusic() {
    this.bgMusicPlaying = false;
    if (this.bgMusicInterval) {
      clearInterval(this.bgMusicInterval);
      this.bgMusicInterval = null;
    }
  }

  playGreenLight() {
    // Bright, happy ascending arpeggio
    const baseFreq = this.currentLevel === 'party' ? 587 : 523; // D5 or C5
    this.playArpeggio([baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2], 0.3, 'sine', 40);
    
    // Add shimmer
    setTimeout(() => {
      this.playTone(baseFreq * 2, 0.5, 'sine', 0.15, 3000);
    }, 200);
  }

  playYellowLight() {
    // Urgent warning beeps
    const freq = this.currentLevel === 'hard' ? 880 : 660;
    
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.playTone(freq, 0.15, 'triangle', 0.35);
        this.playTone(freq * 1.5, 0.1, 'sine', 0.15);
      }, i * 200);
    }
  }

  playRedLight() {
    // Dramatic stop sound
    const baseFreq = this.currentLevel === 'hard' ? 200 : 250;
    
    // Deep bass hit
    this.playTone(baseFreq, 0.6, 'sawtooth', 0.4, 500);
    
    // Add tension
    setTimeout(() => {
      this.playTone(baseFreq * 0.75, 0.4, 'square', 0.2, 300);
    }, 100);
    
    // Eerie high tone
    if (this.currentLevel === 'hard' || this.currentLevel === 'party') {
      setTimeout(() => {
        this.playTone(baseFreq * 4, 0.3, 'sine', 0.1);
      }, 200);
    }
  }

  playStep() {
    // Footstep sound varies by level
    const baseFreq = 600 + Math.random() * 200;
    
    switch (this.currentLevel) {
      case 'easy':
        this.playTone(baseFreq, 0.04, 'sine', 0.12);
        break;
      case 'hard':
        this.playTone(baseFreq * 0.8, 0.03, 'square', 0.1);
        this.playTone(baseFreq * 1.2, 0.02, 'sawtooth', 0.05);
        break;
      case 'party':
        // Musical steps!
        const notes = [523, 587, 659, 698, 784];
        this.playTone(notes[Math.floor(Math.random() * notes.length)], 0.08, 'triangle', 0.15);
        break;
      default:
        this.playTone(baseFreq, 0.05, 'triangle', 0.12);
    }
  }

  playHit() {
    if (!this.audioContext || !this.masterGain || this.isMuted) return;
    
    this.ensureContext();
    
    // Explosion with more impact
    const noiseBuffer = this.createNoiseBuffer(0.4, 0.08);
    if (noiseBuffer) {
      const noise = this.audioContext.createBufferSource();
      const noiseGain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      
      filter.type = 'lowpass';
      filter.frequency.value = 1000;
      
      noise.buffer = noiseBuffer;
      noiseGain.gain.setValueAtTime(0.6, this.audioContext.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
      
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start();
    }
    
    // Deep impact boom
    this.playTone(60, 0.5, 'sine', 0.6);
    this.playTone(80, 0.4, 'triangle', 0.4);
    
    // Rocket whistle down
    if (this.audioContext) {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);
      
      gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.3);
    }
  }

  playWin() {
    // Epic victory fanfare!
    const fanfare = [
      { freq: 523, delay: 0 },    // C5
      { freq: 659, delay: 100 },  // E5
      { freq: 784, delay: 200 },  // G5
      { freq: 1047, delay: 350 }, // C6
      { freq: 1319, delay: 500 }, // E6
      { freq: 1568, delay: 650 }, // G6
      { freq: 2093, delay: 800 }, // C7
    ];
    
    fanfare.forEach(({ freq, delay }) => {
      setTimeout(() => {
        this.playTone(freq, 0.4, 'sine', 0.25, 4000);
        // Add harmony
        this.playTone(freq * 1.25, 0.3, 'triangle', 0.1);
      }, delay);
    });
    
    // Sparkle effect
    setTimeout(() => {
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          this.playTone(2000 + Math.random() * 1000, 0.1, 'sine', 0.08);
        }, i * 80);
      }
    }, 900);
    
    // Final chord
    setTimeout(() => {
      this.playArpeggio([1047, 1319, 1568, 2093], 0.8, 'sine', 30);
    }, 1100);
  }

  playClick() {
    this.playTone(1200, 0.04, 'square', 0.15);
    this.playTone(800, 0.03, 'sine', 0.1);
  }

  // Countdown beep for game start
  playCountdown(number: number) {
    if (number > 0) {
      this.playTone(440, 0.15, 'triangle', 0.3);
    } else {
      // GO!
      this.playArpeggio([523, 659, 784], 0.2, 'sine', 30);
    }
  }
}

export function useSoundManager(): SoundManagerReturn {
  const soundRef = useRef<SoundGenerator | null>(null);

  useEffect(() => {
    soundRef.current = new SoundGenerator();
    return () => {
      soundRef.current?.stopBgMusic();
    };
  }, []);

  const playBgMusic = useCallback(() => soundRef.current?.playBgMusic(), []);
  const stopBgMusic = useCallback(() => soundRef.current?.stopBgMusic(), []);
  const playGreenLight = useCallback(() => soundRef.current?.playGreenLight(), []);
  const playYellowLight = useCallback(() => soundRef.current?.playYellowLight(), []);
  const playRedLight = useCallback(() => soundRef.current?.playRedLight(), []);
  const playStep = useCallback(() => soundRef.current?.playStep(), []);
  const playHit = useCallback(() => soundRef.current?.playHit(), []);
  const playWin = useCallback(() => soundRef.current?.playWin(), []);
  const playClick = useCallback(() => soundRef.current?.playClick(), []);
  const setVolume = useCallback((v: number) => soundRef.current?.setVolume(v), []);
  const setLevel = useCallback((levelId: string) => soundRef.current?.setLevel(levelId), []);
  const toggleMute = useCallback(() => soundRef.current?.toggleMute(), []);

  return {
    playBgMusic,
    stopBgMusic,
    playGreenLight,
    playYellowLight,
    playRedLight,
    playStep,
    playHit,
    playWin,
    playClick,
    setVolume,
    setLevel,
    isMuted: soundRef.current?.getMuted() ?? false,
    toggleMute
  };
}
