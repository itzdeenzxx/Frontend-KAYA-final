import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Trophy, Clock } from 'lucide-react';
import { Challenge } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ChallengeCardProps {
  challenge: Challenge;
  onClick?: () => void;
}

export function ChallengeCard({ challenge, onClick }: ChallengeCardProps) {
  const { i18n, t } = useTranslation();
  const progress = Math.min((challenge.current / challenge.target) * 100, 100);
  const isComplete = challenge.current >= challenge.target;
  
  const timeLeft = () => {
    const diff = new Date(challenge.endDate).getTime() - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d`;
    return `${hours}h`;
  };

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'card-elevated p-4 text-left w-full transition-all hover:shadow-lg',
        isComplete && 'ring-2 ring-success bg-success/5'
      )}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold">
            {i18n.language === 'th' ? challenge.nameTh : challenge.nameEn}
          </h4>
          <p className="text-sm text-muted-foreground">{challenge.description}</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
          <Clock className="w-3 h-3" />
          {timeLeft()}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">
            {challenge.current} / {challenge.target}
          </span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={cn(
              'h-full rounded-full',
              isComplete ? 'bg-success' : 'gradient-coral'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Reward */}
      <div className="flex items-center gap-2 text-sm">
        <Trophy className="w-4 h-4 text-energy" />
        <span className="text-muted-foreground">{t('gamification.points')}:</span>
        <span className="font-bold text-energy">{challenge.reward}</span>
      </div>
    </motion.button>
  );
}
