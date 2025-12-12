import { useRef, useEffect, useState, useCallback } from 'react';

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface OpticalFlowPoint {
  id: number;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  color: string;
}

// Key landmarks for optical flow tracking
// Nose: 0, Left/Right Shoulder: 11/12, Left/Right Elbow: 13/14
// Left/Right Wrist: 15/16, Left/Right Hip: 23/24
// Left/Right Knee: 25/26, Left/Right Ankle: 27/28
const OPTICAL_FLOW_LANDMARKS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

// Colors for different body parts
const LANDMARK_COLORS: Record<number, string> = {
  0: '#FF6B6B',   // Nose - Red
  11: '#4ECDC4',  // Left Shoulder - Teal
  12: '#4ECDC4',  // Right Shoulder
  13: '#45B7D1',  // Left Elbow - Blue
  14: '#45B7D1',  // Right Elbow
  15: '#96CEB4',  // Left Wrist - Green
  16: '#96CEB4',  // Right Wrist
  23: '#FFEAA7',  // Left Hip - Yellow
  24: '#FFEAA7',  // Right Hip
  25: '#DDA0DD',  // Left Knee - Plum
  26: '#DDA0DD',  // Right Knee
  27: '#FF8C00',  // Left Ankle - Orange
  28: '#FF8C00',  // Right Ankle
};

// Pose connections for skeleton
const POSE_CONNECTIONS: [number, number][] = [
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
];

// MediaPipe Pose Results interface
interface PoseResults {
  poseLandmarks?: Landmark[];
  image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;
}

// MediaPipe Pose interface
interface MediaPipePose {
  setOptions: (options: Record<string, unknown>) => void;
  onResults: (callback: (results: PoseResults) => void) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
  close: () => void;
}

interface UseMediaPipePoseOptions {
  onResults?: (results: PoseResults) => void;
  enabled?: boolean;
}

// Load MediaPipe Pose from CDN
const loadPoseScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as unknown as { Pose?: unknown }).Pose) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load MediaPipe Pose'));
    document.head.appendChild(script);
  });
};

export function useMediaPipePose(
  videoRef: React.RefObject<HTMLVideoElement>,
  options: UseMediaPipePoseOptions = {}
) {
  const { onResults, enabled = true } = options;
  
  const poseRef = useRef<MediaPipePose | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Optical flow history
  const flowHistoryRef = useRef<Map<number, { x: number; y: number }[]>>(new Map());
  const [opticalFlowPoints, setOpticalFlowPoints] = useState<OpticalFlowPoint[]>([]);
  
  const MAX_FLOW_HISTORY = 15;

  const handleResults = useCallback((results: PoseResults) => {
    if (results.poseLandmarks) {
      setLandmarks(results.poseLandmarks);
      
      // Update optical flow for key landmarks
      const newFlowPoints: OpticalFlowPoint[] = [];
      
      OPTICAL_FLOW_LANDMARKS.forEach((idx) => {
        const landmark = results.poseLandmarks?.[idx];
        if (landmark && landmark.visibility && landmark.visibility > 0.5) {
          const history = flowHistoryRef.current.get(idx) || [];
          const currentPos = { x: landmark.x, y: landmark.y };
          
          history.push(currentPos);
          
          while (history.length > MAX_FLOW_HISTORY) {
            history.shift();
          }
          
          flowHistoryRef.current.set(idx, history);
          
          if (history.length >= 2) {
            const prevPos = history[history.length - 2];
            newFlowPoints.push({
              id: idx,
              x: currentPos.x,
              y: currentPos.y,
              prevX: prevPos.x,
              prevY: prevPos.y,
              color: LANDMARK_COLORS[idx] || '#FFFFFF',
            });
          }
        }
      });
      
      setOpticalFlowPoints(newFlowPoints);
    }
    
    onResults?.(results);
  }, [onResults]);

  useEffect(() => {
    if (!enabled || !videoRef.current) return;

    let isMounted = true;

    const initPose = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load MediaPipe Pose script from CDN
        await loadPoseScript();

        // Get Pose constructor from window
        const PoseConstructor = (window as unknown as { Pose: new (config: { locateFile: (file: string) => string }) => MediaPipePose }).Pose;
        
        if (!PoseConstructor) {
          throw new Error('MediaPipe Pose not loaded');
        }

        const pose = new PoseConstructor({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
          },
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        pose.onResults(handleResults);

        poseRef.current = pose;

        // Use requestAnimationFrame to send frames from existing video
        const processFrame = async () => {
          if (poseRef.current && videoRef.current && videoRef.current.readyState >= 2) {
            try {
              await poseRef.current.send({ image: videoRef.current });
            } catch (e) {
              // Ignore frame processing errors
            }
          }
          if (isMounted) {
            animationFrameRef.current = requestAnimationFrame(processFrame);
          }
        };

        // Wait for video to be ready then start processing
        const startProcessing = () => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            processFrame();
          } else if (videoRef.current) {
            videoRef.current.addEventListener('loadeddata', processFrame, { once: true });
          }
        };

        startProcessing();

        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('MediaPipe Pose initialization error:', err);
        if (isMounted) {
          setError('Failed to initialize pose detection');
          setIsLoading(false);
        }
      }
    };

    initPose();

    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (poseRef.current) {
        poseRef.current.close();
        poseRef.current = null;
      }
      flowHistoryRef.current.clear();
    };
  }, [enabled, handleResults]);

  const getFlowHistory = useCallback((landmarkIdx: number): { x: number; y: number }[] => {
    return flowHistoryRef.current.get(landmarkIdx) || [];
  }, []);

  return {
    landmarks,
    opticalFlowPoints,
    getFlowHistory,
    isLoading,
    error,
    connections: POSE_CONNECTIONS,
  };
}

// Export for external use
export { OPTICAL_FLOW_LANDMARKS, LANDMARK_COLORS, POSE_CONNECTIONS };
