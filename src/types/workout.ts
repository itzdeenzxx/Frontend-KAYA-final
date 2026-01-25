// Workout-related types

export interface ExerciseResult {
  name: string;
  nameTh: string;
  reps: number;
  targetReps: number;
  formScore: number;
  duration: number; // seconds
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
