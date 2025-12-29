import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Music, 
  Flame, 
  Heart, 
  Dumbbell, 
  Sparkles, 
  Brain,
  Zap,
  Play,
  ChevronRight,
  PersonStanding,
  Waves,
  Footprints,
  Wind,
  Crown,
  Timer,
  TrendingUp,
  Monitor,
  Smartphone,
  Tv
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isMobileDevice } from '@/lib/session';
import { useTheme } from '@/contexts/ThemeContext';

// Workout style types
interface WorkoutStyle {
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
  image: string;
  accentColor: string;
}

// Workout styles data with images
const workoutStyles: WorkoutStyle[] = [
  {
    id: 'rhythm',
    name: 'RHYTHM WORKOUT',
    nameEn: 'Dance to the Beat',
    description: 'ออกกำลังกายสนุกๆ พร้อมเพลงที่คุณชอบ',
    icon: <Music className="w-8 h-8" />,
    color: 'text-pink-400',
    bgGradient: 'from-pink-600/90 via-purple-600/80 to-violet-800/90',
    duration: '15-30 นาที',
    calories: '150-300',
    level: 'ปานกลาง',
    features: ['จังหวะเพลง', 'Cardio'],
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
    accentColor: 'pink'
  },
  {
    id: 'hiit',
    name: 'HIIT EXTREME',
    nameEn: 'Maximum Burn',
    description: 'เผาผลาญไขมันสูงสุดใน 20 นาที',
    icon: <Flame className="w-8 h-8" />,
    color: 'text-orange-400',
    bgGradient: 'from-orange-600/90 via-red-600/80 to-rose-800/90',
    duration: '15-25 นาที',
    calories: '200-400',
    level: 'หนัก',
    features: ['Fat Burn', 'Interval'],
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    accentColor: 'orange'
  },
  {
    id: 'strength',
    name: 'POWER TRAINING',
    nameEn: 'Build Your Strength',
    description: 'สร้างกล้ามเนื้อและความแข็งแรง',
    icon: <Dumbbell className="w-8 h-8" />,
    color: 'text-purple-400',
    bgGradient: 'from-purple-600/90 via-indigo-600/80 to-blue-800/90',
    duration: '20-40 นาที',
    calories: '150-300',
    level: 'ปานกลาง',
    features: ['Muscle', 'Toning'],
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=800&q=80',
    accentColor: 'purple'
  },
  {
    id: 'yoga',
    name: 'YOGA FLOW',
    nameEn: 'Mind & Body Balance',
    description: 'ผสมผสานการหายใจ สมาธิ และการเคลื่อนไหว',
    icon: <Waves className="w-8 h-8" />,
    color: 'text-teal-400',
    bgGradient: 'from-teal-600/90 via-emerald-600/80 to-green-800/90',
    duration: '20-60 นาที',
    calories: '100-200',
    level: 'ง่าย',
    features: ['สมาธิ', 'Balance'],
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
    accentColor: 'teal'
  },
  {
    id: 'cardio',
    name: 'CARDIO BLAST',
    nameEn: 'Heart Pumping Action',
    description: 'เพิ่มความแข็งแรงของหัวใจและปอด',
    icon: <Heart className="w-8 h-8" />,
    color: 'text-red-400',
    bgGradient: 'from-red-600/90 via-rose-600/80 to-pink-800/90',
    duration: '20-45 นาที',
    calories: '200-450',
    level: 'ปานกลาง',
    features: ['Endurance', 'Stamina'],
    image: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800&q=80',
    accentColor: 'red'
  },
  {
    id: 'stretch',
    name: 'FLEX & STRETCH',
    nameEn: 'Improve Flexibility',
    description: 'ยืดกล้ามเนื้อทุกส่วน เพิ่มความยืดหยุ่น',
    icon: <PersonStanding className="w-8 h-8" />,
    color: 'text-cyan-400',
    bgGradient: 'from-cyan-600/90 via-blue-600/80 to-indigo-800/90',
    duration: '10-20 นาที',
    calories: '50-100',
    level: 'ง่าย',
    features: ['Recovery', 'Flexibility'],
    image: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=800&q=80',
    accentColor: 'cyan'
  },
  {
    id: 'dance',
    name: 'DANCE FITNESS',
    nameEn: 'Move & Groove',
    description: 'เต้นสนุกๆ พร้อมออกกำลังกายไปด้วย',
    icon: <Footprints className="w-8 h-8" />,
    color: 'text-yellow-400',
    bgGradient: 'from-yellow-600/90 via-amber-600/80 to-orange-800/90',
    duration: '20-45 นาที',
    calories: '200-400',
    level: 'ปานกลาง',
    features: ['Fun', 'Full Body'],
    image: 'https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?w=800&q=80',
    accentColor: 'yellow'
  },
  {
    id: 'slow',
    name: 'SLOW & CALM',
    nameEn: 'Relaxing Movement',
    description: 'เคลื่อนไหวช้าๆ เน้นการหายใจและผ่อนคลาย',
    icon: <Wind className="w-8 h-8" />,
    color: 'text-green-400',
    bgGradient: 'from-green-600/90 via-emerald-600/80 to-teal-800/90',
    duration: '20-40 นาที',
    calories: '80-150',
    level: 'ง่าย',
    features: ['Relax', 'Breathing'],
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
    accentColor: 'green'
  }
];

// Level badge colors
const levelColors = {
  'ง่าย': 'bg-green-500/30 text-green-300 border-green-500/50',
  'ปานกลาง': 'bg-yellow-500/30 text-yellow-300 border-yellow-500/50',
  'หนัก': 'bg-red-500/30 text-red-300 border-red-500/50'
};

export default function WorkoutSelection() {
  const navigate = useNavigate();
  const [isMobile] = useState(() => isMobileDevice());
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleStyleSelect = (styleId: string) => {
    localStorage.setItem('kaya_workout_style', styleId);
    navigate('/workout-intro');
  };

  const handleAIPersonalized = () => {
    // Navigate to AI quiz first before workout mode
    navigate('/ai-workout-quiz');
  };

  return (
    <div className={cn(
      "min-h-screen relative overflow-x-hidden",
      isDark ? "bg-black text-white" : "bg-gray-50 text-gray-900"
    )}>
      {/* Animated Background - Dark Theme Only */}
      {isDark && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black" />
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute top-1/3 -left-40 w-60 h-60 bg-purple-500/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '2s' }} />
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>
      )}

      <div className="relative z-10 px-4 md:px-6 pt-6 pb-24 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/dashboard"
            className={cn(
              "w-10 h-10 rounded-xl backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all border",
              isDark 
                ? "bg-white/10 border-white/10" 
                : "bg-white border-gray-200 shadow-sm hover:bg-gray-100"
            )}
          >
            <ArrowLeft className={cn("w-5 h-5", isDark ? "text-white" : "text-gray-700")} />
          </Link>
          <div className="flex-1" />
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border",
            isDark 
              ? "bg-white/10 border-white/10" 
              : "bg-white border-gray-200 shadow-sm"
          )}>
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">PRO</span>
          </div>
        </div>

        {/* Hero Title */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-3 tracking-tight">
            <span className={cn(
              "bg-clip-text text-transparent",
              isDark 
                ? "bg-gradient-to-r from-white via-gray-200 to-gray-400" 
                : "bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500"
            )}>
              CHOOSE YOUR
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              WORKOUT
            </span>
          </h1>
          <p className={cn("text-lg max-w-md mx-auto", isDark ? "text-gray-400" : "text-gray-600")}>
            เลือกสไตล์การออกกำลังกายที่เหมาะกับคุณ
          </p>
          
          {/* Big Screen Button - Desktop/Tablet Only */}
          {!isMobile && (
            <button
              onClick={() => navigate('/bigscreen-setup')}
              className={cn(
                "mt-6 inline-flex items-center gap-3 px-6 py-3 rounded-xl border transition-all duration-300 hover:scale-[1.02] group",
                isDark 
                  ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/40 hover:border-green-500/60 hover:shadow-lg hover:shadow-green-500/20" 
                  : "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 hover:border-green-400 shadow-sm hover:shadow-md"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110",
                isDark ? "bg-green-500/30" : "bg-green-500/20"
              )}>
                <Tv className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-left">
                <p className={cn("font-semibold", isDark ? "text-green-400" : "text-green-700")}>
                  ใช้คอมพิวเตอร์เป็น Big Screen
                </p>
                <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                  แสดงผลบนหน้าจอใหญ่ ใช้มือถือเป็น Remote
                </p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <Monitor className={cn("w-4 h-4", isDark ? "text-green-400" : "text-green-600")} />
                <span className={cn("text-lg", isDark ? "text-gray-500" : "text-gray-400")}>+</span>
                <Smartphone className={cn("w-4 h-4", isDark ? "text-green-400" : "text-green-600")} />
              </div>
            </button>
          )}
        </div>

        {/* AI Personalized Premium Banner */}
        <div className="mb-8">
          <button
            onClick={handleAIPersonalized}
            className="w-full group relative overflow-hidden rounded-2xl md:rounded-3xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/20"
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=1200&q=80" 
                alt="AI Workout"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-primary/50 to-black/80" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
            </div>
            
            {/* Animated Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 animate-pulse opacity-50" />
            
            {/* Content */}
            <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center gap-4 md:gap-8">
              {/* Icon */}
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-lg shadow-primary/50 group-hover:scale-110 transition-transform">
                <Brain className="w-10 h-10 md:w-12 md:h-12 text-white" />
              </div>
              
              {/* Text */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <Crown className="w-5 h-5 text-yellow-400" />
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border border-yellow-500/50 text-yellow-300 text-xs font-bold">
                    AI POWERED
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-black mb-2">
                  <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    PERSONALIZED
                  </span>
                  {' '}
                  <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                    WORKOUT
                  </span>
                </h2>
                <p className="text-gray-300 text-sm md:text-base mb-3">
                  ให้ AI วิเคราะห์และสร้างโปรแกรมที่เหมาะกับคุณโดยเฉพาะ
                </p>
                <div className="flex items-center justify-center md:justify-start gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-primary">
                    <Sparkles className="w-4 h-4" /> Smart Analysis
                  </span>
                  <span className="flex items-center gap-1.5 text-primary">
                    <TrendingUp className="w-4 h-4" /> Progress Tracking
                  </span>
                </div>
              </div>
              
              {/* CTA */}
              <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-orange-500 font-bold text-white shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-all">
                <Play className="w-5 h-5" />
                <span>START</span>
              </div>
            </div>
          </button>
        </div>

        {/* Section Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className={cn(
            "flex-1 h-px bg-gradient-to-r from-transparent to-transparent",
            isDark ? "via-white/20" : "via-gray-300"
          )} />
          <span className={cn(
            "text-sm font-medium uppercase tracking-wider",
            isDark ? "text-gray-500" : "text-gray-400"
          )}>หรือเลือกสไตล์</span>
          <div className={cn(
            "flex-1 h-px bg-gradient-to-r from-transparent to-transparent",
            isDark ? "via-white/20" : "via-gray-300"
          )} />
        </div>

        {/* Workout Style Banners */}
        <div className="space-y-4">
          {workoutStyles.map((style, index) => (
            <button
              key={style.id}
              onClick={() => handleStyleSelect(style.id)}
              className="w-full group relative overflow-hidden rounded-xl md:rounded-2xl transition-all duration-300 hover:scale-[1.01] hover:shadow-xl active:scale-[0.99]"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <img 
                  src={style.image} 
                  alt={style.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-r",
                  style.bgGradient
                )} />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/40" />
              </div>
              
              {/* Content */}
              <div className="relative p-4 md:p-6 flex items-center gap-4">
                {/* Icon */}
                <div className={cn(
                  "w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center backdrop-blur-sm border transition-transform group-hover:scale-110",
                  "bg-white/10 border-white/20",
                  style.color
                )}>
                  {style.icon}
                </div>
                
                {/* Text */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg md:text-xl font-black tracking-wide text-white">
                      {style.name}
                    </h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold border",
                      levelColors[style.level]
                    )}>
                      {style.level}
                    </span>
                  </div>
                  <p className="text-white/70 text-xs md:text-sm mb-2">{style.description}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-white/60">
                      <Timer className="w-3 h-3" /> {style.duration}
                    </span>
                    <span className="flex items-center gap-1 text-white/60">
                      <Flame className="w-3 h-3 text-orange-400" /> {style.calories} kcal
                    </span>
                    <div className="flex items-center gap-1">
                      {style.features.map((feature, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 text-[10px]">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Arrow */}
                <ChevronRight className="w-6 h-6 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          ))}
        </div>

        {/* Quick Stats Footer */}
        <div className={cn(
          "mt-8 p-4 rounded-2xl backdrop-blur-sm border",
          isDark 
            ? "bg-white/5 border-white/10" 
            : "bg-white border-gray-200 shadow-sm"
        )}>
          <div className="flex items-center justify-around text-center">
            <div>
              <p className="text-2xl font-bold text-primary">8+</p>
              <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Workout Styles</p>
            </div>
            <div className={cn("w-px h-10", isDark ? "bg-white/10" : "bg-gray-200")} />
            <div>
              <p className="text-2xl font-bold text-orange-400">50+</p>
              <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Exercises</p>
            </div>
            <div className={cn("w-px h-10", isDark ? "bg-white/10" : "bg-gray-200")} />
            <div>
              <p className="text-2xl font-bold text-green-400">AI</p>
              <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Powered</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
