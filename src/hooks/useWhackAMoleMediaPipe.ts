import { useEffect, useRef, useState, useCallback } from 'react';

interface HandPosition {
  x: number;
  y: number;
  isDetected: boolean;
  isSmashing: boolean; // กำลังทุบอยู่ (เคลื่อนที่เร็ว)
  isFist: boolean; // ใช้แทนสถานะ "แขนพร้อมทุบ"
}

interface UseWhackAMoleMediaPipeReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  leftHand: HandPosition | null;
  rightHand: HandPosition | null;
  isLoading: boolean;
  error: string | null;
  isBodyInFrame: boolean;
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

// MediaPipe Pose landmark indices สำหรับแขน
const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
};

// กรอบตรวจจับว่าผู้ใช้ยืนอยู่ในเฟรมหรือเปล่า (normalized 0-1)
const BODY_FRAME = {
  left: 0.25,
  right: 0.75,
  top: 0.05,
  bottom: 0.70,
};

export function useWhackAMoleMediaPipe(): UseWhackAMoleMediaPipeReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leftHand, setLeftHand] = useState<HandPosition | null>(null);
  const [rightHand, setRightHand] = useState<HandPosition | null>(null);
  const [isBodyInFrame, setIsBodyInFrame] = useState(false);
  
  // สำหรับตรวจจับการทุบ (Optical Flow - velocity tracking) ที่ข้อมือ
  const lastLeftPos = useRef<{ x: number; y: number } | null>(null);
  const lastRightPos = useRef<{ x: number; y: number } | null>(null);
  const lastFrameTime = useRef<number>(0);
  
  // Smash buffer - เก็บว่าเพิ่งทุบไปหรือเปล่า (ช่วยไม่ให้หลุดเฟรม)
  const leftSmashBuffer = useRef<number>(0);
  const rightSmashBuffer = useRef<number>(0);
  const SMASH_BUFFER_TIME = 300; // 300ms ที่ยังถือว่าอยู่ในสถานะทุบ
  const SMASH_VELOCITY_THRESHOLD = 0.002; // velocity magnitude threshold (optical flow)

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
    
    const now = performance.now();
    const deltaTime = lastFrameTime.current > 0 ? now - lastFrameTime.current : 16;
    lastFrameTime.current = now;
    
    let detectedLeftHand: HandPosition | null = null;
    let detectedRightHand: HandPosition | null = null;
    
    if (results.poseLandmarks) {
      const landmarks = results.poseLandmarks;
      const MIN_VISIBILITY = 0.5;

      // === ตรวจจับว่าผู้ใช้อยู่ในเฟรมหรือไม่ ===
      const nose = landmarks[POSE_LANDMARKS.NOSE];
      const lSh = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
      const rSh = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
      const bodyInFrame = !!(nose && lSh && rSh &&
        (nose.visibility ?? 0) > MIN_VISIBILITY &&
        (lSh.visibility ?? 0) > MIN_VISIBILITY &&
        (rSh.visibility ?? 0) > MIN_VISIBILITY &&
        nose.x > BODY_FRAME.left && nose.x < BODY_FRAME.right &&
        nose.y > BODY_FRAME.top && nose.y < BODY_FRAME.bottom &&
        lSh.x > BODY_FRAME.left && lSh.x < BODY_FRAME.right &&
        lSh.y > BODY_FRAME.top && lSh.y < BODY_FRAME.bottom &&
        rSh.x > BODY_FRAME.left && rSh.x < BODY_FRAME.right &&
        rSh.y > BODY_FRAME.top && rSh.y < BODY_FRAME.bottom);
      setIsBodyInFrame(bodyInFrame);

      // === แขนขวา (Pose RIGHT = หน้าจอซ้าย เพราะ mirror) ===
      const rShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
      const rElbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];
      const rWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];
      
      if (rWrist && rElbow && rShoulder &&
          (rWrist.visibility ?? 0) > MIN_VISIBILITY &&
          (rElbow.visibility ?? 0) > MIN_VISIBILITY) {
        
        const wristX = rWrist.x;
        const wristY = rWrist.y;
        
        // คำนวณ Optical Flow velocity ที่ข้อมือขวา
        let rightSmashing = false;
        if (lastRightPos.current !== null) {
          const dx = wristX - lastRightPos.current.x;
          const dy = wristY - lastRightPos.current.y;
          const velocityMag = Math.sqrt(dx * dx + dy * dy) / deltaTime;
          if (velocityMag > SMASH_VELOCITY_THRESHOLD) {
            rightSmashing = true;
            rightSmashBuffer.current = now;
          }
        }
        if (now - rightSmashBuffer.current < SMASH_BUFFER_TIME) {
          rightSmashing = true;
        }
        lastRightPos.current = { x: wristX, y: wristY };
        
        detectedRightHand = {
          x: 1 - wristX, // Mirror X
          y: wristY,
          isDetected: true,
          isSmashing: rightSmashing,
          isFist: true, // Pose ไม่ตรวจนิ้ว - ถือว่าแขนพร้อมตีเสมอ
        };
        
        // วาดแขนขวา (shoulder → elbow → wrist)
        drawArm(ctx, canvas, rShoulder, rElbow, rWrist, rightSmashing, now, rightSmashBuffer.current);
      } else {
        lastRightPos.current = null;
      }
      
      // === แขนซ้าย (Pose LEFT = หน้าจอขวา เพราะ mirror) ===
      const lShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
      const lElbow = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
      const lWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
      
      if (lWrist && lElbow && lShoulder &&
          (lWrist.visibility ?? 0) > MIN_VISIBILITY &&
          (lElbow.visibility ?? 0) > MIN_VISIBILITY) {
        
        const wristX = lWrist.x;
        const wristY = lWrist.y;
        
        // คำนวณ Optical Flow velocity ที่ข้อมือซ้าย
        let leftSmashing = false;
        if (lastLeftPos.current !== null) {
          const dx = wristX - lastLeftPos.current.x;
          const dy = wristY - lastLeftPos.current.y;
          const velocityMag = Math.sqrt(dx * dx + dy * dy) / deltaTime;
          if (velocityMag > SMASH_VELOCITY_THRESHOLD) {
            leftSmashing = true;
            leftSmashBuffer.current = now;
          }
        }
        if (now - leftSmashBuffer.current < SMASH_BUFFER_TIME) {
          leftSmashing = true;
        }
        lastLeftPos.current = { x: wristX, y: wristY };
        
        detectedLeftHand = {
          x: 1 - wristX, // Mirror X
          y: wristY,
          isDetected: true,
          isSmashing: leftSmashing,
          isFist: true,
        };
        
        // วาดแขนซ้าย
        drawArm(ctx, canvas, lShoulder, lElbow, lWrist, leftSmashing, now, leftSmashBuffer.current);
      } else {
        lastLeftPos.current = null;
      }
    } else {
      lastLeftPos.current = null;
      lastRightPos.current = null;
    }
    
    setLeftHand(detectedLeftHand);
    setRightHand(detectedRightHand);
  }, []);

  // วาดแขน (shoulder → elbow → wrist) พร้อม visual feedback
  function drawArm(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    shoulder: any, elbow: any, wrist: any,
    isSmashing: boolean,
    now: number, smashBufferTime: number
  ) {
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    
    const armColor = isSmashing ? '#ff0000' : '#00ff00';
    
    const pts = [shoulder, elbow, wrist];
    
    // วาดเส้นเชื่อม shoulder → elbow → wrist
    ctx.strokeStyle = armColor;
    ctx.lineWidth = isSmashing ? 5 : 3;
    ctx.shadowColor = armColor;
    ctx.shadowBlur = isSmashing ? 20 : 8;
    ctx.beginPath();
    ctx.moveTo(shoulder.x * canvas.width, shoulder.y * canvas.height);
    ctx.lineTo(elbow.x * canvas.width, elbow.y * canvas.height);
    ctx.lineTo(wrist.x * canvas.width, wrist.y * canvas.height);
    ctx.stroke();
    
    // วาดจุด landmark ที่ shoulder, elbow, wrist
    pts.forEach((pt, idx) => {
      ctx.fillStyle = idx === 2 ? '#ffffff' : armColor;
      ctx.shadowColor = armColor;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(pt.x * canvas.width, pt.y * canvas.height, idx === 2 ? 8 : 5, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // วาดวงกลมที่ข้อมือ (จุดตี)
    const wX = wrist.x * canvas.width;
    const wY = wrist.y * canvas.height;
    
    const circleColor = isSmashing ? '#ff0000' : '#00ff00';
    ctx.shadowColor = circleColor;
    ctx.shadowBlur = isSmashing ? 30 : 10;
    ctx.strokeStyle = circleColor;
    ctx.lineWidth = isSmashing ? 5 : 3;
    ctx.beginPath();
    ctx.arc(wX, wY, isSmashing ? 35 : 20, 0, 2 * Math.PI);
    ctx.stroke();
    
    // วาด icon - แสดงสถานะ: ทุบ=💥, ปกติ=👊
    ctx.shadowBlur = 0;
    ctx.font = isSmashing ? '26px Arial' : '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(isSmashing ? '💥' : '👊', wX, wY + 5);
    
    ctx.restore();
  }

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const loadScripts = async () => {
      // Load MediaPipe Pose scripts from CDN
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
        
        // ปรับ settings สำหรับ arm tracking
        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.6,
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
        
        await waitForVideo();
        setIsLoading(false);
      } catch (err) {
        console.error('MediaPipe Pose initialization error:', err);
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
    leftHand,
    rightHand,
    isLoading,
    error,
    isBodyInFrame,
  };
}
