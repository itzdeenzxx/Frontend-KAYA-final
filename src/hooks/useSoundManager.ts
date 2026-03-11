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
    if (this.bgAudio) {
      this.bgAudio.muted = this.isMuted;
    }
    if (this.isMuted) {
      this.stopBgMusic();
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

  // Background music using mp3 file
  private bgAudio: HTMLAudioElement | null = null;
  private bgMusicPlaying = false;

  playBgMusic() {
    if (this.bgMusicPlaying || this.isMuted) return;
    this.bgMusicPlaying = true;

    if (!this.bgAudio) {
      this.bgAudio = new Audio('/assets/music/mouse-game.mp3');
      this.bgAudio.loop = true;
      this.bgAudio.volume = 0.18;
    }

    const tryPlay = () => {
      if (this.bgAudio && this.bgAudio.paused && this.bgMusicPlaying) {
        this.bgAudio.play().catch(() => {});
      }
    };
    tryPlay();
    // If blocked by autoplay policy, unlock on next interaction
    const events = ['click', 'touchstart', 'keydown'] as const;
    events.forEach(e => document.addEventListener(e, tryPlay, { once: true }));
  }

  stopBgMusic() {
    this.bgMusicPlaying = false;
    if (this.bgAudio) {
      this.bgAudio.pause();
      this.bgAudio.currentTime = 0;
    }
  }

  playGreenLight() {
    const baseFreq = this.currentLevel === 'party' ? 587 : 523;
    this.playTone(baseFreq, 0.2, 'sine', 0.12);
  }

  playYellowLight() {
    const freq = this.currentLevel === 'hard' ? 880 : 660;
    this.playTone(freq, 0.12, 'triangle', 0.15);
  }

  playRedLight() {
    const baseFreq = this.currentLevel === 'hard' ? 200 : 250;
    this.playTone(baseFreq, 0.3, 'sawtooth', 0.2, 500);
  }

  playStep() {
    const baseFreq = 600 + Math.random() * 200;
    this.playTone(baseFreq, 0.03, 'sine', 0.06);
  }

  playHit() {
    this.playTone(60, 0.3, 'sine', 0.25);
  }

  playWin() {
    const fanfare = [
      { freq: 523, delay: 0 },
      { freq: 659, delay: 120 },
      { freq: 784, delay: 240 },
      { freq: 1047, delay: 400 },
    ];
    fanfare.forEach(({ freq, delay }) => {
      setTimeout(() => this.playTone(freq, 0.3, 'sine', 0.15), delay);
    });
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
