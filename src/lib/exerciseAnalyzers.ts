// Exercise Analyzers - Complete rewrite with new exercise system
// Beginner: arm_raise, torso_twist, knee_raise
// Intermediate: squat_arm_raise, push_up, static_lunge
// Advanced: jump_squat, plank_hold, mountain_climber
// Expert: pistol_squat, pushup_shoulder_tap, burpee

import { Landmark } from '@/hooks/useMediaPipePose';
import {
  ExerciseType,
  ExerciseStage,
  FormQuality,
  EXERCISES,
  LANDMARK_INDICES as LM,
  TARGET_POSES,
} from './exerciseConfig';

// ===========================================
// === IMPROVED DETECTION UTILITIES ===
// ===========================================

// Angle smoothing buffer class for noise reduction
class AngleSmoother {
  private buffer: number[] = [];
  private maxSize: number;
  
  constructor(size: number = 5) {
    this.maxSize = size;
  }
  
  add(value: number): number {
    this.buffer.push(value);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
    return this.getSmoothed();
  }
  
  getSmoothed(): number {
    if (this.buffer.length === 0) return 0;
    // Use weighted moving average (recent values have more weight)
    let sum = 0;
    let weightSum = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      const weight = i + 1; // More recent = higher weight
      sum += this.buffer[i] * weight;
      weightSum += weight;
    }
    return sum / weightSum;
  }
  
  reset(): void {
    this.buffer = [];
  }
}

// Landmark position smoother for reducing jitter
class LandmarkSmoother {
  private bufferX: number[] = [];
  private bufferY: number[] = [];
  private maxSize: number;
  
  constructor(size: number = 3) {
    this.maxSize = size;
  }
  
  add(x: number, y: number): { x: number; y: number } {
    this.bufferX.push(x);
    this.bufferY.push(y);
    if (this.bufferX.length > this.maxSize) {
      this.bufferX.shift();
      this.bufferY.shift();
    }
    return this.getSmoothed();
  }
  
  getSmoothed(): { x: number; y: number } {
    if (this.bufferX.length === 0) return { x: 0, y: 0 };
    const avgX = this.bufferX.reduce((a, b) => a + b, 0) / this.bufferX.length;
    const avgY = this.bufferY.reduce((a, b) => a + b, 0) / this.bufferY.length;
    return { x: avgX, y: avgY };
  }
  
  reset(): void {
    this.bufferX = [];
    this.bufferY = [];
  }
}

// Dynamic visibility threshold based on confidence
function getAdaptiveVisibilityThreshold(avgVisibility: number): number {
  // If average visibility is high, be more strict; if low, be more lenient
  if (avgVisibility > 0.8) return 0.5;
  if (avgVisibility > 0.6) return 0.4;
  if (avgVisibility > 0.4) return 0.3;
  return 0.2;
}

// Calculate average visibility of key landmarks
function getAverageVisibility(landmarks: Landmark[], indices: number[]): number {
  let sum = 0;
  let count = 0;
  for (const idx of indices) {
    const lm = landmarks[idx];
    if (lm && lm.visibility !== undefined) {
      sum += lm.visibility;
      count++;
    }
  }
  return count > 0 ? sum / count : 0.5;
}

// Calculate angle between three points (in degrees)
// point b is the vertex
export function calculateAngle(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number }
): number {
  const v1x = a.x - b.x;
  const v1y = a.y - b.y;
  const v2x = c.x - b.x;
  const v2y = c.y - b.y;
  
  const dot = v1x * v2x + v1y * v2y;
  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);
  
  // Guard against division by zero
  if (mag1 < 0.001 || mag2 < 0.001) return 0;
  
  let cosAngle = dot / (mag1 * mag2);
  cosAngle = Math.max(-1, Math.min(1, cosAngle));
  
  return Math.acos(cosAngle) * (180 / Math.PI);
}

// Calculate distance between two points (normalized)
export function calculateDistance(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

// Get midpoint between two landmarks
export function getMidpoint(
  a: { x: number; y: number },
  b: { x: number; y: number }
): { x: number; y: number } {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

// Calculate angle between two lines (for torso twist)
export function calculateLinesToAngle(
  line1Start: { x: number; y: number },
  line1End: { x: number; y: number },
  line2Start: { x: number; y: number },
  line2End: { x: number; y: number }
): number {
  const v1x = line1End.x - line1Start.x;
  const v1y = line1End.y - line1Start.y;
  const v2x = line2End.x - line2Start.x;
  const v2y = line2End.y - line2Start.y;
  
  // Calculate angle using atan2 for each vector
  const angle1 = Math.atan2(v1y, v1x);
  const angle2 = Math.atan2(v2y, v2x);
  
  // Difference in degrees
  let angleDiff = (angle1 - angle2) * (180 / Math.PI);
  
  // Normalize to -180 to 180
  while (angleDiff > 180) angleDiff -= 360;
  while (angleDiff < -180) angleDiff += 360;
  
  return Math.abs(angleDiff);
}

// Form feedback interface
export interface FormFeedback {
  quality: FormQuality;
  score: number; // 0-100
  issues: string[];
  suggestions: string[];
}

// Exercise analysis result
export interface ExerciseAnalysisResult {
  stage: ExerciseStage;
  reps: number;
  repCompleted: boolean;
  formFeedback: FormFeedback;
  angles: Record<string, number | string>;
  isVisible: boolean;
  holdTime?: number; // For time-based exercises like plank
}

// Base Exercise Analyzer class with improved detection
export abstract class ExerciseAnalyzer {
  protected exerciseType: ExerciseType;
  protected currentStage: ExerciseStage = 'idle';
  protected previousStage: ExerciseStage = 'idle';
  protected reps: number = 0;
  protected lastFormQuality: FormQuality = 'good';
  protected consecutiveWarnings: number = 0;
  protected consecutiveBadForms: number = 0;
  
  // Anti-bounce/debouncing variables
  protected lastRepTime: number = 0;
  protected repCooldown: number = 400;
  protected stageEntryTime: number = 0;
  protected minHoldTime: number = 100;
  protected stageConfirmed: boolean = false;
  protected consecutiveFramesInStage: number = 0;
  protected minFramesInStage: number = 4; // Increased from 3 for stability
  
  // Smoothing for angle calculations
  protected angleSmoothers: Map<string, AngleSmoother> = new Map();
  protected landmarkSmoothers: Map<number, LandmarkSmoother> = new Map();
  
  // Adaptive visibility
  protected adaptiveVisibilityThreshold: number = 0.3;
  protected visibilityHistory: number[] = [];
  protected maxVisibilityHistory: number = 10;

  constructor(exerciseType: ExerciseType) {
    this.exerciseType = exerciseType;
  }

  abstract analyze(landmarks: Landmark[]): ExerciseAnalysisResult;
  abstract evaluateForm(landmarks: Landmark[]): FormFeedback;

  // Get smoothed angle with noise reduction
  protected getSmoothedAngle(key: string, rawAngle: number): number {
    if (!this.angleSmoothers.has(key)) {
      this.angleSmoothers.set(key, new AngleSmoother(5));
    }
    return this.angleSmoothers.get(key)!.add(rawAngle);
  }
  
  // Get smoothed landmark position
  protected getSmoothedLandmark(index: number, landmark: Landmark): { x: number; y: number } {
    if (!this.landmarkSmoothers.has(index)) {
      this.landmarkSmoothers.set(index, new LandmarkSmoother(3));
    }
    return this.landmarkSmoothers.get(index)!.add(landmark.x, landmark.y);
  }
  
  // Update adaptive visibility threshold based on recent history
  protected updateAdaptiveVisibility(landmarks: Landmark[], keyIndices: number[]): void {
    const avgVis = getAverageVisibility(landmarks, keyIndices);
    this.visibilityHistory.push(avgVis);
    if (this.visibilityHistory.length > this.maxVisibilityHistory) {
      this.visibilityHistory.shift();
    }
    const overallAvg = this.visibilityHistory.reduce((a, b) => a + b, 0) / this.visibilityHistory.length;
    this.adaptiveVisibilityThreshold = getAdaptiveVisibilityThreshold(overallAvg);
  }

  protected checkVisibility(landmarks: Landmark[], indices: number[]): boolean {
    return indices.every((idx) => {
      const landmark = landmarks[idx];
      return landmark && (landmark.visibility === undefined || landmark.visibility > this.adaptiveVisibilityThreshold);
    });
  }

  protected getLandmark(landmarks: Landmark[], index: number): Landmark | null {
    const lm = landmarks[index];
    if (!lm || (lm.visibility !== undefined && lm.visibility < this.adaptiveVisibilityThreshold)) {
      return null;
    }
    return lm;
  }

  reset(): void {
    this.currentStage = 'idle';
    this.previousStage = 'idle';
    this.reps = 0;
    this.lastFormQuality = 'good';
    this.consecutiveWarnings = 0;
    this.consecutiveBadForms = 0;
    this.lastRepTime = 0;
    this.stageEntryTime = 0;
    this.stageConfirmed = false;
    this.consecutiveFramesInStage = 0;
    // Reset smoothers
    this.angleSmoothers.forEach(s => s.reset());
    this.landmarkSmoothers.forEach(s => s.reset());
    this.visibilityHistory = [];
  }

  protected canCountRep(): boolean {
    return (Date.now() - this.lastRepTime) >= this.repCooldown;
  }

  protected markRepCounted(): void {
    this.lastRepTime = Date.now();
  }

  protected confirmStageChange(newStage: ExerciseStage): boolean {
    if (newStage === this.currentStage) {
      this.consecutiveFramesInStage++;
      if (this.consecutiveFramesInStage >= this.minFramesInStage && !this.stageConfirmed) {
        this.stageConfirmed = true;
        this.stageEntryTime = Date.now();
      }
      return this.stageConfirmed;
    } else {
      // Only change stage if we've seen multiple frames of the new stage
      // This prevents flickering between stages
      this.consecutiveFramesInStage = 1;
      this.stageConfirmed = false;
      this.previousStage = this.currentStage;
      this.currentStage = newStage;
      return false;
    }
  }

  protected stageHeldLongEnough(): boolean {
    if (!this.stageConfirmed) return false;
    return (Date.now() - this.stageEntryTime) >= this.minHoldTime;
  }

  getState() {
    return {
      stage: this.currentStage,
      reps: this.reps,
      lastFormQuality: this.lastFormQuality,
    };
  }
}

// ============================================
// === BEGINNER EXERCISES ===
// ============================================

// Arm Raise Analyzer - Front facing, shoulder angle > 150°
export class ArmRaiseAnalyzer extends ExerciseAnalyzer {
  private keyLandmarks = [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_ELBOW, LM.RIGHT_ELBOW, LM.LEFT_WRIST, LM.RIGHT_WRIST, LM.LEFT_HIP, LM.RIGHT_HIP];
  private waitingForDown = false;
  private reachedUp = false;

  constructor() {
    super('arm_raise');
    this.repCooldown = 500;
    this.minHoldTime = 200; // Increased for better stability
    this.minFramesInStage = 4;
  }

  analyze(landmarks: Landmark[]): ExerciseAnalysisResult {
    // Update adaptive visibility
    this.updateAdaptiveVisibility(landmarks, this.keyLandmarks);
    const isVisible = this.checkVisibility(landmarks, this.keyLandmarks);
    
    if (!isVisible) {
      return {
        stage: this.currentStage,
        reps: this.reps,
        repCompleted: false,
        formFeedback: { quality: 'good', score: 0, issues: [], suggestions: ['ยืนให้เห็นตัวเต็มๆ ครับ'] },
        angles: {},
        isVisible: false,
      };
    }

    // Get smoothed landmark positions
    const leftShoulder = this.getSmoothedLandmark(LM.LEFT_SHOULDER, landmarks[LM.LEFT_SHOULDER]);
    const rightShoulder = this.getSmoothedLandmark(LM.RIGHT_SHOULDER, landmarks[LM.RIGHT_SHOULDER]);
    const leftElbow = this.getSmoothedLandmark(LM.LEFT_ELBOW, landmarks[LM.LEFT_ELBOW]);
    const rightElbow = this.getSmoothedLandmark(LM.RIGHT_ELBOW, landmarks[LM.RIGHT_ELBOW]);
    const leftHip = this.getSmoothedLandmark(LM.LEFT_HIP, landmarks[LM.LEFT_HIP]);
    const rightHip = this.getSmoothedLandmark(LM.RIGHT_HIP, landmarks[LM.RIGHT_HIP]);

    // Calculate arm elevation angles (hip -> shoulder -> elbow)
    const leftArmAngleRaw = calculateAngle(leftHip, leftShoulder, leftElbow);
    const rightArmAngleRaw = calculateAngle(rightHip, rightShoulder, rightElbow);
    
    // Apply smoothing to angles
    const leftArmAngle = this.getSmoothedAngle('leftArm', leftArmAngleRaw);
    const rightArmAngle = this.getSmoothedAngle('rightArm', rightArmAngleRaw);
    const avgArmAngle = (leftArmAngle + rightArmAngle) / 2;
    
    const thresholds = EXERCISES[this.exerciseType].thresholds;
    const hysteresis = 15; // Increased hysteresis for better stability

    let repCompleted = false;
    
    // Determine raw stage with wider dead zone
    let rawStage: ExerciseStage = this.currentStage;
    if (avgArmAngle >= thresholds.up_angle) {
      rawStage = 'up';
    } else if (avgArmAngle <= thresholds.down_angle) {
      rawStage = 'down';
    } else if (this.currentStage === 'up' && avgArmAngle < thresholds.up_angle - hysteresis) {
      rawStage = 'transition';
    } else if (this.currentStage === 'down' && avgArmAngle > thresholds.down_angle + hysteresis) {
      rawStage = 'transition';
    }

    const stageConfirmed = this.confirmStageChange(rawStage);
    
    // Count rep when: confirmed UP -> confirmed DOWN
    if (stageConfirmed && this.currentStage === 'up' && this.stageHeldLongEnough()) {
      this.reachedUp = true;
      this.waitingForDown = true;
    }
    
    if (stageConfirmed && this.currentStage === 'down' && this.reachedUp && this.waitingForDown) {
      if (this.canCountRep() && this.stageHeldLongEnough()) {
        this.reps++;
        repCompleted = true;
        this.markRepCounted();
        this.waitingForDown = false;
        this.reachedUp = false;
      }
    }

    const formFeedback = this.evaluateForm(landmarks);

    return {
      stage: this.currentStage,
      reps: this.reps,
      repCompleted,
      formFeedback,
      angles: {
        leftArm: Math.round(leftArmAngle),
        rightArm: Math.round(rightArmAngle),
        average: Math.round(avgArmAngle),
      },
      isVisible: true,
    };
  }

  evaluateForm(landmarks: Landmark[]): FormFeedback {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const leftShoulder = landmarks[LM.LEFT_SHOULDER];
    const rightShoulder = landmarks[LM.RIGHT_SHOULDER];
    const leftElbow = landmarks[LM.LEFT_ELBOW];
    const rightElbow = landmarks[LM.RIGHT_ELBOW];
    const leftHip = landmarks[LM.LEFT_HIP];
    const rightHip = landmarks[LM.RIGHT_HIP];

    const leftArmAngle = calculateAngle(leftHip, leftShoulder, leftElbow);
    const rightArmAngle = calculateAngle(rightHip, rightShoulder, rightElbow);
    const angleDiff = Math.abs(leftArmAngle - rightArmAngle);
    
    if (angleDiff > EXERCISES.arm_raise.thresholds.symmetry_diff) {
      issues.push('แขนไม่สมมาตร');
      suggestions.push('ยกแขนให้เท่ากันทั้งสองข้างครับ');
      score -= 20;
    }

    const shoulderHeightDiff = Math.abs(leftShoulder.y - rightShoulder.y);
    if (shoulderHeightDiff > 0.05) {
      issues.push('ไหล่ไม่เสมอกัน');
      suggestions.push('ระวังไหล่ให้เสมอกันครับ');
      score -= 15;
    }

    let quality: FormQuality = 'good';
    if (score < 50) {
      quality = 'bad';
    } else if (score < 80) {
      quality = 'warn';
    }

    this.lastFormQuality = quality;
    return { quality, score: Math.max(0, score), issues, suggestions };
  }
}

// Torso Twist Analyzer - Front facing, 20-40° angle between shoulder and hip lines
export class TorsoTwistAnalyzer extends ExerciseAnalyzer {
  private keyLandmarks = [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_HIP, LM.RIGHT_HIP];
  private lastTwistDirection: 'left' | 'right' | null = null;
  private completedTwist: boolean = false;

  constructor() {
    super('torso_twist');
    this.repCooldown = 400;
    this.minHoldTime = 150; // Increased for stability
    this.minFramesInStage = 4;
  }

  analyze(landmarks: Landmark[]): ExerciseAnalysisResult {
    // Update adaptive visibility
    this.updateAdaptiveVisibility(landmarks, this.keyLandmarks);
    const isVisible = this.checkVisibility(landmarks, this.keyLandmarks);
    
    if (!isVisible) {
      return {
        stage: this.currentStage,
        reps: this.reps,
        repCompleted: false,
        formFeedback: { quality: 'good', score: 0, issues: [], suggestions: ['ยืนให้เห็นตัวเต็มๆ ครับ'] },
        angles: {},
        isVisible: false,
      };
    }

    // Get smoothed landmarks
    const leftShoulder = this.getSmoothedLandmark(LM.LEFT_SHOULDER, landmarks[LM.LEFT_SHOULDER]);
    const rightShoulder = this.getSmoothedLandmark(LM.RIGHT_SHOULDER, landmarks[LM.RIGHT_SHOULDER]);
    const leftHip = this.getSmoothedLandmark(LM.LEFT_HIP, landmarks[LM.LEFT_HIP]);
    const rightHip = this.getSmoothedLandmark(LM.RIGHT_HIP, landmarks[LM.RIGHT_HIP]);

    // Calculate angle between shoulder line and hip line
    const twistAngleRaw = calculateLinesToAngle(leftShoulder, rightShoulder, leftHip, rightHip);
    const twistAngle = this.getSmoothedAngle('twist', twistAngleRaw);
    
    // Also calculate horizontal offset for direction detection
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const hipMidX = (leftHip.x + rightHip.x) / 2;
    const twistOffset = shoulderMidX - hipMidX;

    const thresholds = EXERCISES[this.exerciseType].thresholds;
    const minAngle = thresholds.min_twist_angle;
    const hysteresis = 8; // Increased for better stability

    let rawStage: ExerciseStage = 'center';
    
    if (twistAngle >= minAngle) {
      // Determine direction based on offset
      if (twistOffset > 0.01) {
        rawStage = 'left';
      } else if (twistOffset < -0.01) {
        rawStage = 'right';
      }
    } else if (this.currentStage === 'left' && twistAngle > minAngle - hysteresis && twistOffset > 0) {
      rawStage = 'left';
    } else if (this.currentStage === 'right' && twistAngle > minAngle - hysteresis && twistOffset < 0) {
      rawStage = 'right';
    }

    const stageConfirmed = this.confirmStageChange(rawStage);

    let repCompleted = false;
    
    if (stageConfirmed && (this.currentStage === 'left' || this.currentStage === 'right') && this.stageHeldLongEnough()) {
      this.lastTwistDirection = this.currentStage as 'left' | 'right';
      this.completedTwist = true;
    }
    
    if (stageConfirmed && this.currentStage === 'center' && this.completedTwist && this.lastTwistDirection !== null) {
      if (this.canCountRep() && this.stageHeldLongEnough()) {
        this.reps++;
        repCompleted = true;
        this.markRepCounted();
        this.completedTwist = false;
        this.lastTwistDirection = null;
      }
    }

    const formFeedback = this.evaluateForm(landmarks);

    return {
      stage: this.currentStage,
      reps: this.reps,
      repCompleted,
      formFeedback,
      angles: {
        twistAngle: Math.round(twistAngle),
        direction: twistOffset > 0 ? 'left' : 'right',
      },
      isVisible: true,
    };
  }

  evaluateForm(landmarks: Landmark[]): FormFeedback {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const leftShoulder = landmarks[LM.LEFT_SHOULDER];
    const rightShoulder = landmarks[LM.RIGHT_SHOULDER];
    const leftHip = landmarks[LM.LEFT_HIP];
    const rightHip = landmarks[LM.RIGHT_HIP];

    const twistAngle = calculateLinesToAngle(leftShoulder, rightShoulder, leftHip, rightHip);
    const thresholds = EXERCISES[this.exerciseType].thresholds;

    // Check if twist is in good range (20-40°)
    if (this.currentStage !== 'center') {
      if (twistAngle < thresholds.min_twist_angle) {
        issues.push('บิดไม่ถึง 20°');
        suggestions.push('บิดลำตัวให้มากกว่านี้ครับ');
        score -= 20;
      } else if (twistAngle > thresholds.max_twist_angle) {
        issues.push('บิดเกิน 40°');
        suggestions.push('ระวังบิดมากเกินไปครับ');
        score -= 15;
      }
    }

    // Check hip stability
    const hipWidth = Math.abs(leftHip.x - rightHip.x);
    if (hipWidth < 0.1) {
      issues.push('สะโพกเคลื่อนที่');
      suggestions.push('ล็อคสะโพกไว้ บิดแค่ลำตัวครับ');
      score -= 25;
    }

    let quality: FormQuality = 'good';
    if (score < 50) quality = 'bad';
    else if (score < 80) quality = 'warn';

    this.lastFormQuality = quality;
    return { quality, score: Math.max(0, score), issues, suggestions };
  }

  reset(): void {
    super.reset();
    this.currentStage = 'center';
    this.lastTwistDirection = null;
    this.completedTwist = false;
  }
}

// Knee Raise Analyzer - Side camera, hip flexion > 80°
export class KneeRaiseAnalyzer extends ExerciseAnalyzer {
  private keyLandmarks = [LM.LEFT_HIP, LM.RIGHT_HIP, LM.LEFT_KNEE, LM.RIGHT_KNEE, LM.LEFT_ANKLE, LM.RIGHT_ANKLE, LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER];
  private leftLegStage: 'up' | 'down' = 'down';
  private rightLegStage: 'up' | 'down' = 'down';
  private leftUpConfirmed: boolean = false;
  private rightUpConfirmed: boolean = false;
  private leftUpFrames: number = 0;
  private rightUpFrames: number = 0;

  constructor() {
    super('knee_raise');
    this.repCooldown = 400; // Increased to prevent double counting
    this.minFramesInStage = 3; // Increased for stability
  }

  analyze(landmarks: Landmark[]): ExerciseAnalysisResult {
    // Update adaptive visibility
    this.updateAdaptiveVisibility(landmarks, this.keyLandmarks);
    const isVisible = this.checkVisibility(landmarks, this.keyLandmarks);
    
    if (!isVisible) {
      return {
        stage: this.currentStage,
        reps: this.reps,
        repCompleted: false,
        formFeedback: { quality: 'good', score: 0, issues: [], suggestions: ['ยืนให้เห็นตัวเต็มๆ ครับ'] },
        angles: {},
        isVisible: false,
      };
    }

    // Get smoothed landmarks
    const leftShoulder = this.getSmoothedLandmark(LM.LEFT_SHOULDER, landmarks[LM.LEFT_SHOULDER]);
    const leftHip = this.getSmoothedLandmark(LM.LEFT_HIP, landmarks[LM.LEFT_HIP]);
    const leftKnee = this.getSmoothedLandmark(LM.LEFT_KNEE, landmarks[LM.LEFT_KNEE]);
    const rightShoulder = this.getSmoothedLandmark(LM.RIGHT_SHOULDER, landmarks[LM.RIGHT_SHOULDER]);
    const rightHip = this.getSmoothedLandmark(LM.RIGHT_HIP, landmarks[LM.RIGHT_HIP]);
    const rightKnee = this.getSmoothedLandmark(LM.RIGHT_KNEE, landmarks[LM.RIGHT_KNEE]);

    // Calculate hip flexion angles (shoulder -> hip -> knee) with smoothing
    const leftHipFlexionRaw = calculateAngle(leftShoulder, leftHip, leftKnee);
    const rightHipFlexionRaw = calculateAngle(rightShoulder, rightHip, rightKnee);
    const leftHipFlexion = this.getSmoothedAngle('leftHip', leftHipFlexionRaw);
    const rightHipFlexion = this.getSmoothedAngle('rightHip', rightHipFlexionRaw);

    const thresholds = EXERCISES[this.exerciseType].thresholds;
    const hysteresis = 20; // Increased for better stability

    const prevLeftStage = this.leftLegStage;
    const prevRightStage = this.rightLegStage;

    // Detect left leg stage (hip flexion < 80° means leg is raised up)
    if (leftHipFlexion < thresholds.up_angle) {
      this.leftUpFrames++;
      if (this.leftUpFrames >= this.minFramesInStage) {
        this.leftLegStage = 'up';
        this.leftUpConfirmed = true;
      }
    } else if (leftHipFlexion > thresholds.down_angle) {
      this.leftUpFrames = 0;
      this.leftLegStage = 'down';
    } else if (this.leftLegStage === 'up' && leftHipFlexion < thresholds.up_angle + hysteresis) {
      // Keep up with hysteresis
    } else {
      this.leftUpFrames = 0;
    }

    // Detect right leg stage
    if (rightHipFlexion < thresholds.up_angle) {
      this.rightUpFrames++;
      if (this.rightUpFrames >= this.minFramesInStage) {
        this.rightLegStage = 'up';
        this.rightUpConfirmed = true;
      }
    } else if (rightHipFlexion > thresholds.down_angle) {
      this.rightUpFrames = 0;
      this.rightLegStage = 'down';
    } else if (this.rightLegStage === 'up' && rightHipFlexion < thresholds.up_angle + hysteresis) {
      // Keep up with hysteresis
    } else {
      this.rightUpFrames = 0;
    }

    // Determine overall stage
    this.previousStage = this.currentStage;
    if (this.leftLegStage === 'up' || this.rightLegStage === 'up') {
      this.currentStage = 'up';
    } else {
      this.currentStage = 'down';
    }

    // Rep counting with better debouncing
    let repCompleted = false;
    if (prevLeftStage === 'up' && this.leftLegStage === 'down' && this.leftUpConfirmed) {
      if (this.canCountRep()) {
        this.reps++;
        repCompleted = true;
        this.markRepCounted();
      }
      this.leftUpConfirmed = false;
    } else if (prevRightStage === 'up' && this.rightLegStage === 'down' && this.rightUpConfirmed) {
      if (this.canCountRep()) {
        this.reps++;
        repCompleted = true;
        this.markRepCounted();
      }
      this.rightUpConfirmed = false;
    }

    const formFeedback = this.evaluateForm(landmarks);

    return {
      stage: this.currentStage,
      reps: this.reps,
      repCompleted,
      formFeedback,
      angles: {
        leftHipFlexion: Math.round(leftHipFlexion),
        rightHipFlexion: Math.round(rightHipFlexion),
      },
      isVisible: true,
    };
  }

  evaluateForm(landmarks: Landmark[]): FormFeedback {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const leftShoulder = landmarks[LM.LEFT_SHOULDER];
    const rightShoulder = landmarks[LM.RIGHT_SHOULDER];
    const leftHip = landmarks[LM.LEFT_HIP];
    const rightHip = landmarks[LM.RIGHT_HIP];

    // Check torso lean
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const hipMidX = (leftHip.x + rightHip.x) / 2;
    const leanOffset = Math.abs(shoulderMidX - hipMidX);

    if (leanOffset > 0.08) {
      issues.push('เอนตัว');
      suggestions.push('ยืนตรงๆ อย่าเอนตัวครับ');
      score -= 25;
    }

    let quality: FormQuality = 'good';
    if (score < 50) quality = 'bad';
    else if (score < 80) quality = 'warn';

    this.lastFormQuality = quality;
    return { quality, score: Math.max(0, score), issues, suggestions };
  }

  reset(): void {
    super.reset();
    this.leftLegStage = 'down';
    this.rightLegStage = 'down';
    this.leftUpConfirmed = false;
    this.rightUpConfirmed = false;
    this.leftUpFrames = 0;
    this.rightUpFrames = 0;
  }
}

// ============================================
// === INTERMEDIATE EXERCISES ===
// ============================================

// Squat with Arm Raise Analyzer - Side camera
export class SquatWithArmRaiseAnalyzer extends ExerciseAnalyzer {
  private keyLandmarks = [
    LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_HIP, LM.RIGHT_HIP,
    LM.LEFT_KNEE, LM.RIGHT_KNEE, LM.LEFT_ANKLE, LM.RIGHT_ANKLE,
    LM.LEFT_ELBOW, LM.RIGHT_ELBOW
  ];
  private isDown = false;
  private downConfirmedFrames = 0;
  private upConfirmedFrames = 0;
  private hysteresis = 20; // Prevents flickering between stages

  constructor() {
    super('squat_arm_raise');
    this.repCooldown = 650; // Slightly increased for stability
    this.minFramesInStage = 4;
  }

  analyze(landmarks: Landmark[]): ExerciseAnalysisResult {
    // Update adaptive visibility threshold
    this.updateAdaptiveVisibility(landmarks, this.keyLandmarks);
    
    const isVisible = this.checkVisibility(landmarks, this.keyLandmarks);
    
    if (!isVisible) {
      return {
        stage: this.currentStage,
        reps: this.reps,
        repCompleted: false,
        formFeedback: { quality: 'good', score: 0, issues: [], suggestions: ['ยืนให้เห็นตัวเต็มๆ ครับ'] },
        angles: {},
        isVisible: false,
      };
    }

    // Get smoothed landmarks
    const leftHip = this.getSmoothedLandmark(LM.LEFT_HIP, landmarks[LM.LEFT_HIP]);
    const leftKnee = this.getSmoothedLandmark(LM.LEFT_KNEE, landmarks[LM.LEFT_KNEE]);
    const leftAnkle = this.getSmoothedLandmark(LM.LEFT_ANKLE, landmarks[LM.LEFT_ANKLE]);
    const rightHip = this.getSmoothedLandmark(LM.RIGHT_HIP, landmarks[LM.RIGHT_HIP]);
    const rightKnee = this.getSmoothedLandmark(LM.RIGHT_KNEE, landmarks[LM.RIGHT_KNEE]);
    const rightAnkle = this.getSmoothedLandmark(LM.RIGHT_ANKLE, landmarks[LM.RIGHT_ANKLE]);
    const leftShoulder = this.getSmoothedLandmark(LM.LEFT_SHOULDER, landmarks[LM.LEFT_SHOULDER]);
    const rightShoulder = this.getSmoothedLandmark(LM.RIGHT_SHOULDER, landmarks[LM.RIGHT_SHOULDER]);
    const leftElbow = this.getSmoothedLandmark(LM.LEFT_ELBOW, landmarks[LM.LEFT_ELBOW]);
    const rightElbow = this.getSmoothedLandmark(LM.RIGHT_ELBOW, landmarks[LM.RIGHT_ELBOW]);

    // Calculate and smooth knee angles (hip -> knee -> ankle)
    const leftKneeAngleRaw = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngleRaw = calculateAngle(rightHip, rightKnee, rightAnkle);
    const leftKneeAngle = this.getSmoothedAngle('leftKnee', leftKneeAngleRaw);
    const rightKneeAngle = this.getSmoothedAngle('rightKnee', rightKneeAngleRaw);
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

    // Calculate and smooth arm angles
    const leftArmAngleRaw = calculateAngle(leftHip, leftShoulder, leftElbow);
    const rightArmAngleRaw = calculateAngle(rightHip, rightShoulder, rightElbow);
    const leftArmAngle = this.getSmoothedAngle('leftArm', leftArmAngleRaw);
    const rightArmAngle = this.getSmoothedAngle('rightArm', rightArmAngleRaw);
    const avgArmAngle = (leftArmAngle + rightArmAngle) / 2;

    const thresholds = EXERCISES[this.exerciseType].thresholds;

    this.previousStage = this.currentStage;
    let repCompleted = false;

    // Detect squat position with hysteresis (knee < 95°)
    const inSquat = this.currentStage === 'down' 
      ? avgKneeAngle < thresholds.knee_down_angle + this.hysteresis
      : avgKneeAngle < thresholds.knee_down_angle;
    const isStanding = this.currentStage === 'up'
      ? avgKneeAngle > thresholds.knee_up_angle - this.hysteresis
      : avgKneeAngle > thresholds.knee_up_angle;
    const armsUp = avgArmAngle > thresholds.arm_up_angle - 10; // Slightly relaxed arm threshold

    if (inSquat && armsUp) {
      this.downConfirmedFrames++;
      this.upConfirmedFrames = 0;
      if (this.downConfirmedFrames >= this.minFramesInStage) {
        this.currentStage = 'down';
        this.isDown = true;
      }
    } else if (isStanding) {
      this.upConfirmedFrames++;
      this.downConfirmedFrames = 0;
      if (this.upConfirmedFrames >= this.minFramesInStage) {
        if (this.isDown && this.canCountRep()) {
          this.reps++;
          repCompleted = true;
          this.markRepCounted();
          this.isDown = false;
        }
        this.currentStage = 'up';
      }
    }

    const formFeedback = this.evaluateForm(landmarks);

    return {
      stage: this.currentStage,
      reps: this.reps,
      repCompleted,
      formFeedback,
      angles: {
        kneeAngle: Math.round(avgKneeAngle),
        armAngle: Math.round(avgArmAngle),
      },
      isVisible: true,
    };
  }

  evaluateForm(landmarks: Landmark[]): FormFeedback {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const leftHip = landmarks[LM.LEFT_HIP];
    const leftKnee = landmarks[LM.LEFT_KNEE];
    const leftAnkle = landmarks[LM.LEFT_ANKLE];
    const rightHip = landmarks[LM.RIGHT_HIP];
    const rightKnee = landmarks[LM.RIGHT_KNEE];
    const rightAnkle = landmarks[LM.RIGHT_ANKLE];
    const leftShoulder = landmarks[LM.LEFT_SHOULDER];
    const rightShoulder = landmarks[LM.RIGHT_SHOULDER];
    const leftElbow = landmarks[LM.LEFT_ELBOW];
    const rightElbow = landmarks[LM.RIGHT_ELBOW];

    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

    const leftArmAngle = calculateAngle(leftHip, leftShoulder, leftElbow);
    const rightArmAngle = calculateAngle(rightHip, rightShoulder, rightElbow);
    const avgArmAngle = (leftArmAngle + rightArmAngle) / 2;

    const thresholds = EXERCISES[this.exerciseType].thresholds;

    if (this.currentStage === 'down') {
      if (avgKneeAngle > thresholds.knee_down_angle) {
        issues.push('สควอตไม่ลึกพอ');
        suggestions.push('ก้มเข่าให้ < 95° ครับ');
        score -= 25;
      }
      if (avgArmAngle < thresholds.arm_up_angle) {
        issues.push('ยกแขนไม่สูงพอ');
        suggestions.push('ยกแขนให้ > 140° ครับ');
        score -= 20;
      }
    }

    let quality: FormQuality = 'good';
    if (score < 50) quality = 'bad';
    else if (score < 80) quality = 'warn';

    this.lastFormQuality = quality;
    return { quality, score: Math.max(0, score), issues, suggestions };
  }

  reset(): void {
    super.reset();
    this.isDown = false;
    this.downConfirmedFrames = 0;
    this.upConfirmedFrames = 0;
  }
}

// Push-up Analyzer - Side camera, elbow < 90° down, > 160° up
export class PushUpAnalyzer extends ExerciseAnalyzer {
  private keyLandmarks = [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_ELBOW, LM.RIGHT_ELBOW, LM.LEFT_WRIST, LM.RIGHT_WRIST, LM.LEFT_HIP, LM.RIGHT_HIP, LM.LEFT_ANKLE, LM.RIGHT_ANKLE];
  private isDown = false;
  private downConfirmedFrames = 0;
  private upConfirmedFrames = 0;
  private hysteresis = 15; // Prevents flickering between stages

  constructor() {
    super('push_up');
    this.repCooldown = 550; // Slightly increased for stability
    this.minFramesInStage = 4;
  }

  analyze(landmarks: Landmark[]): ExerciseAnalysisResult {
    // Update adaptive visibility threshold
    this.updateAdaptiveVisibility(landmarks, this.keyLandmarks);
    
    const isVisible = this.checkVisibility(landmarks, this.keyLandmarks);
    
    if (!isVisible) {
      return {
        stage: this.currentStage,
        reps: this.reps,
        repCompleted: false,
        formFeedback: { quality: 'good', score: 0, issues: [], suggestions: ['ให้เห็นตัวเต็มๆ ในท่าวิดพื้นครับ'] },
        angles: {},
        isVisible: false,
      };
    }

    // Get smoothed landmarks
    const leftShoulder = this.getSmoothedLandmark(LM.LEFT_SHOULDER, landmarks[LM.LEFT_SHOULDER]);
    const leftElbow = this.getSmoothedLandmark(LM.LEFT_ELBOW, landmarks[LM.LEFT_ELBOW]);
    const leftWrist = this.getSmoothedLandmark(LM.LEFT_WRIST, landmarks[LM.LEFT_WRIST]);
    const rightShoulder = this.getSmoothedLandmark(LM.RIGHT_SHOULDER, landmarks[LM.RIGHT_SHOULDER]);
    const rightElbow = this.getSmoothedLandmark(LM.RIGHT_ELBOW, landmarks[LM.RIGHT_ELBOW]);
    const rightWrist = this.getSmoothedLandmark(LM.RIGHT_WRIST, landmarks[LM.RIGHT_WRIST]);

    // Calculate and smooth elbow angles (shoulder -> elbow -> wrist)
    const leftElbowAngleRaw = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngleRaw = calculateAngle(rightShoulder, rightElbow, rightWrist);
    const leftElbowAngle = this.getSmoothedAngle('leftElbow', leftElbowAngleRaw);
    const rightElbowAngle = this.getSmoothedAngle('rightElbow', rightElbowAngleRaw);
    const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

    const thresholds = EXERCISES[this.exerciseType].thresholds;

    this.previousStage = this.currentStage;
    let repCompleted = false;

    // Detect push-up position with hysteresis
    const elbowDown = this.currentStage === 'down'
      ? avgElbowAngle < thresholds.elbow_down_angle + this.hysteresis
      : avgElbowAngle < thresholds.elbow_down_angle;
    const elbowUp = this.currentStage === 'up'
      ? avgElbowAngle > thresholds.elbow_up_angle - this.hysteresis
      : avgElbowAngle > thresholds.elbow_up_angle;

    if (elbowDown) {
      this.downConfirmedFrames++;
      this.upConfirmedFrames = 0;
      if (this.downConfirmedFrames >= this.minFramesInStage) {
        this.currentStage = 'down';
        this.isDown = true;
      }
    } else if (elbowUp) {
      this.upConfirmedFrames++;
      this.downConfirmedFrames = 0;
      if (this.upConfirmedFrames >= this.minFramesInStage) {
        if (this.isDown && this.canCountRep()) {
          this.reps++;
          repCompleted = true;
          this.markRepCounted();
          this.isDown = false;
        }
        this.currentStage = 'up';
      }
    }

    const formFeedback = this.evaluateForm(landmarks);

    return {
      stage: this.currentStage,
      reps: this.reps,
      repCompleted,
      formFeedback,
      angles: {
        elbowAngle: Math.round(avgElbowAngle),
      },
      isVisible: true,
    };
  }

  evaluateForm(landmarks: Landmark[]): FormFeedback {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const leftShoulder = landmarks[LM.LEFT_SHOULDER];
    const leftHip = landmarks[LM.LEFT_HIP];
    const leftAnkle = landmarks[LM.LEFT_ANKLE];
    const rightShoulder = landmarks[LM.RIGHT_SHOULDER];
    const rightHip = landmarks[LM.RIGHT_HIP];
    const rightAnkle = landmarks[LM.RIGHT_ANKLE];

    // Check body alignment (shoulder -> hip -> ankle should be straight)
    const leftBodyAngle = calculateAngle(leftShoulder, leftHip, leftAnkle);
    const rightBodyAngle = calculateAngle(rightShoulder, rightHip, rightAnkle);
    const avgBodyAngle = (leftBodyAngle + rightBodyAngle) / 2;

    const bodyDeviation = Math.abs(180 - avgBodyAngle);
    const thresholds = EXERCISES[this.exerciseType].thresholds;

    if (bodyDeviation > thresholds.body_alignment) {
      if (avgBodyAngle < 170) {
        issues.push('สะโพกตก');
        suggestions.push('ยกสะโพกขึ้นให้ตรงกับลำตัวครับ');
      } else {
        issues.push('สะโพกสูงเกินไป');
        suggestions.push('ลดสะโพกลงให้ตรงกับลำตัวครับ');
      }
      score -= 25;
    }

    let quality: FormQuality = 'good';
    if (score < 50) quality = 'bad';
    else if (score < 80) quality = 'warn';

    this.lastFormQuality = quality;
    return { quality, score: Math.max(0, score), issues, suggestions };
  }

  reset(): void {
    super.reset();
    this.isDown = false;
    this.downConfirmedFrames = 0;
    this.upConfirmedFrames = 0;
  }
}

// Static Lunge Analyzer - Side camera, front knee ~90°
export class StaticLungeAnalyzer extends ExerciseAnalyzer {
  private keyLandmarks = [LM.LEFT_HIP, LM.RIGHT_HIP, LM.LEFT_KNEE, LM.RIGHT_KNEE, LM.LEFT_ANKLE, LM.RIGHT_ANKLE];
  private isDown = false;
  private downConfirmedFrames = 0;
  private upConfirmedFrames = 0;
  private hysteresis = 15; // Prevents flickering between stages

  constructor() {
    super('static_lunge');
    this.repCooldown = 650; // Slightly increased for stability
    this.minFramesInStage = 4;
  }

  analyze(landmarks: Landmark[]): ExerciseAnalysisResult {
    // Update adaptive visibility threshold
    this.updateAdaptiveVisibility(landmarks, this.keyLandmarks);
    
    const isVisible = this.checkVisibility(landmarks, this.keyLandmarks);
    
    if (!isVisible) {
      return {
        stage: this.currentStage,
        reps: this.reps,
        repCompleted: false,
        formFeedback: { quality: 'good', score: 0, issues: [], suggestions: ['ยืนให้เห็นตัวเต็มๆ ครับ'] },
        angles: {},
        isVisible: false,
      };
    }

    // Get smoothed landmarks
    const leftHip = this.getSmoothedLandmark(LM.LEFT_HIP, landmarks[LM.LEFT_HIP]);
    const leftKnee = this.getSmoothedLandmark(LM.LEFT_KNEE, landmarks[LM.LEFT_KNEE]);
    const leftAnkle = this.getSmoothedLandmark(LM.LEFT_ANKLE, landmarks[LM.LEFT_ANKLE]);
    const rightHip = this.getSmoothedLandmark(LM.RIGHT_HIP, landmarks[LM.RIGHT_HIP]);
    const rightKnee = this.getSmoothedLandmark(LM.RIGHT_KNEE, landmarks[LM.RIGHT_KNEE]);
    const rightAnkle = this.getSmoothedLandmark(LM.RIGHT_ANKLE, landmarks[LM.RIGHT_ANKLE]);

    // Calculate and smooth knee angles
    const leftKneeAngleRaw = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngleRaw = calculateAngle(rightHip, rightKnee, rightAnkle);
    const leftKneeAngle = this.getSmoothedAngle('leftKnee', leftKneeAngleRaw);
    const rightKneeAngle = this.getSmoothedAngle('rightKnee', rightKneeAngleRaw);

    // Determine which leg is in front (lower knee Y position)
    const leftIsFront = landmarks[LM.LEFT_KNEE].y > landmarks[LM.RIGHT_KNEE].y;
    const frontKneeAngle = leftIsFront ? leftKneeAngle : rightKneeAngle;

    const thresholds = EXERCISES[this.exerciseType].thresholds;
    const targetAngle = thresholds.front_knee_angle;
    const tolerance = thresholds.knee_tolerance;

    this.previousStage = this.currentStage;
    let repCompleted = false;

    // Check if in proper lunge position with hysteresis (front knee ~90° ± tolerance)
    const inLunge = this.currentStage === 'down'
      ? Math.abs(frontKneeAngle - targetAngle) <= tolerance + this.hysteresis
      : Math.abs(frontKneeAngle - targetAngle) <= tolerance;
    const isStanding = frontKneeAngle > 150;

    if (inLunge) {
      this.downConfirmedFrames++;
      this.upConfirmedFrames = 0;
      if (this.downConfirmedFrames >= this.minFramesInStage) {
        this.currentStage = 'down';
        this.isDown = true;
      }
    } else if (isStanding) {
      this.upConfirmedFrames++;
      this.downConfirmedFrames = 0;
      if (this.upConfirmedFrames >= this.minFramesInStage) {
        if (this.isDown && this.canCountRep()) {
          this.reps++;
          repCompleted = true;
          this.markRepCounted();
          this.isDown = false;
        }
        this.currentStage = 'up';
      }
    }

    const formFeedback = this.evaluateForm(landmarks);

    return {
      stage: this.currentStage,
      reps: this.reps,
      repCompleted,
      formFeedback,
      angles: {
        frontKneeAngle: Math.round(frontKneeAngle),
        leftKneeAngle: Math.round(leftKneeAngle),
        rightKneeAngle: Math.round(rightKneeAngle),
      },
      isVisible: true,
    };
  }

  evaluateForm(landmarks: Landmark[]): FormFeedback {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const leftHip = landmarks[LM.LEFT_HIP];
    const leftKnee = landmarks[LM.LEFT_KNEE];
    const leftAnkle = landmarks[LM.LEFT_ANKLE];
    const rightHip = landmarks[LM.RIGHT_HIP];
    const rightKnee = landmarks[LM.RIGHT_KNEE];
    const rightAnkle = landmarks[LM.RIGHT_ANKLE];

    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

    const leftIsFront = leftKnee.y > rightKnee.y;
    const frontKneeAngle = leftIsFront ? leftKneeAngle : rightKneeAngle;

    const thresholds = EXERCISES[this.exerciseType].thresholds;

    if (this.currentStage === 'down') {
      const deviation = Math.abs(frontKneeAngle - thresholds.front_knee_angle);
      if (deviation > thresholds.knee_tolerance) {
        if (frontKneeAngle < thresholds.front_knee_angle - thresholds.knee_tolerance) {
          issues.push('เข่างอมากเกินไป');
          suggestions.push('ยืดเข่าหน้าขึ้นเล็กน้อยครับ');
        } else {
          issues.push('เข่างอไม่พอ');
          suggestions.push('งอเข่าหน้าลงอีกหน่อยครับ');
        }
        score -= 20;
      }
    }

    let quality: FormQuality = 'good';
    if (score < 50) quality = 'bad';
    else if (score < 80) quality = 'warn';

    this.lastFormQuality = quality;
    return { quality, score: Math.max(0, score), issues, suggestions };
  }

  reset(): void {
    super.reset();
    this.isDown = false;
    this.downConfirmedFrames = 0;
    this.upConfirmedFrames = 0;
  }
}

// ============================================
// === ADVANCED EXERCISES ===
// ============================================

// Jump Squat Analyzer - Side camera, knee < 95° + airborne detection
export class JumpSquatAnalyzer extends ExerciseAnalyzer {
  private keyLandmarks = [LM.LEFT_HIP, LM.RIGHT_HIP, LM.LEFT_KNEE, LM.RIGHT_KNEE, LM.LEFT_ANKLE, LM.RIGHT_ANKLE];
  private previousHipY: number = 0;
  private jumpPhase: 'squat' | 'jump' | 'land' = 'squat';
  private hasSquatted: boolean = false;
  private squatConfirmedFrames: number = 0;
  private jumpConfirmedFrames: number = 0;
  private hysteresis = 15; // Prevents flickering between stages
  private hipYHistory: number[] = []; // For smoothing hip position

  constructor() {
    super('jump_squat');
    this.repCooldown = 850; // Slightly increased for stability
    this.minFramesInStage = 4;
  }

  analyze(landmarks: Landmark[]): ExerciseAnalysisResult {
    // Update adaptive visibility threshold
    this.updateAdaptiveVisibility(landmarks, this.keyLandmarks);
    
    const isVisible = this.checkVisibility(landmarks, this.keyLandmarks);
    
    if (!isVisible) {
      return {
        stage: this.currentStage,
        reps: this.reps,
        repCompleted: false,
        formFeedback: { quality: 'good', score: 0, issues: [], suggestions: ['ยืนให้เห็นตัวเต็มๆ ครับ'] },
        angles: {},
        isVisible: false,
      };
    }

    // Get smoothed landmarks
    const leftHip = this.getSmoothedLandmark(LM.LEFT_HIP, landmarks[LM.LEFT_HIP]);
    const rightHip = this.getSmoothedLandmark(LM.RIGHT_HIP, landmarks[LM.RIGHT_HIP]);
    const leftKnee = this.getSmoothedLandmark(LM.LEFT_KNEE, landmarks[LM.LEFT_KNEE]);
    const rightKnee = this.getSmoothedLandmark(LM.RIGHT_KNEE, landmarks[LM.RIGHT_KNEE]);
    const leftAnkle = this.getSmoothedLandmark(LM.LEFT_ANKLE, landmarks[LM.LEFT_ANKLE]);
    const rightAnkle = this.getSmoothedLandmark(LM.RIGHT_ANKLE, landmarks[LM.RIGHT_ANKLE]);

    // Calculate and smooth knee angle
    const leftKneeAngleRaw = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngleRaw = calculateAngle(rightHip, rightKnee, rightAnkle);
    const leftKneeAngle = this.getSmoothedAngle('leftKnee', leftKneeAngleRaw);
    const rightKneeAngle = this.getSmoothedAngle('rightKnee', rightKneeAngleRaw);
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

    // Hip vertical position with smoothing for jump detection
    const currentHipY = (leftHip.y + rightHip.y) / 2;
    this.hipYHistory.push(currentHipY);
    if (this.hipYHistory.length > 5) this.hipYHistory.shift();
    const smoothedHipY = this.hipYHistory.reduce((a, b) => a + b, 0) / this.hipYHistory.length;
    
    const verticalMovement = this.previousHipY - smoothedHipY; // positive = moving up

    const thresholds = EXERCISES[this.exerciseType].thresholds;

    this.previousStage = this.currentStage;
    let repCompleted = false;

    // State machine for jump squat with hysteresis
    const isSquatting = this.jumpPhase === 'squat'
      ? avgKneeAngle < thresholds.knee_squat_angle + this.hysteresis
      : avgKneeAngle < thresholds.knee_squat_angle;

    if (isSquatting) {
      this.squatConfirmedFrames++;
      if (this.squatConfirmedFrames >= this.minFramesInStage) {
        this.currentStage = 'squat';
        this.jumpPhase = 'squat';
        this.hasSquatted = true;
      }
      this.jumpConfirmedFrames = 0;
    } else if (this.hasSquatted && verticalMovement > thresholds.jump_height_ratio) {
      this.jumpConfirmedFrames++;
      if (this.jumpConfirmedFrames >= 3) { // Increased frame confirmation for jump
        this.currentStage = 'jump';
        this.jumpPhase = 'jump';
      }
      this.squatConfirmedFrames = 0;
    } else if (this.jumpPhase === 'jump' && verticalMovement < -thresholds.land_threshold) {
      if (this.canCountRep()) {
        this.jumpPhase = 'land';
        this.reps++;
        repCompleted = true;
        this.markRepCounted();
        this.hasSquatted = false;
        this.squatConfirmedFrames = 0;
        this.jumpConfirmedFrames = 0;
        this.currentStage = 'down';
      }
    }

    this.previousHipY = smoothedHipY;
    const formFeedback = this.evaluateForm(landmarks);

    return {
      stage: this.currentStage,
      reps: this.reps,
      repCompleted,
      formFeedback,
      angles: {
        kneeAngle: Math.round(avgKneeAngle),
        verticalMovement: Math.round(verticalMovement * 100),
        phase: this.jumpPhase,
      },
      isVisible: true,
    };
  }

  evaluateForm(landmarks: Landmark[]): FormFeedback {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const leftHip = landmarks[LM.LEFT_HIP];
    const leftKnee = landmarks[LM.LEFT_KNEE];
    const leftAnkle = landmarks[LM.LEFT_ANKLE];
    const rightHip = landmarks[LM.RIGHT_HIP];
    const rightKnee = landmarks[LM.RIGHT_KNEE];
    const rightAnkle = landmarks[LM.RIGHT_ANKLE];

    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

    const thresholds = EXERCISES[this.exerciseType].thresholds;

    if (this.jumpPhase === 'squat' && avgKneeAngle > thresholds.knee_squat_angle + 10) {
      issues.push('สควอตไม่ลึกพอ');
      suggestions.push('ก้มลงให้เข่า < 95° ก่อนกระโดดครับ');
      score -= 25;
    }

    let quality: FormQuality = 'good';
    if (score < 50) quality = 'bad';
    else if (score < 80) quality = 'warn';

    this.lastFormQuality = quality;
    return { quality, score: Math.max(0, score), issues, suggestions };
  }

  reset(): void {
    super.reset();
    this.previousHipY = 0;
    this.jumpPhase = 'squat';
    this.hasSquatted = false;
    this.squatConfirmedFrames = 0;
    this.jumpConfirmedFrames = 0;
    this.hipYHistory = [];
  }
}

// Plank Hold Analyzer - Side camera, body alignment < 10°, time-based
export class PlankHoldAnalyzer extends ExerciseAnalyzer {
  private keyLandmarks = [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_HIP, LM.RIGHT_HIP, LM.LEFT_ANKLE, LM.RIGHT_ANKLE];
  private holdStartTime: number = 0;
  private isHolding: boolean = false;
  private totalHoldTime: number = 0;
  private lastUpdateTime: number = 0;
  private bodyAngleHistory: number[] = []; // For smoothing body angle

  constructor() {
    super('plank_hold');
    this.repCooldown = 0;
  }

  analyze(landmarks: Landmark[]): ExerciseAnalysisResult {
    // Update adaptive visibility threshold
    this.updateAdaptiveVisibility(landmarks, this.keyLandmarks);
    
    const isVisible = this.checkVisibility(landmarks, this.keyLandmarks);
    
    if (!isVisible) {
      // Stop hold timer when not visible
      if (this.isHolding) {
        this.totalHoldTime += (Date.now() - this.holdStartTime) / 1000;
        this.isHolding = false;
      }
      return {
        stage: 'idle',
        reps: this.reps,
        repCompleted: false,
        formFeedback: { quality: 'good', score: 0, issues: [], suggestions: ['ให้เห็นตัวเต็มๆ ในท่าแพลงค์ครับ'] },
        angles: {},
        isVisible: false,
        holdTime: this.totalHoldTime,
      };
    }

    // Get smoothed landmarks
    const leftShoulder = this.getSmoothedLandmark(LM.LEFT_SHOULDER, landmarks[LM.LEFT_SHOULDER]);
    const rightShoulder = this.getSmoothedLandmark(LM.RIGHT_SHOULDER, landmarks[LM.RIGHT_SHOULDER]);
    const leftHip = this.getSmoothedLandmark(LM.LEFT_HIP, landmarks[LM.LEFT_HIP]);
    const rightHip = this.getSmoothedLandmark(LM.RIGHT_HIP, landmarks[LM.RIGHT_HIP]);
    const leftAnkle = this.getSmoothedLandmark(LM.LEFT_ANKLE, landmarks[LM.LEFT_ANKLE]);
    const rightAnkle = this.getSmoothedLandmark(LM.RIGHT_ANKLE, landmarks[LM.RIGHT_ANKLE]);

    // Calculate body alignment (shoulder -> hip -> ankle)
    const leftBodyAngle = calculateAngle(leftShoulder, leftHip, leftAnkle);
    const rightBodyAngle = calculateAngle(rightShoulder, rightHip, rightAnkle);
    const avgBodyAngleRaw = (leftBodyAngle + rightBodyAngle) / 2;
    
    // Smooth body angle for stability
    this.bodyAngleHistory.push(avgBodyAngleRaw);
    if (this.bodyAngleHistory.length > 7) this.bodyAngleHistory.shift();
    const avgBodyAngle = this.bodyAngleHistory.reduce((a, b) => a + b, 0) / this.bodyAngleHistory.length;

    // Check if body is straight (angle close to 180°)
    const bodyDeviation = Math.abs(180 - avgBodyAngle);
    const thresholds = EXERCISES[this.exerciseType].thresholds;

    // Use slightly relaxed threshold with hysteresis for holding state
    const holdThreshold = this.isHolding 
      ? thresholds.body_alignment_max + 5 // Relaxed when already holding
      : thresholds.body_alignment_max;
    const isGoodForm = bodyDeviation < holdThreshold;

    const currentTime = Date.now();

    if (isGoodForm) {
      if (!this.isHolding) {
        this.holdStartTime = currentTime;
        this.isHolding = true;
      }
      this.currentStage = 'hold';
      
      // Update total hold time and check for reps (every 5 seconds = 1 rep)
      const currentHoldTime = this.totalHoldTime + (currentTime - this.holdStartTime) / 1000;
      const previousReps = Math.floor((currentHoldTime - thresholds.min_hold_time) / thresholds.min_hold_time);
      
      if (previousReps > this.reps) {
        this.reps = previousReps;
      }
    } else {
      if (this.isHolding) {
        this.totalHoldTime += (currentTime - this.holdStartTime) / 1000;
        this.isHolding = false;
      }
      this.currentStage = 'idle';
    }

    const currentHoldTime = this.isHolding 
      ? this.totalHoldTime + (currentTime - this.holdStartTime) / 1000 
      : this.totalHoldTime;

    const formFeedback = this.evaluateForm(landmarks);

    return {
      stage: this.currentStage,
      reps: Math.floor(currentHoldTime), // Report seconds as "reps"
      repCompleted: false,
      formFeedback,
      angles: {
        bodyDeviation: Math.round(bodyDeviation),
        bodyAngle: Math.round(avgBodyAngle),
      },
      isVisible: true,
      holdTime: currentHoldTime,
    };
  }

  evaluateForm(landmarks: Landmark[]): FormFeedback {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const leftShoulder = landmarks[LM.LEFT_SHOULDER];
    const leftHip = landmarks[LM.LEFT_HIP];
    const leftAnkle = landmarks[LM.LEFT_ANKLE];
    const rightShoulder = landmarks[LM.RIGHT_SHOULDER];
    const rightHip = landmarks[LM.RIGHT_HIP];
    const rightAnkle = landmarks[LM.RIGHT_ANKLE];

    const leftBodyAngle = calculateAngle(leftShoulder, leftHip, leftAnkle);
    const rightBodyAngle = calculateAngle(rightShoulder, rightHip, rightAnkle);
    const avgBodyAngle = (leftBodyAngle + rightBodyAngle) / 2;

    const thresholds = EXERCISES[this.exerciseType].thresholds;
    const bodyDeviation = Math.abs(180 - avgBodyAngle);

    if (bodyDeviation > thresholds.body_alignment_max) {
      if (avgBodyAngle < 170) {
        issues.push('สะโพกตก');
        suggestions.push('ยกสะโพกขึ้นให้ตรงกับลำตัวครับ');
      } else {
        issues.push('สะโพกสูงเกินไป');
        suggestions.push('ลดสะโพกลงให้ตรงกับลำตัวครับ');
      }
      score -= 30;
    } else {
      suggestions.push('ดีมาก! ค้างไว้เลยครับ');
    }

    let quality: FormQuality = 'good';
    if (score < 50) quality = 'bad';
    else if (score < 80) quality = 'warn';

    this.lastFormQuality = quality;
    return { quality, score: Math.max(0, score), issues, suggestions };
  }

  reset(): void {
    super.reset();
    this.holdStartTime = 0;
    this.isHolding = false;
    this.totalHoldTime = 0;
    this.lastUpdateTime = 0;
    this.bodyAngleHistory = [];
  }
}

// Mountain Climber Analyzer - Side camera, hip flexion + speed
export class MountainClimberAnalyzer extends ExerciseAnalyzer {
  private keyLandmarks = [LM.LEFT_HIP, LM.RIGHT_HIP, LM.LEFT_KNEE, LM.RIGHT_KNEE, LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER];
  private leftLegUp: boolean = false;
  private rightLegUp: boolean = false;
  private lastStepTime: number = 0;
  private previousLeftKneeY: number = 0;
  private previousRightKneeY: number = 0;
  private leftUpFrames: number = 0;
  private rightUpFrames: number = 0;
  private kneeSpeedHistory: number[] = []; // For smoothing knee speed

  constructor() {
    super('mountain_climber');
    this.repCooldown = 250; // Slightly increased for stability
    this.minFramesInStage = 3;
  }

  analyze(landmarks: Landmark[]): ExerciseAnalysisResult {
    // Update adaptive visibility threshold
    this.updateAdaptiveVisibility(landmarks, this.keyLandmarks);
    
    const isVisible = this.checkVisibility(landmarks, this.keyLandmarks);
    
    if (!isVisible) {
      return {
        stage: this.currentStage,
        reps: this.reps,
        repCompleted: false,
        formFeedback: { quality: 'good', score: 0, issues: [], suggestions: ['ให้เห็นตัวเต็มๆ ในท่าปีนเขาครับ'] },
        angles: {},
        isVisible: false,
      };
    }

    // Get smoothed landmarks
    const leftShoulder = this.getSmoothedLandmark(LM.LEFT_SHOULDER, landmarks[LM.LEFT_SHOULDER]);
    const leftHip = this.getSmoothedLandmark(LM.LEFT_HIP, landmarks[LM.LEFT_HIP]);
    const leftKnee = this.getSmoothedLandmark(LM.LEFT_KNEE, landmarks[LM.LEFT_KNEE]);
    const rightShoulder = this.getSmoothedLandmark(LM.RIGHT_SHOULDER, landmarks[LM.RIGHT_SHOULDER]);
    const rightHip = this.getSmoothedLandmark(LM.RIGHT_HIP, landmarks[LM.RIGHT_HIP]);
    const rightKnee = this.getSmoothedLandmark(LM.RIGHT_KNEE, landmarks[LM.RIGHT_KNEE]);

    // Calculate and smooth hip flexion angles
    const leftHipFlexionRaw = calculateAngle(leftShoulder, leftHip, leftKnee);
    const rightHipFlexionRaw = calculateAngle(rightShoulder, rightHip, rightKnee);
    const leftHipFlexion = this.getSmoothedAngle('leftHip', leftHipFlexionRaw);
    const rightHipFlexion = this.getSmoothedAngle('rightHip', rightHipFlexionRaw);

    const thresholds = EXERCISES[this.exerciseType].thresholds;
    const currentTime = Date.now();

    // Detect knee raises (hip flexion < 70° means knee is up)
    const leftKneeRaised = leftHipFlexion < thresholds.hip_flexion_angle;
    const rightKneeRaised = rightHipFlexion < thresholds.hip_flexion_angle;

    // Frame confirmation
    if (leftKneeRaised) {
      this.leftUpFrames++;
    } else {
      this.leftUpFrames = 0;
    }
    
    if (rightKneeRaised) {
      this.rightUpFrames++;
    } else {
      this.rightUpFrames = 0;
    }

    const leftConfirmedUp = this.leftUpFrames >= this.minFramesInStage;
    const rightConfirmedUp = this.rightUpFrames >= this.minFramesInStage;

    // Speed tracking with smoothing
    const leftKneeSpeed = Math.abs(leftKnee.y - this.previousLeftKneeY);
    const rightKneeSpeed = Math.abs(rightKnee.y - this.previousRightKneeY);
    const avgSpeedRaw = (leftKneeSpeed + rightKneeSpeed) / 2;
    
    this.kneeSpeedHistory.push(avgSpeedRaw);
    if (this.kneeSpeedHistory.length > 5) this.kneeSpeedHistory.shift();
    const avgSpeed = this.kneeSpeedHistory.reduce((a, b) => a + b, 0) / this.kneeSpeedHistory.length;

    this.previousStage = this.currentStage;
    let repCompleted = false;

    // Detect step completion with improved logic
    const cooldownPassed = currentTime - this.lastStepTime > thresholds.step_cooldown;
    const hasMinSpeed = avgSpeed >= thresholds.min_speed * 0.8; // Slightly relaxed speed threshold
    
    if (this.leftLegUp && !leftKneeRaised && cooldownPassed && hasMinSpeed && this.canCountRep()) {
      this.reps++;
      repCompleted = true;
      this.lastStepTime = currentTime;
      this.currentStage = 'left_up';
      this.markRepCounted();
    } else if (this.rightLegUp && !rightKneeRaised && cooldownPassed && hasMinSpeed && this.canCountRep()) {
      this.reps++;
      repCompleted = true;
      this.lastStepTime = currentTime;
      this.currentStage = 'right_up';
      this.markRepCounted();
    } else if (!leftKneeRaised && !rightKneeRaised) {
      this.currentStage = 'down';
    }

    this.leftLegUp = leftConfirmedUp;
    this.rightLegUp = rightConfirmedUp;
    this.previousLeftKneeY = leftKnee.y;
    this.previousRightKneeY = rightKnee.y;

    const formFeedback = this.evaluateForm(landmarks);

    return {
      stage: this.currentStage,
      reps: this.reps,
      repCompleted,
      formFeedback,
      angles: {
        leftHipFlexion: Math.round(leftHipFlexion),
        rightHipFlexion: Math.round(rightHipFlexion),
        speed: Math.round(avgSpeed * 1000),
      },
      isVisible: true,
    };
  }

  evaluateForm(landmarks: Landmark[]): FormFeedback {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const leftShoulder = landmarks[LM.LEFT_SHOULDER];
    const rightShoulder = landmarks[LM.RIGHT_SHOULDER];
    const leftHip = landmarks[LM.LEFT_HIP];
    const rightHip = landmarks[LM.RIGHT_HIP];

    // Check body stability
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const hipMidX = (leftHip.x + rightHip.x) / 2;
    const leanOffset = Math.abs(shoulderMidX - hipMidX);

    if (leanOffset > 0.1) {
      issues.push('ลำตัวเอียง');
      suggestions.push('รักษาลำตัวให้ตรงครับ');
      score -= 20;
    }

    let quality: FormQuality = 'good';
    if (score < 50) quality = 'bad';
    else if (score < 80) quality = 'warn';

    this.lastFormQuality = quality;
    return { quality, score: Math.max(0, score), issues, suggestions };
  }

  reset(): void {
    super.reset();
    this.leftLegUp = false;
    this.rightLegUp = false;
    this.lastStepTime = 0;
    this.previousLeftKneeY = 0;
    this.previousRightKneeY = 0;
    this.leftUpFrames = 0;
    this.rightUpFrames = 0;
    this.kneeSpeedHistory = [];
  }
}

// ============================================
// === EXPERT EXERCISES ===
// ============================================

// Pistol Squat Analyzer - Side camera, knee < 90°, balance check
export class PistolSquatAnalyzer extends ExerciseAnalyzer {
  private keyLandmarks = [LM.LEFT_HIP, LM.RIGHT_HIP, LM.LEFT_KNEE, LM.RIGHT_KNEE, LM.LEFT_ANKLE, LM.RIGHT_ANKLE];
  private isDown = false;
  private downConfirmedFrames = 0;
  private upConfirmedFrames = 0;
  private previousHipX: number = 0;
  private hysteresis = 15; // Prevents flickering between stages
  private balanceHistory: number[] = []; // For smoothing balance

  constructor() {
    super('pistol_squat');
    this.repCooldown = 1100; // Slightly increased for stability
    this.minFramesInStage = 5; // Higher confirmation for expert exercise
  }

  analyze(landmarks: Landmark[]): ExerciseAnalysisResult {
    // Update adaptive visibility threshold
    this.updateAdaptiveVisibility(landmarks, this.keyLandmarks);
    
    const isVisible = this.checkVisibility(landmarks, this.keyLandmarks);
    
    if (!isVisible) {
      return {
        stage: this.currentStage,
        reps: this.reps,
        repCompleted: false,
        formFeedback: { quality: 'good', score: 0, issues: [], suggestions: ['ยืนให้เห็นตัวเต็มๆ ครับ'] },
        angles: {},
        isVisible: false,
      };
    }

    // Get smoothed landmarks
    const leftHip = this.getSmoothedLandmark(LM.LEFT_HIP, landmarks[LM.LEFT_HIP]);
    const rightHip = this.getSmoothedLandmark(LM.RIGHT_HIP, landmarks[LM.RIGHT_HIP]);
    const leftKnee = this.getSmoothedLandmark(LM.LEFT_KNEE, landmarks[LM.LEFT_KNEE]);
    const rightKnee = this.getSmoothedLandmark(LM.RIGHT_KNEE, landmarks[LM.RIGHT_KNEE]);
    const leftAnkle = this.getSmoothedLandmark(LM.LEFT_ANKLE, landmarks[LM.LEFT_ANKLE]);
    const rightAnkle = this.getSmoothedLandmark(LM.RIGHT_ANKLE, landmarks[LM.RIGHT_ANKLE]);

    // Calculate and smooth knee angles
    const leftKneeAngleRaw = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngleRaw = calculateAngle(rightHip, rightKnee, rightAnkle);
    const leftKneeAngle = this.getSmoothedAngle('leftKnee', leftKneeAngleRaw);
    const rightKneeAngle = this.getSmoothedAngle('rightKnee', rightKneeAngleRaw);

    // Determine which leg is the standing leg (lower ankle Y = standing)
    const leftIsStanding = landmarks[LM.LEFT_ANKLE].y > landmarks[LM.RIGHT_ANKLE].y;
    const standingKneeAngle = leftIsStanding ? leftKneeAngle : rightKneeAngle;
    const extendedKneeAngle = leftIsStanding ? rightKneeAngle : leftKneeAngle;

    // Balance check with smoothing (hip horizontal stability)
    const hipMidX = (leftHip.x + rightHip.x) / 2;
    const balanceShiftRaw = Math.abs(hipMidX - this.previousHipX);
    
    this.balanceHistory.push(balanceShiftRaw);
    if (this.balanceHistory.length > 5) this.balanceHistory.shift();
    const balanceShift = this.balanceHistory.reduce((a, b) => a + b, 0) / this.balanceHistory.length;

    const thresholds = EXERCISES[this.exerciseType].thresholds;

    this.previousStage = this.currentStage;
    let repCompleted = false;

    // Check for pistol squat position with hysteresis
    const kneeThreshold = this.currentStage === 'down' 
      ? thresholds.knee_angle + this.hysteresis 
      : thresholds.knee_angle;
    const balanceThreshold = this.isDown 
      ? thresholds.balance_threshold * 1.3 // Relaxed when already in position
      : thresholds.balance_threshold;
    
    const inPistolSquat = standingKneeAngle < kneeThreshold && 
                          extendedKneeAngle > thresholds.extended_leg_angle;
    const isStanding = standingKneeAngle > 150;
    const isBalanced = balanceShift < balanceThreshold;

    if (inPistolSquat && isBalanced) {
      this.downConfirmedFrames++;
      this.upConfirmedFrames = 0;
      if (this.downConfirmedFrames >= this.minFramesInStage) {
        this.currentStage = 'down';
        this.isDown = true;
      }
    } else if (isStanding) {
      this.upConfirmedFrames++;
      this.downConfirmedFrames = 0;
      if (this.upConfirmedFrames >= this.minFramesInStage) {
        if (this.isDown && this.canCountRep()) {
          this.reps++;
          repCompleted = true;
          this.markRepCounted();
          this.isDown = false;
        }
        this.currentStage = 'up';
      }
    }

    this.previousHipX = hipMidX;
    const formFeedback = this.evaluateForm(landmarks);

    return {
      stage: this.currentStage,
      reps: this.reps,
      repCompleted,
      formFeedback,
      angles: {
        standingKneeAngle: Math.round(standingKneeAngle),
        extendedKneeAngle: Math.round(extendedKneeAngle),
        balanceShift: Math.round(balanceShift * 100),
      },
      isVisible: true,
    };
  }

  evaluateForm(landmarks: Landmark[]): FormFeedback {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const leftHip = landmarks[LM.LEFT_HIP];
    const rightHip = landmarks[LM.RIGHT_HIP];
    const leftKnee = landmarks[LM.LEFT_KNEE];
    const rightKnee = landmarks[LM.RIGHT_KNEE];
    const leftAnkle = landmarks[LM.LEFT_ANKLE];
    const rightAnkle = landmarks[LM.RIGHT_ANKLE];

    const leftIsStanding = leftAnkle.y > rightAnkle.y;
    const extendedKneeAngle = leftIsStanding 
      ? calculateAngle(rightHip, rightKnee, rightAnkle) 
      : calculateAngle(leftHip, leftKnee, leftAnkle);

    const thresholds = EXERCISES[this.exerciseType].thresholds;

    // Check extended leg straightness
    if (extendedKneeAngle < thresholds.extended_leg_angle) {
      issues.push('ขาที่ยื่นงอ');
      suggestions.push('ยืดขาที่ยื่นไปข้างหน้าให้ตรงครับ');
      score -= 25;
    }

    // Check balance
    const hipMidX = (leftHip.x + rightHip.x) / 2;
    const balanceShift = Math.abs(hipMidX - this.previousHipX);
    if (balanceShift > thresholds.balance_threshold) {
      issues.push('ทรงตัวไม่มั่นคง');
      suggestions.push('พยายามรักษาสมดุลครับ');
      score -= 20;
    }

    let quality: FormQuality = 'good';
    if (score < 50) quality = 'bad';
    else if (score < 80) quality = 'warn';

    this.lastFormQuality = quality;
    return { quality, score: Math.max(0, score), issues, suggestions };
  }

  reset(): void {
    super.reset();
    this.isDown = false;
    this.downConfirmedFrames = 0;
    this.upConfirmedFrames = 0;
    this.previousHipX = 0;
    this.balanceHistory = [];
  }
}

// Push-up + Shoulder Tap Analyzer - Front camera, symmetry check
export class PushupShoulderTapAnalyzer extends ExerciseAnalyzer {
  private keyLandmarks = [
    LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_ELBOW, LM.RIGHT_ELBOW,
    LM.LEFT_WRIST, LM.RIGHT_WRIST, LM.LEFT_HIP, LM.RIGHT_HIP
  ];
  private phase: 'up' | 'down' | 'tap_left' | 'tap_right' = 'up';
  private completedPushup = false;
  private completedTapLeft = false;
  private completedTapRight = false;
  private phaseConfirmedFrames = 0;
  private previousLeftWristY = 0;
  private previousRightWristY = 0;
  private hysteresis = 15; // Prevents flickering between phases
  private wristRiseHistory: { left: number[]; right: number[] } = { left: [], right: [] };

  constructor() {
    super('pushup_shoulder_tap');
    this.repCooldown = 900; // Slightly increased for stability
    this.minFramesInStage = 4;
  }

  analyze(landmarks: Landmark[]): ExerciseAnalysisResult {
    // Update adaptive visibility threshold
    this.updateAdaptiveVisibility(landmarks, this.keyLandmarks);
    
    const isVisible = this.checkVisibility(landmarks, this.keyLandmarks);
    
    if (!isVisible) {
      return {
        stage: this.currentStage,
        reps: this.reps,
        repCompleted: false,
        formFeedback: { quality: 'good', score: 0, issues: [], suggestions: ['ให้เห็นตัวเต็มๆ ครับ'] },
        angles: {},
        isVisible: false,
      };
    }

    // Get smoothed landmarks
    const leftShoulder = this.getSmoothedLandmark(LM.LEFT_SHOULDER, landmarks[LM.LEFT_SHOULDER]);
    const rightShoulder = this.getSmoothedLandmark(LM.RIGHT_SHOULDER, landmarks[LM.RIGHT_SHOULDER]);
    const leftElbow = this.getSmoothedLandmark(LM.LEFT_ELBOW, landmarks[LM.LEFT_ELBOW]);
    const rightElbow = this.getSmoothedLandmark(LM.RIGHT_ELBOW, landmarks[LM.RIGHT_ELBOW]);
    const leftWrist = this.getSmoothedLandmark(LM.LEFT_WRIST, landmarks[LM.LEFT_WRIST]);
    const rightWrist = this.getSmoothedLandmark(LM.RIGHT_WRIST, landmarks[LM.RIGHT_WRIST]);
    const leftHip = this.getSmoothedLandmark(LM.LEFT_HIP, landmarks[LM.LEFT_HIP]);
    const rightHip = this.getSmoothedLandmark(LM.RIGHT_HIP, landmarks[LM.RIGHT_HIP]);

    // Calculate and smooth elbow angles
    const leftElbowAngleRaw = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngleRaw = calculateAngle(rightShoulder, rightElbow, rightWrist);
    const leftElbowAngle = this.getSmoothedAngle('leftElbow', leftElbowAngleRaw);
    const rightElbowAngle = this.getSmoothedAngle('rightElbow', rightElbowAngleRaw);
    const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

    // Detect hand raises with smoothing for shoulder taps
    const leftWristRiseRaw = this.previousLeftWristY - leftWrist.y;
    const rightWristRiseRaw = this.previousRightWristY - rightWrist.y;
    
    this.wristRiseHistory.left.push(leftWristRiseRaw);
    this.wristRiseHistory.right.push(rightWristRiseRaw);
    if (this.wristRiseHistory.left.length > 3) this.wristRiseHistory.left.shift();
    if (this.wristRiseHistory.right.length > 3) this.wristRiseHistory.right.shift();
    
    const leftWristRise = this.wristRiseHistory.left.reduce((a, b) => a + b, 0) / this.wristRiseHistory.left.length;
    const rightWristRise = this.wristRiseHistory.right.reduce((a, b) => a + b, 0) / this.wristRiseHistory.right.length;

    const thresholds = EXERCISES[this.exerciseType].thresholds;

    this.previousStage = this.currentStage;
    let repCompleted = false;

    // State machine with hysteresis: up -> down -> up -> tap_left -> tap_right -> (count rep)
    const elbowDown = this.phase === 'down' 
      ? avgElbowAngle < thresholds.elbow_down_angle + this.hysteresis
      : avgElbowAngle < thresholds.elbow_down_angle;
    const elbowUp = this.phase === 'up' || this.phase === 'tap_left' || this.phase === 'tap_right'
      ? avgElbowAngle > thresholds.elbow_up_angle - this.hysteresis
      : avgElbowAngle > thresholds.elbow_up_angle;
    const leftTap = leftWristRise > thresholds.tap_height * 0.8; // Slightly relaxed
    const rightTap = rightWristRise > thresholds.tap_height * 0.8;

    // Check body tilt during taps
    const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
    const hipTilt = Math.abs(leftHip.y - rightHip.y);

    if (this.phase === 'up') {
      if (elbowDown) {
        this.phaseConfirmedFrames++;
        if (this.phaseConfirmedFrames >= this.minFramesInStage) {
          this.phase = 'down';
          this.currentStage = 'down';
          this.phaseConfirmedFrames = 0;
        }
      }
    } else if (this.phase === 'down') {
      if (elbowUp) {
        this.phaseConfirmedFrames++;
        if (this.phaseConfirmedFrames >= this.minFramesInStage) {
          this.phase = 'tap_left';
          this.currentStage = 'up';
          this.completedPushup = true;
          this.phaseConfirmedFrames = 0;
        }
      }
    } else if (this.phase === 'tap_left') {
      if (leftTap && !this.completedTapLeft) {
        this.phaseConfirmedFrames++;
        if (this.phaseConfirmedFrames >= 3) { // Increased frame confirmation
          this.completedTapLeft = true;
          this.currentStage = 'tap_left';
          this.phase = 'tap_right';
          this.phaseConfirmedFrames = 0;
        }
      }
    } else if (this.phase === 'tap_right') {
      if (rightTap && !this.completedTapRight) {
        this.phaseConfirmedFrames++;
        if (this.phaseConfirmedFrames >= 3) { // Increased frame confirmation
          this.completedTapRight = true;
          this.currentStage = 'tap_right';
          
          // Complete rep
          if (this.completedPushup && this.completedTapLeft && this.canCountRep()) {
            this.reps++;
            repCompleted = true;
            this.markRepCounted();
          }
          
          // Reset for next rep
          this.phase = 'up';
          this.completedPushup = false;
          this.completedTapLeft = false;
          this.completedTapRight = false;
          this.phaseConfirmedFrames = 0;
        }
      }
    }

    this.previousLeftWristY = leftWrist.y;
    this.previousRightWristY = rightWrist.y;

    const formFeedback = this.evaluateForm(landmarks);

    return {
      stage: this.currentStage,
      reps: this.reps,
      repCompleted,
      formFeedback,
      angles: {
        elbowAngle: Math.round(avgElbowAngle),
        shoulderTilt: Math.round(shoulderTilt * 100),
        hipTilt: Math.round(hipTilt * 100),
        phase: this.phase,
      },
      isVisible: true,
    };
  }

  evaluateForm(landmarks: Landmark[]): FormFeedback {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const leftShoulder = this.getSmoothedLandmark(LM.LEFT_SHOULDER, landmarks[LM.LEFT_SHOULDER]);
    const rightShoulder = this.getSmoothedLandmark(LM.RIGHT_SHOULDER, landmarks[LM.RIGHT_SHOULDER]);
    const leftHip = this.getSmoothedLandmark(LM.LEFT_HIP, landmarks[LM.LEFT_HIP]);
    const rightHip = this.getSmoothedLandmark(LM.RIGHT_HIP, landmarks[LM.RIGHT_HIP]);

    // Check body tilt during taps
    const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
    const hipTilt = Math.abs(leftHip.y - rightHip.y);
    const thresholds = EXERCISES[this.exerciseType].thresholds;

    if (shoulderTilt > thresholds.tilt_threshold || hipTilt > thresholds.tilt_threshold) {
      issues.push('ลำตัวเอียง');
      suggestions.push('รักษาลำตัวให้ตรงขณะแตะไหล่ครับ');
      score -= 25;
    }

    let quality: FormQuality = 'good';
    if (score < 50) quality = 'bad';
    else if (score < 80) quality = 'warn';

    this.lastFormQuality = quality;
    return { quality, score: Math.max(0, score), issues, suggestions };
  }

  reset(): void {
    super.reset();
    this.phase = 'up';
    this.completedPushup = false;
    this.completedTapLeft = false;
    this.completedTapRight = false;
    this.phaseConfirmedFrames = 0;
    this.previousLeftWristY = 0;
    this.previousRightWristY = 0;
    this.wristRiseHistory = { left: [], right: [] };
  }
}

// Burpee Analyzer - Side camera, state machine (squat → plank → jump)
export class BurpeeAnalyzer extends ExerciseAnalyzer {
  private keyLandmarks = [
    LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_HIP, LM.RIGHT_HIP,
    LM.LEFT_KNEE, LM.RIGHT_KNEE, LM.LEFT_ANKLE, LM.RIGHT_ANKLE
  ];
  private burpeePhase: 'standing' | 'squat' | 'plank' | 'jump' = 'standing';
  private previousHipY: number = 0;
  private phaseStartTime: number = Date.now();
  private completedSquat: boolean = false;
  private completedPlank: boolean = false;
  private phaseConfirmedFrames: number = 0;
  private hysteresis = 15; // Prevents flickering between phases
  private hipYHistory: number[] = []; // For smoothing hip position

  constructor() {
    super('burpee');
    this.repCooldown = 1600; // Slightly increased for stability
    this.minFramesInStage = 4;
  }

  analyze(landmarks: Landmark[]): ExerciseAnalysisResult {
    // Update adaptive visibility threshold
    this.updateAdaptiveVisibility(landmarks, this.keyLandmarks);
    
    const isVisible = this.checkVisibility(landmarks, this.keyLandmarks);
    
    if (!isVisible) {
      return {
        stage: this.currentStage,
        reps: this.reps,
        repCompleted: false,
        formFeedback: { quality: 'good', score: 0, issues: [], suggestions: ['ยืนให้เห็นตัวเต็มๆ ครับ'] },
        angles: {},
        isVisible: false,
      };
    }

    // Get smoothed landmarks
    const leftShoulder = this.getSmoothedLandmark(LM.LEFT_SHOULDER, landmarks[LM.LEFT_SHOULDER]);
    const rightShoulder = this.getSmoothedLandmark(LM.RIGHT_SHOULDER, landmarks[LM.RIGHT_SHOULDER]);
    const leftHip = this.getSmoothedLandmark(LM.LEFT_HIP, landmarks[LM.LEFT_HIP]);
    const rightHip = this.getSmoothedLandmark(LM.RIGHT_HIP, landmarks[LM.RIGHT_HIP]);
    const leftKnee = this.getSmoothedLandmark(LM.LEFT_KNEE, landmarks[LM.LEFT_KNEE]);
    const rightKnee = this.getSmoothedLandmark(LM.RIGHT_KNEE, landmarks[LM.RIGHT_KNEE]);
    const leftAnkle = this.getSmoothedLandmark(LM.LEFT_ANKLE, landmarks[LM.LEFT_ANKLE]);
    const rightAnkle = this.getSmoothedLandmark(LM.RIGHT_ANKLE, landmarks[LM.RIGHT_ANKLE]);

    // Calculate and smooth knee angles
    const leftKneeAngleRaw = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngleRaw = calculateAngle(rightHip, rightKnee, rightAnkle);
    const leftKneeAngle = this.getSmoothedAngle('leftKnee', leftKneeAngleRaw);
    const rightKneeAngle = this.getSmoothedAngle('rightKnee', rightKneeAngleRaw);
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

    // Calculate and smooth body angle for plank detection
    const leftBodyAngle = calculateAngle(leftShoulder, leftHip, leftAnkle);
    const rightBodyAngle = calculateAngle(rightShoulder, rightHip, rightAnkle);
    const avgBodyAngle = this.getSmoothedAngle('bodyAngle', (leftBodyAngle + rightBodyAngle) / 2);

    // Vertical movement with smoothing for jump detection
    const hipY = (leftHip.y + rightHip.y) / 2;
    this.hipYHistory.push(hipY);
    if (this.hipYHistory.length > 5) this.hipYHistory.shift();
    const smoothedHipY = this.hipYHistory.reduce((a, b) => a + b, 0) / this.hipYHistory.length;
    
    const verticalMovement = this.previousHipY - smoothedHipY;

    const thresholds = EXERCISES[this.exerciseType].thresholds;
    const currentTime = Date.now();

    this.previousStage = this.currentStage;
    let repCompleted = false;

    // Detect positions with hysteresis
    const squatThreshold = this.burpeePhase === 'squat' 
      ? thresholds.squat_knee_angle + this.hysteresis 
      : thresholds.squat_knee_angle;
    const inSquat = avgKneeAngle < squatThreshold;
    const inPlank = avgBodyAngle > thresholds.plank_body_angle && smoothedHipY > 0.55; // Slightly relaxed
    const isJumping = verticalMovement > thresholds.jump_height_ratio * 0.9; // Slightly relaxed
    const isStanding = avgKneeAngle > 145 && smoothedHipY < 0.6;

    // State machine: standing -> squat -> plank -> squat -> jump
    switch (this.burpeePhase) {
      case 'standing':
        if (inSquat) {
          this.phaseConfirmedFrames++;
          if (this.phaseConfirmedFrames >= this.minFramesInStage) {
            this.burpeePhase = 'squat';
            this.currentStage = 'squat';
            this.completedSquat = true;
            this.phaseStartTime = currentTime;
            this.phaseConfirmedFrames = 0;
          }
        }
        break;
        
      case 'squat':
        if (inPlank && this.completedSquat) {
          this.phaseConfirmedFrames++;
          if (this.phaseConfirmedFrames >= this.minFramesInStage) {
            this.burpeePhase = 'plank';
            this.currentStage = 'plank';
            this.completedPlank = true;
            this.phaseStartTime = currentTime;
            this.phaseConfirmedFrames = 0;
          }
        }
        break;
        
      case 'plank':
        if (inSquat && this.completedPlank) {
          this.phaseConfirmedFrames++;
          if (this.phaseConfirmedFrames >= this.minFramesInStage) {
            this.burpeePhase = 'jump';
            this.phaseConfirmedFrames = 0;
          }
        }
        break;
        
      case 'jump':
        if (isJumping && this.canCountRep()) {
          this.reps++;
          repCompleted = true;
          this.markRepCounted();
          this.currentStage = 'jump';
          
          // Reset for next rep
          this.burpeePhase = 'standing';
          this.completedSquat = false;
          this.completedPlank = false;
          this.phaseConfirmedFrames = 0;
        } else if (isStanding) {
          // If standing without jump, still count as partial rep
          this.burpeePhase = 'standing';
          this.currentStage = 'up';
          this.completedSquat = false;
          this.completedPlank = false;
        }
        break;
    }

    this.previousHipY = smoothedHipY;
    const formFeedback = this.evaluateForm(landmarks);

    return {
      stage: this.currentStage,
      reps: this.reps,
      repCompleted,
      formFeedback,
      angles: {
        kneeAngle: Math.round(avgKneeAngle),
        bodyAngle: Math.round(avgBodyAngle),
        verticalMovement: Math.round(verticalMovement * 100),
        phase: this.burpeePhase,
      },
      isVisible: true,
    };
  }

  evaluateForm(landmarks: Landmark[]): FormFeedback {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const leftShoulder = landmarks[LM.LEFT_SHOULDER];
    const leftHip = landmarks[LM.LEFT_HIP];
    const leftAnkle = landmarks[LM.LEFT_ANKLE];
    const rightShoulder = landmarks[LM.RIGHT_SHOULDER];
    const rightHip = landmarks[LM.RIGHT_HIP];
    const rightAnkle = landmarks[LM.RIGHT_ANKLE];

    const thresholds = EXERCISES[this.exerciseType].thresholds;

    if (this.burpeePhase === 'plank') {
      const leftBodyAngle = calculateAngle(leftShoulder, leftHip, leftAnkle);
      const rightBodyAngle = calculateAngle(rightShoulder, rightHip, rightAnkle);
      const avgBodyAngle = (leftBodyAngle + rightBodyAngle) / 2;
      
      if (avgBodyAngle < thresholds.plank_body_angle - 15) {
        issues.push('ลำตัวไม่ตรงในท่าแพลงค์');
        suggestions.push('ยืดลำตัวให้ตรงครับ');
        score -= 25;
      }
    }

    let quality: FormQuality = 'good';
    if (score < 50) quality = 'bad';
    else if (score < 80) quality = 'warn';

    this.lastFormQuality = quality;
    return { quality, score: Math.max(0, score), issues, suggestions };
  }

  reset(): void {
    super.reset();
    this.burpeePhase = 'standing';
    this.previousHipY = 0;
    this.completedSquat = false;
    this.completedPlank = false;
    this.phaseConfirmedFrames = 0;
    this.hipYHistory = [];
  }
}

// ============================================
// === FACTORY FUNCTION ===
// ============================================

export function createExerciseAnalyzer(exerciseType: ExerciseType): ExerciseAnalyzer {
  switch (exerciseType) {
    // Beginner
    case 'arm_raise':
      return new ArmRaiseAnalyzer();
    case 'torso_twist':
      return new TorsoTwistAnalyzer();
    case 'knee_raise':
      return new KneeRaiseAnalyzer();
    // Intermediate
    case 'squat_arm_raise':
      return new SquatWithArmRaiseAnalyzer();
    case 'push_up':
      return new PushUpAnalyzer();
    case 'static_lunge':
      return new StaticLungeAnalyzer();
    // Advanced
    case 'jump_squat':
      return new JumpSquatAnalyzer();
    case 'plank_hold':
      return new PlankHoldAnalyzer();
    case 'mountain_climber':
      return new MountainClimberAnalyzer();
    // Expert
    case 'pistol_squat':
      return new PistolSquatAnalyzer();
    case 'pushup_shoulder_tap':
      return new PushupShoulderTapAnalyzer();
    case 'burpee':
      return new BurpeeAnalyzer();
    default:
      throw new Error(`Unknown exercise type: ${exerciseType}`);
  }
}

// ============================================
// === VISUAL GUIDE HELPERS ===
// ============================================

// Joint correction for visual guide
export interface JointCorrection {
  jointName: string;
  currentPos: { x: number; y: number };
  targetPos: { x: number; y: number };
  distance: number;
  direction: string[];
}

// Calculate corrections needed for visual guide
export function calculateCorrections(
  landmarks: Landmark[],
  exerciseType: ExerciseType,
  targetStage: string
): JointCorrection[] {
  const targetPose = TARGET_POSES[exerciseType]?.[targetStage];
  
  if (!targetPose) return [];

  const corrections: JointCorrection[] = [];
  const jointToLandmark: Record<string, number> = {
    left_shoulder: LM.LEFT_SHOULDER,
    right_shoulder: LM.RIGHT_SHOULDER,
    left_elbow: LM.LEFT_ELBOW,
    right_elbow: LM.RIGHT_ELBOW,
    left_wrist: LM.LEFT_WRIST,
    right_wrist: LM.RIGHT_WRIST,
    left_hip: LM.LEFT_HIP,
    right_hip: LM.RIGHT_HIP,
    left_knee: LM.LEFT_KNEE,
    right_knee: LM.RIGHT_KNEE,
    left_ankle: LM.LEFT_ANKLE,
    right_ankle: LM.RIGHT_ANKLE,
  };

  for (const [jointName, targetPos] of Object.entries(targetPose)) {
    const landmarkIdx = jointToLandmark[jointName];
    if (landmarkIdx === undefined) continue;

    const landmark = landmarks[landmarkIdx];
    if (!landmark || (landmark.visibility !== undefined && landmark.visibility < 0.5)) continue;

    const currentPos = { x: landmark.x, y: landmark.y };
    const target = targetPos as { x: number; y: number };
    const distance = calculateDistance(currentPos, target);

    const direction: string[] = [];
    const dx = target.x - currentPos.x;
    const dy = target.y - currentPos.y;

    if (dx < -0.03) direction.push('ขยับซ้าย');
    if (dx > 0.03) direction.push('ขยับขวา');
    if (dy < -0.03) direction.push('ยกขึ้น');
    if (dy > 0.03) direction.push('ลดลง');

    corrections.push({
      jointName,
      currentPos,
      targetPos: target,
      distance,
      direction,
    });
  }

  return corrections;
}
