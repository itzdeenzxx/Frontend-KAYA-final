// User Tier System
export type UserTier = 'silver' | 'gold' | 'diamond' | 'diamond_plus';

export interface User {
  id: string;
  nickname: string;
  username: string;
  weight: number;
  height: number;
  age: number;
  gender?: 'male' | 'female' | 'other';
  tier: UserTier;
  points: number;
  streakDays: number;
  createdAt: Date;
}

export interface TierConfig {
  name: string;
  minPoints: number;
  color: string;
  icon: string;
  benefits: string[];
}

export const TIER_CONFIG: Record<UserTier, TierConfig> = {
  silver: {
    name: 'Silver',
    minPoints: 0,
    color: 'hsl(220, 15%, 65%)',
    icon: '🥈',
    benefits: ['Basic workout templates', 'Nutrition recommendations'],
  },
  gold: {
    name: 'Gold',
    minPoints: 1000,
    color: 'hsl(45, 95%, 55%)',
    icon: '🥇',
    benefits: ['Custom workout builder', 'AI suggestions', 'Priority support'],
  },
  diamond: {
    name: 'Diamond',
    minPoints: 5000,
    color: 'hsl(200, 80%, 65%)',
    icon: '💎',
    benefits: ['All Gold benefits', 'Voice coach', 'Pose correction'],
  },
  diamond_plus: {
    name: 'Diamond+',
    minPoints: 15000,
    color: 'hsl(280, 80%, 65%)',
    icon: '💎✨',
    benefits: ['All Diamond benefits', 'Personal coaching', 'Exclusive content'],
  },
};

// Exercise Types
export type ExerciseCategory = 'hiit' | 'circuit' | 'strength' | 'mobility';

export interface Exercise {
  id: string;
  name: string;
  nameEn: string;
  nameTh: string;
  duration: number; // seconds
  reps?: number;
  sets?: number;
  restTime: number;
  category: ExerciseCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  targetMuscles: string[];
  instructions: string[];
  imageUrl?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  nameEn: string;
  nameTh: string;
  category: ExerciseCategory;
  duration: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  calories: number;
  exercises: Exercise[];
  warmUp: Exercise[];
  coolDown: Exercise[];
}

// Device Pairing
export type PairingMethod = 'qr' | 'code' | 'auto';
export type PairingStatus = 'disconnected' | 'connecting' | 'connected';

export interface DevicePair {
  id: string;
  sessionCode: string;
  status: PairingStatus;
  mobileDeviceId?: string;
  screenDeviceId?: string;
  createdAt: Date;
}

// WebSocket Events
export interface WSEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export const WS_EVENTS = {
  // Pairing
  PAIR_REQUEST: 'pair_request',
  PAIR_ACCEPT: 'pair_accept',
  PAIR_REJECT: 'pair_reject',
  PAIR_DISCONNECT: 'pair_disconnect',
  
  // Workout Control
  WORKOUT_START: 'workout_start',
  WORKOUT_PAUSE: 'workout_pause',
  WORKOUT_RESUME: 'workout_resume',
  WORKOUT_NEXT: 'workout_next',
  WORKOUT_STOP: 'workout_stop',
  
  // Telemetry
  REP_COUNT: 'rep_count',
  POSE_FEEDBACK: 'pose_feedback',
  HEART_RATE: 'heart_rate',
  CALORIES_UPDATE: 'calories_update',
  
  // Session
  SESSION_SUMMARY: 'session_summary',
} as const;

// Gamification
export interface Badge {
  id: string;
  name: string;
  nameEn: string;
  nameTh: string;
  description: string;
  icon: string;
  earnedAt?: Date;
  requirement: string;
}

export interface Challenge {
  id: string;
  name: string;
  nameEn: string;
  nameTh: string;
  description: string;
  target: number;
  current: number;
  reward: number; // points
  endDate: Date;
  type: 'daily' | 'weekly' | 'monthly';
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  nickname: string;
  tier: UserTier;
  points: number;
  avatar?: string;
}

// Analytics
export interface WorkoutSession {
  id: string;
  userId: string;
  workoutId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // seconds
  caloriesBurned: number;
  accuracyScore: number; // 0-100
  repsCounted: number;
  exercises: SessionExercise[];
}

export interface SessionExercise {
  exerciseId: string;
  name: string;
  repsCompleted: number;
  duration: number;
  accuracyScore: number;
}

// Nutrition
export interface Meal {
  id: string;
  name: string;
  nameEn: string;
  nameTh: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  imageUrl: string;
  description: string;
  benefits: string[];
}

// Live Classes
export interface LiveClass {
  id: string;
  title: string;
  titleEn: string;
  titleTh: string;
  instructor: string;
  startTime: Date;
  duration: number;
  category: ExerciseCategory;
  participants: number;
  maxParticipants: number;
  isRsvped: boolean;
}
