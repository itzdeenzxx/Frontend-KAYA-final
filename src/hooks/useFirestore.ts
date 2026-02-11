// Custom hooks for Firestore data operations
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  saveHealthData,
  saveWorkoutSession,
  getUserWorkoutHistory,
  getUserWorkoutStats,
  saveNutritionLog,
  getUserNutritionLogs,
  getUserBadges,
  awardBadge,
  getLeaderboard,
  getUserRank,
  saveUserSettings,
  updateUserProfile,
  updateUserPoints,
  getActiveChallenges,
  updateChallengeProgress,
  initializeUserChallenges,
  incrementChallengeProgress,
  syncWaterChallengeProgress,
  claimChallengeReward,
  getDailyStats,
  initializeDailyStats,
  updateDailyStats,
  incrementWaterIntake,
  decrementWaterIntake,
  getCumulativeStats,
  type FirestoreHealthData,
  type FirestoreWorkoutHistory,
  type FirestoreNutritionLog,
  type FirestoreUserBadge,
  type FirestoreUserSettings,
  type FirestoreDailyStats,
} from '@/lib/firestore';
import type { LeaderboardEntry, Challenge } from '@/lib/types';

// Hook for health data operations
export const useHealthData = () => {
  const { lineProfile, healthData, refreshHealthData } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveHealth = useCallback(async (data: Omit<FirestoreHealthData, 'userId' | 'updatedAt'>) => {
    if (!lineProfile?.userId) {
      setError('User not authenticated');
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await saveHealthData(lineProfile.userId, data);
      await refreshHealthData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save health data');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [lineProfile?.userId, refreshHealthData]);

  return {
    healthData,
    saveHealth,
    isLoading,
    error,
    refreshHealthData,
  };
};

// Hook for workout history
export const useWorkoutHistory = () => {
  const { lineProfile } = useAuth();
  const [workouts, setWorkouts] = useState<FirestoreWorkoutHistory[]>([]);
  const [stats, setStats] = useState<{
    totalWorkouts: number;
    totalCalories: number;
    totalDuration: number;
    averageAccuracy: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkouts = useCallback(async (limit: number = 20) => {
    if (!lineProfile?.userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getUserWorkoutHistory(lineProfile.userId, limit);
      setWorkouts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workouts');
    } finally {
      setIsLoading(false);
    }
  }, [lineProfile?.userId]);

  const fetchStats = useCallback(async () => {
    if (!lineProfile?.userId) return;
    
    try {
      const data = await getUserWorkoutStats(lineProfile.userId);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    }
  }, [lineProfile?.userId]);

  const saveWorkout = useCallback(async (
    data: Omit<FirestoreWorkoutHistory, 'id' | 'userId' | 'completedAt'>
  ) => {
    if (!lineProfile?.userId) {
      setError('User not authenticated');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const id = await saveWorkoutSession({ ...data, userId: lineProfile.userId });
      await fetchWorkouts();
      await fetchStats();
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save workout');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [lineProfile?.userId, fetchWorkouts, fetchStats]);

  useEffect(() => {
    if (lineProfile?.userId) {
      fetchWorkouts();
      fetchStats();
    }
  }, [lineProfile?.userId, fetchWorkouts, fetchStats]);

  return {
    workouts,
    stats,
    saveWorkout,
    refreshWorkouts: fetchWorkouts,
    refreshStats: fetchStats,
    isLoading,
    error,
  };
};

// Hook for nutrition logs
export const useNutrition = () => {
  const { lineProfile } = useAuth();
  const [logs, setLogs] = useState<FirestoreNutritionLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (limit: number = 7) => {
    if (!lineProfile?.userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getUserNutritionLogs(lineProfile.userId, limit);
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch nutrition logs');
    } finally {
      setIsLoading(false);
    }
  }, [lineProfile?.userId]);

  const saveLog = useCallback(async (
    data: Omit<FirestoreNutritionLog, 'id' | 'userId' | 'createdAt'>
  ) => {
    if (!lineProfile?.userId) {
      setError('User not authenticated');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const id = await saveNutritionLog({ ...data, userId: lineProfile.userId });
      await fetchLogs();
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save nutrition log');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [lineProfile?.userId, fetchLogs]);

  useEffect(() => {
    if (lineProfile?.userId) {
      fetchLogs();
    }
  }, [lineProfile?.userId, fetchLogs]);

  return {
    logs,
    saveLog,
    refreshLogs: fetchLogs,
    isLoading,
    error,
  };
};

// Hook for badges
export const useBadges = () => {
  const { lineProfile } = useAuth();
  const [badges, setBadges] = useState<FirestoreUserBadge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBadges = useCallback(async () => {
    if (!lineProfile?.userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getUserBadges(lineProfile.userId);
      setBadges(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch badges');
    } finally {
      setIsLoading(false);
    }
  }, [lineProfile?.userId]);

  const award = useCallback(async (
    badge: Omit<FirestoreUserBadge, 'id' | 'userId' | 'earnedAt'>
  ) => {
    if (!lineProfile?.userId) {
      setError('User not authenticated');
      return null;
    }
    
    try {
      const id = await awardBadge(lineProfile.userId, badge);
      await fetchBadges();
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to award badge');
      return null;
    }
  }, [lineProfile?.userId, fetchBadges]);

  useEffect(() => {
    if (lineProfile?.userId) {
      fetchBadges();
    }
  }, [lineProfile?.userId, fetchBadges]);

  return {
    badges,
    awardBadge: award,
    refreshBadges: fetchBadges,
    isLoading,
    error,
  };
};

// Hook for leaderboard
export const useLeaderboard = () => {
  const { lineProfile } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async (limit: number = 50) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getLeaderboard(limit);
      setLeaderboard(data);
      
      if (lineProfile?.userId) {
        const rank = await getUserRank(lineProfile.userId);
        setUserRank(rank);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, [lineProfile?.userId]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    userRank,
    refreshLeaderboard: fetchLeaderboard,
    isLoading,
    error,
  };
};

// Hook for user settings
export const useUserSettings = () => {
  const { lineProfile, userSettings, refreshSettings } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveSettings = useCallback(async (
    settings: Omit<FirestoreUserSettings, 'userId' | 'updatedAt'>
  ) => {
    if (!lineProfile?.userId) {
      setError('User not authenticated');
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await saveUserSettings(lineProfile.userId, settings);
      await refreshSettings();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [lineProfile?.userId, refreshSettings]);

  return {
    settings: userSettings,
    saveSettings,
    refreshSettings,
    isLoading,
    error,
  };
};

// Hook for user profile operations
export const useUserProfile = () => {
  const { lineProfile, userProfile, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback(async (data: {
    nickname?: string;
    email?: string;
    phone?: string;
  }) => {
    if (!lineProfile?.userId) {
      setError('User not authenticated');
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await updateUserProfile(lineProfile.userId, data);
      await refreshUser();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [lineProfile?.userId, refreshUser]);

  const addPoints = useCallback(async (points: number) => {
    if (!lineProfile?.userId) {
      setError('User not authenticated');
      return false;
    }
    
    try {
      await updateUserPoints(lineProfile.userId, points);
      await refreshUser();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add points');
      return false;
    }
  }, [lineProfile?.userId, refreshUser]);

  return {
    profile: userProfile,
    lineProfile,
    updateProfile,
    addPoints,
    refreshUser,
    isLoading,
    error,
  };
};

// Hook for challenges
export const useChallenges = () => {
  const { lineProfile, refreshUser } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialized = useRef(false);

  const fetchChallenges = useCallback(async () => {
    if (!lineProfile?.userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getActiveChallenges(lineProfile.userId);
      setChallenges(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch challenges');
    } finally {
      setIsLoading(false);
    }
  }, [lineProfile?.userId]);

  const initializeChallenges = useCallback(async () => {
    if (!lineProfile?.userId || isInitialized.current) return;
    
    isInitialized.current = true;
    setIsLoading(true);
    
    try {
      // Initialize default challenges if needed
      await initializeUserChallenges(lineProfile.userId);
      // Then fetch all challenges
      await fetchChallenges();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize challenges');
      isInitialized.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [lineProfile?.userId, fetchChallenges]);

  const updateProgress = useCallback(async (challengeId: string, progress: number) => {
    try {
      await updateChallengeProgress(challengeId, progress);
      await fetchChallenges();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update challenge');
      return false;
    }
  }, [fetchChallenges]);

  const incrementProgress = useCallback(async (
    challengeType: 'workout' | 'calories' | 'water',
    amount: number = 1
  ) => {
    if (!lineProfile?.userId) return false;
    
    try {
      await incrementChallengeProgress(lineProfile.userId, challengeType, amount);
      await fetchChallenges();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to increment challenge');
      return false;
    }
  }, [lineProfile?.userId, fetchChallenges]);

  // Claim reward for completed challenge
  const claimReward = useCallback(async (challengeId: string) => {
    if (!lineProfile?.userId) return { success: false, points: 0, message: 'Not logged in' };
    
    try {
      const result = await claimChallengeReward(lineProfile.userId, challengeId);
      
      if (result.success) {
        // Refresh challenges to update UI
        await fetchChallenges();
        // Refresh user profile to update points
        if (refreshUser) {
          await refreshUser();
        }
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim reward');
      return { success: false, points: 0, message: 'Failed to claim reward' };
    }
  }, [lineProfile?.userId, fetchChallenges, refreshUser]);

  useEffect(() => {
    if (lineProfile?.userId) {
      initializeChallenges();
    }
  }, [lineProfile?.userId, initializeChallenges]);

  return {
    challenges,
    updateProgress,
    incrementProgress,
    claimReward,
    refreshChallenges: fetchChallenges,
    isLoading,
    error,
  };
};

// Hook for daily stats (calories, workout time, total workouts, water intake)
export const useDailyStats = () => {
  const { lineProfile } = useAuth();
  const [todayStats, setTodayStats] = useState<FirestoreDailyStats | null>(null);
  const [cumulativeStats, setCumulativeStats] = useState<{
    totalCalories: number;
    totalWorkoutTime: number;
    totalWorkouts: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTodayStats = useCallback(async () => {
    if (!lineProfile?.userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const stats = await initializeDailyStats(lineProfile.userId);
      setTodayStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch daily stats');
    } finally {
      setIsLoading(false);
    }
  }, [lineProfile?.userId]);

  const fetchCumulativeStats = useCallback(async () => {
    if (!lineProfile?.userId) return;
    
    try {
      const stats = await getCumulativeStats(lineProfile.userId);
      setCumulativeStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cumulative stats');
    }
  }, [lineProfile?.userId]);

  const addWater = useCallback(async () => {
    if (!lineProfile?.userId) return null;
    
    try {
      const newWater = await incrementWaterIntake(lineProfile.userId);
      
      // Update local state
      setTodayStats(prev => prev ? { ...prev, waterIntake: newWater } : null);
      
      // Sync water challenge progress with actual water intake
      await syncWaterChallengeProgress(lineProfile.userId, newWater);
      
      return newWater;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add water');
      return null;
    }
  }, [lineProfile?.userId]);

  const removeWater = useCallback(async () => {
    if (!lineProfile?.userId) return null;
    
    try {
      const newWater = await decrementWaterIntake(lineProfile.userId);
      
      // Update local state
      setTodayStats(prev => prev ? { ...prev, waterIntake: newWater } : null);
      
      // Sync water challenge progress with actual water intake
      await syncWaterChallengeProgress(lineProfile.userId, newWater);
      return newWater;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove water');
      return null;
    }
  }, [lineProfile?.userId]);

  const updateStats = useCallback(async (
    updates: Partial<Pick<FirestoreDailyStats, 'caloriesBurned' | 'workoutTime' | 'totalWorkouts' | 'waterIntake'>>
  ) => {
    if (!lineProfile?.userId) return false;
    
    try {
      await updateDailyStats(lineProfile.userId, updates);
      await fetchTodayStats();
      await fetchCumulativeStats();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stats');
      return false;
    }
  }, [lineProfile?.userId, fetchTodayStats, fetchCumulativeStats]);

  useEffect(() => {
    if (lineProfile?.userId) {
      fetchTodayStats();
      fetchCumulativeStats();
    }
  }, [lineProfile?.userId, fetchTodayStats, fetchCumulativeStats]);

  return {
    todayStats,
    cumulativeStats,
    addWater,
    removeWater,
    updateStats,
    refreshStats: fetchTodayStats,
    isLoading,
    error,
  };
};
