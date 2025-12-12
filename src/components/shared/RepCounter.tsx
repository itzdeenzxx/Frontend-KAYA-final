import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface RepCounterProps {
  current: number;
  target: number;
  size?: 'sm' | 'md' | 'lg';
}

export function RepCounter({ current, target, size = 'md' }: RepCounterProps) {
  const { t } = useTranslation();
  const progress = Math.min((current / target) * 100, 100);
  
  const sizes = {
    sm: { wrapper: 'w-20 h-20', text: 'text-xl', label: 'text-xs' },
    md: { wrapper: 'w-28 h-28', text: 'text-3xl', label: 'text-sm' },
    lg: { wrapper: 'w-36 h-36', text: 'text-4xl', label: 'text-base' },
  };

  const strokeWidth = size === 'lg' ? 6 : size === 'md' ? 5 : 4;
  const radius = size === 'lg' ? 60 : size === 'md' ? 48 : 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={`${sizes[size].wrapper} relative`}>
      {/* Background circle */}
      <svg className="absolute inset-0 w-full h-full -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx="50%"
          cy="50%"
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </svg>
      
      {/* Counter */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={current}
            className={`${sizes[size].text} font-bold text-foreground`}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {current}
          </motion.span>
        </AnimatePresence>
        <span className={`${sizes[size].label} text-muted-foreground`}>
          / {target} {t('workout.reps')}
        </span>
      </div>
    </div>
  );
}
