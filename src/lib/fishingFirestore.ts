import { db } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { PlayerProgress, CaughtFish, BiomeType } from '@/types/fishing';

const COLLECTION_NAME = 'fishing_players';

// ========================================
// PLAYER PROGRESS FUNCTIONS
// ========================================

/**
 * สร้าง player ใหม่
 */
export async function createNewFishingPlayer(
  userId: string,
  displayName: string,
  photoURL?: string
): Promise<PlayerProgress> {
  const newPlayer: PlayerProgress = {
    userId,
    displayName,
    photoURL,
    coins: 1000, // เริ่มต้นให้ 1000 coins
    level: 1,
    exp: 0,
    expToNextLevel: 100,
    ownedRods: ['rod_bamboo'], // เริ่มต้นมีไม้ไผ่
    ownedBaits: {
      bait_worm: 50, // เริ่มต้นมีหนอนดิน 50 ตัว
    },
    ownedBoats: ['boat_raft'], // เริ่มต้นมีแพไม้
    equippedRod: 'rod_bamboo',
    equippedBait: 'bait_worm',
    equippedBoat: 'boat_raft',
    unlockedMaps: ['ocean'], // เริ่มต้นปลดล็อคทะเล
    totalFishCaught: 0,
    totalWeightCaught: 0,
    totalEarned: 0,
    fishCollection: {},
    lastPlayed: new Date(),
    createdAt: new Date(),
  };

  const playerRef = doc(db, COLLECTION_NAME, userId);
  await setDoc(playerRef, {
    ...newPlayer,
    lastPlayed: serverTimestamp(),
    createdAt: serverTimestamp(),
  });

  return newPlayer;
}

/**
 * โหลดข้อมูล player
 */
export async function loadFishingPlayer(
  userId: string
): Promise<PlayerProgress | null> {
  try {
    const playerRef = doc(db, COLLECTION_NAME, userId);
    const playerSnap = await getDoc(playerRef);

    if (!playerSnap.exists()) {
      return null;
    }

    const data = playerSnap.data();

    // แปลง Timestamp เป็น Date
    const player: PlayerProgress = {
      ...data,
      lastPlayed: data.lastPlayed?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      fishCollection: data.fishCollection || {},
    } as PlayerProgress;

    return player;
  } catch (error) {
    console.error('Error loading fishing player:', error);
    return null;
  }
}

/**
 * บันทึกข้อมูล player
 */
export async function saveFishingPlayer(
  player: PlayerProgress
): Promise<void> {
  try {
    const playerRef = doc(db, COLLECTION_NAME, player.userId);
    await setDoc(
      playerRef,
      {
        ...player,
        lastPlayed: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error saving fishing player:', error);
    throw error;
  }
}

/**
 * เช็คว่า player เคยเล่นหรือยัง
 */
export async function hasFishingProgress(userId: string): Promise<boolean> {
  try {
    const playerRef = doc(db, COLLECTION_NAME, userId);
    const playerSnap = await getDoc(playerRef);
    return playerSnap.exists();
  } catch (error) {
    console.error('Error checking fishing progress:', error);
    return false;
  }
}

// ========================================
// GAME ACTIONS
// ========================================

/**
 * เพิ่ม coins
 */
export async function addCoins(
  userId: string,
  amount: number
): Promise<void> {
  const playerRef = doc(db, COLLECTION_NAME, userId);
  const player = await loadFishingPlayer(userId);

  if (player) {
    await updateDoc(playerRef, {
      coins: player.coins + amount,
      totalEarned: player.totalEarned + amount,
      lastPlayed: serverTimestamp(),
    });
  }
}

/**
 * ลด coins (ซื้อของ)
 */
export async function spendCoins(
  userId: string,
  amount: number
): Promise<boolean> {
  const player = await loadFishingPlayer(userId);

  if (!player || player.coins < amount) {
    return false;
  }

  const playerRef = doc(db, COLLECTION_NAME, userId);
  await updateDoc(playerRef, {
    coins: player.coins - amount,
    lastPlayed: serverTimestamp(),
  });

  return true;
}

/**
 * เพิ่ม EXP และอัพเดท level
 */
export async function addExp(userId: string, expAmount: number): Promise<{
  newLevel: number;
  leveledUp: boolean;
}> {
  const player = await loadFishingPlayer(userId);
  if (!player) throw new Error('Player not found');

  let newExp = player.exp + expAmount;
  let newLevel = player.level;
  let leveledUp = false;

  // คำนวณ level up
  while (newExp >= player.expToNextLevel) {
    newExp -= player.expToNextLevel;
    newLevel++;
    leveledUp = true;
  }

  // คำนวณ EXP ที่ต้องการสำหรับ level ถัดไป
  const newExpToNextLevel = Math.floor(100 * Math.pow(1.5, newLevel - 1));

  const playerRef = doc(db, COLLECTION_NAME, userId);
  await updateDoc(playerRef, {
    exp: newExp,
    level: newLevel,
    expToNextLevel: newExpToNextLevel,
    lastPlayed: serverTimestamp(),
  });

  return { newLevel, leveledUp };
}

/**
 * บันทึกปลาที่จับได้
 */
export async function saveCaughtFish(
  userId: string,
  caughtFish: CaughtFish
): Promise<void> {
  const player = await loadFishingPlayer(userId);
  if (!player) throw new Error('Player not found');

  const fishCollection = player.fishCollection || {};

  // อัพเดทสถิติปลาชนิดนั้น
  if (!fishCollection[caughtFish.fishId]) {
    fishCollection[caughtFish.fishId] = {
      caught: 0,
      maxWeight: 0,
      firstCaughtAt: caughtFish.caughtAt,
    };
  }

  fishCollection[caughtFish.fishId].caught++;
  fishCollection[caughtFish.fishId].maxWeight = Math.max(
    fishCollection[caughtFish.fishId].maxWeight,
    caughtFish.weight
  );

  const playerRef = doc(db, COLLECTION_NAME, userId);
  await updateDoc(playerRef, {
    fishCollection,
    totalFishCaught: player.totalFishCaught + 1,
    totalWeightCaught: player.totalWeightCaught + caughtFish.weight,
    lastPlayed: serverTimestamp(),
  });
}

/**
 * ซื้อ Rod
 */
export async function buyRod(userId: string, rodId: string): Promise<boolean> {
  const player = await loadFishingPlayer(userId);
  if (!player) return false;

  // เช็คว่ามีอยู่แล้วหรือไม่
  if (player.ownedRods.includes(rodId)) {
    return false;
  }

  const playerRef = doc(db, COLLECTION_NAME, userId);
  await updateDoc(playerRef, {
    ownedRods: [...player.ownedRods, rodId],
    lastPlayed: serverTimestamp(),
  });

  return true;
}

/**
 * ซื้อ Bait (เพิ่มจำนวน)
 */
export async function buyBait(
  userId: string,
  baitId: string,
  quantity: number
): Promise<boolean> {
  const player = await loadFishingPlayer(userId);
  if (!player) return false;

  const ownedBaits = { ...player.ownedBaits };
  ownedBaits[baitId] = (ownedBaits[baitId] || 0) + quantity;

  const playerRef = doc(db, COLLECTION_NAME, userId);
  await updateDoc(playerRef, {
    ownedBaits,
    lastPlayed: serverTimestamp(),
  });

  return true;
}

/**
 * ใช้ Bait (ลดจำนวน)
 */
export async function useBait(userId: string, baitId: string): Promise<boolean> {
  const player = await loadFishingPlayer(userId);
  if (!player || !player.ownedBaits[baitId] || player.ownedBaits[baitId] <= 0) {
    return false;
  }

  const ownedBaits = { ...player.ownedBaits };
  ownedBaits[baitId]--;

  const playerRef = doc(db, COLLECTION_NAME, userId);
  await updateDoc(playerRef, {
    ownedBaits,
    lastPlayed: serverTimestamp(),
  });

  return true;
}

/**
 * ซื้อ Boat
 */
export async function buyBoat(
  userId: string,
  boatId: string
): Promise<boolean> {
  const player = await loadFishingPlayer(userId);
  if (!player) return false;

  // เช็คว่ามีอยู่แล้วหรือไม่
  if (player.ownedBoats.includes(boatId)) {
    return false;
  }

  const playerRef = doc(db, COLLECTION_NAME, userId);
  await updateDoc(playerRef, {
    ownedBoats: [...player.ownedBoats, boatId],
    lastPlayed: serverTimestamp(),
  });

  return true;
}

/**
 * สวมใส่อุปกรณ์
 */
export async function equipItem(
  userId: string,
  itemType: 'rod' | 'bait' | 'boat',
  itemId: string
): Promise<boolean> {
  const player = await loadFishingPlayer(userId);
  if (!player) return false;

  const updateData: any = {
    lastPlayed: serverTimestamp(),
  };

  if (itemType === 'rod') {
    if (!player.ownedRods.includes(itemId)) return false;
    updateData.equippedRod = itemId;
  } else if (itemType === 'bait') {
    if (!player.ownedBaits[itemId] || player.ownedBaits[itemId] <= 0)
      return false;
    updateData.equippedBait = itemId;
  } else if (itemType === 'boat') {
    if (!player.ownedBoats.includes(itemId)) return false;
    updateData.equippedBoat = itemId;
  }

  const playerRef = doc(db, COLLECTION_NAME, userId);
  await updateDoc(playerRef, updateData);

  return true;
}

/**
 * ปลดล็อค Map
 */
export async function unlockMap(
  userId: string,
  biomeId: BiomeType
): Promise<boolean> {
  const player = await loadFishingPlayer(userId);
  if (!player) return false;

  // เช็คว่าปลดล็อคแล้วหรือยัง
  if (player.unlockedMaps.includes(biomeId)) {
    return false;
  }

  const playerRef = doc(db, COLLECTION_NAME, userId);
  await updateDoc(playerRef, {
    unlockedMaps: [...player.unlockedMaps, biomeId],
    lastPlayed: serverTimestamp(),
  });

  return true;
}

// ========================================
// LEADERBOARD
// ========================================

/**
 * ดึง Top Players (เรียงตาม total coins earned)
 */
export async function getTopPlayers(limit: number = 10): Promise<PlayerProgress[]> {
  try {
    const playersRef = collection(db, COLLECTION_NAME);
    const q = query(playersRef);
    const querySnapshot = await getDocs(q);

    const players: PlayerProgress[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      players.push({
        ...data,
        lastPlayed: data.lastPlayed?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
      } as PlayerProgress);
    });

    // เรียงตาม totalEarned
    players.sort((a, b) => b.totalEarned - a.totalEarned);

    return players.slice(0, limit);
  } catch (error) {
    console.error('Error getting top players:', error);
    return [];
  }
}

/**
 * ดึง Top Players (เรียงตาม level)
 */
export async function getTopPlayersByLevel(
  limit: number = 10
): Promise<PlayerProgress[]> {
  try {
    const playersRef = collection(db, COLLECTION_NAME);
    const q = query(playersRef);
    const querySnapshot = await getDocs(q);

    const players: PlayerProgress[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      players.push({
        ...data,
        lastPlayed: data.lastPlayed?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
      } as PlayerProgress);
    });

    // เรียงตาม level แล้ว exp
    players.sort((a, b) => {
      if (a.level === b.level) {
        return b.exp - a.exp;
      }
      return b.level - a.level;
    });

    return players.slice(0, limit);
  } catch (error) {
    console.error('Error getting top players by level:', error);
    return [];
  }
}
