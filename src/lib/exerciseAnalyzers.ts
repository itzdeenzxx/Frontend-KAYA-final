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

// Arm Raise Analyzer - Front facing, shoulder angle > 120°
// HOLD UP for 3 seconds before counting down
export class ArmRaiseAnalyzer extends ExerciseAnalyzer {
  private keyLandmarks = [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_ELBOW, LM.RIGHT_ELBOW, LM.LEFT_WRIST, LM.RIGHT_WRIST, LM.LEFT_HIP, LM.RIGHT_HIP];
  private reachedUp = false;
  private upFrames = 0;
  private downFrames = 0;
  private holdStartTime: number = 0; // When arms reached up
  private holdCompleted: boolean = false; // Whether 3-second hold is done
  private holdDuration: number = 3000; // 3 seconds in ms

  constructor() {
    super('arm_raise');
    this.repCooldown = 250; // Faster cooldown
    this.minHoldTime = 100; // 0.1 วินาที - ถึงปุ๊บนับเลย
    this.minFramesInStage = 1; // Just 1 frame needed
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
        formFeedback: { quality: 'warn', score: 0, issues: ['ไม่เห็นตัวครบ'], suggestions: ['📷 หันหน้าเข้ากล้อง ถอยให้เห็นตั้งแต่ศีรษะถึงเอวครับ'] },
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
    const now = Date.now();

    // Calculate hold countdown
    let holdRemaining = 3;
    if (this.reachedUp && this.holdStartTime > 0) {
      const elapsed = now - this.holdStartTime;
      holdRemaining = Math.max(0, Math.ceil((this.holdDuration - elapsed) / 1000));
    }

    // Always log for debugging
    const upPass = avgArmAngle >= thresholds.up_angle ? '✓' : '✗';
    const downPass = avgArmAngle <= thresholds.down_angle ? '✓' : '✗';
    const holdText = this.reachedUp ? `| ค้าง=${holdRemaining}วิ ${this.holdCompleted ? '✓พร้อม' : '(รอ...)'}` : '';
    console.log(`📊 ARM_RAISE: แขน=${avgArmAngle.toFixed(0)}° | ขึ้น(ต้อง≥${thresholds.up_angle})${upPass} | ลง(ต้อง≤${thresholds.down_angle})${downPass} ${holdText}`);

    let repCompleted = false;
    let holdingCorrectForm = false;
    
    // Simple state machine: detect UP → hold 3 seconds → DOWN to count
    const prevStage = this.currentStage;
    
    if (avgArmAngle >= thresholds.up_angle) {
      this.upFrames++;
      this.downFrames = 0;
      if (this.upFrames >= this.minFramesInStage) {
        this.currentStage = 'up';
        
        // Start hold timer if just reached up
        if (!this.reachedUp) {
          this.reachedUp = true;
          this.holdStartTime = now;
          this.holdCompleted = false;
          console.log(`⬆️ ARM_RAISE ยกขึ้นแล้ว! ค้างไว้ 3 วินาที...`);
        }
        
        // Check if hold duration completed
        if (this.reachedUp && !this.holdCompleted) {
          const elapsed = now - this.holdStartTime;
          if (elapsed >= this.holdDuration) {
            this.holdCompleted = true;
            console.log(`✅ ARM_RAISE ค้างครบ 3 วินาที! เอาลงมาเพื่อนับ rep`);
          } else {
            holdingCorrectForm = true;
            console.log(`⏳ ARM_RAISE ค้างไว้... เหลือ ${holdRemaining} วินาที`);
          }
        }
        
        if (this.holdCompleted) {
          holdingCorrectForm = true;
        }
      }
    } else if (avgArmAngle <= thresholds.down_angle) {
      this.downFrames++;
      this.upFrames = 0;
      if (this.downFrames >= this.minFramesInStage) {
        this.currentStage = 'down';
        
        // Count rep when going from UP (after 3sec hold) to DOWN
        if (this.reachedUp && this.holdCompleted && this.canCountRep()) {
          console.log(`🏋️ ARM_RAISE Rep counted! Angle: ${avgArmAngle.toFixed(0)}°`);
          this.reps++;
          repCompleted = true;
          this.markRepCounted();
        } else if (this.reachedUp && !this.holdCompleted) {
          console.log(`⚠️ ARM_RAISE: ลงเร็วเกินไป! ต้องค้างไว้ 3 วินาทีก่อน`);
        }
        this.reachedUp = false;
        this.holdStartTime = 0;
        this.holdCompleted = false;
      }
    } else {
      // In transition zone - keep current state but don't reset hold timer
      this.upFrames = 0;
      this.downFrames = 0;
    }

    const formFeedback = this.evaluateForm(landmarks, holdingCorrectForm, holdRemaining);

    return {
      stage: this.currentStage,
      reps: this.reps,
      repCompleted,
      formFeedback,
      angles: {
        leftArm: Math.round(leftArmAngle),
        rightArm: Math.round(rightArmAngle),
        average: Math.round(avgArmAngle),
        holdRemaining: holdRemaining,
      },
      isVisible: true,
    };
  }

  evaluateForm(landmarks: Landmark[], holdingCorrectForm: boolean = false, holdRemaining: number = 3): FormFeedback {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // If holding correct form, give positive feedback with countdown
    if (holdingCorrectForm) {
      if (this.holdCompleted) {
        return {
          quality: 'good',
          score: 95,
          issues: [],
          suggestions: ['✅ ครบ 3 วินาที! เอาลงมาเลย']
        };
      } else {
        return {
          quality: 'good',
          score: 90,
          issues: [],
          suggestions: [`⏳ ค้างไว้... เหลือ ${holdRemaining} วินาที`]
        };
      }
    }

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

  reset(): void {
    super.reset();
    this.reachedUp = false;
    this.upFrames = 0;
    this.downFrames = 0;
    this.holdStartTime = 0;
    this.holdCompleted = false;
  }
}

// Torso Twist Analyzer - Front facing, 8-50° angle between shoulder and hip lines
// MUST ALTERNATE: left -> right -> left -> right (prevents counting same side twice)
export class TorsoTwistAnalyzer extends ExerciseAnalyzer {
  private keyLandmarks = [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_HIP, LM.RIGHT_HIP];
  private lastTwistDirection: 'left' | 'right' | null = null;
  private lastCountedDirection: 'left' | 'right' | null = null; // Track which side was last counted
  private completedTwist: boolean = false;
  private twistFrames: number = 0;
  private centerFrames: number = 0;

  constructor() {
    super('torso_twist');
    this.repCooldown = 800; // Prevent double counting (800ms between reps)
    this.minHoldTime = 200; // 0.2 seconds
    this.minFramesInStage = 3; // Need 3 frames to confirm twist/center
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
        formFeedback: { quality: 'warn', score: 0, issues: ['ไม่เห็นตัวครบ'], suggestions: ['📷 หันหน้าเข้ากล้อง ถอยให้เห็นตั้งแต่ศีรษะถึงสะโพกครับ'] },
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
    const centerThreshold = thresholds.center_threshold || 20;

    // Determine next required direction
    const nextRequired = this.lastCountedDirection === null ? 'ซ้ายหรือขวา' : 
                         this.lastCountedDirection === 'left' ? 'ขวา (สลับ)' : 'ซ้าย (สลับ)';

    // Always log for debugging
    const twistPass = twistAngle >= minAngle ? '✓' : '✗';
    console.log(`📊 TORSO_TWIST: บิด=${twistAngle.toFixed(0)}° (ต้อง≥${minAngle})${twistPass} | ทิศ=${twistOffset > 0.01 ? 'ซ้าย' : twistOffset < -0.01 ? 'ขวา' : 'กลาง'} | ครั้งต่อไป: ${nextRequired}`);

    let repCompleted = false;
    let holdingCorrectForm = false;
    const prevStage = this.currentStage;
    
    // Determine current twist direction
    let currentDirection: 'left' | 'right' | 'center' = 'center';
    if (twistAngle >= minAngle) {
      if (twistOffset > 0.01) {
        currentDirection = 'left';
      } else if (twistOffset < -0.01) {
        currentDirection = 'right';
      }
    }
    
    // Simple state machine with alternation check
    if (currentDirection === 'left' || currentDirection === 'right') {
      this.twistFrames++;
      this.centerFrames = 0;
      if (this.twistFrames >= this.minFramesInStage) {
        this.currentStage = currentDirection;
        this.completedTwist = true;
        this.lastTwistDirection = currentDirection;
        
        // Check if this is a valid direction (alternates or first rep)
        const canCount = this.lastCountedDirection === null || this.lastCountedDirection !== currentDirection;
        if (canCount) {
          holdingCorrectForm = true;
          console.log(`✅ TORSO_TWIST ท่าถูก! บิด${currentDirection === 'left' ? 'ซ้าย' : 'ขวา'}: ${twistAngle.toFixed(0)}° → กลับมากลางเพื่อนับ`);
        } else {
          console.log(`⚠️ TORSO_TWIST: ต้องสลับทิศ! บิดไป${currentDirection === 'left' ? 'ขวา' : 'ซ้าย'}ก่อนครับ`);
        }
      }
    } else if (twistAngle < centerThreshold) {
      this.centerFrames++;
      this.twistFrames = 0;
      if (this.centerFrames >= this.minFramesInStage) {
        this.currentStage = 'center';
        
        // Count rep when returning to center after a twist (with alternation check)
        if (this.completedTwist && this.lastTwistDirection !== null && this.canCountRep()) {
          // Check alternation: must be different from lastCountedDirection OR first rep
          const canCount = this.lastCountedDirection === null || this.lastCountedDirection !== this.lastTwistDirection;
          
          if (canCount) {
            console.log(`🔄 TORSO_TWIST Rep counted! Direction: ${this.lastTwistDirection}, Twist was: ${twistAngle.toFixed(1)}°`);
            this.reps++;
            repCompleted = true;
            this.markRepCounted();
            this.lastCountedDirection = this.lastTwistDirection;
          } else {
            console.log(`⚠️ TORSO_TWIST: ไม่นับ! ต้องสลับทิศ (ทำ${this.lastCountedDirection === 'left' ? 'ขวา' : 'ซ้าย'}ก่อน)`);
          }
          this.completedTwist = false;
          this.lastTwistDirection = null;
        }
      }
    }

    const formFeedback = this.evaluateForm(landmarks, holdingCorrectForm);

    return {
      stage: this.currentStage,
      reps: this.reps,
      repCompleted,
      formFeedback,
      angles: {
        twistAngle: Math.round(twistAngle),
        direction: twistOffset > 0 ? 'left' : 'right',
        nextRequired: nextRequired,
      },
      isVisible: true,
    };
  }

  evaluateForm(landmarks: Landmark[], holdingCorrectForm: boolean = false): FormFeedback {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // If holding correct form, give positive feedback
    if (holdingCorrectForm) {
      return {
        quality: 'good',
        score: 90,
        issues: [],
        suggestions: ['✅ ท่าถูกแล้ว! กลับมากลางเลย']
      };
    }

    const leftShoulder = landmarks[LM.LEFT_SHOULDER];
    const rightShoulder = landmarks[LM.RIGHT_SHOULDER];
    const leftHip = landmarks[LM.LEFT_HIP];
    const rightHip = landmarks[LM.RIGHT_HIP];

    const twistAngle = calculateLinesToAngle(leftShoulder, rightShoulder, leftHip, rightHip);
    const thresholds = EXERCISES[this.exerciseType].thresholds;

    // Check if twist is in good range
    if (this.currentStage !== 'center') {
      if (twistAngle < thresholds.min_twist_angle) {
        issues.push('บิดไม่ถึง');
        suggestions.push('บิดลำตัวให้มากกว่านี้ครับ');
        score -= 20;
      } else if (twistAngle > thresholds.max_twist_angle) {
        issues.push('บิดเกินไป');
        suggestions.push('ระวังบิดมากเกินไปครับ');
        score -= 15;
      }
    }

    // Show alternation hint
    if (this.lastCountedDirection !== null) {
      const nextSide = this.lastCountedDirection === 'left' ? 'ขวา' : 'ซ้าย';
      suggestions.push(`🔄 บิดไป${nextSide}ต่อครับ`);
    }

    // Check hip stability
    const hipWidth = Math.abs(leftHip.x - rightHip.x);
    if (hipWidth < 0.08) {
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
    this.lastCountedDirection = null;
    this.completedTwist = false;
    this.twistFrames = 0;
    this.centerFrames = 0;
  }
}

// Knee Raise Analyzer - Side camera, hip flexion > 80°
// MUST ALTERNATE: left -> right -> left -> right (prevents counting same leg twice)
export class KneeRaiseAnalyzer extends ExerciseAnalyzer {
  private keyLandmarks = [LM.LEFT_HIP, LM.RIGHT_HIP, LM.LEFT_KNEE, LM.RIGHT_KNEE, LM.LEFT_ANKLE, LM.RIGHT_ANKLE, LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER];
  private leftLegStage: 'up' | 'down' = 'down';
  private rightLegStage: 'up' | 'down' = 'down';
  private leftUpConfirmed: boolean = false;
  private rightUpConfirmed: boolean = false;
  private leftUpFrames: number = 0;
  private rightUpFrames: number = 0;
  private leftMaxFrames: number = 0; // Track max frames reached for counting
  private rightMaxFrames: number = 0;
  private lastCountedLeg: 'left' | 'right' | null = null; // Track which leg was last counted to prevent duplicate

  constructor() {
    super('knee_raise');
    this.repCooldown = 250; // Faster cooldown
    this.minFramesInStage = 1; // Just 1 frame needed
    this.minHoldTime = 100; // 0.1 วินาที - ยกถึงปุ๊บนับเลย
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
        formFeedback: { quality: 'warn', score: 0, issues: ['ไม่เห็นตัวครบ'], suggestions: ['📷 หันข้างเข้ากล้อง ถอยให้เห็นตั้งแต่ศีรษะถึงเท้าครับ'] },
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

    // Always log for debugging
    const leftPass = leftHipFlexion < thresholds.up_angle ? '✓' : '✗';
    const rightPass = rightHipFlexion < thresholds.up_angle ? '✓' : '✗';
    console.log(`📊 KNEE_RAISE: ซ้าย=${leftHipFlexion.toFixed(0)}°(ต้อง<${thresholds.up_angle})${leftPass} | ขวา=${rightHipFlexion.toFixed(0)}°(ต้อง<${thresholds.up_angle})${rightPass}`);

    const prevLeftStage = this.leftLegStage;
    const prevRightStage = this.rightLegStage;

    // Detect left leg stage (hip flexion < up_angle means leg is raised up)
    if (leftHipFlexion < thresholds.up_angle) {
      this.leftUpFrames++;
      this.leftMaxFrames = Math.max(this.leftMaxFrames, this.leftUpFrames);
      if (this.leftUpFrames >= this.minFramesInStage) {
        this.leftLegStage = 'up';
        this.leftUpConfirmed = true;
      }
    } else if (leftHipFlexion > thresholds.down_angle) {
      this.leftLegStage = 'down';
      // Don't reset frames until after checking for rep count
    }

    // Detect right leg stage
    if (rightHipFlexion < thresholds.up_angle) {
      this.rightUpFrames++;
      this.rightMaxFrames = Math.max(this.rightMaxFrames, this.rightUpFrames);
      if (this.rightUpFrames >= this.minFramesInStage) {
        this.rightLegStage = 'up';
        this.rightUpConfirmed = true;
      }
    } else if (rightHipFlexion > thresholds.down_angle) {
      this.rightLegStage = 'down';
      // Don't reset frames until after checking for rep count
    }

    // Determine overall stage
    this.previousStage = this.currentStage;
    if (this.leftLegStage === 'up' || this.rightLegStage === 'up') {
      this.currentStage = 'up';
    } else {
      this.currentStage = 'down';
    }

    // Rep counting with better debouncing, logging, and ALTERNATION REQUIREMENT
    let repCompleted = false;
    let holdingCorrectForm = false;
    const minHoldFrames = thresholds.min_hold_frames || 1; // Just 1 frame needed
    
    // Determine next required leg
    const nextRequired = this.lastCountedLeg === null ? 'ซ้ายหรือขวา' : 
                         this.lastCountedLeg === 'left' ? 'ขวา (สลับ)' : 'ซ้าย (สลับ)';
    
    // Check if user is holding knee up but not yet confirmed
    if ((leftHipFlexion < thresholds.up_angle && !this.leftUpConfirmed) ||
        (rightHipFlexion < thresholds.up_angle && !this.rightUpConfirmed)) {
      const isLeft = leftHipFlexion < thresholds.up_angle;
      const leg = isLeft ? 'ซ้าย' : 'ขวา';
      const currentLeg = isLeft ? 'left' : 'right';
      const angle = isLeft ? leftHipFlexion : rightHipFlexion;
      const frames = isLeft ? this.leftUpFrames : this.rightUpFrames;
      
      // Check if this is the correct leg (alternates or first rep)
      const canCount = this.lastCountedLeg === null || this.lastCountedLeg !== currentLeg;
      
      if (canCount) {
        holdingCorrectForm = true;
        console.log(`✅ KNEE_RAISE ท่าถูก! ยกขา${leg}: ${angle.toFixed(0)}° | เฟรม: ${frames}/${this.minFramesInStage} ${frames >= this.minFramesInStage ? '✓พร้อม! ลงมาเพื่อนับ' : '(ค้างต่อ...)'}`);
      } else {
        console.log(`⚠️ KNEE_RAISE: ต้องสลับขา! ยกขา${this.lastCountedLeg === 'left' ? 'ขวา' : 'ซ้าย'}ก่อนครับ`);
      }
    }
    
    // Count rep when transitioning from up to down AND was confirmed (with alternation check)
    if (prevLeftStage === 'up' && this.leftLegStage === 'down' && this.leftUpConfirmed) {
      // Check alternation: must be different leg OR first rep
      const canCount = this.lastCountedLeg === null || this.lastCountedLeg !== 'left';
      
      if (this.canCountRep() && this.leftMaxFrames >= minHoldFrames && canCount) {
        console.log(`🦵 KNEE_RAISE Rep counted! Left leg, Hip flexion: ${leftHipFlexion.toFixed(1)}°, Held ${this.leftMaxFrames} frames`);
        this.reps++;
        repCompleted = true;
        this.markRepCounted();
        this.lastCountedLeg = 'left';
      } else if (!canCount) {
        console.log(`⚠️ KNEE_RAISE: ไม่นับ! ต้องสลับขา (ทำขาขวาก่อน)`);
      } else if (!this.canCountRep()) {
        console.log(`⏳ KNEE_RAISE รอ cooldown`);
      }
      this.leftUpConfirmed = false;
      this.leftUpFrames = 0;
      this.leftMaxFrames = 0;
    } else if (prevRightStage === 'up' && this.rightLegStage === 'down' && this.rightUpConfirmed) {
      // Check alternation: must be different leg OR first rep
      const canCount = this.lastCountedLeg === null || this.lastCountedLeg !== 'right';
      
      if (this.canCountRep() && this.rightMaxFrames >= minHoldFrames && canCount) {
        console.log(`🦵 KNEE_RAISE Rep counted! Right leg, Hip flexion: ${rightHipFlexion.toFixed(1)}°, Held ${this.rightMaxFrames} frames`);
        this.reps++;
        repCompleted = true;
        this.markRepCounted();
        this.lastCountedLeg = 'right';
      } else if (!canCount) {
        console.log(`⚠️ KNEE_RAISE: ไม่นับ! ต้องสลับขา (ทำขาซ้ายก่อน)`);
      } else if (!this.canCountRep()) {
        console.log(`⏳ KNEE_RAISE รอ cooldown`);
      }
      this.rightUpConfirmed = false;
      this.rightUpFrames = 0;
      this.rightMaxFrames = 0;
    }

    const formFeedback = this.evaluateForm(landmarks, holdingCorrectForm);

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

  evaluateForm(landmarks: Landmark[], holdingCorrectForm: boolean = false): FormFeedback {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // If holding correct form, give positive feedback
    if (holdingCorrectForm) {
      return {
        quality: 'good',
        score: 90,
        issues: [],
        suggestions: ['✅ ท่าถูกแล้ว! ค้างไว้...']
      };
    }

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
    this.leftMaxFrames = 0;
    this.rightMaxFrames = 0;
    this.lastCountedLeg = null;
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
    this.repCooldown = 400;
    this.minFramesInStage = 2;
    this.minHoldTime = 200; // 0.2 วินาที - ลงถึงปุ๊บนับเลย
  }

  analyze(landmarks: Landmark[]): ExerciseAnalysisResult {
    console.log('🔍 SQUAT_ARM_RAISE analyze() called');
    
    // Update adaptive visibility threshold
    this.updateAdaptiveVisibility(landmarks, this.keyLandmarks);
    
    const isVisible = this.checkVisibility(landmarks, this.keyLandmarks);
    console.log(`🔍 SQUAT_ARM_RAISE visibility: ${isVisible}`);
    
    if (!isVisible) {
      console.log('🔍 SQUAT_ARM_RAISE: ไม่เห็นตัวครบ - return early');
      return {
        stage: this.currentStage,
        reps: this.reps,
        repCompleted: false,
        formFeedback: { quality: 'warn', score: 0, issues: ['ไม่เห็นตัวครบ'], suggestions: ['📷 หันข้างเข้ากล้อง และถอยให้เห็นตั้งแต่ศีรษะถึงเท้าครับ'] },
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
    console.log(`🎯 SQUAT thresholds: knee<${thresholds.knee_down_angle}, arm>${thresholds.arm_up_angle}`);
    console.log(`🎯 SQUAT current: knee=${avgKneeAngle.toFixed(0)}°, arm=${avgArmAngle.toFixed(0)}°`);

    this.previousStage = this.currentStage;
    let repCompleted = false;
    let holdingCorrectForm = false; // Track if user is in correct position but not confirmed yet

    // Detect squat position with hysteresis
    const inSquat = this.currentStage === 'down' 
      ? avgKneeAngle < thresholds.knee_down_angle + this.hysteresis
      : avgKneeAngle < thresholds.knee_down_angle;
    const isStanding = this.currentStage === 'up'
      ? avgKneeAngle > thresholds.knee_up_angle - this.hysteresis
      : avgKneeAngle > thresholds.knee_up_angle;
    const armsUp = avgArmAngle > thresholds.arm_up_angle - 5;

    // Always log current angles for debugging
    const kneePass = inSquat ? '✓' : '✗';
    const armPass = armsUp ? '✓' : '✗';
    console.log(`📊 SQUAT: เข่า=${avgKneeAngle.toFixed(0)}°${kneePass} แขน=${avgArmAngle.toFixed(0)}°${armPass} | inSquat=${inSquat} armsUp=${armsUp}`);

    if (inSquat && armsUp) {
      this.downConfirmedFrames++;
      this.upConfirmedFrames = 0;
      // Show "hold it!" message when in correct squat position
      holdingCorrectForm = true;
      const timeHeld = this.stageConfirmed ? Date.now() - this.stageEntryTime : 0;
      console.log(`✅ SQUAT_ARM_RAISE ท่าถูก! เข่า: ${avgKneeAngle.toFixed(0)}° แขน: ${avgArmAngle.toFixed(0)}° | เฟรม: ${this.downConfirmedFrames}/${this.minFramesInStage} | ค้าง: ${timeHeld}/${this.minHoldTime}ms ${this.downConfirmedFrames >= this.minFramesInStage && timeHeld >= this.minHoldTime ? '✓พร้อม! ยืนขึ้นเพื่อนับ' : '(ค้างต่อ...)'}`);
      if (this.downConfirmedFrames >= this.minFramesInStage) {
        this.currentStage = 'down';
        if (!this.isDown) {
          this.stageEntryTime = Date.now(); // Start hold timer when first entering down
        }
        this.isDown = true;
        // Check if held long enough
        if (Date.now() - this.stageEntryTime >= this.minHoldTime) {
          holdingCorrectForm = false; // Stop showing once held long enough
          console.log(`🎯 SQUAT_ARM_RAISE ค้างครบแล้ว! → ยืนขึ้นเพื่อนับ rep`);
        }
      }
    } else if (isStanding) {
      this.upConfirmedFrames++;
      this.downConfirmedFrames = 0;
      if (this.upConfirmedFrames >= this.minFramesInStage) {
        if (this.isDown && this.canCountRep()) {
          console.log(`🏋️ SQUAT_ARM_RAISE Rep counted! Knee: ${avgKneeAngle.toFixed(1)}°, Arm: ${avgArmAngle.toFixed(1)}°`);
          this.reps++;
          repCompleted = true;
          this.markRepCounted();
          this.isDown = false;
        } else if (this.isDown && !this.canCountRep()) {
          console.log(`⏳ SQUAT_ARM_RAISE รอ cooldown`);
        }
        this.currentStage = 'up';
      }
    } else {
      // Not in squat and not standing - transition
      this.downConfirmedFrames = 0;
      this.upConfirmedFrames = 0;
    }

    const formFeedback = this.evaluateForm(landmarks, holdingCorrectForm);

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

  evaluateForm(landmarks: Landmark[], holdingCorrectForm: boolean = false): FormFeedback {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // If holding correct form, give positive feedback
    if (holdingCorrectForm) {
      return {
        quality: 'good',
        score: 90,
        issues: [],
        suggestions: ['✅ ท่าถูกแล้ว! ค้างไว้...']
      };
    }

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
        suggestions.push('ก้มเข่าให้ < 90° ครับ');
        score -= 25;
      }
      if (avgArmAngle < thresholds.arm_up_angle) {
        issues.push('ยกแขนไม่สูงพอ');
        suggestions.push('ยกแขนให้ > 145° ครับ');
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
    this.repCooldown = 250;
    this.minFramesInStage = 2;
    this.minHoldTime = 100;  // 0.1 วินาที - ลงถึงปุ๊บนับเลย
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
        formFeedback: { quality: 'warn', score: 0, issues: ['ไม่เห็นตัวครบ'], suggestions: ['📷 หันข้างเข้ากล้อง วางกล้องต่ำให้เห็นตั้งแต่ศีรษะถึงเท้าครับ'] },
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
    let holdingCorrectForm = false; // Track if holding correct position

    // Detect push-up position with hysteresis
    const elbowDown = this.currentStage === 'down'
      ? avgElbowAngle < thresholds.elbow_down_angle + this.hysteresis
      : avgElbowAngle < thresholds.elbow_down_angle;
    const elbowUp = this.currentStage === 'up'
      ? avgElbowAngle > thresholds.elbow_up_angle - this.hysteresis
      : avgElbowAngle > thresholds.elbow_up_angle;

    // Always log for debugging
    const downPass = elbowDown ? '✓' : '✗';
    const upPass = elbowUp ? '✓' : '✗';
    console.log(`📊 PUSH_UP: ศอก=${avgElbowAngle.toFixed(0)}° | ลง(ต้อง<${thresholds.elbow_down_angle})${downPass} | ขึ้น(ต้อง>${thresholds.elbow_up_angle})${upPass}`);

    if (elbowDown) {
      this.downConfirmedFrames++;
      this.upConfirmedFrames = 0;
      // Show "hold it!" when form is correct but not yet confirmed
      if (this.downConfirmedFrames > 0 && this.downConfirmedFrames < this.minFramesInStage) {
        holdingCorrectForm = true;
        console.log(`✅ PUSH_UP ท่าถูก! ศอก: ${avgElbowAngle.toFixed(0)}° | เฟรม: ${this.downConfirmedFrames}/${this.minFramesInStage} (ค้างต่อ...)`);
      }
      if (this.downConfirmedFrames >= this.minFramesInStage) {
        this.currentStage = 'down';
        this.isDown = true;
        console.log(`🎯 PUSH_UP ยืนยันแล้ว! → ดันขึ้นเพื่อนับ rep`);
      }
    } else if (elbowUp) {
      this.upConfirmedFrames++;
      this.downConfirmedFrames = 0;
      if (this.upConfirmedFrames >= this.minFramesInStage) {
        if (this.isDown && this.canCountRep()) {
          console.log(`💪 PUSH_UP Rep counted! Elbow angle: ${avgElbowAngle.toFixed(1)}°`);
          this.reps++;
          repCompleted = true;
          this.markRepCounted();
          this.isDown = false;
        } else if (this.isDown && !this.canCountRep()) {
          console.log(`⏳ PUSH_UP รอ cooldown`);
        }
        this.currentStage = 'up';
      }
    }

    const formFeedback = this.evaluateForm(landmarks, holdingCorrectForm);

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

  evaluateForm(landmarks: Landmark[], holdingCorrectForm: boolean = false): FormFeedback {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // If holding correct form, give positive feedback
    if (holdingCorrectForm) {
      return {
        quality: 'good',
        score: 90,
        issues: [],
        suggestions: ['✅ ท่าถูกแล้ว! ค้างไว้...']
      };
    }

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

// Static Lunge Analyzer - TIME-BASED (60 seconds total, 2x30s per leg)
// Detects lunge position and accumulates hold time
export class StaticLungeAnalyzer extends ExerciseAnalyzer {
  private keyLandmarks = [LM.LEFT_HIP, LM.RIGHT_HIP, LM.LEFT_KNEE, LM.RIGHT_KNEE, LM.LEFT_ANKLE, LM.RIGHT_ANKLE];
  private holdStartTime: number = 0;
  private isHolding: boolean = false;
  private totalHoldTime: number = 0;

  constructor() {
    super('static_lunge');
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
        reps: 0,
        repCompleted: false,
        formFeedback: { quality: 'warn', score: 0, issues: ['ไม่เห็นตัวครบ'], suggestions: ['📷 หันข้างเข้ากล้อง ถอยให้เห็นตั้งแต่ศีรษะถึงเท้าครับ'] },
        angles: {},
        isVisible: false,
        holdTime: this.totalHoldTime,
      };
    }

    // Get smoothed landmarks
    const leftHip = this.getSmoothedLandmark(LM.LEFT_HIP, landmarks[LM.LEFT_HIP]);
    const leftKnee = this.getSmoothedLandmark(LM.LEFT_KNEE, landmarks[LM.LEFT_KNEE]);
    const leftAnkle = this.getSmoothedLandmark(LM.LEFT_ANKLE, landmarks[LM.LEFT_ANKLE]);
    const rightHip = this.getSmoothedLandmark(LM.RIGHT_HIP, landmarks[LM.RIGHT_HIP]);
    const rightKnee = this.getSmoothedLandmark(LM.RIGHT_KNEE, landmarks[LM.RIGHT_KNEE]);
    const rightAnkle = this.getSmoothedLandmark(LM.RIGHT_ANKLE, landmarks[LM.RIGHT_ANKLE]);

    // Calculate knee angles
    const leftKneeAngleRaw = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngleRaw = calculateAngle(rightHip, rightKnee, rightAnkle);
    const leftKneeAngle = this.getSmoothedAngle('leftKnee', leftKneeAngleRaw);
    const rightKneeAngle = this.getSmoothedAngle('rightKnee', rightKneeAngleRaw);

    const thresholds = EXERCISES[this.exerciseType].thresholds;
    const targetAngle = thresholds.front_knee_angle; // 130°
    const tolerance = thresholds.knee_tolerance; // 30° → range 100-160°
    const minAngle = targetAngle - tolerance;
    const maxAngle = targetAngle + tolerance;

    // Check if either leg is in valid lunge position (at least one knee must be bent)
    const leftIsValid = leftKneeAngle >= minAngle && leftKneeAngle <= maxAngle;
    const rightIsValid = rightKneeAngle >= minAngle && rightKneeAngle <= maxAngle;
    
    // Detect which leg
    let detectedLeg: 'left' | 'right' | 'none' = 'none';
    if (leftIsValid && rightIsValid) {
      detectedLeg = leftKneeAngle < rightKneeAngle ? 'left' : 'right';
    } else if (leftIsValid) {
      detectedLeg = 'left';
    } else if (rightIsValid) {
      detectedLeg = 'right';
    }

    const isGoodForm = detectedLeg !== 'none';
    const currentTime = Date.now();

    // Time-based hold tracking (like PlankHold)
    if (isGoodForm) {
      if (!this.isHolding) {
        this.holdStartTime = currentTime;
        this.isHolding = true;
      }
      this.currentStage = 'hold';
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

    // Debug log
    const leftStatus = leftIsValid ? '✓' : '✗';
    const rightStatus = rightIsValid ? '✓' : '✗';
    console.log(`📊 STATIC_LUNGE: ซ้าย=${leftKneeAngle.toFixed(0)}°${leftStatus} ขวา=${rightKneeAngle.toFixed(0)}°${rightStatus} (ต้อง${minAngle}-${maxAngle}°) | ค้าง=${currentHoldTime.toFixed(1)}s`);

    const formFeedback = this.evaluateLungeForm(detectedLeg, isGoodForm, currentHoldTime);

    // Time-based: reps=0 so auto-complete won't trigger by reps
    return {
      stage: this.currentStage,
      reps: 0,
      repCompleted: false,
      formFeedback,
      angles: {
        leftKneeAngle: Math.round(leftKneeAngle),
        rightKneeAngle: Math.round(rightKneeAngle),
        targetAngle: targetAngle,
        currentLeg: detectedLeg,
      },
      isVisible: true,
      holdTime: currentHoldTime,
    };
  }

  // Required abstract method implementation
  evaluateForm(landmarks: Landmark[]): FormFeedback {
    return this.evaluateLungeForm('none', false, 0);
  }

  evaluateLungeForm(detectedLeg: 'left' | 'right' | 'none', holdingCorrectForm: boolean = false, holdTime: number = 0): FormFeedback {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    if (holdingCorrectForm) {
      const legText = detectedLeg === 'left' ? 'ซ้าย' : 'ขวา';
      return {
        quality: 'good',
        score: 90,
        issues: [],
        suggestions: [`✅ ค้างขา${legText}ไว้! ${holdTime.toFixed(0)}วิ / สลับขาทุก 30 วินาที`]
      };
    }

    suggestions.push(`📍 ก้าวขาไปข้างหน้า งอเข่า ~90° แล้วค้างไว้`);
    score = 50;

    let quality: FormQuality = score >= 80 ? 'good' : score >= 50 ? 'warn' : 'bad';
    this.lastFormQuality = quality;
    return { quality, score: Math.max(0, score), issues, suggestions };
  }

  reset(): void {
    super.reset();
    this.holdStartTime = 0;
    this.isHolding = false;
    this.totalHoldTime = 0;
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
    this.repCooldown = 400;
    this.minFramesInStage = 2;
    this.minHoldTime = 150; // 0.15 วินาที - ลงถึงปุ๊บกระโดดเลย
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
        formFeedback: { quality: 'warn', score: 0, issues: ['ไม่เห็นตัวครบ'], suggestions: ['📷 หันข้างเข้ากล้อง ถอยให้เห็นตั้งแต่ศีรษะถึงเท้าครับ'] },
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

    // Always log for debugging
    const squatPass = avgKneeAngle < thresholds.knee_squat_angle ? '✓' : '✗';
    console.log(`📊 JUMP_SQUAT: เข่า=${avgKneeAngle.toFixed(0)}°(ต้อง<${thresholds.knee_squat_angle})${squatPass} | phase=${this.jumpPhase} | ขึ้น=${(verticalMovement*100).toFixed(1)}%`);

    this.previousStage = this.currentStage;
    let repCompleted = false;
    let holdingCorrectForm = false;

    // State machine for jump squat with hysteresis
    const isSquatting = this.jumpPhase === 'squat'
      ? avgKneeAngle < thresholds.knee_squat_angle + this.hysteresis
      : avgKneeAngle < thresholds.knee_squat_angle;

    if (isSquatting) {
      this.squatConfirmedFrames++;
      // Show holding feedback when squatting but not yet confirmed
      if (this.squatConfirmedFrames < this.minFramesInStage && avgKneeAngle < thresholds.knee_squat_angle) {
        holdingCorrectForm = true;
        console.log(`✅ JUMP_SQUAT ท่าถูกแล้ว! เข่า: ${avgKneeAngle.toFixed(1)}° (ต้องการ <${thresholds.knee_squat_angle}°) - ค้างไว้แล้วกระโดด... (${this.squatConfirmedFrames}/${this.minFramesInStage} frames)`);
      }
      if (this.squatConfirmedFrames >= this.minFramesInStage) {
        this.currentStage = 'squat';
        this.jumpPhase = 'squat';
        this.hasSquatted = true;
        console.log(`🎯 JUMP_SQUAT ยืนยันสควอตแล้ว! พร้อมกระโดด`);
      }
      this.jumpConfirmedFrames = 0;
    } else if (this.hasSquatted && verticalMovement > thresholds.jump_height_ratio) {
      this.jumpConfirmedFrames++;
      if (this.jumpConfirmedFrames >= 3) { // Increased frame confirmation for jump
        this.currentStage = 'jump';
        this.jumpPhase = 'jump';
        console.log(`🦘 JUMP_SQUAT กระโดดแล้ว! vertical movement: ${(verticalMovement * 100).toFixed(1)}`);
      }
      this.squatConfirmedFrames = 0;
    } else if (this.jumpPhase === 'jump' && verticalMovement < -thresholds.land_threshold) {
      if (this.canCountRep()) {
        this.jumpPhase = 'land';
        console.log(`🏋️ JUMP_SQUAT Rep counted! Landing detected`);
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
    const formFeedback = this.evaluateForm(landmarks, holdingCorrectForm);

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

  evaluateForm(landmarks: Landmark[], holdingCorrectForm: boolean = false): FormFeedback {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // If holding correct form, give positive feedback
    if (holdingCorrectForm) {
      return {
        quality: 'good',
        score: 90,
        issues: [],
        suggestions: ['✅ ท่าถูกแล้ว! ค้างไว้แล้วกระโดด...']
      };
    }

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
        formFeedback: { quality: 'warn', score: 0, issues: ['ไม่เห็นตัวครบ'], suggestions: ['📷 หันข้างเข้ากล้อง วางกล้องต่ำให้เห็นตั้งแต่ศีรษะถึงเท้าครับ'] },
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

    // Always log for debugging
    const alignPass = bodyDeviation < thresholds.body_alignment_max ? '✓' : '✗';
    console.log(`📊 PLANK_HOLD: deviation=${bodyDeviation.toFixed(0)}°(ต้อง<${thresholds.body_alignment_max})${alignPass} | ค้างแล้ว=${currentHoldTime.toFixed(1)}s`);

    const formFeedback = this.evaluateForm(landmarks);

    // For time-based exercise: DO NOT return seconds as reps (causes auto-complete)
    return {
      stage: this.currentStage,
      reps: 0, // Keep at 0 - time-based exercise shouldn't auto-complete based on reps
      repCompleted: false,
      formFeedback,
      angles: {
        bodyDeviation: Math.round(bodyDeviation),
        bodyAngle: Math.round(avgBodyAngle),
      },
      isVisible: true,
      holdTime: currentHoldTime,
      // Note: isTimeBased is in config, not here
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
    this.repCooldown = 150;
    this.minFramesInStage = 2;
    this.minHoldTime = 500; // 0.5 วินาที (ท่าเร็ว)
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

    // Always log for debugging
    const leftPass = leftHipFlexion < thresholds.hip_flexion_angle ? '✓' : '✗';
    const rightPass = rightHipFlexion < thresholds.hip_flexion_angle ? '✓' : '✗';
    console.log(`📊 MOUNTAIN_CLIMBER: ซ้าย=${leftHipFlexion.toFixed(0)}°(ต้อง<${thresholds.hip_flexion_angle})${leftPass} | ขวา=${rightHipFlexion.toFixed(0)}°(ต้อง<${thresholds.hip_flexion_angle})${rightPass}`);

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

    // Detect step completion - no speed requirement, no straight body required between reps
    const cooldownPassed = currentTime - this.lastStepTime > thresholds.step_cooldown;
    
    if (this.leftLegUp && !leftKneeRaised && cooldownPassed && this.canCountRep()) {
      this.reps++;
      repCompleted = true;
      this.lastStepTime = currentTime;
      this.currentStage = 'left_up';
      this.markRepCounted();
      console.log(`🏋️ MOUNTAIN_CLIMBER Rep ${this.reps}! ขาซ้ายยก`);
    } else if (this.rightLegUp && !rightKneeRaised && cooldownPassed && this.canCountRep()) {
      this.reps++;
      repCompleted = true;
      this.lastStepTime = currentTime;
      this.currentStage = 'right_up';
      this.markRepCounted();
      console.log(`🏋️ MOUNTAIN_CLIMBER Rep ${this.reps}! ขาขวายก`);
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
// MUST ALTERNATE: left leg -> right leg -> left leg (prevents counting same leg twice)
export class PistolSquatAnalyzer extends ExerciseAnalyzer {
  private keyLandmarks = [LM.LEFT_HIP, LM.RIGHT_HIP, LM.LEFT_KNEE, LM.RIGHT_KNEE, LM.LEFT_ANKLE, LM.RIGHT_ANKLE];
  private isDown = false;
  private downConfirmedFrames = 0;
  private upConfirmedFrames = 0;
  private previousHipX: number = 0;
  private hysteresis = 15; // Prevents flickering between stages
  private balanceHistory: number[] = []; // For smoothing balance
  private currentStandingLeg: 'left' | 'right' | null = null; // Track which leg is being used
  private lastCountedLeg: 'left' | 'right' | null = null; // Track which leg was last counted to enforce alternation

  constructor() {
    super('pistol_squat');
    this.repCooldown = 500;
    this.minFramesInStage = 2;
    this.minHoldTime = 300; // 0.3 วินาที - ลงถึงปุ๊บนับเลย
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
        formFeedback: { quality: 'warn', score: 0, issues: ['ไม่เห็นตัวครบ'], suggestions: ['📷 หันข้างเข้ากล้อง ถอยให้เห็นตั้งแต่ศีรษะถึงเท้าครับ'] },
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
    const currentLeg: 'left' | 'right' = leftIsStanding ? 'left' : 'right';

    // Balance check with smoothing (hip horizontal stability)
    const hipMidX = (leftHip.x + rightHip.x) / 2;
    const balanceShiftRaw = Math.abs(hipMidX - this.previousHipX);
    
    this.balanceHistory.push(balanceShiftRaw);
    if (this.balanceHistory.length > 5) this.balanceHistory.shift();
    const balanceShift = this.balanceHistory.reduce((a, b) => a + b, 0) / this.balanceHistory.length;

    const thresholds = EXERCISES[this.exerciseType].thresholds;

    // Determine next required leg
    const nextRequired = this.lastCountedLeg === null ? 'ซ้ายหรือขวา' : 
                         this.lastCountedLeg === 'left' ? 'ขวา (สลับ)' : 'ซ้าย (สลับ)';

    // Always log for debugging
    const kneePass = standingKneeAngle < thresholds.knee_angle ? '✓' : '✗';
    const legPass = extendedKneeAngle > thresholds.extended_leg_angle ? '✓' : '✗';
    console.log(`📊 PISTOL_SQUAT: เข่ายืน=${standingKneeAngle.toFixed(0)}°(ต้อง<${thresholds.knee_angle})${kneePass} | ขายืด=${extendedKneeAngle.toFixed(0)}°(ต้อง>${thresholds.extended_leg_angle})${legPass} | ขาปัจจุบัน=${currentLeg === 'left' ? 'ซ้าย' : 'ขวา'} | ครั้งต่อไป: ${nextRequired}`);

    this.previousStage = this.currentStage;
    let repCompleted = false;
    let holdingCorrectForm = false;

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
    
    // Check if alternation is valid
    const canCountThisLeg = this.lastCountedLeg === null || this.lastCountedLeg !== currentLeg;

    if (inPistolSquat && isBalanced) {
      this.downConfirmedFrames++;
      this.upConfirmedFrames = 0;
      this.currentStandingLeg = currentLeg;
      
      // Check alternation before showing positive feedback
      if (this.downConfirmedFrames < this.minFramesInStage) {
        if (canCountThisLeg) {
          holdingCorrectForm = true;
          console.log(`✅ PISTOL_SQUAT ท่าถูกแล้ว! ขา${currentLeg === 'left' ? 'ซ้าย' : 'ขวา'} เข่า: ${standingKneeAngle.toFixed(1)}°, ขายืด: ${extendedKneeAngle.toFixed(1)}° - ค้างไว้... (${this.downConfirmedFrames}/${this.minFramesInStage} frames)`);
        } else {
          console.log(`⚠️ PISTOL_SQUAT: ต้องสลับขา! ทำขา${this.lastCountedLeg === 'left' ? 'ขวา' : 'ซ้าย'}ก่อนครับ`);
        }
      }
      if (this.downConfirmedFrames >= this.minFramesInStage) {
        this.currentStage = 'down';
        this.isDown = true;
        console.log(`🎯 PISTOL_SQUAT ยืนยันท่าแล้ว! ขา${currentLeg === 'left' ? 'ซ้าย' : 'ขวา'} พร้อมนับเมื่อยืนขึ้น`);
      }
    } else if (isStanding) {
      this.upConfirmedFrames++;
      this.downConfirmedFrames = 0;
      if (this.upConfirmedFrames >= this.minFramesInStage) {
        if (this.isDown && this.currentStandingLeg && this.canCountRep()) {
          // Check alternation before counting
          const canCount = this.lastCountedLeg === null || this.lastCountedLeg !== this.currentStandingLeg;
          
          if (canCount) {
            console.log(`🏋️ PISTOL_SQUAT Rep counted! ขา${this.currentStandingLeg === 'left' ? 'ซ้าย' : 'ขวา'} Standing knee: ${standingKneeAngle.toFixed(1)}°`);
            this.reps++;
            repCompleted = true;
            this.markRepCounted();
            this.lastCountedLeg = this.currentStandingLeg;
          } else {
            console.log(`⚠️ PISTOL_SQUAT: ไม่นับ! ต้องสลับขา (ทำขา${this.lastCountedLeg === 'left' ? 'ขวา' : 'ซ้าย'}ก่อน)`);
          }
          this.isDown = false;
          this.currentStandingLeg = null;
        }
        this.currentStage = 'up';
      }
    }

    this.previousHipX = hipMidX;
    const formFeedback = this.evaluateForm(landmarks, holdingCorrectForm);

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

  evaluateForm(landmarks: Landmark[], holdingCorrectForm: boolean = false): FormFeedback {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // If holding correct form, give positive feedback
    if (holdingCorrectForm) {
      return {
        quality: 'good',
        score: 90,
        issues: [],
        suggestions: ['✅ ท่าถูกแล้ว! ค้างไว้...']
      };
    }

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
    this.currentStandingLeg = null;
    this.lastCountedLeg = null;
  }
}

// Push-up + Shoulder Tap Analyzer - Front camera, symmetry check
// Order: down (pushup down) → up → tap_left → tap_right → count rep
export class PushupShoulderTapAnalyzer extends ExerciseAnalyzer {
  private keyLandmarks = [
    LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_ELBOW, LM.RIGHT_ELBOW,
    LM.LEFT_WRIST, LM.RIGHT_WRIST, LM.LEFT_HIP, LM.RIGHT_HIP
  ];
  private phase: 'down' | 'up' | 'tap' = 'down';
  private phaseConfirmedFrames = 0;
  private hysteresis = 15;

  constructor() {
    super('pushup_shoulder_tap');
    this.repCooldown = 500;
    this.minFramesInStage = 2;
    this.minHoldTime = 150;
  }

  analyze(landmarks: Landmark[]): ExerciseAnalysisResult {
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

    // Calculate elbow angles
    const leftElbowAngleRaw = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngleRaw = calculateAngle(rightShoulder, rightElbow, rightWrist);
    const leftElbowAngle = this.getSmoothedAngle('leftElbow', leftElbowAngleRaw);
    const rightElbowAngle = this.getSmoothedAngle('rightElbow', rightElbowAngleRaw);
    const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

    const thresholds = EXERCISES[this.exerciseType].thresholds;

    // TAP DETECTION: Elbow asymmetry (one arm bent to tap, other straight supporting)
    // When tapping shoulder, tapping arm bends to ~40-80°, supporting arm stays ~160-180°
    const elbowDiff = Math.abs(leftElbowAngle - rightElbowAngle);
    const tapThreshold = 50; // Need at least 50° difference between arms
    const tapDetected = elbowDiff >= tapThreshold;

    // Debug log
    const downPass = avgElbowAngle < thresholds.elbow_down_angle ? '✓' : '✗';
    const upPass = avgElbowAngle > thresholds.elbow_up_angle ? '✓' : '✗';
    const tapPass = tapDetected ? '✓' : '✗';
    console.log(`📊 PUSHUP_SHOULDER_TAP: ศอก=${avgElbowAngle.toFixed(0)}° (ซ้าย=${leftElbowAngle.toFixed(0)} ขวา=${rightElbowAngle.toFixed(0)} diff=${elbowDiff.toFixed(0)}) | ลง(ต้อง<${thresholds.elbow_down_angle})${downPass} | ขึ้น(ต้อง>${thresholds.elbow_up_angle})${upPass} | แตะ(diff≥${tapThreshold})${tapPass} | phase=${this.phase}`);

    let repCompleted = false;
    let holdingCorrectForm = false;

    // Elbow detection with hysteresis
    const elbowDown = this.phase === 'down' 
      ? avgElbowAngle < thresholds.elbow_down_angle + this.hysteresis
      : avgElbowAngle < thresholds.elbow_down_angle;
    const elbowUp = this.phase === 'up' || this.phase === 'tap'
      ? avgElbowAngle > thresholds.elbow_up_angle - this.hysteresis
      : avgElbowAngle > thresholds.elbow_up_angle;

    // Phase 1: Push-up DOWN (both elbows bent)
    if (this.phase === 'down') {
      if (elbowDown) {
        this.phaseConfirmedFrames++;
        if (this.phaseConfirmedFrames < this.minFramesInStage) {
          holdingCorrectForm = true;
        }
        if (this.phaseConfirmedFrames >= this.minFramesInStage) {
          this.phase = 'up';
          this.currentStage = 'down';
          this.phaseConfirmedFrames = 0;
          console.log(`🎯 PUSHUP_SHOULDER_TAP ลงแล้ว! ดันขึ้นเลย`);
        }
      } else {
        this.phaseConfirmedFrames = 0;
      }
    } 
    // Phase 2: Push-up UP (both elbows straight)
    else if (this.phase === 'up') {
      if (elbowUp) {
        this.phaseConfirmedFrames++;
        if (this.phaseConfirmedFrames >= this.minFramesInStage) {
          this.phase = 'tap';
          this.currentStage = 'up';
          this.phaseConfirmedFrames = 0;
          console.log(`👋 PUSHUP_SHOULDER_TAP ดันขึ้นแล้ว! แตะไหล่เลย (ข้างไหนก็ได้)`);
        }
      } else {
        this.phaseConfirmedFrames = 0;
      }
    } 
    // Phase 3: TAP (detect one arm bent significantly more than other = tapping shoulder)
    else if (this.phase === 'tap') {
      if (tapDetected) {
        this.phaseConfirmedFrames++;
        if (this.phaseConfirmedFrames < 2) {
          holdingCorrectForm = true;
        }
        if (this.phaseConfirmedFrames >= 2) {
          this.currentStage = 'tap';
          
          if (this.canCountRep()) {
            const tappingSide = leftElbowAngle < rightElbowAngle ? 'ซ้าย' : 'ขวา';
            console.log(`🏋️ PUSHUP_SHOULDER_TAP Rep counted! Down + Up + Tap(${tappingSide}) complete`);
            this.reps++;
            repCompleted = true;
            this.markRepCounted();
          }
          
          // Reset for next rep
          this.phase = 'down';
          this.phaseConfirmedFrames = 0;
        }
      } else {
        this.phaseConfirmedFrames = 0;
      }
    }

    const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
    const hipTilt = Math.abs(leftHip.y - rightHip.y);

    const formFeedback = this.evaluateForm(landmarks, holdingCorrectForm);

    return {
      stage: this.currentStage,
      reps: this.reps,
      repCompleted,
      formFeedback,
      angles: {
        elbowAngle: Math.round(avgElbowAngle),
        leftElbow: Math.round(leftElbowAngle),
        rightElbow: Math.round(rightElbowAngle),
        elbowDiff: Math.round(elbowDiff),
        phase: this.phase,
      },
      isVisible: true,
    };
  }

  evaluateForm(landmarks: Landmark[], holdingCorrectForm: boolean = false): FormFeedback {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    if (holdingCorrectForm) {
      return {
        quality: 'good',
        score: 90,
        issues: [],
        suggestions: ['✅ ท่าถูกแล้ว! ค้างไว้...']
      };
    }

    const leftShoulder = this.getSmoothedLandmark(LM.LEFT_SHOULDER, landmarks[LM.LEFT_SHOULDER]);
    const rightShoulder = this.getSmoothedLandmark(LM.RIGHT_SHOULDER, landmarks[LM.RIGHT_SHOULDER]);
    const leftHip = this.getSmoothedLandmark(LM.LEFT_HIP, landmarks[LM.LEFT_HIP]);
    const rightHip = this.getSmoothedLandmark(LM.RIGHT_HIP, landmarks[LM.RIGHT_HIP]);

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
    this.phase = 'down';
    this.phaseConfirmedFrames = 0;
  }
}

// Burpee Analyzer - Side camera, state machine (squat → plank → jump)
// Burpee Analyzer - SIMPLIFIED: standing → down (any low position) → standing = 1 rep
// No holding required, no jump required. Just go down and come back up.
export class BurpeeAnalyzer extends ExerciseAnalyzer {
  private keyLandmarks = [
    LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_HIP, LM.RIGHT_HIP,
    LM.LEFT_KNEE, LM.RIGHT_KNEE, LM.LEFT_ANKLE, LM.RIGHT_ANKLE
  ];
  private burpeePhase: 'standing' | 'going_down' | 'down' | 'coming_up' = 'standing';
  private previousHipY: number = 0;
  private hipYHistory: number[] = []; // For smoothing hip position
  private wentDown: boolean = false; // Track if user went down

  constructor() {
    super('burpee');
    this.repCooldown = 500; // Fast cooldown
    this.minFramesInStage = 1; // No holding required! ไม่ต้องค้าง
    this.minHoldTime = 0; // No hold time required
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
        formFeedback: { quality: 'warn', score: 0, issues: ['ไม่เห็นตัวครบ'], suggestions: ['📷 หันข้างเข้ากล้อง วางกล้องต่ำให้เห็นตั้งแต่ศีรษะถึงเท้าครับ'] },
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

    // Calculate and smooth body angle for plank/floor detection
    const leftBodyAngle = calculateAngle(leftShoulder, leftHip, leftAnkle);
    const rightBodyAngle = calculateAngle(rightShoulder, rightHip, rightAnkle);
    const avgBodyAngle = this.getSmoothedAngle('bodyAngle', (leftBodyAngle + rightBodyAngle) / 2);

    // Hip Y position for detecting low positions
    const hipY = (leftHip.y + rightHip.y) / 2;
    this.hipYHistory.push(hipY);
    if (this.hipYHistory.length > 3) this.hipYHistory.shift();
    const smoothedHipY = this.hipYHistory.reduce((a, b) => a + b, 0) / this.hipYHistory.length;

    // Shoulder Y for detecting when person goes to floor
    const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;

    const thresholds = EXERCISES[this.exerciseType].thresholds;

    // Detect positions:
    // "Down" = ANY of: squat (knee bent), plank (body horizontal + hip high), or on floor
    const isSquatting = avgKneeAngle < thresholds.squat_knee_angle;
    const isPlankOrFloor = avgBodyAngle > thresholds.plank_body_angle && smoothedHipY > thresholds.hip_high_threshold;
    const isOnFloor = shoulderY > 0.6; // Shoulders are very low = on floor
    const isDown = isSquatting || isPlankOrFloor || isOnFloor;
    const isStanding = avgKneeAngle > thresholds.standing_knee_angle && smoothedHipY < 0.5;

    // Always log for debugging
    const downText = isDown ? '✓ลงแล้ว' : '✗ยังไม่ลง';
    const standText = isStanding ? '✓ยืนแล้ว' : '✗ยังไม่ยืน';
    console.log(`📊 BURPEE: เข่า=${avgKneeAngle.toFixed(0)}° ลำตัว=${avgBodyAngle.toFixed(0)}° สะโพกY=${smoothedHipY.toFixed(2)} | ${downText} | ${standText} | phase=${this.burpeePhase}`);

    this.previousStage = this.currentStage;
    let repCompleted = false;

    // SIMPLE state machine: standing → down → standing = 1 rep (ไม่ต้องค้าง!)
    switch (this.burpeePhase) {
      case 'standing':
        if (isDown) {
          this.burpeePhase = 'going_down';
          console.log(`⬇️ BURPEE กำลังลง...`);
        }
        break;

      case 'going_down':
        if (isDown) {
          this.burpeePhase = 'down';
          this.currentStage = 'down';
          this.wentDown = true;
          console.log(`🎯 BURPEE ลงถึงแล้ว! ยืนขึ้นมาเพื่อนับ`);
        } else if (isStanding) {
          // Went back up too fast without fully going down
          this.burpeePhase = 'standing';
        }
        break;

      case 'down':
        if (!isDown) {
          // Starting to come back up
          this.burpeePhase = 'coming_up';
          console.log(`⬆️ BURPEE กำลังขึ้น...`);
        }
        break;

      case 'coming_up':
        if (isStanding && this.wentDown && this.canCountRep()) {
          console.log(`🏋️ BURPEE Rep counted! เข่า: ${avgKneeAngle.toFixed(1)}°`);
          this.reps++;
          repCompleted = true;
          this.markRepCounted();
          this.currentStage = 'up';
          this.wentDown = false;
          this.burpeePhase = 'standing';
        } else if (isDown) {
          // Went back down again
          this.burpeePhase = 'down';
          this.currentStage = 'down';
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
        hipY: Math.round(smoothedHipY * 100),
        phase: this.burpeePhase,
      },
      isVisible: true,
    };
  }

  evaluateForm(landmarks: Landmark[]): FormFeedback {
    const suggestions: string[] = [];
    let score = 100;

    // Phase-specific suggestions
    switch (this.burpeePhase) {
      case 'standing':
        suggestions.push('🏃 ลงไปเลยครับ!');
        break;
      case 'going_down':
      case 'down':
        suggestions.push('👇 ดีครับ! ลงมาแล้ว ยืนขึ้นเลย!');
        break;
      case 'coming_up':
        suggestions.push('⬆️ ยืนขึ้นมาเลย!');
        break;
    }

    let quality: FormQuality = 'good';
    this.lastFormQuality = quality;
    return { quality, score: Math.max(0, score), issues: [], suggestions };
  }

  reset(): void {
    super.reset();
    this.burpeePhase = 'standing';
    this.previousHipY = 0;
    this.wentDown = false;
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
