// Game Scores Service - Database operations for game scores and leaderboards
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';

// ==================== TYPES ====================

export type GameType = 'fishing' | 'mouseRunning' | 'whackAMole';
export type GameLevel = 'easy' | 'medium' | 'hard' | 'party';

export interface GameScore {
  id?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  gameType: GameType;
  level: GameLevel;
  score: number;
  duration: number; // วินาที
  timestamp: Timestamp;
  isPersonalBest: boolean;
  gameData: GameSpecificData;
}

export interface GameSpecificData {
  // สำหรับเกมตกปลา
  fishCaught?: number;
  perfectCatches?: number;
  biggestFish?: string;
  
  // สำหรับเกมวิ่งหนู
  steps?: number;
  hitCount?: number;
  maxCombo?: number;
  
  // สำหรับเกมตีตุ่น
  molesHit?: number;
  bombsHit?: number;
  accuracy?: number;
  bestCombo?: number;
}

export interface LeaderboardEntry {
  rank?: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  score: number;
  timestamp: Timestamp;
  gameData?: GameSpecificData;
}

export interface Leaderboard {
  gameType: GameType;
  level: GameLevel;
  topScores: LeaderboardEntry[];
  lastUpdated: Timestamp;
}

export interface UserGameStats {
  totalGamesPlayed: number;
  totalPlayTime: number; // วินาที
  personalBests: {
    [key in GameType]?: {
      [key in GameLevel]?: number;
    };
  };
  gamesPlayedByType: {
    [key in GameType]?: number;
  };
  lastPlayed: Timestamp;
  achievements: string[];
}

// ==================== COLLECTIONS ====================

export const GAME_COLLECTIONS = {
  GAME_SCORES: 'gameScores',
  LEADERBOARDS: 'leaderboards',
  USER_GAME_STATS: 'userGameStats',
} as const;

// ==================== SAVE GAME SCORE ====================

export async function saveGameScore(
  scoreData: Omit<GameScore, 'id' | 'timestamp' | 'isPersonalBest'>
): Promise<{ scoreId: string; isNewPersonalBest: boolean }> {
  const { userId, gameType, level, score } = scoreData;
  
  // 1. ตรวจสอบว่าเป็น personal best หรือไม่
  const userStats = await getUserGameStats(userId);
  const currentBest = userStats?.personalBests?.[gameType]?.[level] ?? 0;
  const isNewPersonalBest = score > currentBest;
  
  // 2. บันทึก score ใหม่
  const scoreRef = await addDoc(collection(db, GAME_COLLECTIONS.GAME_SCORES), {
    ...scoreData,
    timestamp: serverTimestamp(),
    isPersonalBest: isNewPersonalBest,
  });
  
  // 3. อัพเดท user stats
  await updateUserGameStats(userId, gameType, level, score, scoreData.duration, isNewPersonalBest);
  
  // 4. อัพเดท leaderboard ถ้าติด top 10
  await updateLeaderboardIfQualified(gameType, level, {
    userId,
    userName: scoreData.userName,
    userAvatar: scoreData.userAvatar,
    score,
    timestamp: Timestamp.now(),
    gameData: scoreData.gameData,
  });
  
  return { scoreId: scoreRef.id, isNewPersonalBest };
}

// ==================== USER GAME STATS ====================

export async function getUserGameStats(userId: string): Promise<UserGameStats | null> {
  const docRef = doc(db, GAME_COLLECTIONS.USER_GAME_STATS, userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as UserGameStats;
  }
  return null;
}

export async function initializeUserGameStats(userId: string): Promise<void> {
  const docRef = doc(db, GAME_COLLECTIONS.USER_GAME_STATS, userId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    await setDoc(docRef, {
      totalGamesPlayed: 0,
      totalPlayTime: 0,
      personalBests: {},
      gamesPlayedByType: {},
      lastPlayed: serverTimestamp(),
      achievements: [],
    });
  }
}

async function updateUserGameStats(
  userId: string,
  gameType: GameType,
  level: GameLevel,
  score: number,
  duration: number,
  isNewPersonalBest: boolean
): Promise<void> {
  const docRef = doc(db, GAME_COLLECTIONS.USER_GAME_STATS, userId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    // สร้างใหม่ถ้ายังไม่มี
    await setDoc(docRef, {
      totalGamesPlayed: 1,
      totalPlayTime: duration,
      personalBests: {
        [gameType]: {
          [level]: score,
        },
      },
      gamesPlayedByType: {
        [gameType]: 1,
      },
      lastPlayed: serverTimestamp(),
      achievements: [],
    });
  } else {
    const currentData = docSnap.data() as UserGameStats;
    
    const updates: Record<string, any> = {
      totalGamesPlayed: increment(1),
      totalPlayTime: increment(duration),
      [`gamesPlayedByType.${gameType}`]: increment(1),
      lastPlayed: serverTimestamp(),
    };
    
    // อัพเดท personal best ถ้าทำสถิติใหม่
    if (isNewPersonalBest) {
      updates[`personalBests.${gameType}.${level}`] = score;
    }
    
    await updateDoc(docRef, updates);
  }
}

// ==================== LEADERBOARD ====================

export async function getLeaderboard(
  gameType: GameType,
  level: GameLevel
): Promise<LeaderboardEntry[]> {
  const leaderboardId = `${gameType}-${level}`;
  const docRef = doc(db, GAME_COLLECTIONS.LEADERBOARDS, leaderboardId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data() as Leaderboard;
    return data.topScores.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }
  
  return [];
}

async function updateLeaderboardIfQualified(
  gameType: GameType,
  level: GameLevel,
  entry: LeaderboardEntry
): Promise<boolean> {
  const leaderboardId = `${gameType}-${level}`;
  const docRef = doc(db, GAME_COLLECTIONS.LEADERBOARDS, leaderboardId);
  const docSnap = await getDoc(docRef);
  
  let topScores: LeaderboardEntry[] = [];
  
  if (docSnap.exists()) {
    const data = docSnap.data() as Leaderboard;
    topScores = data.topScores || [];
  }
  
  // ลบ entry เดิมของ user ถ้ามี (เก็บแค่ score สูงสุดของแต่ละคน)
  topScores = topScores.filter(e => e.userId !== entry.userId);
  
  // เพิ่ม entry ใหม่
  topScores.push(entry);
  
  // เรียงตาม score (มาก -> น้อย)
  topScores.sort((a, b) => b.score - a.score);
  
  // เก็บแค่ top 10
  topScores = topScores.slice(0, 10);
  
  // เช็คว่า entry ติด top 10 หรือไม่
  const isInTop10 = topScores.some(e => e.userId === entry.userId);
  
  if (isInTop10) {
    await setDoc(docRef, {
      gameType,
      level,
      topScores,
      lastUpdated: serverTimestamp(),
    });
  }
  
  return isInTop10;
}

// ==================== GAME HISTORY ====================

export async function getGameHistory(
  userId: string,
  gameType?: GameType,
  limitCount: number = 20
): Promise<GameScore[]> {
  let q;
  
  if (gameType) {
    q = query(
      collection(db, GAME_COLLECTIONS.GAME_SCORES),
      where('userId', '==', userId),
      where('gameType', '==', gameType),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
  } else {
    q = query(
      collection(db, GAME_COLLECTIONS.GAME_SCORES),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
  }
  
  const querySnapshot = await getDocs(q);
  const scores: GameScore[] = [];
  
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data() as Omit<GameScore, 'id'>;
    scores.push({
      id: docSnap.id,
      ...data,
    });
  });
  
  return scores;
}

// ==================== PERSONAL BESTS ====================

export async function getPersonalBest(
  userId: string,
  gameType: GameType,
  level: GameLevel
): Promise<number> {
  const userStats = await getUserGameStats(userId);
  return userStats?.personalBests?.[gameType]?.[level] ?? 0;
}

// ==================== RECENT HIGH SCORES (Global) ====================

export async function getRecentHighScores(
  gameType: GameType,
  limitCount: number = 10
): Promise<GameScore[]> {
  const q = query(
    collection(db, GAME_COLLECTIONS.GAME_SCORES),
    where('gameType', '==', gameType),
    where('isPersonalBest', '==', true),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  
  const querySnapshot = await getDocs(q);
  const scores: GameScore[] = [];
  
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data() as Omit<GameScore, 'id'>;
    scores.push({
      id: docSnap.id,
      ...data,
    });
  });
  
  return scores;
}

// ==================== HELPER FUNCTIONS ====================

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getGameTypeName(gameType: GameType): string {
  const names: Record<GameType, string> = {
    fishing: '🎣 Fishing Game',
    mouseRunning: '🐭 Run or Freeze',
    whackAMole: '🔨 Whack-a-Mole',
  };
  return names[gameType];
}

export function getLevelName(level: GameLevel): string {
  const names: Record<GameLevel, string> = {
    easy: '🌈 Easy',
    medium: '🏙️ Medium',
    hard: '💀 Hard',
    party: '🎉 Party',
  };
  return names[level];
}

// ==================== GET ALL PERSONAL BESTS ====================

export interface AllGameBests {
  mouseRunning: number;
  whackAMole: number;
  fishing: number;
}

/**
 * ดึงคะแนนสูงสุดของทุกเกม (รวมทุกระดับ) สำหรับผู้ใช้
 */
export async function getAllPersonalBests(userId: string): Promise<AllGameBests> {
  const userStats = await getUserGameStats(userId);
  
  const result: AllGameBests = {
    mouseRunning: 0,
    whackAMole: 0,
    fishing: 0,
  };
  
  if (!userStats?.personalBests) {
    return result;
  }
  
  // หา max score จากทุกระดับของแต่ละเกม
  const gameTypes: GameType[] = ['mouseRunning', 'whackAMole', 'fishing'];
  
  for (const gameType of gameTypes) {
    const gameBests = userStats.personalBests[gameType];
    if (gameBests) {
      const scores = Object.values(gameBests).filter((s): s is number => typeof s === 'number');
      if (scores.length > 0) {
        result[gameType] = Math.max(...scores);
      }
    }
  }
  
  return result;
}
