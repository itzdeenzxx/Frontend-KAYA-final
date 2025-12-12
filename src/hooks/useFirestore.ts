// Custom hooks for Firestore data operations
import { useState, useEffect, useCallback } from 'react';
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
  type FirestoreHealthData,
  type FirestoreWorkoutHistory,
  type FirestoreNutritionLog,
  type FirestoreUserBadge,
  type FirestoreUserSettings,
} from '@/lib/firestore';
import type { LeaderboardEntry } from '@/lib/types';

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
