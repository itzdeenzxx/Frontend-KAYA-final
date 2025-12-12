import { Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface StreakCounterProps {
  days: number;
  variant?: 'default' | 'compact';
}

export function StreakCounter({ days, variant = 'default' }: StreakCounterProps) {
  const { t } = useTranslation();

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1.5 text-primary">
        <Flame className="w-4 h-4 fill-primary" />
        <span className="font-bold">{days}</span>
      </div>
    );
  }

  return (
    <div className="card-elevated p-4 flex items-center gap-3">
      <div className="w-12 h-12 rounded-xl gradient-coral flex items-center justify-center shadow-coral">
        <Flame className="w-6 h-6 text-primary-foreground fill-primary-foreground" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{days}</p>
        <p className="text-sm text-muted-foreground">{t('dashboard.streakDays')}</p>
      </div>
    </div>
  );
}
