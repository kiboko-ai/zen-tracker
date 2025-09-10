import { AppState, AppStateStatus, Platform } from 'react-native';

class BackgroundTimerService {
  private listeners: Map<string, () => void> = new Map();
  private intervals: Map<string, { 
    callback: () => void; 
    interval: number; 
    lastRun: number;
    backgroundStartTime?: number;
  }> = new Map();
  private appState: AppStateStatus = 'active';
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (this.isInitialized) return;
    
    this.appState = AppState.currentState;
    
    AppState.addEventListener('change', this.handleAppStateChange);
    this.isInitialized = true;
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    const previousState = this.appState;
    this.appState = nextAppState;

    if (previousState.match(/active/) && nextAppState === 'background') {
      // Going to background - record time for each interval
      const now = Date.now();
      this.intervals.forEach((interval, id) => {
        interval.backgroundStartTime = now;
      });
    } else if (previousState === 'background' && nextAppState === 'active') {
      // Coming back from background - catch up on missed intervals
      const now = Date.now();
      this.intervals.forEach((interval, id) => {
        if (interval.backgroundStartTime) {
          const elapsedTime = now - interval.backgroundStartTime;
          const missedIntervals = Math.floor(elapsedTime / interval.interval);
          
          // Execute callback for missed intervals
          for (let i = 0; i < missedIntervals; i++) {
            interval.callback();
          }
          
          // Update last run time
          interval.lastRun = now;
          delete interval.backgroundStartTime;
        }
      });
    }
  };

  setBackgroundInterval(callback: () => void, ms: number): string {
    const id = Math.random().toString(36).substring(7);
    
    this.intervals.set(id, {
      callback,
      interval: ms,
      lastRun: Date.now(),
    });

    // Start regular interval for foreground
    const intervalId = setInterval(() => {
      if (this.appState === 'active') {
        const interval = this.intervals.get(id);
        if (interval) {
          interval.callback();
          interval.lastRun = Date.now();
        }
      }
    }, ms);

    this.listeners.set(id, () => clearInterval(intervalId));
    
    return id;
  }

  clearBackgroundInterval(id: string) {
    const clear = this.listeners.get(id);
    if (clear) {
      clear();
      this.listeners.delete(id);
    }
    this.intervals.delete(id);
  }

  // Method to get accurate elapsed time even when app was in background
  getElapsedTime(startTime: Date, pausedDuration: number = 0): number {
    const now = new Date();
    const totalElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    return totalElapsed - pausedDuration;
  }

  destroy() {
    this.listeners.forEach(clear => clear());
    this.listeners.clear();
    this.intervals.clear();
  }

  // Alias methods for backward compatibility
  setInterval(callback: () => void, ms: number): string {
    return this.setBackgroundInterval(callback, ms);
  }

  clearInterval(id: string) {
    this.clearBackgroundInterval(id);
  }
}

export default new BackgroundTimerService();