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
  DAILY_STATS: 'dailyStats',
} as const;

// ==================== DAILY STATS ====================

export interface FirestoreDailyStats {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  caloriesBurned: number;
  workoutTime: number; // in seconds
  totalWorkouts: number;
  waterIntake: number; // number of glasses (0-8)
  updatedAt: Timestamp;
}

// Get today's date string in YYYY-MM-DD format
export const getTodayDateString = (): string => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

// Get or create daily stats for user
export const getDailyStats = async (userId: string, date?: string): Promise<FirestoreDailyStats | null> => {
  const dateStr = date || getTodayDateString();
  const docId = `${userId}_${dateStr}`;
  const statsRef = doc(db, COLLECTIONS.DAILY_STATS, docId);
  const statsSnap = await getDoc(statsRef);
  
  if (statsSnap.exists()) {
    return { id: statsSnap.id, ...statsSnap.data() } as FirestoreDailyStats;
  }
  return null;
};

// Initialize or get today's daily stats
export const initializeDailyStats = async (userId: string): Promise<FirestoreDailyStats> => {
  const dateStr = getTodayDateString();
  const docId = `${userId}_${dateStr}`;
  const statsRef = doc(db, COLLECTIONS.DAILY_STATS, docId);
  const statsSnap = await getDoc(statsRef);
  
  if (statsSnap.exists()) {
    return { id: statsSnap.id, ...statsSnap.data() } as FirestoreDailyStats;
  }
  
  // Create new daily stats
  const newStats: Omit<FirestoreDailyStats, 'id'> = {
    userId,
    date: dateStr,
    caloriesBurned: 0,
    workoutTime: 0,
    totalWorkouts: 0,
    waterIntake: 0,
    updatedAt: serverTimestamp() as Timestamp,
  };
  
  await setDoc(statsRef, newStats);
  return { id: docId, ...newStats };
};

// Update daily stats
export const updateDailyStats = async (
  userId: string,
  updates: Partial<Pick<FirestoreDailyStats, 'caloriesBurned' | 'workoutTime' | 'totalWorkouts' | 'waterIntake'>>
): Promise<void> => {
  const dateStr = getTodayDateString();
  const docId = `${userId}_${dateStr}`;
  const statsRef = doc(db, COLLECTIONS.DAILY_STATS, docId);
  
  // Initialize if not exists
  const statsSnap = await getDoc(statsRef);
  if (!statsSnap.exists()) {
    await initializeDailyStats(userId);
  }
  
  await updateDoc(statsRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

// Increment water intake (max 8)
export const incrementWaterIntake = async (userId: string): Promise<number> => {
  const stats = await initializeDailyStats(userId);
  const currentWater = stats.waterIntake || 0;
  
  if (currentWater >= 8) {
    return currentWater; // Already at max
  }
  
  const newWater = currentWater + 1;
  await updateDailyStats(userId, { waterIntake: newWater });
  return newWater;
};

// Add workout to daily stats
export const addWorkoutToDailyStats = async (
  userId: string,
  caloriesBurned: number,
  duration: number
): Promise<void> => {
  const stats = await initializeDailyStats(userId);
  
  await updateDailyStats(userId, {
    caloriesBurned: (stats.caloriesBurned || 0) + caloriesBurned,
    workoutTime: (stats.workoutTime || 0) + duration,
    totalWorkouts: (stats.totalWorkouts || 0) + 1,
  });
};

// Get cumulative stats (all time)
export const getCumulativeStats = async (userId: string): Promise<{
  totalCalories: number;
  totalWorkoutTime: number;
  totalWorkouts: number;
}> => {
  const statsRef = collection(db, COLLECTIONS.DAILY_STATS);
  const q = query(statsRef, where('userId', '==', userId));
  
  const querySnap = await getDocs(q);
  const stats = querySnap.docs.map(doc => doc.data() as FirestoreDailyStats);
  
  return {
    totalCalories: stats.reduce((sum, s) => sum + (s.caloriesBurned || 0), 0),
    totalWorkoutTime: stats.reduce((sum, s) => sum + (s.workoutTime || 0), 0),
    totalWorkouts: stats.reduce((sum, s) => sum + (s.totalWorkouts || 0), 0),
  };
};

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
  lastActivityDate?: string; // YYYY-MM-DD format for streak tracking
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
    
    // Calculate new tier based on new point thresholds
    // Bronze: 0-999, Silver: 1000-1999, Gold: 2000-2999, Platinum: 3000-3999, Diamond: 4000+
    let newTier: UserTier = 'bronze';
    if (newPoints >= 4000) newTier = 'diamond';
    else if (newPoints >= 3000) newTier = 'platinum';
    else if (newPoints >= 2000) newTier = 'gold';
    else if (newPoints >= 1000) newTier = 'silver';
    
    await updateDoc(userRef, {
      points: newPoints,
      tier: newTier,
      updatedAt: serverTimestamp(),
    });
  }
};

// Update streak
export const updateUserStreak = async (userId: string): Promise<number> => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return 0;
  
  const userData = userSnap.data();
  const currentStreak = userData.streakDays || 0;
  const lastActivityDate = userData.lastActivityDate || '';
  
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  
  let newStreak = currentStreak;
  
  if (lastActivityDate === today) {
    // Already did activity today, no change
    return currentStreak;
  } else if (lastActivityDate === yesterday) {
    // Consecutive day, increment streak
    newStreak = currentStreak + 1;
  } else {
    // Streak broken, start fresh
    newStreak = 1;
  }
  
  await updateDoc(userRef, {
    streakDays: newStreak,
    lastActivityDate: today,
    updatedAt: serverTimestamp(),
  });
  
  return newStreak;
};

// Get yesterday's date string
const getYesterdayDateString = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
};

// Add game stats (for games like Mouse Running, Whack-a-Mole, Fishing)
export const addGameToDailyStats = async (
  userId: string,
  gameType: 'mouseRunning' | 'whackAMole' | 'fishing',
  duration: number, // seconds
  score: number
): Promise<void> => {
  // Calculate approximate calories burned based on game type and duration
  // Light activity: ~3-4 cal/min
  const caloriesPerMinute = gameType === 'mouseRunning' ? 5 : 3;
  const caloriesBurned = Math.round((duration / 60) * caloriesPerMinute);
  
  // Add to daily stats
  const stats = await initializeDailyStats(userId);
  await updateDailyStats(userId, {
    caloriesBurned: (stats.caloriesBurned || 0) + caloriesBurned,
    workoutTime: (stats.workoutTime || 0) + duration,
    totalWorkouts: (stats.totalWorkouts || 0) + 1,
  });
  
  // Calculate points: 1 point per 100 score points
  const pointsEarned = Math.max(1, Math.floor(score / 100));
  await updateUserPoints(userId, pointsEarned);
  
  // Update streak
  await updateUserStreak(userId);
  
  // Update challenges
  await incrementChallengeProgress(userId, 'workout', 1);
  await incrementChallengeProgress(userId, 'calories', caloriesBurned);
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

// Default challenges templates
const DEFAULT_CHALLENGES = [
  {
    name: 'Daily Workout',
    nameEn: 'Complete 1 Workout',
    nameTh: 'ออกกำลังกาย 1 ครั้ง',
    description: 'ออกกำลังกายอย่างน้อย 1 ครั้งวันนี้',
    target: 1,
    reward: 50,
    type: 'daily' as const,
  },
  {
    name: 'Burn Calories',
    nameEn: 'Burn 100 Calories',
    nameTh: 'เผาผลาญ 100 แคลอรี่',
    description: 'เผาผลาญแคลอรี่ให้ได้ 100 แคลอรี่',
    target: 100,
    reward: 100,
    type: 'daily' as const,
  },
  {
    name: 'Drink Water',
    nameEn: 'Drink 8 Glasses of Water',
    nameTh: 'ดื่มน้ำ 8 แก้ว',
    description: 'ดื่มน้ำให้ครบ 8 แก้ววันนี้',
    target: 8,
    reward: 30,
    type: 'daily' as const,
  },
  {
    name: 'Weekly Warrior',
    nameEn: 'Complete 5 Workouts This Week',
    nameTh: 'ออกกำลังกาย 5 ครั้งในสัปดาห์นี้',
    description: 'ออกกำลังกายให้ครบ 5 ครั้งในสัปดาห์นี้',
    target: 5,
    reward: 200,
    type: 'weekly' as const,
  },
  {
    name: 'Calorie Crusher',
    nameEn: 'Burn 500 Calories This Week',
    nameTh: 'เผาผลาญ 500 แคลอรี่ในสัปดาห์นี้',
    description: 'เผาผลาญแคลอรี่รวม 500 แคลอรี่ในสัปดาห์นี้',
    target: 500,
    reward: 250,
    type: 'weekly' as const,
  },
  {
    name: 'Monthly Master',
    nameEn: 'Complete 20 Workouts This Month',
    nameTh: 'ออกกำลังกาย 20 ครั้งในเดือนนี้',
    description: 'ออกกำลังกายให้ครบ 20 ครั้งในเดือนนี้',
    target: 20,
    reward: 500,
    type: 'monthly' as const,
  },
];

// Calculate end date based on challenge type
const getEndDate = (type: 'daily' | 'weekly' | 'monthly'): Date => {
  const now = new Date();
  switch (type) {
    case 'daily':
      // End of today
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    case 'weekly':
      // End of this week (Sunday)
      const daysUntilSunday = 7 - now.getDay();
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + daysUntilSunday);
      endOfWeek.setHours(23, 59, 59);
      return endOfWeek;
    case 'monthly':
      // End of this month
      return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  }
};

// Create a challenge for user
export const createChallenge = async (
  userId: string,
  challenge: Omit<Challenge, 'id' | 'current' | 'endDate'> & { type: 'daily' | 'weekly' | 'monthly' }
): Promise<string> => {
  const challengeRef = collection(db, COLLECTIONS.CHALLENGES);
  const docRef = await addDoc(challengeRef, {
    ...challenge,
    userId,
    current: 0,
    endDate: Timestamp.fromDate(getEndDate(challenge.type)),
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

// Initialize default challenges for a user (run once per period)
export const initializeUserChallenges = async (userId: string): Promise<void> => {
  // Check if user already has active challenges
  const existingChallenges = await getActiveChallenges(userId);
  
  // Get existing challenge types
  const existingTypes = new Set(existingChallenges.map(c => `${c.type}-${c.name}`));
  
  // Create missing challenges
  for (const template of DEFAULT_CHALLENGES) {
    const key = `${template.type}-${template.name}`;
    if (!existingTypes.has(key)) {
      await createChallenge(userId, template);
    }
  }
};

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
  return querySnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      nameEn: data.nameEn,
      nameTh: data.nameTh,
      description: data.description,
      target: data.target,
      current: data.current || 0,
      reward: data.reward,
      endDate: data.endDate?.toDate() || new Date(),
      type: data.type,
    };
  }) as Challenge[];
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

// Increment challenge progress (for workout completion, etc.)
export const incrementChallengeProgress = async (
  userId: string,
  challengeType: 'workout' | 'calories' | 'water',
  amount: number = 1
): Promise<void> => {
  const challenges = await getActiveChallenges(userId);
  
  for (const challenge of challenges) {
    let shouldUpdate = false;
    
    // Match challenge to type
    if (challengeType === 'workout' && 
        (challenge.name.includes('Workout') || challenge.nameTh.includes('ออกกำลังกาย'))) {
      shouldUpdate = true;
    } else if (challengeType === 'calories' && 
               (challenge.name.includes('Calorie') || challenge.nameTh.includes('แคลอรี่'))) {
      shouldUpdate = true;
    } else if (challengeType === 'water' && 
               (challenge.name.includes('Water') || challenge.nameTh.includes('น้ำ'))) {
      shouldUpdate = true;
    }
    
    if (shouldUpdate && challenge.current < challenge.target) {
      const newProgress = Math.min(challenge.current + amount, challenge.target);
      await updateChallengeProgress(challenge.id, newProgress);
    }
  }
};
