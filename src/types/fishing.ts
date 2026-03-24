// ========================================
// FISHING GAME TYPES & INTERFACES
// ========================================

// Rarity levels
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// Biome types (6 maps)
export type BiomeType = 'ocean' | 'river' | 'lake' | 'ice' | 'pond' | 'swamp';

// ========================================
// FISH TYPES
// ========================================

export interface Fish {
  id: string;
  name: string;
  nameEn: string;
  nameTh: string;
  biome: BiomeType;
  rarity: Rarity;
  minWeight: number;      // กิโลกรัม
  maxWeight: number;      // กิโลกรัม
  basePrice: number;      // ราคาต่อกิโลกรัม
  catchDifficulty: number; // 1-10 (ยิ่งมากยิ่งยาก)
  spawnChance: number;    // 0-100 (โอกาสพบ)
  description: string;
  emoji: string;
  image?: string;
}

// ========================================
// EQUIPMENT TYPES
// ========================================

export interface FishingRod {
  id: string;
  name: string;
  nameTh: string;
  rarity: Rarity;
  price: number;
  catchBonus: number;     // % เพิ่มโอกาสจับได้ (0-100)
  durability: number;     // ความทนทาน
  description: string;
  image?: string;
  requiredLevel: number;
}

export interface Bait {
  id: string;
  name: string;
  nameTh: string;
  rarity: Rarity;
  price: number;
  rarityBonus: number;    // % เพิ่มโอกาสได้ปลา rarity สูง
  attractionRadius: number; // รัศมีดึงดูดปลา
  quantity: number;       // จำนวนที่มี (consumable)
  description: string;
  image?: string;
}

export interface Boat {
  id: string;
  name: string;
  nameTh: string;
  rarity: Rarity;
  price: number;
  capacity: number;       // ความจุน้ำหนัก (กิโลกรัม)
  speed: number;          // ความเร็วในการเคลื่อนที่
  description: string;
  image?: string;
  requiredLevel: number;
}

export interface PlayerEquipment {
  rod: FishingRod | null;
  bait: Bait | null;
  boat: Boat | null;
}

// ========================================
// MAP/BIOME TYPES  
// ========================================

export interface BiomeMap {
  id: BiomeType;
  name: string;
  nameTh: string;
  description: string;
  unlockPrice: number;    // ราคาปลดล็อค
  requiredLevel: number;  // เลเวลที่ต้องมี
  background: string;     // URL หรือ path ของภาพพื้นหลัง
  thumbnail: string;
  fishSpecies: string[];  // Fish IDs ที่พบในพื้นที่นี้
  emoji: string;
}

// ========================================
// PLAYER DATA
// ========================================

export interface CaughtFish {
  fishId: string;
  weight: number;
  caughtAt: Date;
  biome: BiomeType;
  sellPrice: number;
}

export interface PlayerProgress {
  userId: string;
  displayName: string;
  photoURL?: string;
  
  // Currency & Level
  coins: number;
  level: number;
  exp: number;
  expToNextLevel: number;
  
  // Equipment owned
  ownedRods: string[];    // Rod IDs
  ownedBaits: { [baitId: string]: number }; // Bait ID -> quantity
  ownedBoats: string[];   // Boat IDs
  
  // Currently equipped
  equippedRod: string | null;
  equippedBait: string | null;
  equippedBoat: string | null;
  
  // Map progress
  unlockedMaps: BiomeType[];
  
  // Statistics
  totalFishCaught: number;
  totalWeightCaught: number;
  totalEarned: number;
  fishCollection: {
    [fishId: string]: {
      caught: number;
      maxWeight: number;
      firstCaughtAt: Date;
    };
  };
  
  // Game state
  lastPlayed: Date;
  createdAt: Date;
}

// ========================================
// GAME SESSION
// ========================================

export interface FishingSession {
  biome: BiomeType;
  startTime: Date;
  caughtFish: CaughtFish[];
  currentWeight: number;
  maxWeight: number;       // จากเรือที่ใช้
  isActive: boolean;
}

// ========================================
// SHOP TYPES
// ========================================

export type ShopCategory = 'rods' | 'baits' | 'boats';

export interface ShopItem {
  type: ShopCategory;
  item: FishingRod | Bait | Boat;
  isOwned: boolean;
  canAfford: boolean;
  isLocked: boolean;      // ล็อคเพราะ level ไม่ถึง
}

// ========================================
// GAME STATES
// ========================================

export type FishingGameScreen = 
  | 'menu'           // หน้าแรก (New Game, Continue, Back)
  | 'main-hub'       // หน้าหลักของเกม
  | 'map-selection'  // เลือก biome
  | 'shop'           // ร้านค้า
  | 'gameplay'       // กำลังตกปลา
  | 'catch-result'   // ผลการจับปลา
  | 'sell-summary';  // สรุปการขาย

export interface FishingGameState {
  currentScreen: FishingGameScreen;
  playerProgress: PlayerProgress | null;
  currentSession: FishingSession | null;
  isLoading: boolean;
  error: string | null;
}

// ========================================
// CONSTANTS
// ========================================

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#9CA3AF',      // Gray
  uncommon: '#10B981',    // Green
  rare: '#3B82F6',        // Blue
  epic: '#A855F7',        // Purple
  legendary: '#F59E0B',   // Gold
};

export const RARITY_GLOW: Record<Rarity, string> = {
  common: 'shadow-sm',
  uncommon: 'shadow-md shadow-green-500/50',
  rare: 'shadow-lg shadow-blue-500/50',
  epic: 'shadow-xl shadow-purple-500/50',
  legendary: 'shadow-2xl shadow-amber-500/50 animate-pulse',
};

export const RARITY_NAMES_TH: Record<Rarity, string> = {
  common: 'ธรรมดา',
  uncommon: 'ไม่ธรรมดา',
  rare: 'หายาก',
  epic: 'ยอดเยี่ยม',
  legendary: 'ตำนาน',
};

export const BIOME_NAMES_TH: Record<BiomeType, string> = {
  ocean: 'ทะเล',
  river: 'แม่น้ำ',
  lake: 'ทะเลสาบ',
  ice: 'น้ำแข็ง',
  pond: 'บ่อ',
  swamp: 'บึง',
};

export const BIOME_EMOJIS: Record<BiomeType, string> = {
  ocean: '🌊',
  river: '🏞️',
  lake: '🏔️',
  ice: '❄️',
  pond: '💧',
  swamp: '🌿',
};
