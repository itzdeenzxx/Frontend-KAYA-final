import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface RestTimerProps {
  duration: number;
  onComplete: () => void;
  isActive: boolean;
}

export function RestTimer({ duration, onComplete, isActive }: RestTimerProps) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(duration);
  
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(duration);
      return;
    }
    
    if (timeLeft <= 0) {
      onComplete();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, isActive, onComplete, duration]);
  
  const progress = ((duration - timeLeft) / duration) * 100;
  const circumference = 2 * Math.PI * 80;
  const offset = circumference - (progress / 100) * circumference;

  if (!isActive) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-center">
        <p className="text-lg font-medium text-muted-foreground mb-6">
          {t('workout.restTime')}
        </p>
        
        <div className="relative w-48 h-48 mx-auto mb-8">
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r={80}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
            />
            <motion.circle
              cx="50%"
              cy="50%"
              r={80}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.5, ease: 'linear' }}
            />
          </svg>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              key={timeLeft}
              className="text-6xl font-bold text-foreground"
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {timeLeft}
            </motion.span>
          </div>
        </div>
        
        <motion.p
          className="text-xl font-semibold text-primary"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {t('workout.getReady')}
        </motion.p>
      </div>
    </motion.div>
  );
}
