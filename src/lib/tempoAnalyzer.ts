// Tempo Analyzer - Ported from KAYA/tempo_analyzer.py
// Analyzes movement tempo, rhythm, and consistency

import { 
  TempoQuality, 
  TEMPO_CONFIG, 
  COACH_MESSAGES,
  DifficultyLevel,
  DIFFICULTY_LEVELS,
} from './exerciseConfig';

// Rep timing data
export interface RepTiming {
  repNumber: number;
  startTime: number;
  peakTime: number;      // Time at UP position
  endTime: number;
  upDuration: number;    // Time going up
  downDuration: number;  // Time coming down
  totalDuration: number;
  tempoRatio: number;    // up/down ratio (should be ~1.0)
}

// Tempo analysis result
export interface TempoAnalysis {
  currentPhase: 'idle' | 'going_up' | 'at_peak' | 'going_down';
  phaseDuration: number;
  avgRepDuration: number;
  avgUpDuration: number;
  avgDownDuration: number;
  tempoQuality: TempoQuality;
  consistencyScore: number; // 0-1
  recommendedTempo: string; // "2-2" (up-down seconds)
  feedback: string;
  beatCount: number; // 1-4 for rhythm counting
}

// Tempo analyzer class
export class TempoAnalyzer {
  private repTimings: RepTiming[] = [];
  private currentPhase: 'idle' | 'going_up' | 'at_peak' | 'going_down' = 'idle';
  private phaseStartTime: number = 0;
  private currentRepStartTime: number = 0;
  private currentRepPeakTime: number = 0;
  private lastBeatTime: number = 0;
  private beatCount: number = 0;
  private repCount: number = 0;
  private difficulty: DifficultyLevel;
  private idealUpDuration: number;
  private idealDownDuration: number;
  private tempoTolerance: number;

  constructor(difficulty: DifficultyLevel = 'intermediate') {
    this.difficulty = difficulty;
    const settings = DIFFICULTY_LEVELS[difficulty];
    this.idealUpDuration = settings.upDuration;
    this.idealDownDuration = settings.downDuration;
    this.tempoTolerance = TEMPO_CONFIG.TEMPO_TOLERANCE;
    this.reset();
  }

  // Update difficulty settings
  setDifficulty(difficulty: DifficultyLevel): void {
    this.difficulty = difficulty;
    const settings = DIFFICULTY_LEVELS[difficulty];
    this.idealUpDuration = settings.upDuration;
    this.idealDownDuration = settings.downDuration;
  }

  // Update phase based on exercise stage
  updatePhase(stage: string, timestamp: number = Date.now()): void {
    const prevPhase = this.currentPhase;

    if (stage === 'up') {
      if (this.currentPhase === 'going_up') {
        this.currentPhase = 'at_peak';
        this.currentRepPeakTime = timestamp;
      } else if (this.currentPhase !== 'at_peak') {
        this.currentPhase = 'going_up';
        this.currentRepStartTime = timestamp;
        this.phaseStartTime = timestamp;
      }
    } else if (stage === 'down' || stage === 'center') {
      if (this.currentPhase === 'at_peak') {
        this.currentPhase = 'going_down';
        this.phaseStartTime = timestamp;
      } else if (this.currentPhase === 'going_down') {
        // Rep completed
        this.completeRep(timestamp);
        this.currentPhase = 'idle';
      }
    }

    // Update beat count
    this.updateBeatCount(timestamp);
  }

  // Complete a rep and record timing
  private completeRep(endTime: number): void {
    if (this.currentRepStartTime === 0) return;

    const upDuration = (this.currentRepPeakTime - this.currentRepStartTime) / 1000;
    const downDuration = (endTime - this.currentRepPeakTime) / 1000;
    const totalDuration = upDuration + downDuration;

    // Validate timing
    if (totalDuration < TEMPO_CONFIG.MIN_REP_DURATION || 
        totalDuration > TEMPO_CONFIG.MAX_REP_DURATION) {
      return;
    }

    this.repCount++;
    
    const timing: RepTiming = {
      repNumber: this.repCount,
      startTime: this.currentRepStartTime,
      peakTime: this.currentRepPeakTime,
      endTime,
      upDuration,
      downDuration,
      totalDuration,
      tempoRatio: upDuration / (downDuration || 1),
    };

    this.repTimings.push(timing);

    // Keep only last 10 reps for analysis
    if (this.repTimings.length > 10) {
      this.repTimings.shift();
    }

    // Reset for next rep
    this.currentRepStartTime = 0;
    this.currentRepPeakTime = 0;
  }

  // Update beat count for rhythm guidance
  private updateBeatCount(timestamp: number): void {
    const beatInterval = TEMPO_CONFIG.BEAT_INTERVAL * 1000; // Convert to ms
    
    if (timestamp - this.lastBeatTime >= beatInterval) {
      this.beatCount = (this.beatCount % 4) + 1;
      this.lastBeatTime = timestamp;
    }
  }

  // Analyze current tempo
  analyze(): TempoAnalysis {
    const now = Date.now();
    const phaseDuration = (now - this.phaseStartTime) / 1000;

    // Calculate averages
    let avgRepDuration = 0;
    let avgUpDuration = 0;
    let avgDownDuration = 0;

    if (this.repTimings.length > 0) {
      const totalDurations = this.repTimings.map(t => t.totalDuration);
      const upDurations = this.repTimings.map(t => t.upDuration);
      const downDurations = this.repTimings.map(t => t.downDuration);

      avgRepDuration = totalDurations.reduce((a, b) => a + b, 0) / totalDurations.length;
      avgUpDuration = upDurations.reduce((a, b) => a + b, 0) / upDurations.length;
      avgDownDuration = downDurations.reduce((a, b) => a + b, 0) / downDurations.length;
    }

    // Evaluate tempo quality
    const { quality, feedback } = this.evaluateTempo(avgRepDuration, avgUpDuration, avgDownDuration);

    // Calculate consistency score
    const consistencyScore = this.calculateConsistency();

    return {
      currentPhase: this.currentPhase,
      phaseDuration,
      avgRepDuration,
      avgUpDuration,
      avgDownDuration,
      tempoQuality: quality,
      consistencyScore,
      recommendedTempo: `${this.idealUpDuration}-${this.idealDownDuration}`,
      feedback,
      beatCount: this.beatCount,
    };
  }

  // Evaluate tempo quality based on ideal durations
  private evaluateTempo(
    avgDuration: number, 
    avgUp: number, 
    avgDown: number
  ): { quality: TempoQuality; feedback: string } {
    if (this.repTimings.length < 2) {
      return { quality: 'good', feedback: '' };
    }

    const idealTotal = this.idealUpDuration + this.idealDownDuration;
    const tolerance = this.tempoTolerance;

    // Check if too fast
    if (avgDuration < idealTotal * 0.5) {
      return { 
        quality: 'too_fast', 
        feedback: COACH_MESSAGES.tempo.too_fast 
      };
    }
    
    if (avgDuration < idealTotal - tolerance) {
      return { 
        quality: 'too_fast', 
        feedback: COACH_MESSAGES.tempo.too_fast_mild 
      };
    }

    // Check if too slow
    if (avgDuration > idealTotal * 1.5) {
      return { 
        quality: 'too_slow', 
        feedback: COACH_MESSAGES.tempo.too_slow 
      };
    }
    
    if (avgDuration > idealTotal + tolerance) {
      return { 
        quality: 'too_slow', 
        feedback: COACH_MESSAGES.tempo.too_slow_mild 
      };
    }

    // Check consistency
    const consistencyScore = this.calculateConsistency();
    if (consistencyScore < 0.6) {
      return { 
        quality: 'inconsistent', 
        feedback: COACH_MESSAGES.tempo.inconsistent 
      };
    }

    // Check up/down balance
    const tempoRatio = avgUp / (avgDown || 1);
    if (tempoRatio > 1.5) {
      return { 
        quality: 'good', 
        feedback: COACH_MESSAGES.tempo.unbalanced_up 
      };
    }
    
    if (tempoRatio < 0.67) {
      return { 
        quality: 'good', 
        feedback: COACH_MESSAGES.tempo.unbalanced_down 
      };
    }

    // Perfect tempo
    if (Math.abs(avgDuration - idealTotal) < tolerance * 0.5 && consistencyScore > 0.85) {
      return { 
        quality: 'perfect', 
        feedback: COACH_MESSAGES.tempo.perfect 
      };
    }

    return { 
      quality: 'good', 
      feedback: COACH_MESSAGES.tempo.good 
    };
  }

  // Calculate consistency score (0-1)
  private calculateConsistency(): number {
    if (this.repTimings.length < 3) {
      return 1;
    }

    const durations = this.repTimings.map(t => t.totalDuration);
    const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
    
    // Calculate standard deviation
    const squaredDiffs = durations.map(d => Math.pow(d - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
    const stdDev = Math.sqrt(avgSquaredDiff);

    // Consistency score: higher when std dev is lower
    const idealTotal = this.idealUpDuration + this.idealDownDuration;
    return Math.max(0, 1 - (stdDev / idealTotal));
  }

  // Get current beat count text (Thai)
  getBeatText(): string {
    return COACH_MESSAGES.beat_count[this.beatCount - 1] || '';
  }

  // Check if should give tempo feedback (not too frequent)
  shouldGiveFeedback(): boolean {
    // Give feedback every 5 reps
    return this.repCount > 0 && this.repCount % 5 === 0;
  }

  // Reset analyzer
  reset(): void {
    this.repTimings = [];
    this.currentPhase = 'idle';
    this.phaseStartTime = Date.now();
    this.currentRepStartTime = 0;
    this.currentRepPeakTime = 0;
    this.lastBeatTime = Date.now();
    this.beatCount = 1;
    this.repCount = 0;
  }

  // Get rep count
  getRepCount(): number {
    return this.repCount;
  }
}

// Motion quality analyzer (simplified from optical flow)
export interface MotionQuality {
  speed: 'normal' | 'too_fast' | 'too_slow';
  smoothness: 'smooth' | 'jerky';
  isMoving: boolean;
  feedback: string | null;
}

export class MotionAnalyzer {
  private positionHistory: { x: number; y: number; timestamp: number }[] = [];
  private maxHistoryLength = 30;
  private lastFeedbackTime = 0;
  private minFeedbackInterval = 3000; // 3 seconds between feedback

  // Update with new position
  update(x: number, y: number, timestamp: number = Date.now()): void {
    this.positionHistory.push({ x, y, timestamp });
    
    // Keep history limited
    while (this.positionHistory.length > this.maxHistoryLength) {
      this.positionHistory.shift();
    }
  }

  // Analyze motion quality
  analyze(): MotionQuality {
    if (this.positionHistory.length < 5) {
      return {
        speed: 'normal',
        smoothness: 'smooth',
        isMoving: false,
        feedback: null,
      };
    }

    // Calculate average velocity
    const recentPositions = this.positionHistory.slice(-10);
    let totalVelocity = 0;
    let velocityVariance = 0;
    const velocities: number[] = [];

    for (let i = 1; i < recentPositions.length; i++) {
      const prev = recentPositions[i - 1];
      const curr = recentPositions[i];
      const timeDiff = (curr.timestamp - prev.timestamp) / 1000;
      
      if (timeDiff > 0) {
        const distance = Math.sqrt(
          Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
        );
        const velocity = distance / timeDiff;
        velocities.push(velocity);
        totalVelocity += velocity;
      }
    }

    const avgVelocity = velocities.length > 0 
      ? totalVelocity / velocities.length 
      : 0;

    // Calculate velocity variance for smoothness
    if (velocities.length > 2) {
      const meanVel = avgVelocity;
      velocityVariance = velocities.reduce((acc, v) => 
        acc + Math.pow(v - meanVel, 2), 0) / velocities.length;
    }

    // Determine motion state
    const isMoving = avgVelocity > 0.01;
    
    // Determine speed
    let speed: 'normal' | 'too_fast' | 'too_slow' = 'normal';
    if (avgVelocity > 0.3) {
      speed = 'too_fast';
    } else if (avgVelocity < 0.02 && isMoving) {
      speed = 'too_slow';
    }

    // Determine smoothness
    const smoothness: 'smooth' | 'jerky' = velocityVariance > 0.05 ? 'jerky' : 'smooth';

    // Generate feedback
    let feedback: string | null = null;
    const now = Date.now();

    if (now - this.lastFeedbackTime > this.minFeedbackInterval) {
      if (!isMoving) {
        feedback = COACH_MESSAGES.movement.no_motion;
        this.lastFeedbackTime = now;
      } else if (speed === 'too_fast') {
        feedback = COACH_MESSAGES.movement.too_fast;
        this.lastFeedbackTime = now;
      } else if (speed === 'too_slow') {
        feedback = COACH_MESSAGES.movement.too_slow;
        this.lastFeedbackTime = now;
      } else if (smoothness === 'jerky') {
        feedback = COACH_MESSAGES.movement.jerky;
        this.lastFeedbackTime = now;
      } else if (smoothness === 'smooth' && Math.random() < 0.15) {
        // 15% chance to praise smooth movement
        feedback = COACH_MESSAGES.movement.smooth;
        this.lastFeedbackTime = now;
      }
    }

    return {
      speed,
      smoothness,
      isMoving,
      feedback,
    };
  }

  // Reset analyzer
  reset(): void {
    this.positionHistory = [];
    this.lastFeedbackTime = 0;
  }
}
