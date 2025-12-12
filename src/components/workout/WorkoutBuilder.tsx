import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, Plus, Trash2, Sparkles, Save, X, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Exercise, ExerciseCategory } from '@/lib/types';
import { mockExercises } from '@/lib/mockData';
import { cn } from '@/lib/utils';

interface WorkoutBuilderProps {
  onSave: (exercises: Exercise[], name: string) => void;
  onClose: () => void;
}

export function WorkoutBuilder({ onSave, onClose }: WorkoutBuilderProps) {
  const { t, i18n } = useTranslation();
  const [workoutName, setWorkoutName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);
  const [filterCategory, setFilterCategory] = useState<ExerciseCategory | 'all'>('all');

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(selectedExercises);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setSelectedExercises(items);
  };

  const addExercise = (exercise: Exercise) => {
    setSelectedExercises([...selectedExercises, { ...exercise, id: `${exercise.id}-${Date.now()}` }]);
    setShowExerciseLibrary(false);
  };

  const removeExercise = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const handleAISuggest = () => {
    // Mock AI suggestion - adds random exercises
    const suggestions = mockExercises
      .sort(() => Math.random() - 0.5)
      .slice(0, 4)
      .map(ex => ({ ...ex, id: `${ex.id}-${Date.now()}-${Math.random()}` }));
    setSelectedExercises(suggestions);
  };

  const filteredExercises = filterCategory === 'all' 
    ? mockExercises 
    : mockExercises.filter(ex => ex.category === filterCategory);

  const categories: (ExerciseCategory | 'all')[] = ['all', 'hiit', 'circuit', 'strength', 'mobility'];

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="gradient-coral px-6 py-4 flex items-center justify-between">
        <button onClick={onClose} className="text-primary-foreground">
          <X className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-primary-foreground">
          {t('templates.createWorkout')}
        </h1>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary-foreground hover:bg-primary-foreground/20"
          onClick={() => onSave(selectedExercises, workoutName)}
          disabled={selectedExercises.length === 0 || !workoutName}
        >
          <Save className="w-5 h-5" />
        </Button>
      </div>

      <div className="p-6 space-y-6 pb-32 overflow-auto" style={{ maxHeight: 'calc(100vh - 64px)' }}>
        {/* Workout Name */}
        <Input
          placeholder={t('templates.createWorkout')}
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          className="text-lg font-medium"
        />

        {/* AI Suggest Button */}
        <Button
          variant="outline"
          className="w-full gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          onClick={handleAISuggest}
        >
          <Sparkles className="w-4 h-4" />
          {t('templates.aiSuggest')}
        </Button>

        {/* Exercise List */}
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            {t('templates.dragToReorder')}
          </p>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="exercises">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3"
                >
                  <AnimatePresence>
                    {selectedExercises.map((exercise, index) => (
                      <Draggable key={exercise.id} draggableId={exercise.id} index={index}>
                        {(provided, snapshot) => (
                          <motion.div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            className={cn(
                              'card-elevated p-4 flex items-center gap-3',
                              snapshot.isDragging && 'shadow-lg ring-2 ring-primary'
                            )}
                          >
                            <div {...provided.dragHandleProps} className="text-muted-foreground">
                              <GripVertical className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">
                                {i18n.language === 'th' ? exercise.nameTh : exercise.nameEn}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {exercise.duration}s {exercise.reps ? `• ${exercise.reps} reps` : ''}
                              </p>
                            </div>
                            <button
                              onClick={() => removeExercise(index)}
                              className="text-destructive p-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </motion.div>
                        )}
                      </Draggable>
                    ))}
                  </AnimatePresence>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Add Exercise Button */}
          <Button
            variant="outline"
            className="w-full mt-4 border-dashed"
            onClick={() => setShowExerciseLibrary(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('templates.addExercise')}
          </Button>
        </div>
      </div>

      {/* Exercise Library Modal */}
      <AnimatePresence>
        {showExerciseLibrary && (
          <motion.div
            className="fixed inset-0 z-60 bg-background"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{t('templates.templateLibrary')}</h2>
                <button onClick={() => setShowExerciseLibrary(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                      filterCategory === cat
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {cat === 'all' ? 'All' : t(`templates.${cat}`)}
                  </button>
                ))}
              </div>

              {/* Exercise List */}
              <div className="space-y-3">
                {filteredExercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => addExercise(exercise)}
                    className="w-full card-elevated p-4 flex items-center gap-4 text-left hover:border-primary transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Dumbbell className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {i18n.language === 'th' ? exercise.nameTh : exercise.nameEn}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {exercise.duration}s • {exercise.category} • {exercise.difficulty}
                      </p>
                    </div>
                    <Plus className="w-5 h-5 text-primary" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
