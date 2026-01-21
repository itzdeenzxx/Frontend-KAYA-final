import { useEffect, useRef, useState, useCallback } from 'react';

interface HandPosition {
  x: number;
  y: number;
  isDetected: boolean;
}

interface GestureState {
  isCasting: boolean;      // กำลังเขวี้ยงเบ็ด
  isSlapping: boolean;     // กำลังตบ/โบกลง
  slapCount: number;       // จำนวนครั้งที่ตบ
  isIdle: boolean;         // หยุดนิ่ง
  idleTime: number;        // เวลาที่หยุดนิ่ง (วินาที)
}

interface UseFishingGameReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  rightHand: HandPosition | null;
  gesture: GestureState;
  isLoading: boolean;
  error: string | null;
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

export function useFishingGame(): UseFishingGameReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rightHand, setRightHand] = useState<HandPosition | null>(null);
  const [gesture, setGesture] = useState<GestureState>({
    isCasting: false,
    isSlapping: false,
    slapCount: 0,
    isIdle: false,
    idleTime: 0
  });

  // History for gesture detection
  const rightWristHistory = useRef<{ x: number; y: number; time: number }[]>([]);
  const leftWristHistory = useRef<{ x: number; y: number; time: number }[]>([]);
  const lastCastTime = useRef<number>(0);
  const idleStartTime = useRef<number | null>(null);
  const lastMovementTime = useRef<number>(Date.now());
  
  // Slap detection (ตบลง) - Both hands
  const slapCountRef = useRef<number>(0);
  const lastSlapTime = useRef<number>(0);
  // Right hand slap tracking
  const lastYRight = useRef<number>(0);
  const movingDownRight = useRef<boolean>(false);
  const lastSlapTimeRight = useRef<number>(0);
  // Left hand slap tracking  
  const lastYLeft = useRef<number>(0);
  const movingDownLeft = useRef<boolean>(false);
  const lastSlapTimeLeft = useRef<number>(0);

  const onResults = useCallback((results: any) => {
    try {
      if (!canvasRef.current || !results) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Mirror the video
      if (results.image) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
      }
      ctx.restore();
    
    const now = Date.now();
    
    if (results.poseLandmarks) {
      const landmarks = results.poseLandmarks;
      const rightWrist = landmarks[16];
      const leftWrist = landmarks[15];
      const rightElbow = landmarks[14];
      const rightShoulder = landmarks[12];
      
      let isCasting = false;
      let isSlapping = false;
      let slapCount = slapCountRef.current;
      let isIdle = false;
      let idleTime = 0;
      
      const slapThreshold = 0.03; // ปรับเป็น 0.015 (1.5%) - ตรวจจับได้ง่ายมาก!
      const slapCooldown = 300; // ปรับเป็น 150ms - โบกได้เร็วขึ้น!
      
      let rightHandSlapped = false;
      let leftHandSlapped = false;
      
      // ========== RIGHT HAND DETECTION ==========
      if (rightWrist && rightWrist.visibility > 0.5) { // ลดเป็น 0.3 - ตรวจจับได้ง่ายขึ้น
        setRightHand({
          x: 1 - rightWrist.x,
          y: rightWrist.y,
          isDetected: true
        });
        
        // Track wrist history
        rightWristHistory.current.push({ x: rightWrist.x, y: rightWrist.y, time: now });
        if (rightWristHistory.current.length > 30) {
          rightWristHistory.current.shift();
        }
        
        // Calculate movement for right hand
        let totalMovementRight = 0;
        if (rightWristHistory.current.length >= 5) {
          const recent = rightWristHistory.current.slice(-5);
          for (let i = 1; i < recent.length; i++) {
            const dx = recent[i].x - recent[i-1].x;
            const dy = recent[i].y - recent[i-1].y;
            totalMovementRight += Math.sqrt(dx * dx + dy * dy);
          }
        }
        
        // 1. CASTING detection - แขนเคลื่อนจากบนลงล่างเร็วๆ (ใช้มือขวา)
        if (rightWristHistory.current.length >= 8 && now - lastCastTime.current > 2000) {
          const recent = rightWristHistory.current.slice(-8);
          const first = recent[0];
          const last = recent[recent.length - 1];
          
          const yMovement = last.y - first.y; // ลงล่าง = positive
          const timeSpan = last.time - first.time;
          const speed = yMovement / (timeSpan / 1000);
          
          // Fast downward motion
          if (yMovement > 0.12 && speed > 0.25) {
            isCasting = true;
            lastCastTime.current = now;
            rightWristHistory.current = [];
          }
        }
        
        // 2. RIGHT HAND SLAP detection - ตบลงเร็วๆ
        const currentYRight = rightWrist.y;
        const yDiffRight = currentYRight - lastYRight.current;
        
        // ตรวจจับการเคลื่อนลง
        if (yDiffRight > slapThreshold && !movingDownRight.current && now - lastSlapTimeRight.current > slapCooldown) {
          movingDownRight.current = true;
          slapCountRef.current += 1;
          slapCount = slapCountRef.current;
          lastSlapTimeRight.current = now;
          lastSlapTime.current = now;
          rightHandSlapped = true;
          lastMovementTime.current = now;
          idleStartTime.current = null;
          console.log('👋 RIGHT SLAP!', slapCount, 'yDiff:', yDiffRight.toFixed(3));
        } else if (yDiffRight < -0.02) {
          // มือเลื่อนขึ้น - reset
          movingDownRight.current = false;
        }
        
        lastYRight.current = currentYRight;
        
        // IDLE detection for right hand
        if (totalMovementRight < 0.01) {
          if (idleStartTime.current === null) {
            idleStartTime.current = now;
          }
          idleTime = (now - idleStartTime.current) / 1000;
          if (idleTime >= 1) {
            isIdle = true;
          }
        } else {
          idleStartTime.current = null;
        }
      } else {
        setRightHand(null);
      }
      
      // ========== LEFT HAND DETECTION ==========
      if (leftWrist && leftWrist.visibility > 0.5) { // ลดเป็น 0.3 - ตรวจจับได้ง่ายขึ้น
        // Track left wrist history
        leftWristHistory.current.push({ x: leftWrist.x, y: leftWrist.y, time: now });
        if (leftWristHistory.current.length > 30) {
          leftWristHistory.current.shift();
        }
        
        // LEFT HAND SLAP detection - ตบลงเร็วๆ
        const currentYLeft = leftWrist.y;
        const yDiffLeft = currentYLeft - lastYLeft.current;
        
        // ตรวจจับการเคลื่อนลง
        if (yDiffLeft > slapThreshold && !movingDownLeft.current && now - lastSlapTimeLeft.current > slapCooldown) {
          movingDownLeft.current = true;
          slapCountRef.current += 1;
          slapCount = slapCountRef.current;
          lastSlapTimeLeft.current = now;
          lastSlapTime.current = now;
          leftHandSlapped = true;
          lastMovementTime.current = now;
          idleStartTime.current = null;
          console.log('👋 LEFT SLAP!', slapCount, 'yDiff:', yDiffLeft.toFixed(3));
        } else if (yDiffLeft < -0.02) {
          // มือเลื่อนขึ้น - reset
          movingDownLeft.current = false;
        }
        
        lastYLeft.current = currentYLeft;
      }
      
      // Set isSlapping if either hand slapped recently
      isSlapping = rightHandSlapped || leftHandSlapped || (now - lastSlapTime.current < 300);
      
      setGesture({ isCasting, isSlapping, slapCount, isIdle, idleTime });
      
      // Draw skeleton
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      
      if (window.drawConnectors && window.POSE_CONNECTIONS) {
        window.drawConnectors(ctx, landmarks, window.POSE_CONNECTIONS, {
          color: 'rgba(0, 200, 255, 0.4)',
          lineWidth: 4
        });
      }
      ctx.restore();
      
      // Draw right hand indicator
      if (rightWrist && rightWrist.visibility > 0.5) {
        const rx = (1 - rightWrist.x) * canvas.width;
        const ry = rightWrist.y * canvas.height;
        
        ctx.shadowColor = isSlapping ? '#00ff00' : '#ff0000ff';
        ctx.shadowBlur = 20;
        ctx.fillStyle = isSlapping ? '#00ff00' : '#ff0000ff';
        ctx.beginPath();
        ctx.arc(rx, ry, 15, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      
      // Draw left hand indicator
      if (leftWrist && leftWrist.visibility > 0.5) {
        const lx = (1 - leftWrist.x) * canvas.width;
        const ly = leftWrist.y * canvas.height;
        
        ctx.shadowColor = isSlapping ? '#00ff00' : '#ff0000ff';
        ctx.shadowBlur = 20;
        ctx.fillStyle = isSlapping ? '#00ff00' : '#ff0000ff';
        ctx.beginPath();
        ctx.arc(lx, ly, 15, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    } else {
      setRightHand(null);
      setGesture({ isCasting: false, isSlapping: false, slapCount: slapCountRef.current, isIdle: true, idleTime: 0 });
    }
    } catch (err) {
      console.error('Error in onResults:', err);
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
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        
        pose.onResults(onResults);
        poseRef.current = pose;
        
        const camera = new window.Camera(videoRef.current!, {
          onFrame: async () => {
            if (poseRef.current && videoRef.current) {
              const video = videoRef.current;
              if (video.readyState >= 2 && video.videoWidth > 0) {
                await poseRef.current.send({ image: video });
              }
            }
          },
          width: 640,
          height: 480
        });
        
        cameraRef.current = camera;
        await camera.start();
        setIsLoading(false);
      } catch (err) {
        console.error('MediaPipe error:', err);
        setError('ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการเข้าถึงกล้อง');
        setIsLoading(false);
      }
    };

    initPose();

    return () => {
      cameraRef.current?.stop();
      poseRef.current?.close();
    };
  }, [onResults]);

  return { videoRef, canvasRef, rightHand, gesture, isLoading, error };
}
