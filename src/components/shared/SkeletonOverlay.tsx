import { useRef, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import { 
  Landmark, 
  OpticalFlowPoint, 
  OPTICAL_FLOW_LANDMARKS, 
  LANDMARK_COLORS 
} from '@/hooks/useMediaPipePose';

interface SkeletonOverlayProps {
  landmarks: Landmark[];
  opticalFlowPoints: OpticalFlowPoint[];
  getFlowHistory: (idx: number) => { x: number; y: number }[];
  showSkeleton?: boolean;
  showOpticalFlow?: boolean;
  width: number;
  height: number;
  className?: string;
  mirrored?: boolean;
}

// MediaPipe Pose connections
const POSE_CONNECTIONS: [number, number][] = [
  // Face
  [0, 1], [1, 2], [2, 3], [3, 7], // Left eye
  [0, 4], [4, 5], [5, 6], [6, 8], // Right eye
  [9, 10], // Mouth
  // Torso
  [11, 12], // Shoulders
  [11, 23], [12, 24], // Shoulder to hip
  [23, 24], // Hips
  // Left arm
  [11, 13], [13, 15], // Shoulder -> Elbow -> Wrist
  [15, 17], [15, 19], [15, 21], [17, 19], // Hand
  // Right arm
  [12, 14], [14, 16], // Shoulder -> Elbow -> Wrist
  [16, 18], [16, 20], [16, 22], [18, 20], // Hand
  // Left leg
  [23, 25], [25, 27], // Hip -> Knee -> Ankle
  [27, 29], [27, 31], [29, 31], // Foot
  // Right leg
  [24, 26], [26, 28], // Hip -> Knee -> Ankle
  [28, 30], [28, 32], [30, 32], // Foot
];

// Skeleton connections (main body only, no face/hand details)
const SKELETON_CONNECTIONS: [number, number][] = [
  // Torso
  [11, 12], // Shoulders
  [11, 23], [12, 24], // Shoulder to hip
  [23, 24], // Hips
  // Arms
  [11, 13], [13, 15], // Left arm
  [12, 14], [14, 16], // Right arm
  // Legs
  [23, 25], [25, 27], // Left leg
  [24, 26], [26, 28], // Right leg
  // Spine (virtual connection)
  // No direct nose to hip, but we connect shoulders midpoint to hips midpoint via drawing
];

// Key body landmarks only (no face/hand details)
const KEY_LANDMARKS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

export const SkeletonOverlay = memo(function SkeletonOverlay({
  landmarks,
  opticalFlowPoints,
  getFlowHistory,
  showSkeleton = true,
  showOpticalFlow = true,
  width,
  height,
  className,
  mirrored = true,
}: SkeletonOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (!landmarks.length) return;

    // Helper to convert normalized coords to canvas coords
    const toCanvasCoords = (x: number, y: number): [number, number] => {
      const canvasX = mirrored ? width - x * width : x * width;
      const canvasY = y * height;
      return [canvasX, canvasY];
    };

    // Draw optical flow trails first (behind skeleton)
    if (showOpticalFlow) {
      OPTICAL_FLOW_LANDMARKS.forEach((idx) => {
        const history = getFlowHistory(idx);
        if (history.length < 2) return;

        ctx.beginPath();
        ctx.strokeStyle = LANDMARK_COLORS[idx] || '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw trail with fading opacity
        for (let i = 1; i < history.length; i++) {
          const opacity = i / history.length;
          ctx.globalAlpha = opacity * 0.8;
          
          const [x1, y1] = toCanvasCoords(history[i - 1].x, history[i - 1].y);
          const [x2, y2] = toCanvasCoords(history[i].x, history[i].y);
          
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        // Draw glow effect at current position
        if (history.length > 0) {
          const current = history[history.length - 1];
          const [cx, cy] = toCanvasCoords(current.x, current.y);
          
          ctx.globalAlpha = 0.5;
          const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 15);
          gradient.addColorStop(0, LANDMARK_COLORS[idx] || '#FFFFFF');
          gradient.addColorStop(1, 'transparent');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(cx, cy, 15, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      
      ctx.globalAlpha = 1;
    }

    // Draw skeleton
    if (showSkeleton) {
      // Draw connections
      ctx.strokeStyle = '#00FF88';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#00FF88';
      ctx.shadowBlur = 10;

      SKELETON_CONNECTIONS.forEach(([start, end]) => {
        const startLm = landmarks[start];
        const endLm = landmarks[end];
        
        if (!startLm || !endLm) return;
        if ((startLm.visibility ?? 0) < 0.5 || (endLm.visibility ?? 0) < 0.5) return;

        const [x1, y1] = toCanvasCoords(startLm.x, startLm.y);
        const [x2, y2] = toCanvasCoords(endLm.x, endLm.y);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });

      // Draw nose to neck (midpoint of shoulders) connection
      const nose = landmarks[0];
      const leftShoulder = landmarks[11];
      const rightShoulder = landmarks[12];
      
      if (nose && leftShoulder && rightShoulder &&
          (nose.visibility ?? 0) > 0.5 &&
          (leftShoulder.visibility ?? 0) > 0.5 &&
          (rightShoulder.visibility ?? 0) > 0.5) {
        const neckX = (leftShoulder.x + rightShoulder.x) / 2;
        const neckY = (leftShoulder.y + rightShoulder.y) / 2;
        
        const [nx, ny] = toCanvasCoords(nose.x, nose.y);
        const [ncx, ncy] = toCanvasCoords(neckX, neckY);
        
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(ncx, ncy);
        ctx.stroke();
      }

      // Draw spine (shoulders midpoint to hips midpoint)
      const leftHip = landmarks[23];
      const rightHip = landmarks[24];
      
      if (leftShoulder && rightShoulder && leftHip && rightHip &&
          (leftShoulder.visibility ?? 0) > 0.5 &&
          (rightShoulder.visibility ?? 0) > 0.5 &&
          (leftHip.visibility ?? 0) > 0.5 &&
          (rightHip.visibility ?? 0) > 0.5) {
        const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
        const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
        const hipMidX = (leftHip.x + rightHip.x) / 2;
        const hipMidY = (leftHip.y + rightHip.y) / 2;
        
        const [smx, smy] = toCanvasCoords(shoulderMidX, shoulderMidY);
        const [hmx, hmy] = toCanvasCoords(hipMidX, hipMidY);
        
        ctx.beginPath();
        ctx.moveTo(smx, smy);
        ctx.lineTo(hmx, hmy);
        ctx.stroke();
      }

      // Reset shadow
      ctx.shadowBlur = 0;

      // Draw key joint points
      KEY_LANDMARKS.forEach((idx) => {
        const landmark = landmarks[idx];
        if (!landmark || (landmark.visibility ?? 0) < 0.5) return;

        const [x, y] = toCanvasCoords(landmark.x, landmark.y);
        const color = LANDMARK_COLORS[idx] || '#00FF88';

        // Outer glow
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = color + '40';
        ctx.fill();

        // Inner circle
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // White border
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }
  }, [landmarks, opticalFlowPoints, getFlowHistory, showSkeleton, showOpticalFlow, width, height, mirrored]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={cn('absolute inset-0 pointer-events-none', className)}
      style={{ zIndex: 10 }}
    />
  );
});

export default SkeletonOverlay;
