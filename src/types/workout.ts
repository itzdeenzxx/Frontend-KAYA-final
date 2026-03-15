// Workout-related types

export interface ExerciseResult {
  name: string;
  nameTh: string;
  reps: number;
  targetReps: number;
  formScore: number;
  duration: number; // seconds
  kayaExercise?: string; // exercise type for AI scoring (e.g. 'arm_raise')
  repFrames?: [number, number][][][]; // frames per rep for AI scoring: [rep][frame][landmark][x,y]
}

export interface ExerciseAIScoreResult {
  lstmScore: number;  // 0-100 average across reps
  cnnScore: number;   // 0-100 average across reps
  avgScore: number;   // 0-100 weighted average (cnn*0.7 + lstm*0.3)
  repScores: { repIndex: number; lstm_score: number; cnn_score: number; avg_score: number }[];
}

export interface WorkoutResults {
  styleName: string;
  styleNameTh: string;
  exercises: ExerciseResult[];
  totalTime: number; // seconds
  totalReps: number;
  averageFormScore: number;
  caloriesBurned: number;
  completionPercentage: number;
  screenshots?: string[]; // base64 images
}
