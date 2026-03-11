import { BiomeMap, BiomeType } from '@/types/fishing';
import { getFishByBiome } from './fishingDatabase';

// ========================================
// BIOME MAPS DATABASE
// ========================================

export const BIOME_MAPS: BiomeMap[] = [
  {
    id: 'ocean',
    name: 'Ocean',
    nameTh: 'ทะเล',
    description: 'ทะเลกว้างใหญ่เต็มไปด้วยปลาหลากหลายชนิด จากปลาเล็กจนถึงปลายักษ์',
    unlockPrice: 0, // เริ่มต้นปลดล็อคฟรี
    requiredLevel: 1,
    background: '/images/maps/ocean-bg.jpg',
    thumbnail: '/images/maps/ocean-thumb.jpg',
    fishSpecies: getFishByBiome('ocean').map(f => f.id),
    emoji: '🌊',
  },
  {
    id: 'river',
    name: 'River',
    nameTh: 'แม่น้ำ',
    description: 'แม่น้ำที่ไหลเย็นสบาย เต็มไปด้วยปลาน้ำจืดหลากหลาย',
    unlockPrice: 5000,
    requiredLevel: 5,
    background: '/images/maps/river-bg.jpg',
    thumbnail: '/images/maps/river-thumb.jpg',
    fishSpecies: getFishByBiome('river').map(f => f.id),
    emoji: '🏞️',
  },
  {
    id: 'lake',
    name: 'Lake',
    nameTh: 'ทะเลสาบ',
    description: 'ทะเลสาบสงบเงียบที่มีปลาคุณภาพดีและหลากหลาย',
    unlockPrice: 10000,
    requiredLevel: 10,
    background: '/images/maps/lake-bg.jpg',
    thumbnail: '/images/maps/lake-thumb.jpg',
    fishSpecies: getFishByBiome('lake').map(f => f.id),
    emoji: '🏔️',
  },
  {
    id: 'ice',
    name: 'Ice',
    nameTh: 'น้ำแข็ง',
    description: 'พื้นที่น้ำแข็งโพรงลึก เต็มไปด้วยปลาหายากที่ทนหนาว',
    unlockPrice: 20000,
    requiredLevel: 15,
    background: '/images/maps/ice-bg.jpg',
    thumbnail: '/images/maps/ice-thumb.jpg',
    fishSpecies: getFishByBiome('ice').map(f => f.id),
    emoji: '❄️',
  },
  {
    id: 'pond',
    name: 'Pond',
    nameTh: 'บ่อ',
    description: 'บ่อน้ำขังสงบที่มีปลาสวยงามและปลาเลี้ยง',
    unlockPrice: 15000,
    requiredLevel: 12,
    background: '/images/maps/pond-bg.jpg',
    thumbnail: '/images/maps/pond-thumb.jpg',
    fishSpecies: getFishByBiome('pond').map(f => f.id),
    emoji: '💧',
  },
  {
    id: 'swamp',
    name: 'Swamp',
    nameTh: 'บึง',
    description: 'บึงชื้นแฉะที่มีปลาดุร้ายและหายาก รวมถึงปลายักษ์โบราณ',
    unlockPrice: 30000,
    requiredLevel: 20,
    background: '/images/maps/swamp-bg.jpg',
    thumbnail: '/images/maps/swamp-thumb.jpg',
    fishSpecies: getFishByBiome('swamp').map(f => f.id),
    emoji: '🌿',
  },
];

// ========================================
// HELPER FUNCTIONS
// ========================================

export function getBiomeById(biomeId: BiomeType): BiomeMap | undefined {
  return BIOME_MAPS.find(biome => biome.id === biomeId);
}

export function getUnlockedBiomes(unlockedBiomeIds: BiomeType[]): BiomeMap[] {
  return BIOME_MAPS.filter(biome => unlockedBiomeIds.includes(biome.id));
}

export function getLockedBiomes(
  unlockedBiomeIds: BiomeType[],
  playerLevel: number
): BiomeMap[] {
  return BIOME_MAPS.filter(
    biome =>
      !unlockedBiomeIds.includes(biome.id) && biome.requiredLevel <= playerLevel
  );
}

export function canUnlockBiome(
  biome: BiomeMap,
  playerCoins: number,
  playerLevel: number
): boolean {
  return playerCoins >= biome.unlockPrice && playerLevel >= biome.requiredLevel;
}

export function getBiomeProgress(
  biomeId: BiomeType,
  caughtFishIds: string[]
): {
  totalSpecies: number;
  caughtSpecies: number;
  progress: number;
} {
  const biome = getBiomeById(biomeId);
  if (!biome) {
    return { totalSpecies: 0, caughtSpecies: 0, progress: 0 };
  }

  const totalSpecies = biome.fishSpecies.length;
  const caughtSpecies = biome.fishSpecies.filter(fishId =>
    caughtFishIds.includes(fishId)
  ).length;

  const progress = totalSpecies > 0 ? (caughtSpecies / totalSpecies) * 100 : 0;

  return {
    totalSpecies,
    caughtSpecies,
    progress: Math.round(progress),
  };
}

// จัดเรียง biomes ตาม unlock order
export function getSortedBiomes(): BiomeMap[] {
  return [...BIOME_MAPS].sort((a, b) => a.requiredLevel - b.requiredLevel);
}

export function getNextBiomeToUnlock(
  unlockedBiomeIds: BiomeType[],
  playerLevel: number
): BiomeMap | null {
  const locked = getLockedBiomes(unlockedBiomeIds, playerLevel);
  if (locked.length === 0) return null;

  // หา biome ที่ต้องการ level ต่ำที่สุด
  return locked.reduce((prev, current) =>
    current.requiredLevel < prev.requiredLevel ? current : prev
  );
}
