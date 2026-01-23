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
  angles: Record<string, number>;
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

  constructor() {
    super('arm_raise');
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
    const leftWrist = landmarks[LM.LEFT_WRIST];
    const rightWrist = landmarks[LM.RIGHT_WRIST];
    const leftHip = landmarks[LM.LEFT_HIP];
    const rightHip = landmarks[LM.RIGHT_HIP];

    // Calculate arm elevation angles (hip -> shoulder -> elbow)
    const leftArmAngle = calculateAngle(leftHip, leftShoulder, leftElbow);
    const rightArmAngle = calculateAngle(rightHip, rightShoulder, rightElbow);
    
    // Use average of both arms
    const avgArmAngle = (leftArmAngle + rightArmAngle) / 2;
    
    const thresholds = EXERCISES.arm_raise.thresholds;

    // KAYA-style rep counting logic
    let repCompleted = false;
    this.previousStage = this.currentStage;
    
    if (avgArmAngle >= thresholds.up_angle) {
      this.currentStage = 'up';
      this.waitingForDown = true; // Mark that we reached UP
    } else if (avgArmAngle <= thresholds.down_angle) {
      this.currentStage = 'down';
      // Only count rep when: was UP + waiting for down + now DOWN
      if (this.waitingForDown && this.previousStage === 'up') {
        this.reps++;
        repCompleted = true;
        this.waitingForDown = false;
      }
    }
    // else: in transition, keep current stage

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

  constructor() {
    super('torso_twist');
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

    const thresholds = EXERCISES.torso_twist.thresholds;

    // Stage detection
    this.previousStage = this.currentStage;
    
    if (twistOffset > thresholds.twist_threshold) {
      this.currentStage = 'left'; // Shoulders moved left relative to hips
    } else if (twistOffset < -thresholds.twist_threshold) {
      this.currentStage = 'right'; // Shoulders moved right relative to hips
    } else {
      this.currentStage = 'center';
    }

    // Rep counting: count when returning to center from left or right
    let repCompleted = false;
    if (this.previousStage !== 'center' && this.currentStage === 'center') {
      // Count a rep only if we've completed a full twist (left or right then back)
      if (this.lastTwistDirection !== null) {
        this.reps++;
        repCompleted = true;
        this.lastTwistDirection = null;
      }
    }

    // Track twist direction
    if (this.currentStage === 'left') {
      this.lastTwistDirection = 'left';
    } else if (this.currentStage === 'right') {
      this.lastTwistDirection = 'right';
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

  constructor() {
    super('knee_raise');
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
    const leftAnkle = landmarks[LM.LEFT_ANKLE];
    
    const rightShoulder = landmarks[LM.RIGHT_SHOULDER];
    const rightHip = landmarks[LM.RIGHT_HIP];
    const rightKnee = landmarks[LM.RIGHT_KNEE];
    const rightAnkle = landmarks[LM.RIGHT_ANKLE];

    // Calculate knee angles (shoulder -> hip -> knee)
    const leftKneeAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
    const rightKneeAngle = calculateAngle(rightShoulder, rightHip, rightKnee);

    const thresholds = EXERCISES.knee_raise.thresholds;

    // Track previous leg stages
    const prevLeftStage = this.leftLegStage;
    const prevRightStage = this.rightLegStage;

    // Detect left leg stage
    if (leftKneeAngle < thresholds.up_angle) {
      this.leftLegStage = 'up';
    } else if (leftKneeAngle > thresholds.down_angle) {
      this.leftLegStage = 'down';
    }

    // Detect right leg stage
    if (rightKneeAngle < thresholds.up_angle) {
      this.rightLegStage = 'up';
    } else if (rightKneeAngle > thresholds.down_angle) {
      this.rightLegStage = 'down';
    }

    // Determine overall stage
    this.previousStage = this.currentStage;
    if (this.leftLegStage === 'up' || this.rightLegStage === 'up') {
      this.currentStage = 'up';
    } else {
      this.currentStage = 'down';
    }

    // Rep counting: count when either knee completes an up-down cycle
    let repCompleted = false;
    if (prevLeftStage === 'up' && this.leftLegStage === 'down') {
      this.reps++;
      repCompleted = true;
    } else if (prevRightStage === 'up' && this.rightLegStage === 'down') {
      this.reps++;
      repCompleted = true;
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
