// Exercise Analyzers - Ported from KAYA/exercise_analyzer.py
// Handles rep counting, stage detection, and form quality assessment

import { Landmark } from '@/hooks/useMediaPipePose';
import {
  ExerciseType,
  ExerciseStage,
  FormQuality,
  EXERCISES,
  LANDMARK_INDICES as LM,
  TARGET_POSES,
} from './exerciseConfig';

// Calculate angle between three points (in degrees)
// point b is the vertex (same as KAYA/pose_detector.py)
export function calculateAngle(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number }
): number {
  // Calculate vectors from b to a and from b to c
  const v1x = a.x - b.x;
  const v1y = a.y - b.y;
  const v2x = c.x - b.x;
  const v2y = c.y - b.y;
  
  // Dot product
  const dot = v1x * v2x + v1y * v2y;
  
  // Magnitudes
  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);
  
  // Cosine of angle
  let cosAngle = dot / (mag1 * mag2 + 1e-6);
  
  // Clamp to [-1, 1] to avoid NaN from acos
  cosAngle = Math.max(-1, Math.min(1, cosAngle));
  
  // Convert to degrees
  const angle = Math.acos(cosAngle) * (180 / Math.PI);
  
  return angle;
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
  repCompleted: boolean; // True when a rep just completed (like KAYA)
  formFeedback: FormFeedback;
  angles: Record<string, number | string>; // Allow string for phase info
  isVisible: boolean;
}

// Base Exercise Analyzer class
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
  protected repCooldown: number = 400; // ms between reps (prevents double counting)
  protected stageEntryTime: number = 0;
  protected minHoldTime: number = 100; // ms to hold a stage before it counts
  protected stageConfirmed: boolean = false;
  protected consecutiveFramesInStage: number = 0;
  protected minFramesInStage: number = 3; // frames to confirm stage change

  constructor(exerciseType: ExerciseType) {
    this.exerciseType = exerciseType;
  }

  abstract analyze(landmarks: Landmark[]): ExerciseAnalysisResult;
  abstract evaluateForm(landmarks: Landmark[]): FormFeedback;

  // Check if key landmarks are visible (lowered threshold for better detection)
  protected checkVisibility(landmarks: Landmark[], indices: number[]): boolean {
    const VISIBILITY_THRESHOLD = 0.3; // Lowered from 0.5 for better detection
    return indices.every((idx) => {
      const landmark = landmarks[idx];
      return landmark && (landmark.visibility === undefined || landmark.visibility > VISIBILITY_THRESHOLD);
    });
  }

  // Get landmark safely
  protected getLandmark(landmarks: Landmark[], index: number): Landmark | null {
    const VISIBILITY_THRESHOLD = 0.3;
    const lm = landmarks[index];
    if (!lm || (lm.visibility !== undefined && lm.visibility < VISIBILITY_THRESHOLD)) {
      return null;
    }
    return lm;
  }

  // Reset the analyzer
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
  }

  // Helper to check if rep can be counted (cooldown passed)
  protected canCountRep(): boolean {
    const now = Date.now();
    return (now - this.lastRepTime) >= this.repCooldown;
  }

  // Mark that a rep was counted
  protected markRepCounted(): void {
    this.lastRepTime = Date.now();
  }

  // Confirm stage change with frame validation
  protected confirmStageChange(newStage: ExerciseStage): boolean {
    if (newStage === this.currentStage) {
      this.consecutiveFramesInStage++;
      if (this.consecutiveFramesInStage >= this.minFramesInStage && !this.stageConfirmed) {
        this.stageConfirmed = true;
        this.stageEntryTime = Date.now();
      }
      return this.stageConfirmed;
    } else {
      // Stage changed, reset frame counter
      this.consecutiveFramesInStage = 1;
      this.stageConfirmed = false;
      this.previousStage = this.currentStage;
      this.currentStage = newStage;
      return false;
    }
  }

  // Check if stage has been held long enough
  protected stageHeldLongEnough(): boolean {
    if (!this.stageConfirmed) return false;
    return (Date.now() - this.stageEntryTime) >= this.minHoldTime;
  }

  // Get current state
  getState() {
    return {
      stage: this.currentStage,
      reps: this.reps,
      lastFormQuality: this.lastFormQuality,
    };
  }
}

// Arm Raise Analyzer
export class ArmRaiseAnalyzer extends ExerciseAnalyzer {
  private keyLandmarks = [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_ELBOW, LM.RIGHT_ELBOW, LM.LEFT_WRIST, LM.RIGHT_WRIST, LM.LEFT_HIP, LM.RIGHT_HIP];
  private waitingForDown = false; // KAYA-style flag
  private reachedUp = false; // Confirmed up position

  constructor() {
    super('arm_raise');
    this.repCooldown = 500; // 500ms between arm raises
    this.minHoldTime = 150; // Must hold position for 150ms
  }

  analyze(landmarks: Landmark[]): ExerciseAnalysisResult {
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

    // Get landmarks
    const leftShoulder = landmarks[LM.LEFT_SHOULDER];
    const rightShoulder = landmarks[LM.RIGHT_SHOULDER];
    const leftElbow = landmarks[LM.LEFT_ELBOW];
    const rightElbow = landmarks[LM.RIGHT_ELBOW];
    const leftHip = landmarks[LM.LEFT_HIP];
    const rightHip = landmarks[LM.RIGHT_HIP];

    // Calculate arm elevation angles (hip -> shoulder -> elbow)
    const leftArmAngle = calculateAngle(leftHip, leftShoulder, leftElbow);
    const rightArmAngle = calculateAngle(rightHip, rightShoulder, rightElbow);
    
    // Use average of both arms
    const avgArmAngle = (leftArmAngle + rightArmAngle) / 2;
    
    const thresholds = EXERCISES[this.exerciseType].thresholds as Record<string, number>;
    
    // Add hysteresis to prevent bouncing
    const upThreshold = thresholds.up_angle;
    const downThreshold = thresholds.down_angle;
    const hysteresis = 10; // degrees

    // KAYA-style rep counting logic with improved validation
    let repCompleted = false;
    
    // Determine raw stage
    let rawStage: ExerciseStage = this.currentStage;
    if (avgArmAngle >= upThreshold) {
      rawStage = 'up';
    } else if (avgArmAngle <= downThreshold) {
      rawStage = 'down';
    } else if (this.currentStage === 'up' && avgArmAngle < upThreshold - hysteresis) {
      rawStage = 'transition';
    } else if (this.currentStage === 'down' && avgArmAngle > downThreshold + hysteresis) {
      rawStage = 'transition';
    }

    // Confirm stage with frame validation
    const stageConfirmed = this.confirmStageChange(rawStage);
    
    // Count rep when: confirmed UP -> confirmed DOWN with cooldown
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

    // Evaluate form
    const formFeedback = this.evaluateForm(landmarks);

    return {
      stage: this.currentStage,
      reps: this.reps,
      repCompleted,
      formFeedback,
      angles: {
        leftArm: leftArmAngle,
        rightArm: rightArmAngle,
        average: avgArmAngle,
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

    // Check arm symmetry
    const leftArmAngle = calculateAngle(leftHip, leftShoulder, leftElbow);
    const rightArmAngle = calculateAngle(rightHip, rightShoulder, rightElbow);
    const angleDiff = Math.abs(leftArmAngle - rightArmAngle);
    
    if (angleDiff > EXERCISES.arm_raise.thresholds.symmetry_diff) {
      issues.push('แขนไม่สมมาตร');
      suggestions.push('ยกแขนให้เท่ากันทั้งสองข้างครับ');
      score -= 20;
    }

    // Check shoulder level
    const shoulderHeightDiff = Math.abs(leftShoulder.y - rightShoulder.y);
    if (shoulderHeightDiff > 0.05) {
      issues.push('ไหล่ไม่เสมอกัน');
      suggestions.push('ระวังไหล่ให้เสมอกันครับ');
      score -= 15;
    }

    // Determine form quality
    let quality: FormQuality = 'good';
    if (score < 50) {
      quality = 'bad';
      this.consecutiveBadForms++;
      this.consecutiveWarnings = 0;
    } else if (score < 80) {
      quality = 'warn';
      this.consecutiveWarnings++;
      this.consecutiveBadForms = 0;
    } else {
      this.consecutiveWarnings = 0;
      this.consecutiveBadForms = 0;
    }

    this.lastFormQuality = quality;

    return {
      quality,
      score: Math.max(0, score),
      issues,
      suggestions,
    };
  }
}

// Torso Twist Analyzer
export class TorsoTwistAnalyzer extends ExerciseAnalyzer {
  private keyLandmarks = [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_HIP, LM.RIGHT_HIP];
  private lastTwistDirection: 'left' | 'right' | null = null;
  private completedTwist: boolean = false; // Confirmed twist to one side

  constructor() {
    super('torso_twist');
    this.repCooldown = 400; // 400ms between twists
    this.minHoldTime = 100;
  }

  analyze(landmarks: Landmark[]): ExerciseAnalysisResult {
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

    const leftShoulder = landmarks[LM.LEFT_SHOULDER];
    const rightShoulder = landmarks[LM.RIGHT_SHOULDER];
    const leftHip = landmarks[LM.LEFT_HIP];
    const rightHip = landmarks[LM.RIGHT_HIP];

    // Calculate shoulder offset relative to hips
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const hipMidX = (leftHip.x + rightHip.x) / 2;
    const twistOffset = shoulderMidX - hipMidX;

    const thresholds = EXERCISES[this.exerciseType].thresholds as Record<string, number>;
    const hysteresis = thresholds.twist_threshold * 0.3; // 30% hysteresis

    // Determine raw stage with hysteresis
    let rawStage: ExerciseStage = 'center';
    if (twistOffset > thresholds.twist_threshold) {
      rawStage = 'left';
    } else if (twistOffset < -thresholds.twist_threshold) {
      rawStage = 'right';
    } else if (this.currentStage === 'left' && twistOffset > thresholds.twist_threshold - hysteresis) {
      rawStage = 'left'; // Keep in left with hysteresis
    } else if (this.currentStage === 'right' && twistOffset < -thresholds.twist_threshold + hysteresis) {
      rawStage = 'right'; // Keep in right with hysteresis
    } else {
      rawStage = 'center';
    }

    // Confirm stage
    const stageConfirmed = this.confirmStageChange(rawStage);

    // Rep counting logic
    let repCompleted = false;
    
    // Track when we've completed a full twist to one side
    if (stageConfirmed && (this.currentStage === 'left' || this.currentStage === 'right') && this.stageHeldLongEnough()) {
      this.lastTwistDirection = this.currentStage as 'left' | 'right';
      this.completedTwist = true;
    }
    
    // Count rep when returning to center after a confirmed twist
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
        twistOffset: twistOffset * 100, // Convert to percentage
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

    // Check hip stability (hips should stay relatively still)
    const hipWidth = Math.abs(leftHip.x - rightHip.x);
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
    
    // If hip width changes significantly, hips are moving
    // This is a simplified check
    if (hipWidth < 0.1) {
      issues.push('สะโพกเคลื่อนที่');
      suggestions.push('ล็อคสะโพกไว้ บิดแค่ลำตัวครับ');
      score -= 25;
    }

    // Check shoulder level
    const shoulderHeightDiff = Math.abs(leftShoulder.y - rightShoulder.y);
    if (shoulderHeightDiff > 0.08) {
      issues.push('ไหล่ไม่ขนาน');
      suggestions.push('ไหล่ให้ขนานพื้นครับ');
      score -= 15;
    }

    let quality: FormQuality = 'good';
    if (score < 50) {
      quality = 'bad';
    } else if (score < 80) {
      quality = 'warn';
    }

    this.lastFormQuality = quality;

    return {
      quality,
      score: Math.max(0, score),
      issues,
      suggestions,
    };
  }

  reset(): void {
    super.reset();
    this.currentStage = 'center';
    this.lastTwistDirection = null;
  }
}

// Knee Raise Analyzer
export class KneeRaiseAnalyzer extends ExerciseAnalyzer {
  private keyLandmarks = [LM.LEFT_HIP, LM.RIGHT_HIP, LM.LEFT_KNEE, LM.RIGHT_KNEE, LM.LEFT_ANKLE, LM.RIGHT_ANKLE, LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER];
  private lastRaisedLeg: 'left' | 'right' | null = null;
  private leftLegStage: 'up' | 'down' = 'down';
  private rightLegStage: 'up' | 'down' = 'down';
  private leftUpConfirmed: boolean = false;
  private rightUpConfirmed: boolean = false;
  private leftUpFrames: number = 0;
  private rightUpFrames: number = 0;

  constructor() {
    super('knee_raise');
    this.repCooldown = 350; // 350ms between knee raises
    this.minFramesInStage = 2; // Need 2 frames to confirm
  }

  analyze(landmarks: Landmark[]): ExerciseAnalysisResult {
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

    const leftShoulder = landmarks[LM.LEFT_SHOULDER];
    const leftHip = landmarks[LM.LEFT_HIP];
    const leftKnee = landmarks[LM.LEFT_KNEE];
    
    const rightShoulder = landmarks[LM.RIGHT_SHOULDER];
    const rightHip = landmarks[LM.RIGHT_HIP];
    const rightKnee = landmarks[LM.RIGHT_KNEE];

    // Calculate knee angles (shoulder -> hip -> knee)
    const leftKneeAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
    const rightKneeAngle = calculateAngle(rightShoulder, rightHip, rightKnee);

    const thresholds = EXERCISES[this.exerciseType].thresholds as Record<string, number>;
    const hysteresis = 15; // degrees

    // Track previous leg stages
    const prevLeftStage = this.leftLegStage;
    const prevRightStage = this.rightLegStage;

    // Detect left leg stage with hysteresis and frame confirmation
    if (leftKneeAngle < thresholds.up_angle) {
      this.leftUpFrames++;
      if (this.leftUpFrames >= this.minFramesInStage) {
        this.leftLegStage = 'up';
        this.leftUpConfirmed = true;
      }
    } else if (leftKneeAngle > thresholds.down_angle) {
      this.leftUpFrames = 0;
      this.leftLegStage = 'down';
    } else if (this.leftLegStage === 'up' && leftKneeAngle < thresholds.up_angle + hysteresis) {
      // Keep up with hysteresis
    } else {
      this.leftUpFrames = 0;
    }

    // Detect right leg stage with hysteresis and frame confirmation
    if (rightKneeAngle < thresholds.up_angle) {
      this.rightUpFrames++;
      if (this.rightUpFrames >= this.minFramesInStage) {
        this.rightLegStage = 'up';
        this.rightUpConfirmed = true;
      }
    } else if (rightKneeAngle > thresholds.down_angle) {
      this.rightUpFrames = 0;
      this.rightLegStage = 'down';
    } else if (this.rightLegStage === 'up' && rightKneeAngle < thresholds.up_angle + hysteresis) {
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

    // Rep counting: count when confirmed up -> down with cooldown
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
        leftKnee: leftKneeAngle,
        rightKnee: rightKneeAngle,
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

    // Check torso lean (should stay vertical)
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const hipMidX = (leftHip.x + rightHip.x) / 2;
    const leanOffset = Math.abs(shoulderMidX - hipMidX);

    if (leanOffset > 0.08) {
      issues.push('เอนตัว');
      suggestions.push('ยืนตรงๆ อย่าเอนตัวครับ');
      score -= 25;
    }

    // Check if knee is raised high enough when in up position
    if (this.leftLegStage === 'up' || this.rightLegStage === 'up') {
      const leftKnee = landmarks[LM.LEFT_KNEE];
      const rightKnee = landmarks[LM.RIGHT_KNEE];
      const activeKnee = this.leftLegStage === 'up' ? leftKnee : rightKnee;
      const activeHip = this.leftLegStage === 'up' ? leftHip : rightHip;
      
      // Knee should be at or above hip level when raised
      if (activeKnee.y > activeHip.y + 0.05) {
        issues.push('ยกเข่าไม่สูงพอ');
        suggestions.push('ยกเข่าให้สูงกว่านี้ครับ');
        score -= 20;
      }
    }

    let quality: FormQuality = 'good';
    if (score < 50) {
      quality = 'bad';
    } else if (score < 80) {
      quality = 'warn';
    }

    this.lastFormQuality = quality;

    return {
      quality,
      score: Math.max(0, score),
      issues,
      suggestions,
    };
  }

  reset(): void {
    super.reset();
    this.leftLegStage = 'down';
    this.rightLegStage = 'down';
    this.lastRaisedLeg = null;
    this.leftUpConfirmed = false;
    this.rightUpConfirmed = false;
    this.leftUpFrames = 0;
    this.rightUpFrames = 0;
  }
}

// Squat + Arm Raise Analyzer: reuse ArmRaiseAnalyzer but require squat knee angle
export class SquatWithArmRaiseAnalyzer extends ArmRaiseAnalyzer {
  constructor() {
    super();
    // Override exercise type so thresholds refer to the correct EXERCISES entry
    // ArmRaiseAnalyzer constructor set exerciseType to 'arm_raise', replace it
    (this as any).exerciseType = 'squat_arm_raise';
  }

  analyze(landmarks: Landmark[]): ExerciseAnalysisResult {
    const prevReps = this.reps;
    const result = super.analyze(landmarks);

    // Check squat knee angles
    const leftShoulder = landmarks[LM.LEFT_SHOULDER];
    const leftHip = landmarks[LM.LEFT_HIP];
    const leftKnee = landmarks[LM.LEFT_KNEE];
    const rightShoulder = landmarks[LM.RIGHT_SHOULDER];
    const rightHip = landmarks[LM.RIGHT_HIP];
    const rightKnee = landmarks[LM.RIGHT_KNEE];

    const leftKneeAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
    const rightKneeAngle = calculateAngle(rightShoulder, rightHip, rightKnee);
    const avgKnee = (leftKneeAngle + rightKneeAngle) / 2;

    const thresholds = EXERCISES[this.exerciseType].thresholds as Record<string, number>;
    const minA = thresholds.knee_min_angle ?? 90;
    const maxA = thresholds.knee_max_angle ?? 160;

    const inSquat = avgKnee >= minA && avgKnee <= maxA;

    if (!inSquat) {
      // If a rep was counted by arm logic but user wasn't in squat, revert the count
      if (result.repCompleted && this.reps > prevReps) {
        this.reps = prevReps;
        result.repCompleted = false;
      }
      // Add form issue
      result.formFeedback.issues.push('ไม่อยู่ในท่าสควอต');
      result.formFeedback.suggestions.push('ก้มเข่าลงให้ถึงมุมที่กำหนดก่อนทำท่านี้');
      result.formFeedback.quality = 'warn';
    }

    return result;
  }
}

// Squat + Twist Analyzer: reuse TorsoTwistAnalyzer but require squat knee angle
export class SquatWithTwistAnalyzer extends TorsoTwistAnalyzer {
  constructor() {
    super();
    (this as any).exerciseType = 'squat_twist';
  }

  analyze(landmarks: Landmark[]): ExerciseAnalysisResult {
    const prevReps = this.reps;
    const result = super.analyze(landmarks);

    // Check squat knee angles
    const leftShoulder = landmarks[LM.LEFT_SHOULDER];
    const leftHip = landmarks[LM.LEFT_HIP];
    const leftKnee = landmarks[LM.LEFT_KNEE];
    const rightShoulder = landmarks[LM.RIGHT_SHOULDER];
    const rightHip = landmarks[LM.RIGHT_HIP];
    const rightKnee = landmarks[LM.RIGHT_KNEE];

    const leftKneeAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
    const rightKneeAngle = calculateAngle(rightShoulder, rightHip, rightKnee);
    const avgKnee = (leftKneeAngle + rightKneeAngle) / 2;

    const thresholds = EXERCISES[this.exerciseType].thresholds as Record<string, number>;
    const minA = thresholds.knee_min_angle ?? 90;
    const maxA = thresholds.knee_max_angle ?? 160;

    const inSquat = avgKnee >= minA && avgKnee <= maxA;

    if (!inSquat) {
      if (result.repCompleted && this.reps > prevReps) {
        this.reps = prevReps;
        result.repCompleted = false;
      }
      result.formFeedback.issues.push('ไม่อยู่ในท่าสควอต');
      result.formFeedback.suggestions.push('ก้มเข่าลงให้ถึงมุมที่กำหนดก่อนบิดตัว');
      result.formFeedback.quality = 'warn';
    }

    return result;
  }
}

// High Knee Analyzer: reuse KneeRaiseAnalyzer but use high_knee_raise thresholds
export class HighKneeAnalyzer extends KneeRaiseAnalyzer {
  constructor() {
    super();
    (this as any).exerciseType = 'high_knee_raise';
  }
  
  analyze(landmarks: Landmark[]): ExerciseAnalysisResult {
    const prevReps = this.reps;
    const result = super.analyze(landmarks);

    // If a rep was counted, ensure knee height meets the high-knee threshold
    if (result.repCompleted) {
      const thresholds = EXERCISES[this.exerciseType].thresholds as Record<string, number>;
      const heightThresh = thresholds.knee_height_ratio ?? 0.05;

      const leftHip = landmarks[LM.LEFT_HIP];
      const rightHip = landmarks[LM.RIGHT_HIP];
      const leftKnee = landmarks[LM.LEFT_KNEE];
      const rightKnee = landmarks[LM.RIGHT_KNEE];

      // knee above hip means smaller y (normalized coordinates)
      const leftHigh = leftKnee.y < leftHip.y - heightThresh;
      const rightHigh = rightKnee.y < rightHip.y - heightThresh;

      if (!(leftHigh || rightHigh)) {
        // Revert rep if height condition not met
        this.reps = prevReps;
        result.repCompleted = false;
        result.formFeedback.issues.push('ยกเข่าไม่ถึงระดับเอว');
        result.formFeedback.suggestions.push('ยกเข่าให้สูงกว่าระดับสะโพก/เอว');
        result.formFeedback.quality = 'warn';
      }
    }

    return result;
  }
}

// ============================================
// === ADVANCED EXERCISE ANALYZERS ===
// ============================================

// Jump Squat with Arm Raise Analyzer
// Detects: squat -> jump (vertical movement) -> land cycle
export class JumpSquatWithArmRaiseAnalyzer extends ExerciseAnalyzer {
  private keyLandmarks = [
    LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_HIP, LM.RIGHT_HIP,
    LM.LEFT_KNEE, LM.RIGHT_KNEE, LM.LEFT_ANKLE, LM.RIGHT_ANKLE,
    LM.LEFT_ELBOW, LM.RIGHT_ELBOW, LM.LEFT_WRIST, LM.RIGHT_WRIST
  ];
  private previousHipY: number = 0;
  private jumpPhase: 'squat' | 'jump' | 'land' = 'squat';
  private jumpStartY: number = 0;
  private hasSquatted: boolean = false;
  private squatConfirmedFrames: number = 0;
  private jumpConfirmedFrames: number = 0;

  constructor() {
    super('jump_squat_arm_raise');
    this.repCooldown = 800; // 800ms between jump squats
    this.minFramesInStage = 3;
  }

  analyze(landmarks: Landmark[]): ExerciseAnalysisResult {
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

    const leftHip = landmarks[LM.LEFT_HIP];
    const rightHip = landmarks[LM.RIGHT_HIP];
    const leftKnee = landmarks[LM.LEFT_KNEE];
    const rightKnee = landmarks[LM.RIGHT_KNEE];
    const leftShoulder = landmarks[LM.LEFT_SHOULDER];
    const rightShoulder = landmarks[LM.RIGHT_SHOULDER];
    const leftElbow = landmarks[LM.LEFT_ELBOW];
    const rightElbow = landmarks[LM.RIGHT_ELBOW];

    // Calculate knee angle
    const leftKneeAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
    const rightKneeAngle = calculateAngle(rightShoulder, rightHip, rightKnee);
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

    // Calculate arm angle
    const leftArmAngle = calculateAngle(leftHip, leftShoulder, leftElbow);
    const rightArmAngle = calculateAngle(rightHip, rightShoulder, rightElbow);
    const avgArmAngle = (leftArmAngle + rightArmAngle) / 2;

    // Hip vertical position for jump detection
    const currentHipY = (leftHip.y + rightHip.y) / 2;
    const verticalMovement = this.previousHipY - currentHipY; // positive = moving up

    const thresholds = EXERCISES[this.exerciseType].thresholds as Record<string, number>;

    this.previousStage = this.currentStage;
    let repCompleted = false;

    // State machine for jump squat with validation
    if (avgKneeAngle >= thresholds.knee_min_angle && avgKneeAngle <= thresholds.knee_max_angle) {
      // In squat position
      this.squatConfirmedFrames++;
      if (this.squatConfirmedFrames >= this.minFramesInStage) {
        this.currentStage = 'down';
        this.jumpPhase = 'squat';
        this.hasSquatted = true;
        this.jumpStartY = currentHipY;
      }
      this.jumpConfirmedFrames = 0;
    } else if (this.hasSquatted && verticalMovement > thresholds.jump_height_ratio) {
      // Jumping up
      this.jumpConfirmedFrames++;
      if (this.jumpConfirmedFrames >= 2) {
        this.currentStage = 'up';
        this.jumpPhase = 'jump';
      }
      this.squatConfirmedFrames = 0;
    } else if (this.jumpPhase === 'jump' && verticalMovement < -thresholds.land_threshold) {
      // Landing - check cooldown before counting
      if (this.canCountRep()) {
        this.jumpPhase = 'land';
        // Check if arms were raised during jump
        if (avgArmAngle >= thresholds.arm_up_angle) {
          this.reps++;
          repCompleted = true;
          this.markRepCounted();
        }
        this.hasSquatted = false;
        this.squatConfirmedFrames = 0;
        this.jumpConfirmedFrames = 0;
      }
    }

    this.previousHipY = currentHipY;
    const formFeedback = this.evaluateForm(landmarks);

    return {
      stage: this.currentStage,
      reps: this.reps,
      repCompleted,
      formFeedback,
      angles: {
        kneeAngle: avgKneeAngle,
        armAngle: avgArmAngle,
        verticalMovement: verticalMovement * 100,
      },
      isVisible: true,
    };
  }

  evaluateForm(landmarks: Landmark[]): FormFeedback {
    // Get current angles for form evaluation
    const leftShoulder = landmarks[LM.LEFT_SHOULDER];
    const leftHip = landmarks[LM.LEFT_HIP];
    const leftKnee = landmarks[LM.LEFT_KNEE];
    const rightShoulder = landmarks[LM.RIGHT_SHOULDER];
    const rightHip = landmarks[LM.RIGHT_HIP];
    const rightKnee = landmarks[LM.RIGHT_KNEE];
    const leftElbow = landmarks[LM.LEFT_ELBOW];
    const rightElbow = landmarks[LM.RIGHT_ELBOW];

    const leftKneeAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
    const rightKneeAngle = calculateAngle(rightShoulder, rightHip, rightKnee);
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

    const leftArmAngle = calculateAngle(leftHip, leftShoulder, leftElbow);
    const rightArmAngle = calculateAngle(rightHip, rightShoulder, rightElbow);
    const avgArmAngle = (leftArmAngle + rightArmAngle) / 2;

    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const thresholds = EXERCISES[this.exerciseType].thresholds as Record<string, number>;

    // Check squat depth
    if (this.jumpPhase === 'squat' && avgKneeAngle > thresholds.knee_max_angle - 10) {
      issues.push('สควอตไม่ลึกพอ');
      suggestions.push('ก้มลงให้มากกว่านี้ก่อนกระโดดครับ');
      score -= 20;
    }

    // Check arm raise during jump
    if (this.jumpPhase === 'jump' && avgArmAngle < thresholds.arm_up_angle) {
      issues.push('ยกแขนไม่สูงพอ');
      suggestions.push('ยกแขนให้สูงขณะกระโดดครับ');
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
    this.previousHipY = 0;
    this.jumpPhase = 'squat';
    this.hasSquatted = false;
    this.squatConfirmedFrames = 0;
    this.jumpConfirmedFrames = 0;
  }
}

// Standing Twist Analyzer - Fast continuous twists with speed measurement
export class StandingTwistAnalyzer extends ExerciseAnalyzer {
  private keyLandmarks = [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_HIP, LM.RIGHT_HIP];
  private lastTwistDirection: 'left' | 'right' | null = null;
  private lastTwistOffset: number = 0;
  private twistTimestamps: number[] = [];
  private lastTimestamp: number = Date.now();
  private twistConfirmedFrames: number = 0;
  private centerConfirmedFrames: number = 0;
  private confirmedTwist: boolean = false;

  constructor() {
    super('standing_twist');
    this.repCooldown = 300; // 300ms between twists (faster exercise)
    this.minFramesInStage = 2;
  }

  analyze(landmarks: Landmark[]): ExerciseAnalysisResult {
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

    const leftShoulder = landmarks[LM.LEFT_SHOULDER];
    const rightShoulder = landmarks[LM.RIGHT_SHOULDER];
    const leftHip = landmarks[LM.LEFT_HIP];
    const rightHip = landmarks[LM.RIGHT_HIP];

    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const hipMidX = (leftHip.x + rightHip.x) / 2;
    const twistOffset = shoulderMidX - hipMidX;

    // Calculate twist speed
    const currentTime = Date.now();
    const deltaTime = (currentTime - this.lastTimestamp) / 1000; // seconds
    const twistSpeed = Math.abs(twistOffset - this.lastTwistOffset) / (deltaTime + 0.001);

    const thresholds = EXERCISES[this.exerciseType].thresholds as Record<string, number>;
    const hysteresis = thresholds.twist_threshold * 0.25;

    this.previousStage = this.currentStage;
    
    // Determine raw stage with hysteresis
    let rawStage: ExerciseStage = 'center';
    if (twistOffset > thresholds.twist_threshold) {
      rawStage = 'left';
    } else if (twistOffset < -thresholds.twist_threshold) {
      rawStage = 'right';
    } else if (this.currentStage === 'left' && twistOffset > thresholds.twist_threshold - hysteresis) {
      rawStage = 'left';
    } else if (this.currentStage === 'right' && twistOffset < -thresholds.twist_threshold + hysteresis) {
      rawStage = 'right';
    }

    // Confirm stage with frame validation
    if (rawStage === this.currentStage) {
      if (rawStage === 'left' || rawStage === 'right') {
        this.twistConfirmedFrames++;
        this.centerConfirmedFrames = 0;
      } else {
        this.centerConfirmedFrames++;
        this.twistConfirmedFrames = 0;
      }
    } else {
      this.currentStage = rawStage;
      this.twistConfirmedFrames = 1;
      this.centerConfirmedFrames = 1;
    }

    // Mark twist as confirmed
    if ((this.currentStage === 'left' || this.currentStage === 'right') && this.twistConfirmedFrames >= this.minFramesInStage) {
      this.lastTwistDirection = this.currentStage as 'left' | 'right';
      this.confirmedTwist = true;
    }

    let repCompleted = false;
    // Count rep when returning to confirmed center after confirmed twist
    if (this.currentStage === 'center' && this.centerConfirmedFrames >= this.minFramesInStage && this.confirmedTwist) {
      if (this.canCountRep() && this.lastTwistDirection !== null) {
        this.reps++;
        repCompleted = true;
        this.markRepCounted();
        this.twistTimestamps.push(currentTime);
        if (this.twistTimestamps.length > 10) {
          this.twistTimestamps.shift();
        }
        this.lastTwistDirection = null;
        this.confirmedTwist = false;
      }
    }

    this.lastTwistOffset = twistOffset;
    this.lastTimestamp = currentTime;

    const formFeedback = this.evaluateForm(landmarks);

    return {
      stage: this.currentStage,
      reps: this.reps,
      repCompleted,
      formFeedback,
      angles: {
        twistOffset: twistOffset * 100,
        twistSpeed: twistSpeed * 100,
      },
      isVisible: true,
    };
  }

  evaluateForm(landmarks: Landmark[]): FormFeedback {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const thresholds = EXERCISES[this.exerciseType].thresholds as Record<string, number>;

    // Check hip stability
    const leftHip = landmarks[LM.LEFT_HIP];
    const rightHip = landmarks[LM.RIGHT_HIP];
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
    this.lastTwistOffset = 0;
    this.twistTimestamps = [];
    this.twistConfirmedFrames = 0;
    this.centerConfirmedFrames = 0;
    this.confirmedTwist = false;
  }
}

// Running in Place Analyzer - Counts steps using leg movement
export class RunningInPlaceAnalyzer extends ExerciseAnalyzer {
  private keyLandmarks = [LM.LEFT_HIP, LM.RIGHT_HIP, LM.LEFT_KNEE, LM.RIGHT_KNEE, LM.LEFT_ANKLE, LM.RIGHT_ANKLE];
  private leftLegUp: boolean = false;
  private rightLegUp: boolean = false;
  private lastStepTime: number = 0;
  private previousLeftKneeY: number = 0;
  private previousRightKneeY: number = 0;
  private leftUpFrames: number = 0;
  private rightUpFrames: number = 0;

  constructor() {
    super('running_in_place');
    this.repCooldown = 150; // 150ms between steps (fast running)
    this.minFramesInStage = 2;
  }

  analyze(landmarks: Landmark[]): ExerciseAnalysisResult {
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

    const leftHip = landmarks[LM.LEFT_HIP];
    const rightHip = landmarks[LM.RIGHT_HIP];
    const leftKnee = landmarks[LM.LEFT_KNEE];
    const rightKnee = landmarks[LM.RIGHT_KNEE];

    const thresholds = EXERCISES[this.exerciseType].thresholds as Record<string, number>;
    const currentTime = Date.now();

    // Detect knee raises with frame confirmation
    const leftKneeRaised = leftKnee.y < leftHip.y - thresholds.knee_height_ratio;
    const rightKneeRaised = rightKnee.y < rightHip.y - thresholds.knee_height_ratio;

    // Track frame confirmation
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

    // Confirmed up states
    const leftConfirmedUp = this.leftUpFrames >= this.minFramesInStage;
    const rightConfirmedUp = this.rightUpFrames >= this.minFramesInStage;

    // Track vertical movement
    const leftKneeMovement = this.previousLeftKneeY - leftKnee.y;
    const rightKneeMovement = this.previousRightKneeY - rightKnee.y;

    this.previousStage = this.currentStage;
    let repCompleted = false;

    // Detect step (confirmed knee up -> now down) with cooldown
    if (this.leftLegUp && !leftKneeRaised && leftKneeMovement < -thresholds.min_step_height) {
      if (this.canCountRep()) {
        this.reps++;
        repCompleted = true;
        this.markRepCounted();
        this.lastStepTime = currentTime;
        this.currentStage = 'left_up';
      }
    } else if (this.rightLegUp && !rightKneeRaised && rightKneeMovement < -thresholds.min_step_height) {
      if (this.canCountRep()) {
        this.reps++;
        repCompleted = true;
        this.markRepCounted();
        this.lastStepTime = currentTime;
        this.currentStage = 'right_up';
      }
    } else if (!leftKneeRaised && !rightKneeRaised) {
      this.currentStage = 'down';
    }

    // Only mark leg as "up" if confirmed
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
        leftKneeY: leftKnee.y * 100,
        rightKneeY: rightKnee.y * 100,
        stepsPerMinute: this.calculateSPM(),
      },
      isVisible: true,
    };
  }

  private calculateSPM(): number {
    // Simple SPM calculation based on recent reps
    return this.reps > 0 ? Math.round(this.reps / ((Date.now() - this.lastStepTime) / 60000 + 0.001)) : 0;
  }

  evaluateForm(landmarks: Landmark[]): FormFeedback {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const leftShoulder = landmarks[LM.LEFT_SHOULDER];
    const rightShoulder = landmarks[LM.RIGHT_SHOULDER];
    const leftHip = landmarks[LM.LEFT_HIP];
    const rightHip = landmarks[LM.RIGHT_HIP];

    // Check torso stability
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const hipMidX = (leftHip.x + rightHip.x) / 2;
    const leanOffset = Math.abs(shoulderMidX - hipMidX);

    if (leanOffset > 0.1) {
      issues.push('เอนตัวมากไป');
      suggestions.push('ยืนตรงๆ ขณะวิ่งครับ');
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
  }
}

// ============================================
// === EXPERT EXERCISE ANALYZERS ===
// ============================================

// Modified Burpee Analyzer - 3 phase: standing -> down -> jump
export class ModifiedBurpeeAnalyzer extends ExerciseAnalyzer {
  private keyLandmarks = [
    LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_HIP, LM.RIGHT_HIP,
    LM.LEFT_KNEE, LM.RIGHT_KNEE, LM.LEFT_ANKLE, LM.RIGHT_ANKLE
  ];
  private burpeePhase: 'standing' | 'down' | 'jump' = 'standing';
  private previousHipY: number = 0;
  private phaseStartTime: number = Date.now();
  private completedDown: boolean = false;
  private downConfirmedFrames: number = 0;
  private standingConfirmedFrames: number = 0;

  constructor() {
    super('modified_burpee');
    this.repCooldown = 1000; // 1 second between burpees (complex movement)
    this.minFramesInStage = 3;
  }

  analyze(landmarks: Landmark[]): ExerciseAnalysisResult {
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

    const leftShoulder = landmarks[LM.LEFT_SHOULDER];
    const rightShoulder = landmarks[LM.RIGHT_SHOULDER];
    const leftHip = landmarks[LM.LEFT_HIP];
    const rightHip = landmarks[LM.RIGHT_HIP];

    const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const hipY = (leftHip.y + rightHip.y) / 2;
    const verticalMovement = this.previousHipY - hipY;

    const thresholds = EXERCISES[this.exerciseType].thresholds as Record<string, number>;

    this.previousStage = this.currentStage;
    let repCompleted = false;
    const currentTime = Date.now();

    // Burpee phase detection with frame confirmation
    const isDown = hipY > thresholds.down_ratio;
    const isStanding = hipY < thresholds.standing_ratio;
    const isJumping = verticalMovement > thresholds.jump_height_ratio;

    // Track frame confirmation
    if (isDown) {
      this.downConfirmedFrames++;
      this.standingConfirmedFrames = 0;
    } else if (isStanding) {
      this.standingConfirmedFrames++;
      this.downConfirmedFrames = 0;
    } else {
      // Reset both if in transition
      this.downConfirmedFrames = Math.max(0, this.downConfirmedFrames - 1);
      this.standingConfirmedFrames = Math.max(0, this.standingConfirmedFrames - 1);
    }

    const downConfirmed = this.downConfirmedFrames >= this.minFramesInStage;
    const standingConfirmed = this.standingConfirmedFrames >= this.minFramesInStage;

    if (this.burpeePhase === 'standing') {
      this.currentStage = 'up';
      if (downConfirmed) {
        this.burpeePhase = 'down';
        this.phaseStartTime = currentTime;
        this.currentStage = 'down';
        this.completedDown = true;
      }
    } else if (this.burpeePhase === 'down') {
      this.currentStage = 'down';
      if (standingConfirmed && this.completedDown) {
        this.burpeePhase = 'standing';
        // Check for jump with cooldown
        if (isJumping && this.canCountRep()) {
          this.burpeePhase = 'jump';
          this.reps++;
          repCompleted = true;
          this.markRepCounted();
          this.completedDown = false;
          this.downConfirmedFrames = 0;
          this.standingConfirmedFrames = 0;
        }
      }
    } else if (this.burpeePhase === 'jump') {
      this.currentStage = 'up';
      if (!isJumping) {
        this.burpeePhase = 'standing';
      }
    }

    this.previousHipY = hipY;
    const formFeedback = this.evaluateForm(landmarks);

    return {
      stage: this.currentStage,
      reps: this.reps,
      repCompleted,
      formFeedback,
      angles: {
        hipY: hipY * 100,
        verticalMovement: verticalMovement * 100,
        phase: this.burpeePhase,
      },
      isVisible: true,
    };
  }

  evaluateForm(landmarks: Landmark[]): FormFeedback {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Check if going all the way down
    if (this.burpeePhase === 'down') {
      const leftHip = landmarks[LM.LEFT_HIP];
      const rightHip = landmarks[LM.RIGHT_HIP];
      const hipY = (leftHip.y + rightHip.y) / 2;
      const thresholds = EXERCISES[this.exerciseType].thresholds as Record<string, number>;

      if (hipY < thresholds.down_ratio - 0.1) {
        issues.push('ลงไม่ถึง');
        suggestions.push('ลงให้ถึงพื้นมากกว่านี้ครับ');
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
    this.completedDown = false;
    this.downConfirmedFrames = 0;
    this.standingConfirmedFrames = 0;
  }
}

// Jump Twist Analyzer - Jump with mid-air twist
export class JumpTwistAnalyzer extends ExerciseAnalyzer {
  private keyLandmarks = [
    LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_HIP, LM.RIGHT_HIP,
    LM.LEFT_ANKLE, LM.RIGHT_ANKLE
  ];
  private previousHipY: number = 0;
  private isAirborne: boolean = false;
  private airborneStartTime: number = 0;
  private hasTwistedInAir: boolean = false;
  private groundY: number = 0;
  private airborneConfirmedFrames: number = 0;
  private landedConfirmedFrames: number = 0;

  constructor() {
    super('jump_twist');
    this.repCooldown = 600; // 600ms between jumps
    this.minFramesInStage = 2;
  }

  analyze(landmarks: Landmark[]): ExerciseAnalysisResult {
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

    const leftShoulder = landmarks[LM.LEFT_SHOULDER];
    const rightShoulder = landmarks[LM.RIGHT_SHOULDER];
    const leftHip = landmarks[LM.LEFT_HIP];
    const rightHip = landmarks[LM.RIGHT_HIP];
    const leftAnkle = landmarks[LM.LEFT_ANKLE];
    const rightAnkle = landmarks[LM.RIGHT_ANKLE];

    const hipY = (leftHip.y + rightHip.y) / 2;
    const ankleY = (leftAnkle.y + rightAnkle.y) / 2;
    const verticalMovement = this.previousHipY - hipY;

    // Twist detection
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const hipMidX = (leftHip.x + rightHip.x) / 2;
    const twistOffset = Math.abs(shoulderMidX - hipMidX);

    const thresholds = EXERCISES[this.exerciseType].thresholds as Record<string, number>;
    const currentTime = Date.now();

    this.previousStage = this.currentStage;
    let repCompleted = false;

    // Ground reference
    if (!this.isAirborne && ankleY > 0.9) {
      this.groundY = hipY;
    }

    // Track airborne detection with frame confirmation
    const jumpDetected = verticalMovement > thresholds.jump_height_ratio;
    const landingDetected = verticalMovement < -thresholds.jump_height_ratio / 2;
    
    if (jumpDetected) {
      this.airborneConfirmedFrames++;
      this.landedConfirmedFrames = 0;
    } else if (landingDetected) {
      this.landedConfirmedFrames++;
      this.airborneConfirmedFrames = 0;
    } else {
      this.airborneConfirmedFrames = Math.max(0, this.airborneConfirmedFrames - 1);
      this.landedConfirmedFrames = Math.max(0, this.landedConfirmedFrames - 1);
    }

    // Detect jump with frame confirmation
    if (!this.isAirborne && this.airborneConfirmedFrames >= this.minFramesInStage) {
      this.isAirborne = true;
      this.airborneStartTime = currentTime;
      this.hasTwistedInAir = false;
    }

    // While airborne, check for twist
    if (this.isAirborne) {
      this.currentStage = 'up';
      if (twistOffset > thresholds.twist_threshold) {
        this.hasTwistedInAir = true;
      }

      // Detect landing with frame confirmation
      if (this.landedConfirmedFrames >= this.minFramesInStage) {
        const airTime = currentTime - this.airborneStartTime;
        
        if (this.hasTwistedInAir && airTime >= thresholds.air_time_min && this.canCountRep()) {
          this.reps++;
          repCompleted = true;
          this.markRepCounted();
        }
        
        this.isAirborne = false;
        this.currentStage = 'down';
        this.airborneConfirmedFrames = 0;
        this.landedConfirmedFrames = 0;
      }
    } else {
      this.currentStage = 'down';
    }

    this.previousHipY = hipY;
    const formFeedback = this.evaluateForm(landmarks);

    return {
      stage: this.currentStage,
      reps: this.reps,
      repCompleted,
      formFeedback,
      angles: {
        twistOffset: twistOffset * 100,
        verticalMovement: verticalMovement * 100,
        isAirborne: this.isAirborne ? 1 : 0,
      },
      isVisible: true,
    };
  }

  evaluateForm(landmarks: Landmark[]): FormFeedback {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Calculate twist offset for form evaluation
    const leftShoulder = landmarks[LM.LEFT_SHOULDER];
    const rightShoulder = landmarks[LM.RIGHT_SHOULDER];
    const leftHip = landmarks[LM.LEFT_HIP];
    const rightHip = landmarks[LM.RIGHT_HIP];
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const hipMidX = (leftHip.x + rightHip.x) / 2;
    const twistOffset = Math.abs(shoulderMidX - hipMidX);

    const thresholds = EXERCISES[this.exerciseType].thresholds as Record<string, number>;

    if (this.isAirborne && twistOffset < thresholds.twist_threshold * 0.7) {
      issues.push('บิดลำตัวไม่พอ');
      suggestions.push('บิดลำตัวให้มากกว่านี้ขณะอยู่ในอากาศครับ');
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
    this.isAirborne = false;
    this.hasTwistedInAir = false;
    this.groundY = 0;
    this.airborneConfirmedFrames = 0;
    this.landedConfirmedFrames = 0;
  }
}

// Sprint Knee Raises Analyzer - Fast knee raises with speed tracking
export class SprintKneeRaisesAnalyzer extends ExerciseAnalyzer {
  private keyLandmarks = [LM.LEFT_HIP, LM.RIGHT_HIP, LM.LEFT_KNEE, LM.RIGHT_KNEE, LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER];
  private leftLegUp: boolean = false;
  private rightLegUp: boolean = false;
  private lastStepTime: number = 0;
  private stepTimestamps: number[] = [];
  private previousLeftKneeY: number = 0;
  private previousRightKneeY: number = 0;
  private leftUpFrames: number = 0;
  private rightUpFrames: number = 0;

  constructor() {
    super('sprint_knee_raises');
    this.repCooldown = 80; // Very fast exercise, minimal cooldown
    this.minFramesInStage = 2;
  }

  analyze(landmarks: Landmark[]): ExerciseAnalysisResult {
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

    const leftHip = landmarks[LM.LEFT_HIP];
    const rightHip = landmarks[LM.RIGHT_HIP];
    const leftKnee = landmarks[LM.LEFT_KNEE];
    const rightKnee = landmarks[LM.RIGHT_KNEE];

    const thresholds = EXERCISES[this.exerciseType].thresholds as Record<string, number>;
    const currentTime = Date.now();

    // Stricter knee raise detection for sprint
    const leftKneeRaised = leftKnee.y < leftHip.y - thresholds.knee_height_ratio;
    const rightKneeRaised = rightKnee.y < rightHip.y - thresholds.knee_height_ratio;

    // Speed tracking
    const leftKneeSpeed = Math.abs(leftKnee.y - this.previousLeftKneeY);
    const rightKneeSpeed = Math.abs(rightKnee.y - this.previousRightKneeY);
    const avgSpeed = (leftKneeSpeed + rightKneeSpeed) / 2;

    // Frame confirmation for knee raises
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

    const leftConfirmed = this.leftUpFrames >= this.minFramesInStage;
    const rightConfirmed = this.rightUpFrames >= this.minFramesInStage;

    this.previousStage = this.currentStage;
    let repCompleted = false;

    const cooldownPassed = currentTime - this.lastStepTime > thresholds.step_cooldown;

    // Detect fast step with frame confirmation and cooldown
    if (this.leftLegUp && !leftKneeRaised && cooldownPassed && avgSpeed >= thresholds.min_speed && this.canCountRep()) {
      this.reps++;
      repCompleted = true;
      this.lastStepTime = currentTime;
      this.stepTimestamps.push(currentTime);
      this.currentStage = 'left_up';
      this.markRepCounted();
      this.leftUpFrames = 0;
    } else if (this.rightLegUp && !rightKneeRaised && cooldownPassed && avgSpeed >= thresholds.min_speed && this.canCountRep()) {
      this.reps++;
      repCompleted = true;
      this.lastStepTime = currentTime;
      this.stepTimestamps.push(currentTime);
      this.currentStage = 'right_up';
      this.markRepCounted();
      this.rightUpFrames = 0;
    } else {
      this.currentStage = 'transition';
    }

    // Keep only last 20 timestamps
    if (this.stepTimestamps.length > 20) {
      this.stepTimestamps.shift();
    }

    // Use confirmed state for next cycle
    this.leftLegUp = leftConfirmed;
    this.rightLegUp = rightConfirmed;
    this.previousLeftKneeY = leftKnee.y;
    this.previousRightKneeY = rightKnee.y;

    const spm = this.calculateSPM();
    const formFeedback = this.evaluateForm(landmarks);

    return {
      stage: this.currentStage,
      reps: this.reps,
      repCompleted,
      formFeedback,
      angles: {
        speed: avgSpeed * 1000,
        stepsPerMinute: spm,
        targetSPM: thresholds.target_spm,
      },
      isVisible: true,
    };
  }

  private calculateSPM(): number {
    if (this.stepTimestamps.length < 2) return 0;
    const duration = (this.stepTimestamps[this.stepTimestamps.length - 1] - this.stepTimestamps[0]) / 60000;
    return duration > 0 ? Math.round(this.stepTimestamps.length / duration) : 0;
  }

  evaluateForm(landmarks: Landmark[]): FormFeedback {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Check posture
    const leftShoulder = landmarks[LM.LEFT_SHOULDER];
    const rightShoulder = landmarks[LM.RIGHT_SHOULDER];
    const leftHip = landmarks[LM.LEFT_HIP];
    const rightHip = landmarks[LM.RIGHT_HIP];

    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const hipMidX = (leftHip.x + rightHip.x) / 2;
    const leanOffset = Math.abs(shoulderMidX - hipMidX);

    if (leanOffset > 0.12) {
      issues.push('เอนตัวมากไป');
      suggestions.push('ยืนตรงขณะสปรินต์ครับ');
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
    this.stepTimestamps = [];
    this.previousLeftKneeY = 0;
    this.previousRightKneeY = 0;
    this.leftUpFrames = 0;
    this.rightUpFrames = 0;
  }
}

// Factory function to create analyzer
export function createExerciseAnalyzer(exerciseType: ExerciseType): ExerciseAnalyzer {
  switch (exerciseType) {
    case 'arm_raise':
      return new ArmRaiseAnalyzer();
    case 'torso_twist':
      return new TorsoTwistAnalyzer();
    case 'knee_raise':
      return new KneeRaiseAnalyzer();
    case 'squat_arm_raise':
      return new SquatWithArmRaiseAnalyzer();
    case 'squat_twist':
      return new SquatWithTwistAnalyzer();
    case 'high_knee_raise':
      return new HighKneeAnalyzer();
    // Advanced exercises
    case 'jump_squat_arm_raise':
      return new JumpSquatWithArmRaiseAnalyzer();
    case 'standing_twist':
      return new StandingTwistAnalyzer();
    case 'running_in_place':
      return new RunningInPlaceAnalyzer();
    // Expert exercises
    case 'modified_burpee':
      return new ModifiedBurpeeAnalyzer();
    case 'jump_twist':
      return new JumpTwistAnalyzer();
    case 'sprint_knee_raises':
      return new SprintKneeRaisesAnalyzer();
    default:
      throw new Error(`Unknown exercise type: ${exerciseType}`);
  }
}

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

    // Calculate direction hints
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
