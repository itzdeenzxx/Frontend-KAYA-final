import { useEffect, useRef, useState, useCallback } from 'react';

interface PoseData {
  leftAnkleY: number;
  rightAnkleY: number;
  leftKneeY: number;
  rightKneeY: number;
  isDetected: boolean;
}

interface UseGameMediaPipeReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isRunning: boolean;
  stepCount: number;
  isLoading: boolean;
  error: string | null;
  poseData: PoseData | null;
  resetSteps: () => void;
}

declare global {
  interface Window {
    Pose: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    POSE_CONNECTIONS: any;
  }
}

export function useGameMediaPipe(): UseGameMediaPipeReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  
  const [isRunning, setIsRunning] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [poseData, setPoseData] = useState<PoseData | null>(null);
  
  // Running detection state
  const lastLeftAnkleY = useRef<number | null>(null);
  const lastRightAnkleY = useRef<number | null>(null);
  const leftPhase = useRef<'up' | 'down'>('down');
  const rightPhase = useRef<'up' | 'down'>('down');
  const lastStepTime = useRef<number>(0);
  const movementHistory = useRef<number[]>([]);
  const runningThreshold = 0.012; // Lowered for better sensitivity
  const minStepInterval = 100; // Faster step counting
  
  const resetSteps = useCallback(() => {
    setStepCount(0);
    lastLeftAnkleY.current = null;
    lastRightAnkleY.current = null;
    leftPhase.current = 'down';
    rightPhase.current = 'down';
    movementHistory.current = [];
  }, []);

  const onResults = useCallback((results: any) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear and draw video
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Mirror the video
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    
    if (results.poseLandmarks) {
      const landmarks = results.poseLandmarks;
      
      // Get ankle and knee positions (normalized 0-1)
      const leftAnkle = landmarks[27];
      const rightAnkle = landmarks[28];
      const leftKnee = landmarks[25];
      const rightKnee = landmarks[26];
      
      if (leftAnkle && rightAnkle && leftKnee && rightKnee) {
        const currentPoseData: PoseData = {
          leftAnkleY: leftAnkle.y,
          rightAnkleY: rightAnkle.y,
          leftKneeY: leftKnee.y,
          rightKneeY: rightKnee.y,
          isDetected: true
        };
        setPoseData(currentPoseData);
        
        // Running detection logic
        const now = Date.now();
        
        if (lastLeftAnkleY.current !== null && lastRightAnkleY.current !== null) {
          const leftMovement = Math.abs(leftAnkle.y - lastLeftAnkleY.current);
          const rightMovement = Math.abs(rightAnkle.y - lastRightAnkleY.current);
          const totalMovement = leftMovement + rightMovement;
          
          // Track movement history for running detection
          movementHistory.current.push(totalMovement);
          if (movementHistory.current.length > 8) {
            movementHistory.current.shift();
          }
          
          // Calculate average movement
          const avgMovement = movementHistory.current.reduce((a, b) => a + b, 0) / movementHistory.current.length;
          
          // Detect if running (consistent movement above threshold)
          const isCurrentlyRunning = avgMovement > runningThreshold && movementHistory.current.length >= 4;
          setIsRunning(isCurrentlyRunning);
          
          // Step counting - detect phase changes
          const leftCurrentPhase = leftAnkle.y < lastLeftAnkleY.current ? 'up' : 'down';
          const rightCurrentPhase = rightAnkle.y < lastRightAnkleY.current ? 'up' : 'down';
          
          // Count step when leg goes from down to up (lifting)
          if (leftCurrentPhase === 'up' && leftPhase.current === 'down' && 
              leftMovement > runningThreshold && (now - lastStepTime.current) > minStepInterval) {
            setStepCount(prev => prev + 1);
            lastStepTime.current = now;
          }
          
          if (rightCurrentPhase === 'up' && rightPhase.current === 'down' && 
              rightMovement > runningThreshold && (now - lastStepTime.current) > minStepInterval) {
            setStepCount(prev => prev + 1);
            lastStepTime.current = now;
          }
          
          leftPhase.current = leftCurrentPhase;
          rightPhase.current = rightCurrentPhase;
        }
        
        lastLeftAnkleY.current = leftAnkle.y;
        lastRightAnkleY.current = rightAnkle.y;
        
        // Draw skeleton overlay
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        
        // Draw connections using global function if available
        if (window.drawConnectors && window.POSE_CONNECTIONS) {
          window.drawConnectors(ctx, landmarks, window.POSE_CONNECTIONS, {
            color: 'rgba(0, 255, 150, 0.6)',
            lineWidth: 3
          });
        }
        
        // Draw key points (ankles and knees)
        ctx.fillStyle = '#00ff96';
        [leftAnkle, rightAnkle, leftKnee, rightKnee].forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x * canvas.width, point.y * canvas.height, 8, 0, 2 * Math.PI);
          ctx.fill();
        });
        
        ctx.restore();
      }
    } else {
      setPoseData({ leftAnkleY: 0, rightAnkleY: 0, leftKneeY: 0, rightKneeY: 0, isDetected: false });
      setIsRunning(false);
    }
  }, []);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const loadScripts = async () => {
      // Load MediaPipe scripts from CDN
      const scripts = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js'
      ];

      for (const src of scripts) {
        if (!document.querySelector(`script[src="${src}"]`)) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.crossOrigin = 'anonymous';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(script);
          });
        }
      }
    };

    const initPose = async () => {
      try {
        setIsLoading(true);
        
        await loadScripts();
        
        // Wait a bit for scripts to initialize
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!window.Pose) {
          throw new Error('MediaPipe Pose not loaded');
        }
        
        const pose = new window.Pose({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
          }
        });
        
        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        
        pose.onResults(onResults);
        poseRef.current = pose;
        
        // Wait for video element to be ready with valid dimensions
        const waitForVideo = (): Promise<void> => {
          return new Promise((resolve) => {
            const video = videoRef.current!;
            const checkReady = () => {
              if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
                resolve();
              } else {
                requestAnimationFrame(checkReady);
              }
            };
            video.addEventListener('loadeddata', () => checkReady(), { once: true });
            checkReady();
          });
        };
        
        const camera = new window.Camera(videoRef.current!, {
          onFrame: async () => {
            if (poseRef.current && videoRef.current) {
              const video = videoRef.current;
              // Only send frame if video has valid dimensions
              if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
                await poseRef.current.send({ image: video });
              }
            }
          },
          width: 640,
          height: 480
        });
        
        cameraRef.current = camera;
        await camera.start();
        
        // Wait for video to be ready before marking loading as complete
        await waitForVideo();
        setIsLoading(false);
      } catch (err) {
        console.error('MediaPipe initialization error:', err);
        setError('Failed to initialize camera. Please ensure camera permissions are granted.');
        setIsLoading(false);
      }
    };

    initPose();

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (poseRef.current) {
        poseRef.current.close();
      }
    };
  }, [onResults]);

  return {
    videoRef,
    canvasRef,
    isRunning,
    stepCount,
    isLoading,
    error,
    poseData,
    resetSteps
  };
}
