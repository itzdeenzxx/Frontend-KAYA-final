import { 
  Music, 
  Timer, 
  Flame, 
  Heart, 
  Dumbbell, 
  Brain,
  PersonStanding,
  Waves,
  Footprints,
  Wind,
  Target
} from 'lucide-react';
import React from 'react';

// Workout style types
export interface WorkoutStyle {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  duration: string;
  calories: string;
  level: 'ง่าย' | 'ปานกลาง' | 'หนัก';
  features: string[];
}

export interface WorkoutExercise {
  name: string;
  nameTh: string;
  duration: number | null;
  reps: number | null;
  icon: string;
  description?: string;
  kayaExercise?: 'arm_raise' | 'torso_twist' | 'knee_raise' | 'squat_arm_raise' | 'push_up' | 'static_lunge' | 'jump_squat' | 'plank_hold' | 'mountain_climber' | 'pistol_squat' | 'pushup_shoulder_tap' | 'burpee'; // For AI-powered KAYA exercises
}

// Workout styles data
export const workoutStyles: WorkoutStyle[] = [
  {
    id: 'rhythm',
    name: 'ออกกำลังกายตามจังหวะเพลง',
    nameEn: 'Rhythm Workout',
    description: 'ออกกำลังกายสนุกๆ พร้อมเพลงที่คุณชอบ ทำตามจังหวะ',
    icon: React.createElement(Music, { className: "w-8 h-8" }),
    color: 'text-pink-500',
    bgGradient: 'from-pink-500/20 to-purple-500/20',
    duration: '15-30 นาที',
    calories: '150-300 kcal',
    level: 'ปานกลาง',
    features: ['จังหวะเพลง', 'สนุกสนาน', 'Cardio']
  },
  {
    id: 'slow',
    name: 'ออกกำลังกายช้าๆ ผ่อนคลาย',
    nameEn: 'Slow & Relaxing',
    description: 'เคลื่อนไหวช้าๆ เน้นการหายใจและความยืดหยุ่น',
    icon: React.createElement(Wind, { className: "w-8 h-8" }),
    color: 'text-green-500',
    bgGradient: 'from-green-500/20 to-teal-500/20',
    duration: '20-40 นาที',
    calories: '80-150 kcal',
    level: 'ง่าย',
    features: ['ผ่อนคลาย', 'หายใจลึก', 'Flexibility']
  },
  {
    id: 'stretch',
    name: 'ยืดเหยียดกล้ามเนื้อ',
    nameEn: 'Stretching',
    description: 'ยืดกล้ามเนื้อทุกส่วน เพิ่มความยืดหยุ่นร่างกาย',
    icon: React.createElement(PersonStanding, { className: "w-8 h-8" }),
    color: 'text-blue-500',
    bgGradient: 'from-blue-500/20 to-cyan-500/20',
    duration: '10-20 นาที',
    calories: '50-100 kcal',
    level: 'ง่าย',
    features: ['ยืดหยุ่น', 'ลดเกร็ง', 'Recovery']
  },
  {
    id: 'kaya-stretch',
    name: 'KAYA ยืดเหยียดอัจฉริยะ',
    nameEn: 'KAYA AI Stretching',
    description: '3 ท่ายืดเหยียด พร้อม AI Coach วิเคราะห์ท่าทาง, Visual Guide และ TTS',
    icon: React.createElement(Target, { className: "w-8 h-8" }),
    color: 'text-primary',
    bgGradient: 'from-primary/20 to-orange-500/20',
    duration: '5-10 นาที',
    calories: '30-60 kcal',
    level: 'ง่าย',
    features: ['AI Coach', 'Visual Guide', 'TTS', 'นับเซ็ต']
  },
  {
    id: 'kaya-intermediate',
    name: 'KAYA ระดับกลาง',
    nameEn: 'KAYA Intermediate',
    description: 'สควอตยกแขน วิดพื้น ลันจ์อยู่กับที่ กล้องด้านข้าง',
    icon: React.createElement(Target, { className: "w-8 h-8" }),
    color: 'text-yellow-500',
    bgGradient: 'from-yellow-500/10 to-yellow-500/20',
    duration: '8-12 นาที',
    calories: '80-150 kcal',
    level: 'ปานกลาง',
    features: ['AI Coach', 'Push-up', 'Lunge', 'Side Camera']
  },
  {
    id: 'kaya-advanced',
    name: 'KAYA ระดับสูง',
    nameEn: 'KAYA Advanced',
    description: 'กระโดดสควอต ท่าแพลงค์ ไต่เขา ฝึกพลังระเบิดและคาร์ดิโอ',
    icon: React.createElement(Flame, { className: "w-8 h-8" }),
    color: 'text-orange-500',
    bgGradient: 'from-orange-500/20 to-red-500/20',
    duration: '12-18 นาที',
    calories: '120-200 kcal',
    level: 'หนัก',
    features: ['AI Coach', 'Jump Detection', 'Plank Hold', 'Cardio']
  },
  {
    id: 'kaya-expert',
    name: 'KAYA ผู้เชี่ยวชาญ',
    nameEn: 'KAYA Expert',
    description: 'สควอตขาเดียว วิดพื้นแตะไหล่ เบอร์พี ท้าทายขั้นสูงสุด!',
    icon: React.createElement(Target, { className: "w-8 h-8" }),
    color: 'text-rose-500',
    bgGradient: 'from-rose-500/20 to-purple-500/20',
    duration: '15-25 นาที',
    calories: '180-300 kcal',
    level: 'หนัก',
    features: ['AI Coach', 'Pistol Squat', 'Shoulder Tap', 'Burpee']
  },
  {
    id: 'hiit',
    name: 'HIIT เผาผลาญสูงสุด',
    nameEn: 'HIIT Training',
    description: 'ออกกำลังกายแบบ Interval เข้มข้น เผาผลาญไขมันเร็ว',
    icon: React.createElement(Flame, { className: "w-8 h-8" }),
    color: 'text-orange-500',
    bgGradient: 'from-orange-500/20 to-red-500/20',
    duration: '15-25 นาที',
    calories: '200-400 kcal',
    level: 'หนัก',
    features: ['เผาผลาญสูง', 'Interval', 'Fat Burn']
  },
  {
    id: 'strength',
    name: 'สร้างกล้ามเนื้อ',
    nameEn: 'Strength Training',
    description: 'เน้นการสร้างกล้ามเนื้อและความแข็งแรง',
    icon: React.createElement(Dumbbell, { className: "w-8 h-8" }),
    color: 'text-purple-500',
    bgGradient: 'from-purple-500/20 to-indigo-500/20',
    duration: '20-40 นาที',
    calories: '150-300 kcal',
    level: 'ปานกลาง',
    features: ['สร้างกล้าม', 'ความแข็งแรง', 'Toning']
  },
  {
    id: 'cardio',
    name: 'คาร์ดิโอ',
    nameEn: 'Cardio Workout',
    description: 'เพิ่มความแข็งแรงของหัวใจและปอด',
    icon: React.createElement(Heart, { className: "w-8 h-8" }),
    color: 'text-red-500',
    bgGradient: 'from-red-500/20 to-pink-500/20',
    duration: '20-45 นาที',
    calories: '200-450 kcal',
    level: 'ปานกลาง',
    features: ['หัวใจแข็งแรง', 'เพิ่มความทนทาน', 'Endurance']
  },
  {
    id: 'yoga',
    name: 'โยคะ',
    nameEn: 'Yoga Flow',
    description: 'ผสมผสานการหายใจ สมาธิ และการเคลื่อนไหว',
    icon: React.createElement(Waves, { className: "w-8 h-8" }),
    color: 'text-teal-500',
    bgGradient: 'from-teal-500/20 to-emerald-500/20',
    duration: '20-60 นาที',
    calories: '100-200 kcal',
    level: 'ง่าย',
    features: ['สมาธิ', 'Balance', 'Mind & Body']
  },
  {
    id: 'dance',
    name: 'เต้นออกกำลังกาย',
    nameEn: 'Dance Fitness',
    description: 'เต้นสนุกๆ พร้อมออกกำลังกายไปด้วย',
    icon: React.createElement(Footprints, { className: "w-8 h-8" }),
    color: 'text-yellow-500',
    bgGradient: 'from-yellow-500/20 to-orange-500/20',
    duration: '20-45 นาที',
    calories: '200-400 kcal',
    level: 'ปานกลาง',
    features: ['สนุก', 'เต้น', 'Full Body']
  },
  {
    id: 'ai-personalized',
    name: 'AI Personalized',
    nameEn: 'AI Personalized Workout',
    description: 'โปรแกรมออกกำลังกายที่ AI สร้างให้คุณโดยเฉพาะ',
    icon: React.createElement(Brain, { className: "w-8 h-8" }),
    color: 'text-primary',
    bgGradient: 'from-primary/20 to-orange-500/20',
    duration: 'ตามเป้าหมาย',
    calories: 'ตามโปรแกรม',
    level: 'ปานกลาง',
    features: ['AI วิเคราะห์', 'ปรับตามเป้าหมาย', 'Personal']
  }
];

// Exercise sets for each workout style (Expanded with 8-10 exercises per style)
export const workoutExercises: Record<string, WorkoutExercise[]> = {
  rhythm: [
    { name: 'Dance Warm-up', nameTh: 'วอร์มอัพเต้น', duration: 30, reps: null, icon: 'run', description: 'เคลื่อนไหวร่างกายตามจังหวะเบาๆ' },
    { name: 'Step Touch', nameTh: 'สเตปทัช', duration: 45, reps: null, icon: 'leg', description: 'ก้าวเท้าซ้าย-ขวาสลับกัน' },
    { name: 'Grapevine', nameTh: 'เกรฟไวน์', duration: 45, reps: null, icon: 'leg', description: 'ก้าวข้างไขว้เท้าตามจังหวะ' },
    { name: 'Box Step', nameTh: 'บ็อกซ์สเตป', duration: 45, reps: null, icon: 'leg', description: 'ก้าวเป็นรูปสี่เหลี่ยม' },
    { name: 'Mambo', nameTh: 'แมมโบ้', duration: 60, reps: null, icon: 'run', description: 'ก้าวหน้า-หลังสลับกัน' },
    { name: 'Cha Cha Cha', nameTh: 'ชะ-ชะ-ช่า', duration: 45, reps: null, icon: 'leg', description: 'สามก้าวเร็วตามจังหวะ' },
    { name: 'Arm Waves', nameTh: 'เวฟแขน', duration: 30, reps: null, icon: 'muscle', description: 'เคลื่อนไหวแขนเป็นคลื่น' },
    { name: 'Hip Shake', nameTh: 'เขย่าสะโพก', duration: 45, reps: null, icon: 'leg', description: 'เขย่าสะโพกซ้าย-ขวา' },
    { name: 'Spin Move', nameTh: 'หมุนตัว', duration: 30, reps: null, icon: 'run', description: 'หมุนตัว 360 องศา' },
    { name: 'Cool Down Dance', nameTh: 'คูลดาวน์เต้น', duration: 30, reps: null, icon: 'yoga', description: 'เคลื่อนไหวช้าๆ ผ่อนคลาย' },
  ],
  slow: [
    { name: 'Deep Breathing', nameTh: 'หายใจลึก', duration: 60, reps: null, icon: 'yoga', description: 'หายใจเข้าลึกๆ ออกช้าๆ' },
    { name: 'Neck Rolls', nameTh: 'หมุนคอ', duration: 45, reps: null, icon: 'yoga', description: 'หมุนคอเป็นวงกลม' },
    { name: 'Shoulder Circles', nameTh: 'หมุนไหล่', duration: 45, reps: null, icon: 'yoga', description: 'หมุนไหล่ไปข้างหน้าและข้างหลัง' },
    { name: 'Cat-Cow Stretch', nameTh: 'ท่าแมว-วัว', duration: 60, reps: null, icon: 'yoga', description: 'โค้งหลังขึ้น-ลงสลับกัน' },
    { name: 'Gentle Twist', nameTh: 'บิดตัวช้าๆ', duration: 45, reps: null, icon: 'yoga', description: 'บิดลำตัวไปซ้าย-ขวา' },
    { name: 'Standing Forward Fold', nameTh: 'ก้มตัวยืน', duration: 45, reps: null, icon: 'yoga', description: 'ก้มตัวลงแตะพื้น' },
    { name: 'Side Stretch', nameTh: 'ยืดข้างลำตัว', duration: 30, reps: null, icon: 'yoga', description: 'เอียงตัวยืดด้านข้าง' },
    { name: 'Arm Circles', nameTh: 'หมุนแขน', duration: 30, reps: null, icon: 'muscle', description: 'หมุนแขนเป็นวงกลม' },
    { name: 'Hip Circles', nameTh: 'หมุนสะโพก', duration: 45, reps: null, icon: 'leg', description: 'หมุนสะโพกเป็นวงกลม' },
    { name: 'Relaxation', nameTh: 'ผ่อนคลาย', duration: 90, reps: null, icon: 'yoga', description: 'นอนหงาย หายใจลึกๆ' },
  ],
  stretch: [
    { name: 'Standing Quad Stretch', nameTh: 'ยืดต้นขาหน้า', duration: 30, reps: null, icon: 'leg', description: 'ยืนดึงเท้าไปด้านหลัง' },
    { name: 'Hamstring Stretch', nameTh: 'ยืดต้นขาหลัง', duration: 30, reps: null, icon: 'leg', description: 'ก้มตัวยืดขาหลัง' },
    { name: 'Hip Flexor Stretch', nameTh: 'ยืดสะโพก', duration: 30, reps: null, icon: 'leg', description: 'ย่อเข่าหนึ่งข้าง ยืดสะโพก' },
    { name: 'Chest Opener', nameTh: 'เปิดหน้าอก', duration: 30, reps: null, icon: 'yoga', description: 'ดึงแขนไปด้านหลัง เปิดหน้าอก' },
    { name: 'Tricep Stretch', nameTh: 'ยืดไทรเซป', duration: 20, reps: null, icon: 'muscle', description: 'ดึงข้อศอกไปด้านหลัง' },
    { name: 'Shoulder Stretch', nameTh: 'ยืดไหล่', duration: 25, reps: null, icon: 'muscle', description: 'ดึงแขนข้ามหน้าอก' },
    { name: 'Neck Stretch', nameTh: 'ยืดคอ', duration: 25, reps: null, icon: 'yoga', description: 'เอียงศีรษะยืดคอ' },
    { name: 'Calf Stretch', nameTh: 'ยืดน่อง', duration: 30, reps: null, icon: 'leg', description: 'ยืนดันผนัง ยืดน่อง' },
    { name: 'Spinal Twist', nameTh: 'บิดกระดูกสันหลัง', duration: 40, reps: null, icon: 'yoga', description: 'นั่งบิดลำตัว' },
    { name: 'Full Body Stretch', nameTh: 'ยืดทั้งตัว', duration: 45, reps: null, icon: 'yoga', description: 'ยืดแขนขาพร้อมกัน' },
  ],
  'kaya-stretch': [
    { name: 'Arm Raise', nameTh: 'ยกแขน', duration: null, reps: 10, icon: 'kaya-arm', description: 'ยกแขนขึ้น-ลง ยืดกล้ามเนื้อไหล่และแขน', kayaExercise: 'arm_raise' },
    { name: 'Torso Twist', nameTh: 'บิดลำตัว', duration: null, reps: 10, icon: 'kaya-torso', description: 'บิดลำตัวซ้าย-ขวา ยืดกล้ามเนื้อแกนกลาง', kayaExercise: 'torso_twist' },
    { name: 'Knee Raise', nameTh: 'ยกเข่า', duration: null, reps: 10, icon: 'kaya-knee', description: 'ยกเข่าขึ้น-ลง ยืดกล้ามเนื้อขาและสะโพก', kayaExercise: 'knee_raise' },
  ],

  // New intermediate KAYA set
  'kaya-intermediate': [
    { name: 'Squat + Arm Raise', nameTh: 'สควอตพร้อมยกแขนเหนือศีรษะ', duration: null, reps: 10, icon: 'kaya-squat-arm', description: 'สควอตพร้อมยกแขนเหนือศีรษะ', kayaExercise: 'squat_arm_raise' },
    { name: 'Push-up', nameTh: 'วิดพื้น', duration: null, reps: 10, icon: 'kaya-pushup', description: 'วิดพื้นเต็มรูปแบบ เน้นกล้ามเนื้ออกและแขน', kayaExercise: 'push_up' },
    { name: 'Static Lunge', nameTh: 'ลันจ์อยู่กับที่', duration: null, reps: 10, icon: 'kaya-lunge', description: 'ย่อขาหน้า 90 องศา ฝึกกล้ามเนื้อขา', kayaExercise: 'static_lunge' },
  ],

  // Advanced KAYA set
  'kaya-advanced': [
    { name: 'Jump Squat', nameTh: 'กระโดดสควอต', duration: null, reps: 15, icon: 'kaya-jump-squat', description: 'สควอตแล้วกระโดดขึ้น ฝึกพลังระเบิด', kayaExercise: 'jump_squat' },
    { name: 'Plank Hold', nameTh: 'ท่าแพลงค์', duration: 30, reps: null, icon: 'kaya-plank', description: 'ค้างท่าแพลงค์ ลำตัวตรง เสริมแกนกลางลำตัว', kayaExercise: 'plank_hold' },
    { name: 'Mountain Climber', nameTh: 'ไต่เขา', duration: null, reps: 20, icon: 'kaya-mountain', description: 'ท่าแพลงค์สลับยกเข่า เหมาะสำหรับคาร์ดิโอ', kayaExercise: 'mountain_climber' },
  ],

  // Expert KAYA set
  'kaya-expert': [
    { name: 'Pistol Squat', nameTh: 'สควอตขาเดียว', duration: null, reps: 8, icon: 'kaya-pistol', description: 'สควอตขาเดียว ท้าทายการทรงตัวและความแข็งแรง', kayaExercise: 'pistol_squat' },
    { name: 'Push-up + Shoulder Tap', nameTh: 'วิดพื้นแตะไหล่', duration: null, reps: 12, icon: 'kaya-pushup-tap', description: 'วิดพื้นแล้วแตะไหล่สลับข้าง เสริมความมั่นคง', kayaExercise: 'pushup_shoulder_tap' },
    { name: 'Burpee', nameTh: 'เบอร์พี', duration: null, reps: 10, icon: 'kaya-burpee', description: 'สควอต-แพลงค์-กระโดด ท่าซับซ้อนที่สุด', kayaExercise: 'burpee' },
  ],
  hiit: [
    { name: 'Jumping Jacks', nameTh: 'กระโดดตบ', duration: 30, reps: null, icon: 'run', description: 'กระโดดกางขา-แขน' },
    { name: 'Burpees', nameTh: 'เบอร์พี', duration: 30, reps: null, icon: 'fire', description: 'ลงนอน-กระโดดขึ้น' },
    { name: 'Mountain Climbers', nameTh: 'ไต่เขา', duration: 30, reps: null, icon: 'fire', description: 'ท่าแพลงค์วิ่งยกเข่า' },
    { name: 'High Knees', nameTh: 'ยกเข่าสูง', duration: 30, reps: null, icon: 'leg', description: 'วิ่งยกเข่าสูงอยู่กับที่' },
    { name: 'Jump Squats', nameTh: 'กระโดดสควอท', duration: 30, reps: null, icon: 'weight', description: 'สควอทแล้วกระโดด' },
    { name: 'Sprint in Place', nameTh: 'วิ่งอยู่กับที่', duration: 30, reps: null, icon: 'run', description: 'วิ่งเร็วอยู่กับที่' },
    { name: 'Tuck Jumps', nameTh: 'กระโดดเก็บเข่า', duration: 25, reps: null, icon: 'fire', description: 'กระโดดพับเข่าขึ้น' },
    { name: 'Box Jumps', nameTh: 'กระโดดกล่อง', duration: 30, reps: null, icon: 'leg', description: 'กระโดดขึ้น-ลง' },
    { name: 'Speed Skaters', nameTh: 'สเก็ตเร็ว', duration: 30, reps: null, icon: 'run', description: 'กระโดดสลับข้าง' },
    { name: 'Rest & Recover', nameTh: 'พักฟื้น', duration: 20, reps: null, icon: 'yoga', description: 'หายใจลึกๆ พักกล้ามเนื้อ' },
  ],
  strength: [
    { name: 'Push-ups', nameTh: 'วิดพื้น', duration: null, reps: 15, icon: 'muscle', description: 'วิดพื้นท่ามาตรฐาน' },
    { name: 'Squats', nameTh: 'สควอท', duration: null, reps: 20, icon: 'weight', description: 'ย่อตัวลง 90 องศา' },
    { name: 'Lunges', nameTh: 'ลันจ์', duration: null, reps: 12, icon: 'leg', description: 'ก้าวเท้าย่อเข่าสลับข้าง' },
    { name: 'Plank', nameTh: 'แพลงค์', duration: 45, reps: null, icon: 'yoga', description: 'ค้างท่ากระดานตรง' },
    { name: 'Tricep Dips', nameTh: 'ดิปส์ไทรเซป', duration: null, reps: 12, icon: 'muscle', description: 'ย่อแขนหลังเก้าอี้' },
    { name: 'Glute Bridge', nameTh: 'ยกสะโพก', duration: null, reps: 15, icon: 'leg', description: 'นอนหงายยกสะโพก' },
    { name: 'Diamond Push-ups', nameTh: 'วิดพื้นเพชร', duration: null, reps: 10, icon: 'muscle', description: 'วิดพื้นมือชิดกัน' },
    { name: 'Wall Sit', nameTh: 'นั่งพิงกำแพง', duration: 45, reps: null, icon: 'leg', description: 'นั่งพิงกำแพง 90 องศา' },
    { name: 'Superman Hold', nameTh: 'ท่าซูเปอร์แมน', duration: 30, reps: null, icon: 'yoga', description: 'นอนคว่ำยกแขน-ขา' },
    { name: 'Side Plank', nameTh: 'แพลงค์ข้าง', duration: 30, reps: null, icon: 'yoga', description: 'แพลงค์ตะแคงข้าง' },
  ],
  cardio: [
    { name: 'Jumping Jacks', nameTh: 'กระโดดตบ', duration: 45, reps: null, icon: 'run', description: 'กระโดดกางขา-แขน' },
    { name: 'High Knees', nameTh: 'ยกเข่าสูง', duration: 45, reps: null, icon: 'leg', description: 'วิ่งยกเข่าสูงอยู่กับที่' },
    { name: 'Butt Kicks', nameTh: 'เตะส้นก้น', duration: 45, reps: null, icon: 'leg', description: 'วิ่งเตะส้นถูกก้น' },
    { name: 'Jump Rope', nameTh: 'กระโดดเชือก', duration: 60, reps: null, icon: 'run', description: 'กระโดดเชือกหรือสมมติ' },
    { name: 'Side Shuffle', nameTh: 'ชัฟเฟิลข้าง', duration: 45, reps: null, icon: 'leg', description: 'เคลื่อนตัวไปด้านข้าง' },
    { name: 'Marching', nameTh: 'เดินอยู่กับที่', duration: 45, reps: null, icon: 'run', description: 'เดินยกเข่าสูง' },
    { name: 'Step Ups', nameTh: 'สเตปอัพ', duration: 45, reps: null, icon: 'leg', description: 'ก้าวขึ้น-ลงบันได' },
    { name: 'Jog in Place', nameTh: 'วิ่งเหยาะอยู่กับที่', duration: 60, reps: null, icon: 'run', description: 'วิ่งเหยาะเบาๆ' },
    { name: 'Toe Taps', nameTh: 'แตะปลายเท้า', duration: 30, reps: null, icon: 'leg', description: 'แตะปลายเท้าสลับข้าง' },
    { name: 'Cool Down Jog', nameTh: 'วิ่งช้าๆ', duration: 60, reps: null, icon: 'run', description: 'วิ่งช้าๆ คูลดาวน์' },
  ],
  yoga: [
    { name: 'Mountain Pose', nameTh: 'ท่าภูเขา', duration: 30, reps: null, icon: 'yoga', description: 'ยืนตรง หายใจลึก' },
    { name: 'Downward Dog', nameTh: 'ท่าสุนัขคว่ำ', duration: 45, reps: null, icon: 'yoga', description: 'ยกสะโพกขึ้นเป็นรูปตัว V' },
    { name: 'Warrior I', nameTh: 'ท่านักรบ 1', duration: 45, reps: null, icon: 'yoga', description: 'ก้าวขาหน้า ยกแขนขึ้น' },
    { name: 'Warrior II', nameTh: 'ท่านักรบ 2', duration: 45, reps: null, icon: 'yoga', description: 'กางแขนออกข้าง มองหน้า' },
    { name: 'Tree Pose', nameTh: 'ท่าต้นไม้', duration: 30, reps: null, icon: 'yoga', description: 'ยืนขาเดียว เท้าพักบนขา' },
    { name: 'Child Pose', nameTh: 'ท่าเด็ก', duration: 45, reps: null, icon: 'yoga', description: 'นั่งคุกเข่า ก้มตัวลง' },
    { name: 'Cobra Pose', nameTh: 'ท่างูเห่า', duration: 30, reps: null, icon: 'yoga', description: 'นอนคว่ำ ยกหน้าอกขึ้น' },
    { name: 'Triangle Pose', nameTh: 'ท่าสามเหลี่ยม', duration: 40, reps: null, icon: 'yoga', description: 'กางขา เอียงตัวลง' },
    { name: 'Bridge Pose', nameTh: 'ท่าสะพาน', duration: 40, reps: null, icon: 'yoga', description: 'นอนหงาย ยกสะโพก' },
    { name: 'Savasana', nameTh: 'ท่าศพ (ผ่อนคลาย)', duration: 90, reps: null, icon: 'yoga', description: 'นอนหงาย ผ่อนคลายทั้งตัว' },
  ],
  dance: [
    { name: 'Dance Warm-up', nameTh: 'วอร์มอัพเต้น', duration: 45, reps: null, icon: 'run', description: 'เคลื่อนไหวเบาๆ ตามจังหวะ' },
    { name: 'Hip Hop Moves', nameTh: 'ท่าฮิปฮอป', duration: 60, reps: null, icon: 'run', description: 'ท่าเต้นสไตล์ฮิปฮอป' },
    { name: 'Latin Moves', nameTh: 'ท่าละติน', duration: 60, reps: null, icon: 'leg', description: 'ท่าเต้นสไตล์ละติน' },
    { name: 'Body Roll', nameTh: 'โรลตัว', duration: 30, reps: null, icon: 'yoga', description: 'เคลื่อนไหวลำตัวเป็นคลื่น' },
    { name: 'Arm Pop', nameTh: 'ป๊อปแขน', duration: 30, reps: null, icon: 'muscle', description: 'เคลื่อนไหวแขนแบบป๊อป' },
    { name: 'Salsa Steps', nameTh: 'สเตปซัลซ่า', duration: 45, reps: null, icon: 'leg', description: 'ก้าวเท้าแบบซัลซ่า' },
    { name: 'Free Dance', nameTh: 'เต้นอิสระ', duration: 90, reps: null, icon: 'run', description: 'เต้นตามใจ ปล่อยใจไปกับเพลง' },
    { name: 'Dance Cardio', nameTh: 'เต้นคาร์ดิโอ', duration: 60, reps: null, icon: 'fire', description: 'เต้นเร็ว เบิร์นแคลอรี่' },
    { name: 'Groove Time', nameTh: 'กรูฟไทม์', duration: 45, reps: null, icon: 'run', description: 'เคลื่อนไหวตามจังหวะ' },
    { name: 'Cool Down', nameTh: 'คูลดาวน์', duration: 45, reps: null, icon: 'yoga', description: 'เคลื่อนไหวช้าๆ ผ่อนคลาย' },
  ],
  'ai-personalized': [
    { name: 'Dynamic Warm-up', nameTh: 'วอร์มอัพไดนามิก', duration: 45, reps: null, icon: 'run', description: 'อุ่นเครื่องแบบเคลื่อนไหว' },
    { name: 'Core Activation', nameTh: 'กระตุ้นแกนกลาง', duration: 45, reps: null, icon: 'yoga', description: 'กระตุ้นกล้ามเนื้อแกนกลาง' },
    { name: 'Compound Move 1', nameTh: 'ท่าผสม 1', duration: 45, reps: null, icon: 'fire', description: 'ท่าออกกำลังกายหลายกลุ่มกล้าม' },
    { name: 'Strength Focus', nameTh: 'เน้นความแข็งแรง', duration: null, reps: 15, icon: 'muscle', description: 'ท่าสร้างกล้ามเนื้อ' },
    { name: 'Cardio Burst', nameTh: 'คาร์ดิโอเร็ว', duration: 30, reps: null, icon: 'run', description: 'ท่าคาร์ดิโอเข้มข้น' },
    { name: 'Flexibility Move', nameTh: 'ท่ายืดหยุ่น', duration: 30, reps: null, icon: 'yoga', description: 'เพิ่มความยืดหยุ่น' },
    { name: 'Power Exercise', nameTh: 'ท่าพลัง', duration: null, reps: 12, icon: 'weight', description: 'ท่าเน้นพลังกล้ามเนื้อ' },
    { name: 'Balance Challenge', nameTh: 'ท้าทายการทรงตัว', duration: 30, reps: null, icon: 'yoga', description: 'ท่าฝึกการทรงตัว' },
    { name: 'Compound Move 2', nameTh: 'ท่าผสม 2', duration: 40, reps: null, icon: 'fire', description: 'ท่าผสมหลายกลุ่มกล้าม' },
    { name: 'Smart Cool Down', nameTh: 'คูลดาวน์อัจฉริยะ', duration: 60, reps: null, icon: 'yoga', description: 'คูลดาวน์ที่เหมาะกับคุณ' },
  ],
};

// Helper function to get workout style by ID
export function getWorkoutStyle(styleId: string | null): WorkoutStyle | null {
  if (!styleId) return null;
  return workoutStyles.find(s => s.id === styleId) || null;
}

// Helper function to get exercises for a style
export function getExercisesForStyle(styleId: string | null): WorkoutExercise[] {
  if (!styleId) {
    // Default exercises if no style selected (balanced full-body workout)
    return [
      { name: 'Jumping Jacks', nameTh: 'กระโดดตบ', duration: 30, reps: null, icon: 'run', description: 'กระโดดกางขา-แขน' },
      { name: 'Push-ups', nameTh: 'วิดพื้น', duration: null, reps: 15, icon: 'muscle', description: 'วิดพื้นท่ามาตรฐาน' },
      { name: 'High Knees', nameTh: 'ยกเข่าสูง', duration: 30, reps: null, icon: 'leg', description: 'วิ่งยกเข่าสูงอยู่กับที่' },
      { name: 'Squats', nameTh: 'สควอท', duration: null, reps: 20, icon: 'weight', description: 'ย่อตัวลง 90 องศา' },
      { name: 'Mountain Climbers', nameTh: 'ไต่เขา', duration: 30, reps: null, icon: 'fire', description: 'ท่าแพลงค์วิ่งยกเข่า' },
      { name: 'Lunges', nameTh: 'ลันจ์', duration: null, reps: 12, icon: 'leg', description: 'ก้าวเท้าย่อเข่าสลับข้าง' },
      { name: 'Burpees', nameTh: 'เบอร์พี', duration: 30, reps: null, icon: 'fire', description: 'ลงนอน-กระโดดขึ้น' },
      { name: 'Plank', nameTh: 'แพลงค์', duration: 45, reps: null, icon: 'yoga', description: 'ค้างท่ากระดานตรง' },
      { name: 'Glute Bridge', nameTh: 'ยกสะโพก', duration: null, reps: 15, icon: 'leg', description: 'นอนหงายยกสะโพก' },
      { name: 'Cool Down Stretch', nameTh: 'ยืดคูลดาวน์', duration: 60, reps: null, icon: 'yoga', description: 'ยืดกล้ามเนื้อผ่อนคลาย' },
    ];
  }

  // For AI-personalized: read exercises from localStorage (saved by AIWorkoutQuiz)
  if (styleId === 'ai-personalized') {
    try {
      const savedExercises = localStorage.getItem('kaya_ai_recommended_exercises');
      if (savedExercises) {
        const parsed = JSON.parse(savedExercises) as WorkoutExercise[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse AI recommended exercises:', e);
    }
    // Fall through to default ai-personalized exercises
  }

  return workoutExercises[styleId] || workoutExercises['strength'];
}

// Level badge colors
export const levelColors = {
  'ง่าย': 'bg-green-500/10 text-green-600',
  'ปานกลาง': 'bg-yellow-500/10 text-yellow-600',
  'หนัก': 'bg-red-500/10 text-red-600'
};
