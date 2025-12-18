/**
 * SoundManager - Audio feedback for POS operations
 * Provides beep sounds for successful scans, pack scans, and errors
 */

class SoundManager {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    // Initialize AudioContext on first use (browser requires user interaction)
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('AudioContext not supported, sounds will be disabled');
        this.isEnabled = false;
      }
    }
  }

  private ensureAudioContext(): AudioContext | null {
    if (!this.isEnabled || !this.audioContext) return null;
    
    // Resume if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    return this.audioContext;
  }

  /**
   * Play a beep sound (successful scan)
   * Frequency: 800Hz, Duration: 100ms
   */
  playBeep(): void {
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 800; // Hz
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  }

  /**
   * Play double beep (pack scan - bulk item)
   * Two beeps: 800Hz then 1000Hz
   */
  playDoubleBeep(): void {
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    const playSingleBeep = (frequency: number, delay: number) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime + delay);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.1);

      oscillator.start(ctx.currentTime + delay);
      oscillator.stop(ctx.currentTime + delay + 0.1);
    };

    playSingleBeep(800, 0);
    playSingleBeep(1000, 0.15);
  }

  /**
   * Play error sound (product not found)
   * Low frequency descending tone: 400Hz -> 200Hz
   */
  playError(): void {
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(400, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
    oscillator.type = 'sawtooth';

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  }

  /**
   * Enable/disable sounds
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if sounds are enabled
   */
  isSoundEnabled(): boolean {
    return this.isEnabled;
  }
}

// Singleton instance
export const soundManager = new SoundManager();








