import { useEffect, useRef, useState, useCallback } from 'react';

interface HandPosition {
  x: number;
  y: number;
  isDetected: boolean;
  isSmashing: boolean; // กำลังทุบอยู่ (เคลื่อนที่ลงเร็ว)
  isFist: boolean; // กำมืออยู่
}

interface UseWhackAMoleMediaPipeReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  leftHand: HandPosition | null;
  rightHand: HandPosition | null;
  isLoading: boolean;
  error: string | null;
}

declare global {
  interface Window {
    Hands: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    HAND_CONNECTIONS: any;
  }
}

export function useWhackAMoleMediaPipe(): UseWhackAMoleMediaPipeReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leftHand, setLeftHand] = useState<HandPosition | null>(null);
  const [rightHand, setRightHand] = useState<HandPosition | null>(null);
  
  // สำหรับตรวจจับการทุบ (velocity tracking)
  const lastLeftY = useRef<number | null>(null);
  const lastRightY = useRef<number | null>(null);
  const lastFrameTime = useRef<number>(0);
  
  // Smash buffer - เก็บว่าเพิ่งทุบไปหรือเปล่า (ช่วยไม่ให้หลุดเฟรม)
  const leftSmashBuffer = useRef<number>(0);
  const rightSmashBuffer = useRef<number>(0);
  const SMASH_BUFFER_TIME = 250; // เพิ่มเป็น 250ms ที่ยังถือว่าอยู่ในสถานะทุบ
  const SMASH_VELOCITY_THRESHOLD = 0.003; // ลดลงมากเพื่อ detect ง่ายขึ้น
  
  // ฟังก์ชันตรวจจับกำมือ (Fist detection)
  const detectFist = useCallback((landmarks: any[]): boolean => {
    // ตรวจสอบว่านิ้วพับอยู่หรือเปล่า
    // โดยเทียบตำแหน่งปลายนิ้วกับ MCP joint
    // นิ้วชี้ (8), นิ้วกลาง (12), นิ้วนาง (16), นิ้วก้อย (20)
    // MCP: นิ้วชี้ (5), นิ้วกลาง (9), นิ้วนาง (13), นิ้วก้อย (17)
    
    const fingerTips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
    const fingerMcps = [landmarks[5], landmarks[9], landmarks[13], landmarks[17]];
    const wrist = landmarks[0];
    
    let foldedFingers = 0;
    
    for (let i = 0; i < 4; i++) {
      const tip = fingerTips[i];
      const mcp = fingerMcps[i];
      
      // คำนวณระยะห่างจาก wrist ไป tip และจาก wrist ไป mcp
      const tipDist = Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2));
      const mcpDist = Math.sqrt(Math.pow(mcp.x - wrist.x, 2) + Math.pow(mcp.y - wrist.y, 2));
      
      // ถ้าปลายนิ้วอยู่ใกล้ข้อมือกว่า MCP = นิ้วพับอยู่
      if (tipDist < mcpDist * 1.2) {
        foldedFingers++;
      }
    }
    
    // ถ้าพับอย่างน้อย 3 นิ้ว = กำมือ
    return foldedFingers >= 3;
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
    
    const now = performance.now();
    const deltaTime = lastFrameTime.current > 0 ? now - lastFrameTime.current : 16;
    lastFrameTime.current = now;
    
    let detectedLeftHand: HandPosition | null = null;
    let detectedRightHand: HandPosition | null = null;
    
    if (results.multiHandLandmarks && results.multiHandedness) {
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const landmarks = results.multiHandLandmarks[i];
        const handedness = results.multiHandedness[i];
        
        // คำนวณจุดกลางฝ่ามือ (palm center)
        // ใช้ wrist(0), index_mcp(5), middle_mcp(9), ring_mcp(13), pinky_mcp(17)
        const wrist = landmarks[0];
        const indexMcp = landmarks[5];
        const middleMcp = landmarks[9];
        const ringMcp = landmarks[13];
        const pinkyMcp = landmarks[17];
        
        // Palm center = average of these 5 points
        const palmX = (wrist.x + indexMcp.x + middleMcp.x + ringMcp.x + pinkyMcp.x) / 5;
        const palmY = (wrist.y + indexMcp.y + middleMcp.y + ringMcp.y + pinkyMcp.y) / 5;
        
        // Note: MediaPipe returns "Left" for what appears on the right side of the screen
        const isRightHand = handedness.label === 'Left'; // Reversed due to mirror
        
        // ตรวจจับกำมือ
        const isFist = detectFist(landmarks);
        
        // คำนวณ velocity และ smash detection
        if (isRightHand) {
          let rightSmashing = false;
          if (lastRightY.current !== null) {
            const velocityY = (palmY - lastRightY.current) / deltaTime;
            if (velocityY > SMASH_VELOCITY_THRESHOLD) {
              rightSmashing = true;
              rightSmashBuffer.current = now;
            }
          }
          // ถ้าเพิ่งทุบไปไม่นาน ยังถือว่ากำลังทุบ (smash buffer)
          if (now - rightSmashBuffer.current < SMASH_BUFFER_TIME) {
            rightSmashing = true;
          }
          lastRightY.current = palmY;
          
          detectedRightHand = {
            x: 1 - palmX, // Mirror X coordinate
            y: palmY,
            isDetected: true,
            isSmashing: rightSmashing,
            isFist: isFist
          };
        } else {
          let leftSmashing = false;
          if (lastLeftY.current !== null) {
            const velocityY = (palmY - lastLeftY.current) / deltaTime;
            if (velocityY > SMASH_VELOCITY_THRESHOLD) {
              leftSmashing = true;
              leftSmashBuffer.current = now;
            }
          }
          // ถ้าเพิ่งทุบไปไม่นาน ยังถือว่ากำลังทุบ (smash buffer)
          if (now - leftSmashBuffer.current < SMASH_BUFFER_TIME) {
            leftSmashing = true;
          }
          lastLeftY.current = palmY;
          
          detectedLeftHand = {
            x: 1 - palmX, // Mirror X coordinate
            y: palmY,
            isDetected: true,
            isSmashing: leftSmashing,
            isFist: isFist
          };
        }
        
        // วาด hand skeleton (mirrored)
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        
        const handColor = isRightHand ? '#00ff00' : '#00ff00';
      
        // วาดเส้นเชื่อมนิ้ว
        if (window.drawConnectors && window.HAND_CONNECTIONS) {
          window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
            color: handColor,
            lineWidth: 2
          });
        }
        
        // วาดจุด landmarks
        landmarks.forEach((point: any, idx: number) => {
          ctx.fillStyle = idx === 0 ? '#ffffff' : handColor;
          ctx.shadowColor = handColor;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(point.x * canvas.width, point.y * canvas.height, idx === 0 ? 5 : 3, 0, 2 * Math.PI);
          ctx.fill();
        });
        
        // วาดวงกลมที่ palm center (จุดตี)
        const mirrPalmX = palmX * canvas.width;
        const mirrPalmY = palmY * canvas.height;
        
        // Glow เมื่อกำมือ + ทุบ
        // const isSmashing = isRightHand 
        //   ? (now - rightSmashBuffer.current < SMASH_BUFFER_TIME)
        //   : (now - leftSmashBuffer.current < SMASH_BUFFER_TIME);
        
        // สีตามสถานะ: กำมือ, กำมือ=แดง, ปกติ=สีมือ
        const circleColor = isFist ? '#ff0000' : handColor;
        
        ctx.shadowColor = circleColor;
        ctx.shadowBlur = (isFist) ? 25 : (isFist ? 15 : 10);
        ctx.strokeStyle = circleColor;
        ctx.lineWidth = isFist ? 4 : 3;
        ctx.beginPath();
        ctx.arc(mirrPalmX, mirrPalmY, (isFist) ? 30 : (isFist ? 22 : 18), 0, 2 * Math.PI);
        ctx.stroke();
        
        // วาด icon มือ - แสดงสถานะกำมือ
        ctx.shadowBlur = 0;
        ctx.font = isFist ? '22px Arial' : '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(isFist ? '👊' : '✋', mirrPalmX, mirrPalmY + 5);
        
        ctx.restore();
      }
    }
    
    // ถ้าไม่เจอมือ reset Y tracking
    if (!detectedLeftHand) {
      lastLeftY.current = null;
    }
    if (!detectedRightHand) {
      lastRightY.current = null;
    }
    
    setLeftHand(detectedLeftHand);
    setRightHand(detectedRightHand);
  }, []);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const loadScripts = async () => {
      // Load MediaPipe Hands scripts from CDN
      const scripts = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'
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

    const initHands = async () => {
      try {
        setIsLoading(true);
        
        await loadScripts();
        
        // Wait a bit for scripts to initialize
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!window.Hands) {
          throw new Error('MediaPipe Hands not loaded');
        }
        
        const hands = new window.Hands({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });
        
        // ปรับ settings สำหรับ tracking ที่ดี
        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.5
        });
        
        hands.onResults(onResults);
        handsRef.current = hands;
        
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
            if (handsRef.current && videoRef.current) {
              const video = videoRef.current;
              // Only send frame if video has valid dimensions
              if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
                await handsRef.current.send({ image: video });
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
        console.error('MediaPipe Hands initialization error:', err);
        setError('Failed to initialize camera. Please ensure camera permissions are granted.');
        setIsLoading(false);
      }
    };

    initHands();

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (handsRef.current) {
        handsRef.current.close();
      }
    };
  }, [onResults]);

  return {
    videoRef,
    canvasRef,
    leftHand,
    rightHand,
    isLoading,
    error
  };
}
