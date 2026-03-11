import { FishingRod, Bait, Boat, Rarity } from '@/types/fishing';

// ========================================
// FISHING RODS DATABASE
// ========================================

export const FISHING_RODS: FishingRod[] = [
  // COMMON RODS
  {
    id: 'rod_bamboo',
    name: 'Bamboo Rod',
    nameTh: 'คันเบ็ดไม้ไผ่',
    rarity: 'common',
    price: 0, // เริ่มต้นให้ฟรี
    catchBonus: 0,
    durability: 100,
    description: 'คันเบ็ดธรรมดาที่ทุกคนเริ่มต้นด้วย',
    requiredLevel: 1,
  },
  {
    id: 'rod_wooden',
    name: 'Wooden Rod',
    nameTh: 'คันเบ็ดไม้',
    rarity: 'common',
    price: 500,
    catchBonus: 5,
    durability: 150,
    description: 'คันเบ็ดไม้แข็งแรงกว่าไม้ไผ่',
    requiredLevel: 1,
  },
  {
    id: 'rod_basic_fiberglass',
    name: 'Basic Fiberglass Rod',
    nameTh: 'คันเบ็ดไฟเบอร์กลาสพื้นฐาน',
    rarity: 'common',
    price: 1200,
    catchBonus: 10,
    durability: 200,
    description: 'คันเบ็ดที่ยืดหยุ่นและทนทาน',
    requiredLevel: 3,
  },

  // UNCOMMON RODS
  {
    id: 'rod_carbon',
    name: 'Carbon Fiber Rod',
    nameTh: 'คันเบ็ดคาร์บอนไฟเบอร์',
    rarity: 'uncommon',
    price: 3000,
    catchBonus: 18,
    durability: 300,
    description: 'คันเบ็ดเบาและแข็งแรง',
    requiredLevel: 5,
  },
  {
    id: 'rod_spinning',
    name: 'Spinning Rod',
    nameTh: 'คันเบ็ดสปินนิ่ง',
    rarity: 'uncommon',
    price: 4500,
    catchBonus: 22,
    durability: 350,
    description: 'คันเบ็ดสำหรับจับปลากลางขนาด',
    requiredLevel: 7,
  },
  {
    id: 'rod_baitcasting',
    name: 'Baitcasting Rod',
    nameTh: 'คันเบ็ดเบทแคสติ้ง',
    rarity: 'uncommon',
    price: 5500,
    catchBonus: 25,
    durability: 400,
    description: 'คันเบ็ดควบคุมง่าย แม่นยำสูง',
    requiredLevel: 10,
  },

  // RARE RODS
  {
    id: 'rod_telescopic',
    name: 'Telescopic Rod',
    nameTh: 'คันเบ็ดหดได้',
    rarity: 'rare',
    price: 8000,
    catchBonus: 32,
    durability: 500,
    description: 'คันเบ็ดพกพาสะดวก พลังดี',
    requiredLevel: 12,
  },
  {
    id: 'rod_fly',
    name: 'Fly Fishing Rod',
    nameTh: 'คันเบ็ดฟลายฟิชชิ่ง',
    rarity: 'rare',
    price: 10000,
    catchBonus: 35,
    durability: 550,
    description: 'คันเบ็ดสำหรับจับปลาน้ำไหล',
    requiredLevel: 15,
  },
  {
    id: 'rod_surf',
    name: 'Surf Casting Rod',
    nameTh: 'คันเบ็ดชายหาด',
    rarity: 'rare',
    price: 12000,
    catchBonus: 40,
    durability: 600,
    description: 'คันเบ็ดยาวสำหรับขว้างไกล',
    requiredLevel: 18,
  },

  // EPIC RODS
  {
    id: 'rod_pro_carbon',
    name: 'Pro Carbon Rod',
    nameTh: 'คันเบ็ดคาร์บอนโปร',
    rarity: 'epic',
    price: 20000,
    catchBonus: 50,
    durability: 800,
    description: 'คันเบ็ดระดับมืออาชีพ',
    requiredLevel: 22,
  },
  {
    id: 'rod_titanium',
    name: 'Titanium Rod',
    nameTh: 'คันเบ็ดไทเทเนียม',
    rarity: 'epic',
    price: 30000,
    catchBonus: 60,
    durability: 1000,
    description: 'คันเบ็ดเบาและแข็งแรงสุดขีด',
    requiredLevel: 25,
  },
  {
    id: 'rod_deep_sea',
    name: 'Deep Sea Rod',
    nameTh: 'คันเบ็ดท้องทะเลลึก',
    rarity: 'epic',
    price: 35000,
    catchBonus: 65,
    durability: 1200,
    description: 'คันเบ็ดทนทานสำหรับปลาใหญ่',
    requiredLevel: 28,
  },

  // LEGENDARY RODS
  {
    id: 'rod_master',
    name: 'Master Angler Rod',
    nameTh: 'คันเบ็ดนักตกปลาเซียน',
    rarity: 'legendary',
    price: 50000,
    catchBonus: 80,
    durability: 1500,
    description: 'คันเบ็ดในตำนานที่ทุกคนใฝ่ฝัน',
    requiredLevel: 32,
  },
  {
    id: 'rod_golden',
    name: 'Golden Dragon Rod',
    nameTh: 'คันเบ็ดมังกรทอง',
    rarity: 'legendary',
    price: 100000,
    catchBonus: 100,
    durability: 2000,
    description: 'คันเบ็ดที่ทรงพลังที่สุด นำโชคลาภมา',
    requiredLevel: 40,
  },
];

// ========================================
// BAITS DATABASE
// ========================================

export const BAITS: Bait[] = [
  // COMMON BAITS
  {
    id: 'bait_worm',
    name: 'Earthworm',
    nameTh: 'หนอนดิน',
    rarity: 'common',
    price: 10,
    rarityBonus: 0,
    attractionRadius: 1.0,
    quantity: 20,
    description: 'เหยื่อพื้นฐานที่ใช้ได้กับปลาหลายชนิด',
  },
  {
    id: 'bait_bread',
    name: 'Bread',
    nameTh: 'ขนมปัง',
    rarity: 'common',
    price: 5,
    rarityBonus: 0,
    attractionRadius: 0.8,
    quantity: 30,
    description: 'เหยื่อถูกที่สุด เหมาะกับปลาเล็ก',
  },
  {
    id: 'bait_corn',
    name: 'Sweet Corn',
    nameTh: 'ข้าวโพดหวาน',
    rarity: 'common',
    price: 15,
    rarityBonus: 0,
    attractionRadius: 0.9,
    quantity: 25,
    description: 'เหยื่อหวานดึงดูดปลาบางชนิด',
  },

  // UNCOMMON BAITS
  {
    id: 'bait_shrimp',
    name: 'Fresh Shrimp',
    nameTh: 'กุ้งสด',
    rarity: 'uncommon',
    price: 50,
    rarityBonus: 10,
    attractionRadius: 1.5,
    quantity: 15,
    description: 'เหยื่อทะเลดึงดูดปลาทะเล',
  },
  {
    id: 'bait_minnow',
    name: 'Live Minnow',
    nameTh: 'ปลาเล็กสด',
    rarity: 'uncommon',
    price: 80,
    rarityBonus: 15,
    attractionRadius: 1.8,
    quantity: 12,
    description: 'เหยื่อมีชีวิตดึงดูดปลาล่าเหยื่อ',
  },
  {
    id: 'bait_cricket',
    name: 'Cricket',
    nameTh: 'จิ้งหรีด',
    rarity: 'uncommon',
    price: 40,
    rarityBonus: 12,
    attractionRadius: 1.3,
    quantity: 18,
    description: 'เหยื่อแมลงสำหรับปลาน้ำจืด',
  },

  // RARE BAITS
  {
    id: 'bait_squid',
    name: 'Fresh Squid',
    nameTh: 'ปลาหมึกสด',
    rarity: 'rare',
    price: 150,
    rarityBonus: 25,
    attractionRadius: 2.2,
    quantity: 10,
    description: 'เหยื่อที่ปลาใหญ่ชอบ',
  },
  {
    id: 'bait_crab',
    name: 'Soft Shell Crab',
    nameTh: 'ปูนิ่ม',
    rarity: 'rare',
    price: 200,
    rarityBonus: 30,
    attractionRadius: 2.5,
    quantity: 8,
    description: 'เหยื่อพรีเมียมสำหรับปลาทะเล',
  },
  {
    id: 'bait_frog',
    name: 'Live Frog',
    nameTh: 'กบสด',
    rarity: 'rare',
    price: 180,
    rarityBonus: 28,
    attractionRadius: 2.3,
    quantity: 9,
    description: 'เหยื่อดึงดูดปลาล่าเหยื่อขนาดใหญ่',
  },

  // EPIC BAITS
  {
    id: 'bait_lure_legendary',
    name: 'Legendary Lure',
    nameTh: 'เหยื่อเทียมตำนาน',
    rarity: 'epic',
    price: 500,
    rarityBonus: 45,
    attractionRadius: 3.0,
    quantity: 5,
    description: 'เหยื่อเทียมที่ดีที่สุด มีความทนทาน',
  },
  {
    id: 'bait_octopus',
    name: 'Fresh Octopus',
    nameTh: 'ปลาหมึกยักษ์สด',
    rarity: 'epic',
    price: 600,
    rarityBonus: 50,
    attractionRadius: 3.2,
    quantity: 4,
    description: 'เหยื่อสำหรับปลายักษ์เท่านั้น',
  },
  {
    id: 'bait_special_blend',
    name: 'Special Blend Bait',
    nameTh: 'เหยื่อผสมพิเศษ',
    rarity: 'epic',
    price: 700,
    rarityBonus: 55,
    attractionRadius: 3.5,
    quantity: 3,
    description: 'สูตรลับที่ดึงดูดปลาหายาก',
  },

  // LEGENDARY BAITS
  {
    id: 'bait_golden',
    name: 'Golden Bait',
    nameTh: 'เหยื่อทองคำ',
    rarity: 'legendary',
    price: 2000,
    rarityBonus: 80,
    attractionRadius: 4.5,
    quantity: 2,
    description: 'เหยื่อในตำนานดึงดูดปลาหายาก',
  },
  {
    id: 'bait_mystical',
    name: 'Mystical Essence',
    nameTh: 'แก่นวิเศษ',
    rarity: 'legendary',
    price: 5000,
    rarityBonus: 100,
    attractionRadius: 5.0,
    quantity: 1,
    description: 'พลังวิเศษที่ดึงดูดปลาในตำนาน',
  },
];

// ========================================
// BOATS DATABASE
// ========================================

export const BOATS: Boat[] = [
  // COMMON BOATS
  {
    id: 'boat_raft',
    name: 'Wooden Raft',
    nameTh: 'แพไม้',
    rarity: 'common',
    price: 0, // เริ่มต้นให้ฟรี
    capacity: 50, // กิโลกรัม
    speed: 1.0,
    description: 'แพไม้เล็กที่ทุกคนเริ่มต้น',
    requiredLevel: 1,
  },
  {
    id: 'boat_canoe',
    name: 'Canoe',
    nameTh: 'เรือเล็ก',
    rarity: 'common',
    price: 1000,
    capacity: 80,
    speed: 1.2,
    description: 'เรือเล็กพายได้สะดวก',
    requiredLevel: 1,
  },
  {
    id: 'boat_kayak',
    name: 'Kayak',
    nameTh: 'คายัค',
    rarity: 'common',
    price: 2000,
    capacity: 100,
    speed: 1.4,
    description: 'เรือคายัคเร็วและคล่องตัว',
    requiredLevel: 3,
  },

  // UNCOMMON BOATS
  {
    id: 'boat_fishing_boat',
    name: 'Fishing Boat',
    nameTh: 'เรือตกปลา',
    rarity: 'uncommon',
    price: 5000,
    capacity: 150,
    speed: 1.6,
    description: 'เรือตกปลาขนาดเล็ก',
    requiredLevel: 5,
  },
  {
    id: 'boat_speedboat',
    name: 'Speedboat',
    nameTh: 'เรือเร็ว',
    rarity: 'uncommon',
    price: 8000,
    capacity: 180,
    speed: 2.0,
    description: 'เรือเร็วเคลื่อนที่คล่อง',
    requiredLevel: 8,
  },
  {
    id: 'boat_sailboat',
    name: 'Sailboat',
    nameTh: 'เรือใบ',
    rarity: 'uncommon',
    price: 10000,
    capacity: 200,
    speed: 1.7,
    description: 'เรือใบสวยงามและมั่นคง',
    requiredLevel: 10,
  },

  // RARE BOATS
  {
    id: 'boat_cabin_cruiser',
    name: 'Cabin Cruiser',
    nameTh: 'เรือห้องนอน',
    rarity: 'rare',
    price: 20000,
    capacity: 300,
    speed: 2.2,
    description: 'เรือขนาดกลางมีห้องพัก',
    requiredLevel: 15,
  },
  {
    id: 'boat_trawler',
    name: 'Trawler',
    nameTh: 'เรืออวนลาก',
    rarity: 'rare',
    price: 30000,
    capacity: 400,
    speed: 1.9,
    description: 'เรือทนทานความจุสูง',
    requiredLevel: 18,
  },
  {
    id: 'boat_yacht_small',
    name: 'Small Yacht',
    nameTh: 'เรือยอทช์เล็ก',
    rarity: 'rare',
    price: 40000,
    capacity: 350,
    speed: 2.5,
    description: 'เรือยอทช์หรูหรา',
    requiredLevel: 20,
  },

  // EPIC BOATS
  {
    id: 'boat_sport_fisher',
    name: 'Sport Fishing Yacht',
    nameTh: 'เรือยอทช์ตกปลาสปอร์ต',
    rarity: 'epic',
    price: 80000,
    capacity: 600,
    speed: 3.0,
    description: 'เรือตกปลาระดับมืออาชีพ',
    requiredLevel: 25,
  },
  {
    id: 'boat_catamaran',
    name: 'Luxury Catamaran',
    nameTh: 'เรือแคทามารันหรู',
    rarity: 'epic',
    price: 120000,
    capacity: 700,
    speed: 3.2,
    description: 'เรือแบบ 2 ตัวเรือมั่นคง',
    requiredLevel: 30,
  },
  {
    id: 'boat_mega_yacht',
    name: 'Mega Yacht',
    nameTh: 'เมก้าเบอร์ยอทช์',
    rarity: 'epic',
    price: 200000,
    capacity: 1000,
    speed: 3.5,
    description: 'เรือยอทช์ขนาดใหญ่',
    requiredLevel: 35,
  },

  // LEGENDARY BOATS
  {
    id: 'boat_super_yacht',
    name: 'Super Yacht',
    nameTh: 'ซูเปอร์ยอทช์',
    rarity: 'legendary',
    price: 500000,
    capacity: 1500,
    speed: 4.0,
    description: 'เรือยอทช์หรูหราที่สุด',
    requiredLevel: 40,
  },
  {
    id: 'boat_golden_ship',
    name: 'Golden Dragon Ship',
    nameTh: 'เรือมังกรทอง',
    rarity: 'legendary',
    price: 1000000,
    capacity: 2000,
    speed: 5.0,
    description: 'เรือในตำนานที่ทรงพลังที่สุด',
    requiredLevel: 50,
  },
];

// ========================================
// HELPER FUNCTIONS
// ========================================

export function getRodById(rodId: string): FishingRod | undefined {
  return FISHING_RODS.find(rod => rod.id === rodId);
}

export function getBaitById(baitId: string): Bait | undefined {
  return BAITS.find(bait => bait.id === baitId);
}

export function getBoatById(boatId: string): Boat | undefined {
  return BOATS.find(boat => boat.id === boatId);
}

export function getRodsByRarity(rarity: Rarity): FishingRod[] {
  return FISHING_RODS.filter(rod => rod.rarity === rarity);
}

export function getBaitsByRarity(rarity: Rarity): Bait[] {
  return BAITS.filter(bait => bait.rarity === rarity);
}

export function getBoatsByRarity(rarity: Rarity): Boat[] {
  return BOATS.filter(boat => boat.rarity === rarity);
}

export function getAvailableRods(playerLevel: number): FishingRod[] {
  return FISHING_RODS.filter(rod => rod.requiredLevel <= playerLevel);
}

export function getAvailableBoats(playerLevel: number): Boat[] {
  return BOATS.filter(boat => boat.requiredLevel <= playerLevel);
}

// คำนวณ catch rate หลังจากใช้ equipment
export function calculateCatchRate(
  baseDifficulty: number, // 1-10 (ยิ่งมากยิ่งยาก)
  rodBonus: number = 0,    // % bonus จากคันเบ็ด
  baitRarityBonus: number = 0, // % bonus จากเหยื่อ
): number {
  // Base success rate (ยิ่ง difficulty สูง ยิ่งยาก)
  let successRate = Math.max(10, 100 - (baseDifficulty * 9));
  
  // เพิ่ม bonus จาก rod
  successRate += rodBonus;
  
  // เพิ่ม bonus จาก bait (ถ้าเป็นปลา rare)
  successRate += baitRarityBonus * 0.5;
  
  // จำกัดไม่ให้เกิน 95%
  return Math.min(95, Math.max(5, successRate));
}

// คำนวณ EXP ที่ได้จากการจับปลา
export function calculateFishingExp(
  fishRarity: Rarity,
  fishWeight: number
): number {
  const rarityExp = {
    common: 10,
    uncommon: 25,
    rare: 50,
    epic: 100,
    legendary: 250,
  };
  
  const baseExp = rarityExp[fishRarity];
  const weightBonus = Math.floor(fishWeight * 2);
  
  return baseExp + weightBonus;
}
