// useExerciseAnalysis Hook
// Combines pose detection, exercise analysis, tempo analysis, and AI coaching

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Landmark } from '@/hooks/useMediaPipePose';
import {
  ExerciseType,
  ExerciseStage,
  FormQuality,
  TempoQuality,
  DifficultyLevel,
  EXERCISES,
  KAYA_EXERCISE_ORDER,
  DIFFICULTY_LEVELS,
  LANDMARK_INDICES as LM,
} from '@/lib/exerciseConfig';
import {
  ExerciseAnalyzer,
  createExerciseAnalyzer,
  ExerciseAnalysisResult,
  FormFeedback,
  JointCorrection,
  calculateCorrections,
} from '@/lib/exerciseAnalyzers';
import { TempoAnalyzer, TempoAnalysis, MotionAnalyzer, MotionQuality } from '@/lib/tempoAnalyzer';
import { AICoachService, CoachMessage } from '@/components/workout/AICoachPopup';

// Hook options
interface UseExerciseAnalysisOptions {
  enabled?: boolean;
  difficulty?: DifficultyLevel;
  exerciseType?: ExerciseType; // Allow specifying exercise type directly
  onRepComplete?: (count: number) => void;
  onExerciseComplete?: (exerciseType: ExerciseType, repCount: number) => void;
  onFormFeedback?: (quality: FormQuality, feedback: FormFeedback) => void;
}

// Hook return type
interface UseExerciseAnalysisReturn {
  // Current exercise state
  currentExercise: ExerciseType;
  currentExerciseIndex: number;
  exerciseInfo: typeof EXERCISES[ExerciseType];
  
  // Analysis results
  reps: number;
  stage: ExerciseStage;
  targetStage: ExerciseStage;
  formQuality: FormQuality;
  formScore: number;
  formFeedback: FormFeedback;
  
  // Tempo analysis
  tempoAnalysis: TempoAnalysis;
  tempoQuality: TempoQuality;
  beatCount: number;
  
  // Motion analysis
  motionQuality: MotionQuality;
  
  // Visual guide
  corrections: JointCorrection[];
  
  // AI Coach
  coachMessage: CoachMessage | null;
  
  // Time tracking
  exerciseTimeLeft: number;
  exerciseProgress: number;
  
  // Visibility
  isBodyVisible: boolean;
  
  // Controls
  setCurrentExercise: (index: number) => void;
  nextExercise: () => boolean;
  previousExercise: () => boolean;
  resetExercise: () => void;
  resetAll: () => void;
  setDifficulty: (level: DifficultyLevel) => void;
  
  // Pause/Resume
  isPaused: boolean;
  pause: () => void;
  resume: () => void;
}

export function useExerciseAnalysis(
  landmarks: Landmark[] | null,
  options: UseExerciseAnalysisOptions = {}
): UseExerciseAnalysisReturn {
  const {
    enabled = true,
    difficulty: initialDifficulty = 'intermediate',
    exerciseType: specifiedExerciseType,
    onRepComplete,
    onExerciseComplete,
    onFormFeedback,
  } = options;

  // State
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialDifficulty);
  const [isPaused, setIsPaused] = useState(false);
  const [exerciseTimeLeft, setExerciseTimeLeft] = useState(DIFFICULTY_LEVELS[initialDifficulty].duration);
  const [coachMessage, setCoachMessage] = useState<CoachMessage | null>(null);
  
  // Analysis results state
  const [analysisResult, setAnalysisResult] = useState<ExerciseAnalysisResult>({
    stage: 'idle',
    reps: 0,
    repCompleted: false,
    formFeedback: { quality: 'good', score: 100, issues: [], suggestions: [] },
    angles: {},
    isVisible: false,
  });
  const [tempoAnalysis, setTempoAnalysis] = useState<TempoAnalysis>({
    currentPhase: 'idle',
    phaseDuration: 0,
    avgRepDuration: 0,
    avgUpDuration: 0,
    avgDownDuration: 0,
    tempoQuality: 'good',
    consistencyScore: 1,
    recommendedTempo: '2-2',
    feedback: '',
    beatCount: 1,
  });
  const [motionQuality, setMotionQuality] = useState<MotionQuality>({
    speed: 'normal',
    smoothness: 'smooth',
    isMoving: false,
    feedback: null,
  });
  const [corrections, setCorrections] = useState<JointCorrection[]>([]);

  // Refs for analyzers (to persist across renders)
  const exerciseAnalyzerRef = useRef<ExerciseAnalyzer | null>(null);
  const tempoAnalyzerRef = useRef<TempoAnalyzer | null>(null);
  const motionAnalyzerRef = useRef<MotionAnalyzer | null>(null);
  const coachServiceRef = useRef<AICoachService | null>(null);
  
  // Previous values for change detection
  const prevRepsRef = useRef(0);
  const prevStageRef = useRef<ExerciseStage>('idle');
  const halfwayShownRef = useRef(false);
  const almostDoneShownRef = useRef(false);
  const exerciseStartShownRef = useRef(false);

  // Current exercise type - use specified type or from internal order
  const currentExercise = specifiedExerciseType || KAYA_EXERCISE_ORDER[currentExerciseIndex];
  const exerciseInfo = EXERCISES[currentExercise];
  const difficultySettings = DIFFICULTY_LEVELS[difficulty];

  // Initialize analyzers when exercise type changes
  useEffect(() => {
    console.log('[useExerciseAnalysis] Initializing for:', currentExercise);
    exerciseAnalyzerRef.current = createExerciseAnalyzer(currentExercise);
    tempoAnalyzerRef.current = new TempoAnalyzer(difficulty);
    motionAnalyzerRef.current = new MotionAnalyzer();
    coachServiceRef.current = new AICoachService();
    
    // Reset tracking refs
    prevRepsRef.current = 0;
    prevStageRef.current = 'idle';
    halfwayShownRef.current = false;
    almostDoneShownRef.current = false;
    exerciseStartShownRef.current = false;
    
    // Reset analysis result
    setAnalysisResult({
      stage: 'idle',
      reps: 0,
      repCompleted: false,
      formFeedback: { quality: 'good', score: 100, issues: [], suggestions: [] },
      angles: {},
      isVisible: false,
    });
    
    // Reset time
    setExerciseTimeLeft(difficultySettings.duration);
    
    return () => {
      exerciseAnalyzerRef.current = null;
      tempoAnalyzerRef.current = null;
      motionAnalyzerRef.current = null;
    };
  }, [currentExercise, difficulty]);

  // Exercise timer
  useEffect(() => {
    if (!enabled || isPaused) return;

    const timer = setInterval(() => {
      setExerciseTimeLeft((prev) => {
        if (prev <= 1) {
          // Exercise time complete
          const repCount = analysisResult.reps;
          onExerciseComplete?.(currentExercise, repCount);
          // TTS messages handled separately in WorkoutUI via speakRepCount
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [enabled, isPaused, currentExercise, analysisResult.reps, onExerciseComplete]);

  // Main analysis effect
  useEffect(() => {
    if (!enabled || isPaused || !landmarks || !landmarks.length) return;

    const analyzer = exerciseAnalyzerRef.current;
    const tempoAn = tempoAnalyzerRef.current;
    const motionAn = motionAnalyzerRef.current;
    const coach = coachServiceRef.current;

    if (!analyzer || !tempoAn || !motionAn || !coach) return;

    // Run exercise analysis
    const result = analyzer.analyze(landmarks);
    
    // Debug logging - only when visible or stage changes
    if (result.isVisible || result.stage !== prevStageRef.current) {
      console.log('[Exercise] stage:', result.stage, 'reps:', result.reps, 'visible:', result.isVisible);
    }
    
    setAnalysisResult(result);

    // Update tempo analyzer with stage
    if (result.isVisible) {
      tempoAn.updatePhase(result.stage);
      const tempo = tempoAn.analyze();
      setTempoAnalysis(tempo);

      // Update motion analyzer with wrist position (or relevant joint)
      const wrist = landmarks[LM.LEFT_WRIST];
      if (wrist) {
        motionAn.update(wrist.x, wrist.y);
        const motion = motionAn.analyze();
        setMotionQuality(motion);
      }

      // Calculate corrections for visual guide
      const targetStage = getTargetStage(currentExercise, result.stage);
      const corr = calculateCorrections(landmarks, currentExercise, targetStage);
      setCorrections(corr);
    }

    // Show exercise start message
    if (!exerciseStartShownRef.current && result.isVisible) {
      exerciseStartShownRef.current = true;
      const message = coach.getExerciseStartMessage(currentExercise);
      setCoachMessage(message);
    }

    // Handle rep completion - use repCompleted flag from analyzer (KAYA-style)
    if (result.repCompleted) {
      onRepComplete?.(result.reps);

      // Rep count message
      const repMessage = coach.getRepCompletedMessage(result.reps);
      if (repMessage) setCoachMessage(repMessage);

      // Target reached
      if (result.reps === difficultySettings.minReps) {
        const targetMessage = coach.getTargetReachedMessage(result.reps);
        setCoachMessage(targetMessage);
      }
    }

    // Handle form feedback
    if (result.formFeedback.quality !== 'good' || result.formFeedback.score >= 80) {
      onFormFeedback?.(result.formFeedback.quality, result.formFeedback);
      
      const formMessage = coach.getFormFeedbackMessage(
        result.formFeedback.quality,
        result.formFeedback.suggestions
      );
      if (formMessage) setCoachMessage(formMessage);
    }

    // Handle tempo feedback
    if (tempoAn.shouldGiveFeedback()) {
      const tempo = tempoAn.analyze();
      const tempoMessage = coach.getTempoFeedbackMessage(tempo.tempoQuality, tempo.feedback);
      if (tempoMessage) setCoachMessage(tempoMessage);
    }

    // Handle motion feedback
    if (motionQuality.feedback) {
      const motionMessage = coach.getMovementFeedbackMessage(motionQuality.feedback);
      if (motionMessage) setCoachMessage(motionMessage);
    }

    // Progress messages disabled - TTS handled in WorkoutUI via speakRepCount for reps 1, 5, 9, 10 only
    // const progress = (difficultySettings.duration - exerciseTimeLeft) / difficultySettings.duration;

    prevStageRef.current = result.stage;
  }, [landmarks, enabled, isPaused, currentExercise, exerciseTimeLeft, difficulty, onRepComplete, onFormFeedback]);

  // Get target stage based on current stage
  const getTargetStage = useCallback((exercise: ExerciseType, current: ExerciseStage): ExerciseStage => {
    const stages = EXERCISES[exercise].stages;
    
    if (exercise === 'torso_twist') {
      // For torso twist, alternate: center -> left -> center -> right -> center
      if (current === 'center') return 'left';
      return 'center';
    }
    
    // For arm_raise and knee_raise, alternate up/down
    return current === 'up' ? 'down' : 'up';
  }, []);

  // Controls
  const nextExercise = useCallback((): boolean => {
    if (currentExerciseIndex < KAYA_EXERCISE_ORDER.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
      return true;
    }
    return false;
  }, [currentExerciseIndex]);

  const previousExercise = useCallback((): boolean => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((prev) => prev - 1);
      return true;
    }
    return false;
  }, [currentExerciseIndex]);

  const resetExercise = useCallback(() => {
    exerciseAnalyzerRef.current?.reset();
    tempoAnalyzerRef.current?.reset();
    motionAnalyzerRef.current?.reset();
    setExerciseTimeLeft(difficultySettings.duration);
    prevRepsRef.current = 0;
    halfwayShownRef.current = false;
    almostDoneShownRef.current = false;
    exerciseStartShownRef.current = false;
    setAnalysisResult({
      stage: 'idle',
      reps: 0,
      repCompleted: false,
      formFeedback: { quality: 'good', score: 100, issues: [], suggestions: [] },
      angles: {},
      isVisible: false,
    });
  }, [difficultySettings.duration]);

  const resetAll = useCallback(() => {
    setCurrentExerciseIndex(0);
    coachServiceRef.current?.reset();
    resetExercise();
  }, [resetExercise]);

  const handleSetDifficulty = useCallback((level: DifficultyLevel) => {
    setDifficulty(level);
    tempoAnalyzerRef.current?.setDifficulty(level);
  }, []);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);

  // Calculate exercise progress
  const exerciseProgress = useMemo(() => {
    return ((difficultySettings.duration - exerciseTimeLeft) / difficultySettings.duration) * 100;
  }, [difficultySettings.duration, exerciseTimeLeft]);

  // Target stage
  const targetStage = useMemo(() => {
    return getTargetStage(currentExercise, analysisResult.stage);
  }, [currentExercise, analysisResult.stage, getTargetStage]);

  return {
    // Current exercise
    currentExercise,
    currentExerciseIndex,
    exerciseInfo,
    
    // Analysis results
    reps: analysisResult.reps,
    stage: analysisResult.stage,
    targetStage,
    formQuality: analysisResult.formFeedback.quality,
    formScore: analysisResult.formFeedback.score,
    formFeedback: analysisResult.formFeedback,
    
    // Tempo
    tempoAnalysis,
    tempoQuality: tempoAnalysis.tempoQuality,
    beatCount: tempoAnalysis.beatCount,
    
    // Motion
    motionQuality,
    
    // Visual guide
    corrections,
    
    // Coach
    coachMessage,
    
    // Time
    exerciseTimeLeft,
    exerciseProgress,
    
    // Visibility
    isBodyVisible: analysisResult.isVisible,
    
    // Controls
    setCurrentExercise: setCurrentExerciseIndex,
    nextExercise,
    previousExercise,
    resetExercise,
    resetAll,
    setDifficulty: handleSetDifficulty,
    
    // Pause
    isPaused,
    pause,
    resume,
  };
}

export default useExerciseAnalysis;
