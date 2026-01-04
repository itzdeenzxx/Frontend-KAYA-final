import { useEffect, useState } from 'react';

interface ScreenShakeProps {
  trigger: boolean;
  intensity?: 'light' | 'medium' | 'heavy';
  children: React.ReactNode;
}

export function ScreenShake({ trigger, intensity = 'medium', children }: ScreenShakeProps) {
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  const shakeClass = isShaking 
    ? intensity === 'heavy' 
      ? 'animate-pulse' 
      : intensity === 'light' 
        ? 'animate-pulse' 
        : 'animate-pulse'
    : '';

  return (
    <div className={shakeClass}>
      {children}
    </div>
  );
}
