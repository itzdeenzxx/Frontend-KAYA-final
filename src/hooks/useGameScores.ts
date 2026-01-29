// useGameScores - Hook for managing game scores
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  saveGameScore,
  getGameHistory,
  getLeaderboard,
  getUserGameStats,
  getPersonalBest,
  initializeUserGameStats,
  type GameType,
  type GameLevel,
  type GameScore,
  type GameSpecificData,
  type LeaderboardEntry,
  type UserGameStats,
} from '@/lib/gameScores';

interface UseGameScoresReturn {
  // State
  isLoading: boolean;
  error: string | null;
  userStats: UserGameStats | null;
  gameHistory: GameScore[];
  leaderboard: LeaderboardEntry[];
  personalBest: number;
  
  // Actions
  submitScore: (params: SubmitScoreParams) => Promise<SubmitScoreResult>;
  loadGameHistory: (gameType?: GameType) => Promise<void>;
  loadLeaderboard: (gameType: GameType, level: GameLevel) => Promise<void>;
  loadPersonalBest: (gameType: GameType, level: GameLevel) => Promise<void>;
  loadUserStats: () => Promise<void>;
  refreshAll: (gameType: GameType, level: GameLevel) => Promise<void>;
}

interface SubmitScoreParams {
  gameType: GameType;
  level: GameLevel;
  score: number;
  duration: number;
  gameData: GameSpecificData;
}

interface SubmitScoreResult {
  success: boolean;
  scoreId?: string;
  isNewPersonalBest: boolean;
  error?: string;
}

export function useGameScores(): UseGameScoresReturn {
  const { userProfile } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserGameStats | null>(null);
  const [gameHistory, setGameHistory] = useState<GameScore[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [personalBest, setPersonalBest] = useState<number>(0);
  
  // Initialize user stats when user logs in
  useEffect(() => {
    if (userProfile?.id) {
      initializeUserGameStats(userProfile.id).catch(console.error);
    }
  }, [userProfile?.id]);
  
  // Submit score
  const submitScore = useCallback(async (params: SubmitScoreParams): Promise<SubmitScoreResult> => {
    if (!userProfile) {
      return { success: false, isNewPersonalBest: false, error: 'User not logged in' };
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await saveGameScore({
        userId: userProfile.id,
        userName: userProfile.displayName || userProfile.nickname || 'Anonymous',
        userAvatar: userProfile.pictureUrl,
        gameType: params.gameType,
        level: params.level,
        score: params.score,
        duration: params.duration,
        gameData: params.gameData,
      });
      
      return {
        success: true,
        scoreId: result.scoreId,
        isNewPersonalBest: result.isNewPersonalBest,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save score';
      setError(errorMessage);
      return { success: false, isNewPersonalBest: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [userProfile]);
  
  // Load game history
  const loadGameHistory = useCallback(async (gameType?: GameType): Promise<void> => {
    if (!userProfile) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const history = await getGameHistory(userProfile.id, gameType);
      setGameHistory(history);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load history';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userProfile]);
  
  // Load leaderboard
  const loadLeaderboard = useCallback(async (gameType: GameType, level: GameLevel): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getLeaderboard(gameType, level);
      setLeaderboard(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load leaderboard';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Load personal best
  const loadPersonalBest = useCallback(async (gameType: GameType, level: GameLevel): Promise<void> => {
    if (!userProfile) return;
    
    try {
      const best = await getPersonalBest(userProfile.id, gameType, level);
      setPersonalBest(best);
    } catch (err) {
      console.error('Failed to load personal best:', err);
    }
  }, [userProfile]);
  
  // Load user stats
  const loadUserStats = useCallback(async (): Promise<void> => {
    if (!userProfile) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const stats = await getUserGameStats(userProfile.id);
      setUserStats(stats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load stats';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userProfile]);
  
  // Refresh all data for a specific game
  const refreshAll = useCallback(async (gameType: GameType, level: GameLevel): Promise<void> => {
    await Promise.all([
      loadGameHistory(gameType),
      loadLeaderboard(gameType, level),
      loadPersonalBest(gameType, level),
      loadUserStats(),
    ]);
  }, [loadGameHistory, loadLeaderboard, loadPersonalBest, loadUserStats]);
  
  return {
    isLoading,
    error,
    userStats,
    gameHistory,
    leaderboard,
    personalBest,
    submitScore,
    loadGameHistory,
    loadLeaderboard,
    loadPersonalBest,
    loadUserStats,
    refreshAll,
  };
}
