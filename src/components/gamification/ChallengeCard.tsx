import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Trophy, Clock, Check, Loader2 } from 'lucide-react';
import { Challenge } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ChallengeCardProps {
  challenge: Challenge;
  onClick?: () => void;
  onClaimReward?: (challengeId: string) => Promise<{ success: boolean; points: number; message: string }>;
}

export function ChallengeCard({ challenge, onClick, onClaimReward }: ChallengeCardProps) {
  const { i18n, t } = useTranslation();
  const [isClaiming, setIsClaiming] = useState(false);
  const progress = Math.min((challenge.current / challenge.target) * 100, 100);
  const isComplete = challenge.current >= challenge.target;
  const canClaimReward = isComplete && !challenge.rewardClaimed && onClaimReward;
  
  const timeLeft = () => {
    const diff = new Date(challenge.endDate).getTime() - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d`;
    return `${hours}h`;
  };

  const handleClaimReward = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onClaimReward || isClaiming) return;
    
    setIsClaiming(true);
    try {
      await onClaimReward(challenge.id);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <motion.div
      className={cn(
        'card-elevated p-4 text-left w-full transition-all hover:shadow-lg',
        isComplete && 'ring-2 ring-success bg-success/5'
      )}
      whileTap={{ scale: 0.98 }}
    >
      <div onClick={onClick} className="cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className={cn(
              "font-semibold",
              isComplete ? "text-foreground" : "text-muted-foreground"
            )}>
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
            <span className={cn(
              "font-medium",
              isComplete ? "text-foreground" : "text-muted-foreground"
            )}>{Math.round(progress)}%</span>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Trophy className="w-4 h-4 text-energy" />
            <span className="text-muted-foreground">{t('gamification.points')}:</span>
            <span className="font-bold text-energy">{challenge.reward}</span>
          </div>
          
          {/* Claim/Claimed status */}
          {challenge.rewardClaimed && (
            <div className="flex items-center gap-1 text-xs text-success bg-success/10 px-2 py-1 rounded-full">
              <Check className="w-3 h-3" />
              <span>{t('gamification.claimed', 'Claimed')}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Claim Reward Button */}
      {canClaimReward && (
        <Button
          onClick={handleClaimReward}
          disabled={isClaiming}
          className="w-full mt-3 bg-gradient-to-r from-energy to-yellow-500 hover:from-energy/90 hover:to-yellow-500/90"
          size="sm"
        >
          {isClaiming ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('gamification.claiming', 'Claiming...')}
            </>
          ) : (
            <>
              <Trophy className="w-4 h-4 mr-2" />
              {t('gamification.claimReward', 'Claim Reward')} (+{challenge.reward} pts)
            </>
          )}
        </Button>
      )}
    </motion.div>
  );
}
