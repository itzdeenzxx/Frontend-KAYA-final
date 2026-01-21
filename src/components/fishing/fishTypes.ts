// Fish types with different scores and rarity
export interface FishType {
  id: string;
  name: string;
  nameEn: string;
  emoji: string;
  score: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  color: string;
  weight: number; // For weighted random selection (higher = more common)
  // Difficulty settings - ยิ่งหายากยิ่งจับยาก
  pullGain: number; // % ที่เพิ่มเมื่อตบ 1 ครั้ง (ยิ่งน้อยยิ่งยาก)
  decayRate: number; // % ที่ลดลงเมื่อไม่ตบ (ยิ่งมากยิ่งยาก)
  waitTimeMin: number; // เวลารอขั้นต่ำ (วินาที)
  waitTimeMax: number; // เวลารอสูงสุด (วินาที)
}

export const FISH_TYPES: FishType[] = [
  {
    id: 'sardine',
    name: 'ปลาซาร์ดีน',
    nameEn: 'Sardine',
    emoji: '🐟',
    score: 10,
    rarity: 'common',
    color: 'from-gray-400 to-gray-600',
    weight: 40,
    pullGain: 10,      // ง่าย: +15% ต่อครั้ง (≈7 ครั้งจับได้)
    decayRate: 0.3,    // ช้า: หนีช้า
    waitTimeMin: 2,
    waitTimeMax: 4
  },
  {
    id: 'bass',
    name: 'ปลากะพง',
    nameEn: 'Bass',
    emoji: '🐠',
    score: 25,
    rarity: 'uncommon',
    color: 'from-green-400 to-green-600',
    weight: 30,
    pullGain: 8,      // ปานกลาง: +12% ต่อครั้ง (≈9 ครั้งจับได้)
    decayRate: 0.5,    // ปานกลาง
    waitTimeMin: 3,
    waitTimeMax: 5
  },
  {
    id: 'salmon',
    name: 'ปลาแซลมอน',
    nameEn: 'Salmon',
    emoji: '🐡',
    score: 50,
    rarity: 'rare',
    color: 'from-orange-400 to-red-500',
    weight: 18,
    pullGain: 7,      // ยากขึ้น: +10% ต่อครั้ง (≈10 ครั้งจับได้)
    decayRate: 0.8,    // หนีเร็วขึ้น
    waitTimeMin: 4,
    waitTimeMax: 7
  },
  {
    id: 'tuna',
    name: 'ปลาทูน่า',
    nameEn: 'Tuna',
    emoji: '🦈',
    score: 100,
    rarity: 'epic',
    color: 'from-blue-500 to-indigo-600',
    weight: 10,
    pullGain: 6,       // ยากมาก: +8% ต่อครั้ง (≈13 ครั้งจับได้)
    decayRate: 1.2,    // หนีเร็วมาก
    waitTimeMin: 5,
    waitTimeMax: 9
  },
  {
    id: 'golden',
    name: 'ปลาทอง',
    nameEn: 'Golden Fish',
    emoji: '✨🐟✨',
    score: 250,
    rarity: 'legendary',
    color: 'from-yellow-400 to-amber-500',
    weight: 2,
    pullGain: 4,       // ยากที่สุด: +6% ต่อครั้ง (≈17 ครั้งจับได้)
    decayRate: 1.8,    // หนีเร็วที่สุด
    waitTimeMin: 6,
    waitTimeMax: 12
  }
];

export const RARITY_COLORS = {
  common: 'text-gray-400 border-gray-400',
  uncommon: 'text-green-400 border-green-400',
  rare: 'text-blue-400 border-blue-400',
  epic: 'text-purple-400 border-purple-400',
  legendary: 'text-yellow-400 border-yellow-400'
};

export const RARITY_BG = {
  common: 'bg-gray-500/20',
  uncommon: 'bg-green-500/20',
  rare: 'bg-blue-500/20',
  epic: 'bg-purple-500/20',
  legendary: 'bg-yellow-500/20'
};

// Weighted random selection
export function getRandomFish(): FishType {
  const totalWeight = FISH_TYPES.reduce((sum, fish) => sum + fish.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const fish of FISH_TYPES) {
    random -= fish.weight;
    if (random <= 0) {
      return fish;
    }
  }
  
  return FISH_TYPES[0]; // Fallback
}
