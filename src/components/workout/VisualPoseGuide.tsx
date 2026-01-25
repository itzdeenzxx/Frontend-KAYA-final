// Visual Pose Guide Component - Ported from KAYA/visual_guide.py
// Shows target pose overlay, correction arrows, and stage indicator

import { useRef, useEffect, memo } from 'react';
import { Landmark } from '@/hooks/useMediaPipePose';
import {
  ExerciseType,
  ExerciseStage,
  VISUAL_GUIDE_CONFIG,
  LANDMARK_INDICES as LM,
} from '@/lib/exerciseConfig';
import { JointCorrection } from '@/lib/exerciseAnalyzers';

interface VisualPoseGuideProps {
  landmarks: Landmark[];
  exerciseType: ExerciseType;
  currentStage: ExerciseStage;
  targetStage: ExerciseStage;
  corrections: JointCorrection[];
  formScore: number;
  width: number;
  height: number;
  mirrored?: boolean;
  showTargetPose?: boolean;
  showCorrections?: boolean;
  showStageIndicator?: boolean;
}

// Joint to landmark index mapping
const JOINT_TO_LANDMARK: Record<string, number> = {
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

// Target pose connections for drawing skeleton
const TARGET_CONNECTIONS: [string, string][] = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
];

// Calculate dynamic target pose based on user's actual body proportions
function calculateDynamicTargetPose(
  landmarks: Landmark[],
  exerciseType: ExerciseType,
  targetStage: ExerciseStage
): Record<string, { x: number; y: number }> | null {
  // Need at least shoulders and hips to calculate
  const leftShoulder = landmarks[LM.LEFT_SHOULDER];
  const rightShoulder = landmarks[LM.RIGHT_SHOULDER];
  const leftHip = landmarks[LM.LEFT_HIP];
  const rightHip = landmarks[LM.RIGHT_HIP];
  const leftElbow = landmarks[LM.LEFT_ELBOW];
  const rightElbow = landmarks[LM.RIGHT_ELBOW];
  const leftWrist = landmarks[LM.LEFT_WRIST];
  const rightWrist = landmarks[LM.RIGHT_WRIST];
  const leftKnee = landmarks[LM.LEFT_KNEE];
  const rightKnee = landmarks[LM.RIGHT_KNEE];
  const leftAnkle = landmarks[LM.LEFT_ANKLE];
  const rightAnkle = landmarks[LM.RIGHT_ANKLE];

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return null;

  // Calculate arm and leg lengths from current pose
  const leftArmLength = leftElbow && leftWrist 
    ? Math.hypot(leftShoulder.x - leftElbow.x, leftShoulder.y - leftElbow.y) +
      Math.hypot(leftElbow.x - leftWrist.x, leftElbow.y - leftWrist.y)
    : 0.25;
  
  const rightArmLength = rightElbow && rightWrist
    ? Math.hypot(rightShoulder.x - rightElbow.x, rightShoulder.y - rightElbow.y) +
      Math.hypot(rightElbow.x - rightWrist.x, rightElbow.y - rightWrist.y)
    : 0.25;

  const leftUpperArm = leftElbow 
    ? Math.hypot(leftShoulder.x - leftElbow.x, leftShoulder.y - leftElbow.y) 
    : 0.12;
  const rightUpperArm = rightElbow 
    ? Math.hypot(rightShoulder.x - rightElbow.x, rightShoulder.y - rightElbow.y) 
    : 0.12;
  const leftForearm = leftElbow && leftWrist 
    ? Math.hypot(leftElbow.x - leftWrist.x, leftElbow.y - leftWrist.y) 
    : 0.13;
  const rightForearm = rightElbow && rightWrist 
    ? Math.hypot(rightElbow.x - rightWrist.x, rightElbow.y - rightWrist.y) 
    : 0.13;

  const leftThigh = leftKnee 
    ? Math.hypot(leftHip.x - leftKnee.x, leftHip.y - leftKnee.y) 
    : 0.2;
  const rightThigh = rightKnee 
    ? Math.hypot(rightHip.x - rightKnee.x, rightHip.y - rightKnee.y) 
    : 0.2;
  const leftShin = leftKnee && leftAnkle 
    ? Math.hypot(leftKnee.x - leftAnkle.x, leftKnee.y - leftAnkle.y) 
    : 0.2;
  const rightShin = rightKnee && rightAnkle 
    ? Math.hypot(rightKnee.x - rightAnkle.x, rightKnee.y - rightAnkle.y) 
    : 0.2;

  // Base pose from current landmarks (keep body position)
  const basePose: Record<string, { x: number; y: number }> = {
    left_shoulder: { x: leftShoulder.x, y: leftShoulder.y },
    right_shoulder: { x: rightShoulder.x, y: rightShoulder.y },
    left_hip: { x: leftHip.x, y: leftHip.y },
    right_hip: { x: rightHip.x, y: rightHip.y },
  };

  // Calculate target positions based on exercise type and stage
  switch (exerciseType) {
    case 'arm_raise':
      if (targetStage === 'up') {
        // Arms raised overhead - maintain body proportions
        const leftElbowTarget = {
          x: leftShoulder.x + leftUpperArm * 0.3, // Slightly outward
          y: leftShoulder.y - leftUpperArm * 0.9, // Up
        };
        const rightElbowTarget = {
          x: rightShoulder.x - rightUpperArm * 0.3,
          y: rightShoulder.y - rightUpperArm * 0.9,
        };
        return {
          ...basePose,
          left_elbow: leftElbowTarget,
          right_elbow: rightElbowTarget,
          left_wrist: {
            x: leftElbowTarget.x + leftForearm * 0.2,
            y: leftElbowTarget.y - leftForearm * 0.95,
          },
          right_wrist: {
            x: rightElbowTarget.x - rightForearm * 0.2,
            y: rightElbowTarget.y - rightForearm * 0.95,
          },
        };
      } else {
        // Arms down by sides
        const leftElbowTarget = {
          x: leftShoulder.x + leftUpperArm * 0.15,
          y: leftShoulder.y + leftUpperArm * 0.95,
        };
        const rightElbowTarget = {
          x: rightShoulder.x - rightUpperArm * 0.15,
          y: rightShoulder.y + rightUpperArm * 0.95,
        };
        return {
          ...basePose,
          left_elbow: leftElbowTarget,
          right_elbow: rightElbowTarget,
          left_wrist: {
            x: leftElbowTarget.x + leftForearm * 0.1,
            y: leftElbowTarget.y + leftForearm * 0.95,
          },
          right_wrist: {
            x: rightElbowTarget.x - rightForearm * 0.1,
            y: rightElbowTarget.y + rightForearm * 0.95,
          },
        };
      }

    case 'torso_twist':
      // For torso twist, show shoulder rotation based on current position
      const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
      if (targetStage === 'left') {
        return {
          ...basePose,
          left_shoulder: { x: leftShoulder.x - shoulderWidth * 0.15, y: leftShoulder.y },
          right_shoulder: { x: rightShoulder.x - shoulderWidth * 0.1, y: rightShoulder.y + 0.02 },
        };
      } else if (targetStage === 'right') {
        return {
          ...basePose,
          left_shoulder: { x: leftShoulder.x + shoulderWidth * 0.1, y: leftShoulder.y + 0.02 },
          right_shoulder: { x: rightShoulder.x + shoulderWidth * 0.15, y: rightShoulder.y },
        };
      }
      return basePose;

    case 'knee_raise':
      if (targetStage === 'up') {
        // One knee raised high
        return {
          ...basePose,
          left_hip: { x: leftHip.x, y: leftHip.y },
          left_knee: {
            x: leftHip.x,
            y: leftHip.y - leftThigh * 0.3, // Knee raised
          },
          left_ankle: {
            x: leftHip.x - leftShin * 0.1,
            y: leftHip.y + leftShin * 0.2,
          },
          right_hip: { x: rightHip.x, y: rightHip.y },
          right_knee: {
            x: rightHip.x,
            y: rightHip.y + rightThigh,
          },
          right_ankle: {
            x: rightHip.x,
            y: rightHip.y + rightThigh + rightShin,
          },
        };
      } else {
        // Standing position
        return {
          ...basePose,
          left_knee: {
            x: leftHip.x,
            y: leftHip.y + leftThigh,
          },
          left_ankle: {
            x: leftHip.x,
            y: leftHip.y + leftThigh + leftShin,
          },
          right_knee: {
            x: rightHip.x,
            y: rightHip.y + rightThigh,
          },
          right_ankle: {
            x: rightHip.x,
            y: rightHip.y + rightThigh + rightShin,
          },
        };
      }

    default:
      return null;
  }
}

export const VisualPoseGuide = memo(function VisualPoseGuide({
  landmarks,
  exerciseType,
  currentStage,
  targetStage,
  corrections,
  formScore,
  width,
  height,
  mirrored = true,
  showTargetPose = true,
  showCorrections = true,
  showStageIndicator = true,
}: VisualPoseGuideProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate dynamic target pose from actual landmarks
    const targetPose = calculateDynamicTargetPose(landmarks, exerciseType, targetStage);
    if (!targetPose || !landmarks.length) return;

    // Helper to convert normalized coords to canvas coords
    const toCanvasCoords = (x: number, y: number): [number, number] => {
      const canvasX = mirrored ? width - x * width : x * width;
      const canvasY = y * height;
      return [canvasX, canvasY];
    };

    // Draw target pose skeleton
    if (showTargetPose) {
      ctx.globalAlpha = VISUAL_GUIDE_CONFIG.TARGET_OPACITY;
      ctx.strokeStyle = VISUAL_GUIDE_CONFIG.COLORS.target;
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 5]);

      // Draw connections
      for (const [joint1, joint2] of TARGET_CONNECTIONS) {
        const pos1 = targetPose[joint1];
        const pos2 = targetPose[joint2];
        
        if (pos1 && pos2) {
          const [x1, y1] = toCanvasCoords(pos1.x, pos1.y);
          const [x2, y2] = toCanvasCoords(pos2.x, pos2.y);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      // Draw target joints
      ctx.setLineDash([]);
      for (const [jointName, pos] of Object.entries(targetPose)) {
        const [x, y] = toCanvasCoords(pos.x, pos.y);
        
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fillStyle = VISUAL_GUIDE_CONFIG.COLORS.target;
        ctx.fill();
        
        // Inner circle
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    }

    // Draw correction arrows
    if (showCorrections && corrections.length > 0) {
      ctx.setLineDash([]);
      
      for (const correction of corrections) {
        // Only show corrections for significant deviations
        if (correction.distance < VISUAL_GUIDE_CONFIG.WARN_THRESHOLD) continue;

        const [currentX, currentY] = toCanvasCoords(
          correction.currentPos.x, 
          correction.currentPos.y
        );
        const [targetX, targetY] = toCanvasCoords(
          correction.targetPos.x, 
          correction.targetPos.y
        );

        // Determine color based on distance
        const isError = correction.distance > VISUAL_GUIDE_CONFIG.ERROR_THRESHOLD;
        const color = isError 
          ? VISUAL_GUIDE_CONFIG.COLORS.error 
          : VISUAL_GUIDE_CONFIG.COLORS.arrow;

        // Draw arrow from current to target
        drawArrow(ctx, currentX, currentY, targetX, targetY, color, isError ? 4 : 3);

        // Draw direction label
        if (correction.direction.length > 0) {
          const labelX = (currentX + targetX) / 2;
          const labelY = (currentY + targetY) / 2 - 20;
          
          ctx.font = 'bold 14px sans-serif';
          ctx.fillStyle = color;
          ctx.textAlign = 'center';
          ctx.fillText(correction.direction.join(' '), labelX, labelY);
        }

        // Draw pulsing circle on current position if error
        if (isError) {
          const pulseSize = 20 + Math.sin(Date.now() / 200) * 5;
          ctx.beginPath();
          ctx.arc(currentX, currentY, pulseSize, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }
    }

    // Draw stage indicator
    if (showStageIndicator) {
      drawStageIndicator(ctx, exerciseType, currentStage, targetStage, formScore, width);
    }
  }, [
    landmarks, 
    exerciseType, 
    currentStage, 
    targetStage, 
    corrections, 
    formScore,
    width, 
    height, 
    mirrored, 
    showTargetPose, 
    showCorrections, 
    showStageIndicator
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none z-20"
      style={{ width: '100%', height: '100%' }}
    />
  );
});

// Draw arrow helper
function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  lineWidth: number
): void {
  const headLength = 15;
  const angle = Math.atan2(toY - fromY, toX - fromX);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;

  // Draw line
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  // Draw arrowhead
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLength * Math.cos(angle - Math.PI / 6),
    toY - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    toX - headLength * Math.cos(angle + Math.PI / 6),
    toY - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
}

// Draw stage indicator
function drawStageIndicator(
  ctx: CanvasRenderingContext2D,
  exerciseType: ExerciseType,
  currentStage: ExerciseStage,
  targetStage: ExerciseStage,
  formScore: number,
  canvasWidth: number
): void {
  const boxWidth = 200;
  const boxHeight = 80;
  const boxX = canvasWidth / 2 - boxWidth / 2;
  const boxY = 20;
  const padding = 15;

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 12);
  ctx.fill();

  // Border based on form quality
  const borderColor = formScore >= 80 
    ? VISUAL_GUIDE_CONFIG.COLORS.correct 
    : formScore >= 50 
      ? VISUAL_GUIDE_CONFIG.COLORS.arrow 
      : VISUAL_GUIDE_CONFIG.COLORS.error;
  
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Stage text
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';

  const stageLabels: Record<ExerciseStage, string> = {
    up: '⬆️ ยกขึ้น',
    down: '⬇️ ลดลง',
    center: '⚪ กลาง',
    left: '⬅️ ซ้าย',
    right: '➡️ ขวา',
    idle: '⏸️ พร้อม',
  };

  const currentLabel = stageLabels[currentStage] || currentStage;
  const targetLabel = stageLabels[targetStage] || targetStage;

  ctx.fillText(`ปัจจุบัน: ${currentLabel}`, boxX + boxWidth / 2, boxY + 30);
  
  ctx.font = '14px sans-serif';
  ctx.fillStyle = VISUAL_GUIDE_CONFIG.COLORS.target;
  ctx.fillText(`เป้าหมาย: ${targetLabel}`, boxX + boxWidth / 2, boxY + 52);

  // Progress bar for form score
  const progressWidth = boxWidth - padding * 2;
  const progressHeight = 8;
  const progressX = boxX + padding;
  const progressY = boxY + boxHeight - padding - progressHeight;

  // Background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.roundRect(progressX, progressY, progressWidth, progressHeight, 4);
  ctx.fill();

  // Fill based on score
  const fillWidth = (formScore / 100) * progressWidth;
  ctx.fillStyle = borderColor;
  ctx.beginPath();
  ctx.roundRect(progressX, progressY, fillWidth, progressHeight, 4);
  ctx.fill();
}

// Standalone Stage Indicator Component (for use without canvas)
interface StageIndicatorProps {
  exerciseType: ExerciseType;
  currentStage: ExerciseStage;
  targetStage: ExerciseStage;
  formScore: number;
  reps: number;
  className?: string;
}

export function StageIndicator({
  exerciseType,
  currentStage,
  targetStage,
  formScore,
  reps,
  className = '',
}: StageIndicatorProps) {
  const stageEmojis: Record<ExerciseStage, string> = {
    up: '⬆️',
    down: '⬇️',
    center: '⚪',
    left: '⬅️',
    right: '➡️',
    idle: '⏸️',
  };

  const stageLabels: Record<ExerciseStage, string> = {
    up: 'ยกขึ้น',
    down: 'ลดลง',
    center: 'กลาง',
    left: 'ซ้าย',
    right: 'ขวา',
    idle: 'พร้อม',
  };

  const formColor = formScore >= 80 
    ? 'bg-green-500' 
    : formScore >= 50 
      ? 'bg-orange-500' 
      : 'bg-red-500';

  return (
    <div className={`bg-black/70 backdrop-blur-sm rounded-2xl p-4 ${className}`}>
      {/* Rep Counter */}
      <div className="text-center mb-3">
        <span className="text-5xl font-bold text-white">{reps}</span>
        <span className="text-white/60 text-lg ml-2">ครั้ง</span>
      </div>

      {/* Stage Display */}
      <div className="flex items-center justify-center gap-4 mb-3">
        <div className="text-center">
          <div className="text-3xl">{stageEmojis[currentStage]}</div>
          <div className="text-white/60 text-sm">{stageLabels[currentStage]}</div>
        </div>
        <div className="text-white/40 text-2xl">→</div>
        <div className="text-center opacity-60">
          <div className="text-3xl">{stageEmojis[targetStage]}</div>
          <div className="text-blue-400 text-sm">{stageLabels[targetStage]}</div>
        </div>
      </div>

      {/* Form Score Bar */}
      <div className="w-full">
        <div className="flex justify-between text-xs text-white/60 mb-1">
          <span>ฟอร์ม</span>
          <span>{formScore}%</span>
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div 
            className={`h-full ${formColor} rounded-full transition-all duration-300`}
            style={{ width: `${formScore}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Beat Counter Component for tempo guidance
interface BeatCounterProps {
  beatCount: number;
  tempoQuality: string;
  className?: string;
}

export function BeatCounter({ beatCount, tempoQuality, className = '' }: BeatCounterProps) {
  const beatTexts = ['หนึ่ง', 'สอง', 'สาม', 'สี่'];
  const qualityColors: Record<string, string> = {
    perfect: 'text-green-400',
    good: 'text-white',
    too_fast: 'text-red-400',
    too_slow: 'text-yellow-400',
    inconsistent: 'text-orange-400',
  };

  return (
    <div className={`bg-black/50 backdrop-blur-sm rounded-xl px-4 py-2 ${className}`}>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((beat) => (
          <div
            key={beat}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 ${
              beat === beatCount 
                ? 'bg-primary scale-110 text-white font-bold' 
                : 'bg-white/20 text-white/60'
            }`}
          >
            {beat}
          </div>
        ))}
      </div>
      <div className={`text-center mt-1 text-sm ${qualityColors[tempoQuality] || 'text-white'}`}>
        {beatTexts[beatCount - 1]}
      </div>
    </div>
  );
}

export default VisualPoseGuide;
