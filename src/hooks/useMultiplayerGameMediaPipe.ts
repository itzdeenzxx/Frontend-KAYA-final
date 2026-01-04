import { useEffect, useRef, useState, useCallback } from 'react';

interface PlayerPoseData {
  isRunning: boolean;
  stepCount: number;
  movementAmount: number;
}

interface UseMultiplayerGameMediaPipeReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  leftPlayer: PlayerPoseData;
  rightPlayer: PlayerPoseData;
  isLoading: boolean;
  error: string | null;
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

export function useMultiplayerGameMediaPipe(): UseMultiplayerGameMediaPipeReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [leftPlayer, setLeftPlayer] = useState<PlayerPoseData>({
    isRunning: false,
    stepCount: 0,
    movementAmount: 0
  });
  
  const [rightPlayer, setRightPlayer] = useState<PlayerPoseData>({
    isRunning: false,
    stepCount: 0,
    movementAmount: 0
  });
  
  // Movement tracking for both sides
  const leftLastY = useRef<number | null>(null);
  const rightLastY = useRef<number | null>(null);
  const leftHistory = useRef<number[]>([]);
  const rightHistory = useRef<number[]>([]);
  const leftPhase = useRef<'up' | 'down'>('down');
  const rightPhase = useRef<'up' | 'down'>('down');
  const leftStepTime = useRef<number>(0);
  const rightStepTime = useRef<number>(0);
  const leftStepCount = useRef<number>(0);
  const rightStepCount = useRef<number>(0);
  
  const runningThreshold = 0.015;
  const minStepInterval = 150;
  
  const resetSteps = useCallback(() => {
    leftStepCount.current = 0;
    rightStepCount.current = 0;
    leftHistory.current = [];
    rightHistory.current = [];
    setLeftPlayer({ isRunning: false, stepCount: 0, movementAmount: 0 });
    setRightPlayer({ isRunning: false, stepCount: 0, movementAmount: 0 });
  }, []);

  const onResults = useCallback((results: any) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Draw center divider line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Labels
    ctx.font = 'bold 16px Fredoka';
    ctx.fillStyle = 'hsl(200 75% 60%)';
    ctx.fillText('← Player 1', 10, 30);
    ctx.fillStyle = 'hsl(340 75% 65%)';
    ctx.textAlign = 'right';
    ctx.fillText('Player 2 →', canvas.width - 10, 30);
    ctx.textAlign = 'left';

    if (results.poseLandmarks) {
      const landmarks = results.poseLandmarks;
      const now = Date.now();
      
      // Get hip position to determine if this pose is on left or right side
      const leftHip = landmarks[23];
      const rightHip = landmarks[24];
      const hipCenterX = (leftHip.x + rightHip.x) / 2;
      
      const leftAnkle = landmarks[27];
      const rightAnkle = landmarks[28];
      
      // Mirror the X coordinate for correct side detection
      const mirroredHipX = 1 - hipCenterX;
      const isLeftSide = mirroredHipX < 0.5;
      
      if (leftAnkle && rightAnkle) {
        const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2;
        
        if (isLeftSide) {
          // Update left player
          if (leftLastY.current !== null) {
            const movement = Math.abs(avgAnkleY - leftLastY.current);
            leftHistory.current.push(movement);
            if (leftHistory.current.length > 8) leftHistory.current.shift();
            
            const avgMovement = leftHistory.current.reduce((a, b) => a + b, 0) / leftHistory.current.length;
            const isRunning = avgMovement > runningThreshold && leftHistory.current.length >= 4;
            
            // Step counting
            const currentPhase = avgAnkleY < leftLastY.current ? 'up' : 'down';
            if (currentPhase === 'up' && leftPhase.current === 'down' && 
                movement > runningThreshold && (now - leftStepTime.current) > minStepInterval) {
              leftStepCount.current++;
              leftStepTime.current = now;
            }
            leftPhase.current = currentPhase;
            
            setLeftPlayer({
              isRunning,
              stepCount: leftStepCount.current,
              movementAmount: avgMovement
            });
          }
          leftLastY.current = avgAnkleY;
        } else {
          // Update right player
          if (rightLastY.current !== null) {
            const movement = Math.abs(avgAnkleY - rightLastY.current);
            rightHistory.current.push(movement);
            if (rightHistory.current.length > 8) rightHistory.current.shift();
            
            const avgMovement = rightHistory.current.reduce((a, b) => a + b, 0) / rightHistory.current.length;
            const isRunning = avgMovement > runningThreshold && rightHistory.current.length >= 4;
            
            // Step counting
            const currentPhase = avgAnkleY < rightLastY.current ? 'up' : 'down';
            if (currentPhase === 'up' && rightPhase.current === 'down' && 
                movement > runningThreshold && (now - rightStepTime.current) > minStepInterval) {
              rightStepCount.current++;
              rightStepTime.current = now;
            }
            rightPhase.current = currentPhase;
            
            setRightPlayer({
              isRunning,
              stepCount: rightStepCount.current,
              movementAmount: avgMovement
            });
          }
          rightLastY.current = avgAnkleY;
        }
        
        // Draw skeleton
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        
        const color = isLeftSide ? 'rgba(100, 180, 255, 0.8)' : 'rgba(255, 150, 180, 0.8)';
        
        if (window.drawConnectors && window.POSE_CONNECTIONS) {
          window.drawConnectors(ctx, landmarks, window.POSE_CONNECTIONS, {
            color,
            lineWidth: 3
          });
        }
        
        ctx.fillStyle = color;
        [leftAnkle, rightAnkle, landmarks[25], landmarks[26]].forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x * canvas.width, point.y * canvas.height, 8, 0, 2 * Math.PI);
          ctx.fill();
        });
        
        ctx.restore();
      }
    }
  }, []);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const loadScripts = async () => {
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
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!window.Pose) {
          throw new Error('MediaPipe Pose not loaded');
        }
        
        const pose = new window.Pose({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
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
          width: 1280,
          height: 720
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
      if (cameraRef.current) cameraRef.current.stop();
      if (poseRef.current) poseRef.current.close();
    };
  }, [onResults]);

  return {
    videoRef,
    canvasRef,
    leftPlayer,
    rightPlayer,
    isLoading,
    error,
    resetSteps
  };
}
