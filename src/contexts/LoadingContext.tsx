// App Loading Context
// Manages global loading state for resources like MediaPipe, images, etc.

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface LoadingState {
  isLoading: boolean;
  progress: number;
  message: string;
  tasks: Map<string, { loaded: boolean; message: string }>;
}

interface LoadingContextType {
  state: LoadingState;
  startLoading: (taskId: string, message: string) => void;
  completeTask: (taskId: string) => void;
  setMessage: (message: string) => void;
  isReady: boolean;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LoadingState>({
    isLoading: true,
    progress: 0,
    message: 'กำลังเตรียมแอพพลิเคชัน...',
    tasks: new Map(),
  });

  const startLoading = useCallback((taskId: string, message: string) => {
    setState(prev => {
      const newTasks = new Map(prev.tasks);
      newTasks.set(taskId, { loaded: false, message });
      return {
        ...prev,
        tasks: newTasks,
        message,
      };
    });
  }, []);

  const completeTask = useCallback((taskId: string) => {
    setState(prev => {
      const newTasks = new Map(prev.tasks);
      const task = newTasks.get(taskId);
      if (task) {
        newTasks.set(taskId, { ...task, loaded: true });
      }
      
      // Calculate progress
      const totalTasks = newTasks.size;
      const completedTasks = Array.from(newTasks.values()).filter(t => t.loaded).length;
      const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      // Check if all tasks are done
      const allDone = completedTasks === totalTasks && totalTasks > 0;
      
      return {
        ...prev,
        tasks: newTasks,
        progress,
        isLoading: !allDone,
        message: allDone ? 'พร้อมใช้งาน!' : prev.message,
      };
    });
  }, []);

  const setMessage = useCallback((message: string) => {
    setState(prev => ({ ...prev, message }));
  }, []);

  // Initial app resources loading
  useEffect(() => {
    const loadInitialResources = async () => {
      // Register essential tasks
      startLoading('fonts', 'กำลังโหลดฟอนต์...');
      startLoading('images', 'กำลังโหลดรูปภาพ...');
      
      // Simulate font loading
      if (document.fonts) {
        await document.fonts.ready;
      }
      completeTask('fonts');
      
      // Preload critical images
      const criticalImages = [
        '/ai-coach.png',
      ];
      
      await Promise.all(
        criticalImages.map(src => {
          return new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Don't block on error
            img.src = src;
          });
        })
      );
      completeTask('images');
    };

    loadInitialResources();
  }, [startLoading, completeTask]);

  const isReady = !state.isLoading;

  return (
    <LoadingContext.Provider value={{ state, startLoading, completeTask, setMessage, isReady }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
}

// Hook สำหรับ MediaPipe loading โดยเฉพาะ
export function useMediaPipeLoading() {
  const { startLoading, completeTask, setMessage } = useLoading();
  const [isModelReady, setIsModelReady] = useState(false);

  const startMediaPipeLoading = useCallback(() => {
    startLoading('mediapipe', 'กำลังโหลด MediaPipe Model...');
    setMessage('กำลังโหลด AI Model สำหรับตรวจจับท่าทาง...');
  }, [startLoading, setMessage]);

  const completeMediaPipeLoading = useCallback(() => {
    completeTask('mediapipe');
    setIsModelReady(true);
    setMessage('MediaPipe พร้อมใช้งาน!');
  }, [completeTask, setMessage]);

  return {
    isModelReady,
    startMediaPipeLoading,
    completeMediaPipeLoading,
  };
}
