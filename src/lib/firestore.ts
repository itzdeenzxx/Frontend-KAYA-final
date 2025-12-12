// Firestore Service - Database operations for user data
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp,
  DocumentReference,
} from 'firebase/firestore';
import { db } from './firebase';
import type { 
  User, 
  UserTier, 
  WorkoutSession, 
  Badge, 
  Challenge,
  LeaderboardEntry 
} from './types';

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  PROFILES: 'profiles',
  HEALTH_DATA: 'healthData',
  WORKOUT_HISTORY: 'workoutHistory',
  NUTRITION_LOGS: 'nutritionLogs',
  BADGES: 'badges',
  CHALLENGES: 'challenges',
  LEADERBOARD: 'leaderboard',
  SETTINGS: 'userSettings',
} as const;

// ==================== USER PROFILE ====================

export interface FirestoreUserProfile {
  id: string;
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
  nickname?: string;
  email?: string;
  phone?: string;
  tier: UserTier;
  points: number;
  streakDays: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;
}

export interface FirestoreHealthData {
  userId: string;
  weight: number; // kg
  height: number; // cm
  age: number;
  gender: 'male' | 'female' | 'other';
  bmi?: number;
  bodyFat?: number;
  muscleMass?: number;
  targetWeight?: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  healthGoals: string[];
  allergies?: string[];
  medicalConditions?: string[];
  updatedAt: Timestamp;
}

export interface FirestoreWorkoutHistory {
  id?: string;
  userId: string;
  workoutId: string;
  workoutName: string;
  category: string;
  duration: number; // seconds
  caloriesBurned: number;
  accuracyScore: number;
  repsCounted: number;
  exercises: {
    exerciseId: string;
    name: string;
    repsCompleted: number;
    duration: number;
    accuracyScore: number;
  }[];
  completedAt: Timestamp;
}

export interface FirestoreNutritionLog {
  id?: string;
  userId: string;
  date: Timestamp;
  meals: {
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    time: string;
  }[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  waterIntake: number; // ml
  createdAt: Timestamp;
}

export interface FirestoreUserBadge {
  id?: string;
  userId: string;
  badgeId: string;
  badgeName: string;
  description: string;
  icon: string;
  earnedAt: Timestamp;
}

export interface FirestoreUserSettings {
  userId: string;
  language: 'th' | 'en';
  notifications: {
    workoutReminders: boolean;
    mealReminders: boolean;
    achievements: boolean;
    promotions: boolean;
  };
  privacy: {
    showOnLeaderboard: boolean;
    shareWorkouts: boolean;
  };
  workout: {
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    voiceCoach: boolean;
    restTimerDuration: number;
  };
  updatedAt: Timestamp;
}

// ==================== USER OPERATIONS ====================

// Create or update user profile from LINE login
export const createOrUpdateUserFromLine = async (
  lineUserId: string,
  displayName: string,
  pictureUrl?: string
): Promise<FirestoreUserProfile> => {
  const userRef = doc(db, COLLECTIONS.USERS, lineUserId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    // Update existing user
    await updateDoc(userRef, {
      displayName,
      pictureUrl,
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { ...userSnap.data(), id: lineUserId } as FirestoreUserProfile;
  } else {
    // Create new user
    const newUser: Omit<FirestoreUserProfile, 'id'> = {
      lineUserId,
      displayName,
      pictureUrl,
      nickname: displayName,
      tier: 'silver',
      points: 0,
      streakDays: 0,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      lastLoginAt: serverTimestamp() as Timestamp,
    };
    await setDoc(userRef, newUser);
    return { ...newUser, id: lineUserId } as FirestoreUserProfile;
  }
};

// Get user profile
export const getUserProfile = async (userId: string): Promise<FirestoreUserProfile | null> => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return { ...userSnap.data(), id: userId } as FirestoreUserProfile;
  }
  return null;
};

// Update user profile
export const updateUserProfile = async (
  userId: string,
  data: Partial<FirestoreUserProfile>
): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// Update user points
export const updateUserPoints = async (userId: string, pointsToAdd: number): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const currentPoints = userSnap.data().points || 0;
    const newPoints = currentPoints + pointsToAdd;
    
    // Calculate new tier
    let newTier: UserTier = 'silver';
    if (newPoints >= 15000) newTier = 'diamond_plus';
    else if (newPoints >= 5000) newTier = 'diamond';
    else if (newPoints >= 1000) newTier = 'gold';
    
    await updateDoc(userRef, {
      points: newPoints,
      tier: newTier,
      updatedAt: serverTimestamp(),
    });
  }
};

// Update streak
export const updateUserStreak = async (userId: string, increment: boolean = true): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const currentStreak = userSnap.data().streakDays || 0;
    await updateDoc(userRef, {
      streakDays: increment ? currentStreak + 1 : 0,
      updatedAt: serverTimestamp(),
    });
  }
};

// ==================== HEALTH DATA OPERATIONS ====================

// Create or update health data
export const saveHealthData = async (
  userId: string,
  data: Omit<FirestoreHealthData, 'userId' | 'updatedAt'>
): Promise<void> => {
  const healthRef = doc(db, COLLECTIONS.HEALTH_DATA, userId);
  
  // Calculate BMI
  const heightInMeters = data.height / 100;
  const bmi = data.weight / (heightInMeters * heightInMeters);
  
  await setDoc(healthRef, {
    userId,
    ...data,
    bmi: Math.round(bmi * 10) / 10,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

// Get health data
export const getHealthData = async (userId: string): Promise<FirestoreHealthData | null> => {
  const healthRef = doc(db, COLLECTIONS.HEALTH_DATA, userId);
  const healthSnap = await getDoc(healthRef);
  
  if (healthSnap.exists()) {
    return healthSnap.data() as FirestoreHealthData;
  }
  return null;
};

// ==================== WORKOUT HISTORY OPERATIONS ====================

// Save workout session
export const saveWorkoutSession = async (
  data: Omit<FirestoreWorkoutHistory, 'id' | 'completedAt'>
): Promise<string> => {
  const workoutRef = collection(db, COLLECTIONS.WORKOUT_HISTORY);
  const docRef = await addDoc(workoutRef, {
    ...data,
    completedAt: serverTimestamp(),
  });
  
  // Update user points based on workout
  const pointsEarned = Math.floor(data.caloriesBurned / 10) + Math.floor(data.accuracyScore);
  await updateUserPoints(data.userId, pointsEarned);
  
  return docRef.id;
};

// Get user workout history
export const getUserWorkoutHistory = async (
  userId: string,
  limitCount: number = 20
): Promise<FirestoreWorkoutHistory[]> => {
  const workoutRef = collection(db, COLLECTIONS.WORKOUT_HISTORY);
  const q = query(
    workoutRef,
    where('userId', '==', userId),
    orderBy('completedAt', 'desc'),
    limit(limitCount)
  );
  
  const querySnap = await getDocs(q);
  return querySnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as FirestoreWorkoutHistory[];
};

// Get workout stats
export const getUserWorkoutStats = async (userId: string): Promise<{
  totalWorkouts: number;
  totalCalories: number;
  totalDuration: number;
  averageAccuracy: number;
}> => {
  const workoutRef = collection(db, COLLECTIONS.WORKOUT_HISTORY);
  const q = query(workoutRef, where('userId', '==', userId));
  
  const querySnap = await getDocs(q);
  const workouts = querySnap.docs.map(doc => doc.data()) as FirestoreWorkoutHistory[];
  
  const totalWorkouts = workouts.length;
  const totalCalories = workouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
  const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);
  const averageAccuracy = workouts.length > 0
    ? workouts.reduce((sum, w) => sum + w.accuracyScore, 0) / workouts.length
    : 0;
    
  return {
    totalWorkouts,
    totalCalories,
    totalDuration,
    averageAccuracy: Math.round(averageAccuracy * 10) / 10,
  };
};

// ==================== NUTRITION LOG OPERATIONS ====================

// Save nutrition log
export const saveNutritionLog = async (
  data: Omit<FirestoreNutritionLog, 'id' | 'createdAt'>
): Promise<string> => {
  const nutritionRef = collection(db, COLLECTIONS.NUTRITION_LOGS);
  const docRef = await addDoc(nutritionRef, {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

// Get user nutrition logs
export const getUserNutritionLogs = async (
  userId: string,
  limitCount: number = 7
): Promise<FirestoreNutritionLog[]> => {
  const nutritionRef = collection(db, COLLECTIONS.NUTRITION_LOGS);
  const q = query(
    nutritionRef,
    where('userId', '==', userId),
    orderBy('date', 'desc'),
    limit(limitCount)
  );
  
  const querySnap = await getDocs(q);
  return querySnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as FirestoreNutritionLog[];
};

// ==================== BADGE OPERATIONS ====================

// Award badge to user
export const awardBadge = async (
  userId: string,
  badge: Omit<FirestoreUserBadge, 'id' | 'userId' | 'earnedAt'>
): Promise<string> => {
  // Check if user already has this badge
  const badgeRef = collection(db, COLLECTIONS.BADGES);
  const q = query(
    badgeRef,
    where('userId', '==', userId),
    where('badgeId', '==', badge.badgeId)
  );
  
  const existing = await getDocs(q);
  if (!existing.empty) {
    return existing.docs[0].id; // Already has badge
  }
  
  const docRef = await addDoc(badgeRef, {
    ...badge,
    userId,
    earnedAt: serverTimestamp(),
  });
  
  return docRef.id;
};

// Get user badges
export const getUserBadges = async (userId: string): Promise<FirestoreUserBadge[]> => {
  const badgeRef = collection(db, COLLECTIONS.BADGES);
  const q = query(
    badgeRef,
    where('userId', '==', userId),
    orderBy('earnedAt', 'desc')
  );
  
  const querySnap = await getDocs(q);
  return querySnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as FirestoreUserBadge[];
};

// ==================== LEADERBOARD OPERATIONS ====================

// Get leaderboard
export const getLeaderboard = async (limitCount: number = 50): Promise<LeaderboardEntry[]> => {
  const usersRef = collection(db, COLLECTIONS.USERS);
  const q = query(
    usersRef,
    orderBy('points', 'desc'),
    limit(limitCount)
  );
  
  const querySnap = await getDocs(q);
  return querySnap.docs.map((doc, index) => {
    const data = doc.data();
    return {
      rank: index + 1,
      userId: doc.id,
      nickname: data.nickname || data.displayName,
      tier: data.tier as UserTier,
      points: data.points,
      avatar: data.pictureUrl,
    };
  });
};

// Get user rank
export const getUserRank = async (userId: string): Promise<number> => {
  const usersRef = collection(db, COLLECTIONS.USERS);
  const userSnap = await getDoc(doc(db, COLLECTIONS.USERS, userId));
  
  if (!userSnap.exists()) return 0;
  
  const userPoints = userSnap.data().points || 0;
  const q = query(usersRef, where('points', '>', userPoints));
  const higher = await getDocs(q);
  
  return higher.size + 1;
};

// ==================== USER SETTINGS OPERATIONS ====================

// Get user settings
export const getUserSettings = async (userId: string): Promise<FirestoreUserSettings | null> => {
  const settingsRef = doc(db, COLLECTIONS.SETTINGS, userId);
  const settingsSnap = await getDoc(settingsRef);
  
  if (settingsSnap.exists()) {
    return settingsSnap.data() as FirestoreUserSettings;
  }
  return null;
};

// Save user settings
export const saveUserSettings = async (
  userId: string,
  settings: Omit<FirestoreUserSettings, 'userId' | 'updatedAt'>
): Promise<void> => {
  const settingsRef = doc(db, COLLECTIONS.SETTINGS, userId);
  await setDoc(settingsRef, {
    userId,
    ...settings,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

// Initialize default settings for new user
export const initializeUserSettings = async (userId: string): Promise<void> => {
  const existing = await getUserSettings(userId);
  if (existing) return;
  
  const defaultSettings: Omit<FirestoreUserSettings, 'updatedAt'> = {
    userId,
    language: 'th',
    notifications: {
      workoutReminders: true,
      mealReminders: true,
      achievements: true,
      promotions: false,
    },
    privacy: {
      showOnLeaderboard: true,
      shareWorkouts: false,
    },
    workout: {
      soundEnabled: true,
      vibrationEnabled: true,
      voiceCoach: true,
      restTimerDuration: 30,
    },
  };
  
  await saveUserSettings(userId, defaultSettings);
};

// ==================== CHALLENGE OPERATIONS ====================

// Get active challenges
export const getActiveChallenges = async (userId: string): Promise<Challenge[]> => {
  const challengeRef = collection(db, COLLECTIONS.CHALLENGES);
  const now = new Date();
  
  const q = query(
    challengeRef,
    where('userId', '==', userId),
    where('endDate', '>=', Timestamp.fromDate(now))
  );
  
  const querySnap = await getDocs(q);
  return querySnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as unknown as Challenge[];
};

// Update challenge progress
export const updateChallengeProgress = async (
  challengeId: string,
  progress: number
): Promise<void> => {
  const challengeRef = doc(db, COLLECTIONS.CHALLENGES, challengeId);
  await updateDoc(challengeRef, {
    current: progress,
  });
};
