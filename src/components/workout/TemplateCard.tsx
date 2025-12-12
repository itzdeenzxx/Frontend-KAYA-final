import { useTranslation } from 'react-i18next';
import { Clock, Flame, Zap, Activity, Wind, Dumbbell } from 'lucide-react';
import { WorkoutTemplate, ExerciseCategory } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TemplateCardProps {
  template: WorkoutTemplate;
  onSelect: (template: WorkoutTemplate) => void;
  variant?: 'default' | 'compact';
}

const categoryIcons: Record<ExerciseCategory, React.ReactNode> = {
  hiit: <Zap className="w-5 h-5" />,
  circuit: <Activity className="w-5 h-5" />,
  strength: <Dumbbell className="w-5 h-5" />,
  mobility: <Wind className="w-5 h-5" />,
};

const categoryColors: Record<ExerciseCategory, string> = {
  hiit: 'bg-primary/10 text-primary',
  circuit: 'bg-energy/10 text-energy',
  strength: 'bg-calm/10 text-calm',
  mobility: 'bg-nature/10 text-nature',
};

export function TemplateCard({ template, onSelect, variant = 'default' }: TemplateCardProps) {
  const { i18n } = useTranslation();
  const name = i18n.language === 'th' ? template.nameTh : template.nameEn;

  if (variant === 'compact') {
    return (
      <button
        onClick={() => onSelect(template)}
        className="card-elevated p-4 flex items-center gap-3 w-full hover:border-primary transition-colors"
      >
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', categoryColors[template.category])}>
          {categoryIcons[template.category]}
        </div>
        <div className="flex-1 text-left">
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">{template.duration} min</p>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => onSelect(template)}
      className="card-elevated p-5 text-left hover:border-primary transition-all hover:shadow-lg group"
    >
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', categoryColors[template.category])}>
        {categoryIcons[template.category]}
      </div>
      
      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
        {name}
      </h3>
      
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" /> {template.duration} min
        </span>
        <span className="flex items-center gap-1">
          <Flame className="w-4 h-4" /> {template.calories} kcal
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className={cn(
          'text-xs px-2 py-0.5 rounded-full',
          template.difficulty === 'beginner' && 'bg-nature/10 text-nature',
          template.difficulty === 'intermediate' && 'bg-energy/10 text-energy',
          template.difficulty === 'advanced' && 'bg-destructive/10 text-destructive'
        )}>
          {template.difficulty}
        </span>
        <span className="text-xs text-muted-foreground">
          {template.exercises.length} exercises
        </span>
      </div>
    </button>
  );
}
