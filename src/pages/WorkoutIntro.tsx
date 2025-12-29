import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  Clock, 
  Flame, 
  Target,
  TrendingUp,
  CheckCircle2,
  Info,
  Sparkles,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getWorkoutStyle, getExercisesForStyle, levelColors } from '@/lib/workoutStyles';
import { useTheme } from '@/contexts/ThemeContext';

// Exercise icon mapping
const exerciseIconMap: Record<string, React.ReactNode> = {
  run: <span className="text-2xl">🏃</span>,
  muscle: <span className="text-2xl">💪</span>,
  leg: <span className="text-2xl">🦵</span>,
  weight: <span className="text-2xl">🏋️</span>,
  fire: <span className="text-2xl">🔥</span>,
  yoga: <span className="text-2xl">🧘</span>,
};

export default function WorkoutIntro() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Get selected workout style from localStorage
  const selectedStyleId = localStorage.getItem('kaya_workout_style');
  const selectedStyle = getWorkoutStyle(selectedStyleId);
  const exercises = getExercisesForStyle(selectedStyleId);

  const [isReady, setIsReady] = useState(false);

  // Calculate total workout info
  const totalDuration = exercises.reduce((sum, ex) => sum + (ex.duration || 30), 0);
  const totalExercises = exercises.length;
  const estimatedCalories = Math.round(totalDuration * 0.15); // rough estimate

  // If no style selected, redirect back
  useEffect(() => {
    if (!selectedStyle) {
      navigate('/workout-selection');
    }
  }, [selectedStyle, navigate]);

  if (!selectedStyle) {
    return null;
  }

  const handleStartWorkout = () => {
    setIsReady(true);
    setTimeout(() => {
      navigate('/workout-mode');
    }, 300);
  };

  return (
    <div className={cn(
      "min-h-screen relative overflow-x-hidden pb-24",
      isDark ? "bg-black text-white" : "bg-gray-50 text-gray-900"
    )}>
      {/* Animated Background - Dark Theme Only */}
      {isDark && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black" />
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute top-1/3 -left-40 w-60 h-60 bg-purple-500/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>
      )}

      <div className="relative z-10 px-4 md:px-6 pt-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/workout-selection"
            className={cn(
              "w-10 h-10 rounded-xl backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all border",
              isDark 
                ? "bg-white/10 border-white/10" 
                : "bg-white border-gray-200 shadow-sm hover:bg-gray-100"
            )}
          >
            <ArrowLeft className={cn("w-5 h-5", isDark ? "text-white" : "text-gray-700")} />
          </Link>
          <div>
            <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>เตรียมพร้อม</p>
            <h1 className="text-xl font-bold">รายละเอียดการออกกำลังกาย</h1>
          </div>
        </div>

        {/* Workout Style Hero Card */}
        <div className={cn(
          "relative rounded-3xl overflow-hidden mb-6 border",
          isDark ? "border-white/10" : "border-gray-200"
        )}>
          <div className={cn("absolute inset-0 bg-gradient-to-br", selectedStyle.bgGradient)} />
          <div className="relative p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center bg-white/20 backdrop-blur-sm",
                selectedStyle.color
              )}>
                {selectedStyle.icon}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl md:text-3xl font-black text-white mb-1">
                  {selectedStyle.name}
                </h2>
                <p className="text-white/80 text-sm md:text-base">{selectedStyle.nameEn}</p>
              </div>
            </div>
            <p className="text-white/90 text-base md:text-lg mb-4">
              {selectedStyle.description}
            </p>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <Clock className="w-5 h-5 mx-auto mb-1 text-white" />
                <p className="text-xs text-white/70">ระยะเวลา</p>
                <p className="text-sm font-bold text-white">{selectedStyle.duration}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <Flame className="w-5 h-5 mx-auto mb-1 text-white" />
                <p className="text-xs text-white/70">แคลอรี่</p>
                <p className="text-sm font-bold text-white">{selectedStyle.calories}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <TrendingUp className="w-5 h-5 mx-auto mb-1 text-white" />
                <p className="text-xs text-white/70">ระดับ</p>
                <p className="text-sm font-bold text-white">{selectedStyle.level}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className={cn(
          "rounded-2xl p-5 mb-6 border",
          isDark 
            ? "bg-white/5 border-white/10" 
            : "bg-white border-gray-200 shadow-sm"
        )}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className={cn("w-5 h-5", isDark ? "text-primary" : "text-orange-500")} />
            <h3 className="font-bold text-lg">จุดเด่น</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedStyle.features.map((feature, index) => (
              <div
                key={index}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium border",
                  isDark 
                    ? "bg-primary/10 border-primary/30 text-primary" 
                    : "bg-orange-50 border-orange-200 text-orange-700"
                )}
              >
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Workout Summary */}
        <div className={cn(
          "rounded-2xl p-5 mb-6 border",
          isDark 
            ? "bg-white/5 border-white/10" 
            : "bg-white border-gray-200 shadow-sm"
        )}>
          <div className="flex items-center gap-2 mb-4">
            <Info className={cn("w-5 h-5", isDark ? "text-blue-400" : "text-blue-600")} />
            <h3 className="font-bold text-lg">ข้อมูลเซสชัน</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className={cn("text-3xl font-black mb-1", isDark ? "text-primary" : "text-orange-500")}>
                {totalExercises}
              </p>
              <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>ท่าทั้งหมด</p>
            </div>
            <div className="text-center">
              <p className={cn("text-3xl font-black mb-1", isDark ? "text-primary" : "text-orange-500")}>
                {Math.round(totalDuration / 60)}
              </p>
              <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>นาที</p>
            </div>
            <div className="text-center">
              <p className={cn("text-3xl font-black mb-1", isDark ? "text-primary" : "text-orange-500")}>
                ~{estimatedCalories}
              </p>
              <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>แคลอรี่</p>
            </div>
          </div>
        </div>

        {/* Exercise List */}
        <div className={cn(
          "rounded-2xl p-5 mb-6 border",
          isDark 
            ? "bg-white/5 border-white/10" 
            : "bg-white border-gray-200 shadow-sm"
        )}>
          <div className="flex items-center gap-2 mb-4">
            <Target className={cn("w-5 h-5", isDark ? "text-green-400" : "text-green-600")} />
            <h3 className="font-bold text-lg">ท่าออกกำลังกายทั้งหมด</h3>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {exercises.map((exercise, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-xl border transition-all hover:scale-[1.01]",
                  isDark 
                    ? "bg-white/5 border-white/10 hover:bg-white/10" 
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                  isDark ? "bg-primary/20" : "bg-orange-100"
                )}>
                  {exerciseIconMap[exercise.icon] || <Zap className="w-6 h-6 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-bold text-base">{exercise.nameTh}</h4>
                    <span className={cn(
                      "text-xs font-bold px-2 py-1 rounded-lg whitespace-nowrap",
                      isDark ? "bg-primary/20 text-primary" : "bg-orange-100 text-orange-700"
                    )}>
                      {exercise.duration ? `${exercise.duration}s` : `${exercise.reps}x`}
                    </span>
                  </div>
                  <p className={cn("text-sm mb-2", isDark ? "text-gray-400" : "text-gray-600")}>
                    {exercise.name}
                  </p>
                  {exercise.description && (
                    <p className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-500")}>
                      {exercise.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className={cn(
          "rounded-2xl p-5 mb-6 border",
          isDark 
            ? "bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20" 
            : "bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200"
        )}>
          <h3 className={cn("font-bold mb-3 flex items-center gap-2", isDark ? "text-blue-300" : "text-blue-700")}>
            <CheckCircle2 className="w-5 h-5" />
            เตรียมตัวก่อนเริ่ม
          </h3>
          <ul className="space-y-2">
            <li className={cn("text-sm flex items-start gap-2", isDark ? "text-gray-300" : "text-gray-700")}>
              <CheckCircle2 className={cn("w-4 h-4 mt-0.5 flex-shrink-0", isDark ? "text-green-400" : "text-green-600")} />
              <span>สวมชุดออกกำลังกายที่สบาย และเตรียมน้ำดื่ม</span>
            </li>
            <li className={cn("text-sm flex items-start gap-2", isDark ? "text-gray-300" : "text-gray-700")}>
              <CheckCircle2 className={cn("w-4 h-4 mt-0.5 flex-shrink-0", isDark ? "text-green-400" : "text-green-600")} />
              <span>เลือกพื้นที่ที่มีพื้นที่เพียงพอและปลอดภัย</span>
            </li>
            <li className={cn("text-sm flex items-start gap-2", isDark ? "text-gray-300" : "text-gray-700")}>
              <CheckCircle2 className={cn("w-4 h-4 mt-0.5 flex-shrink-0", isDark ? "text-green-400" : "text-green-600")} />
              <span>อนุญาตให้เข้าถึงกล้องเพื่อให้ AI วิเคราะห์ท่าทาง</span>
            </li>
            <li className={cn("text-sm flex items-start gap-2", isDark ? "text-gray-300" : "text-gray-700")}>
              <CheckCircle2 className={cn("w-4 h-4 mt-0.5 flex-shrink-0", isDark ? "text-green-400" : "text-green-600")} />
              <span>พักผ่อนให้เพียงพอก่อนออกกำลังกาย</span>
            </li>
          </ul>
        </div>

        {/* CTA Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 md:relative md:p-0">
          <div className={cn(
            "md:rounded-2xl p-4 border-t md:border",
            isDark 
              ? "bg-black/95 md:bg-white/5 backdrop-blur-xl border-white/10" 
              : "bg-white md:bg-gray-50 border-gray-200"
          )}>
            <Button
              onClick={handleStartWorkout}
              variant="hero"
              size="lg"
              className={cn(
                "w-full text-lg font-bold gap-3 transition-all duration-300",
                isReady && "scale-95 opacity-80"
              )}
              disabled={isReady}
            >
              <Play className="w-6 h-6" />
              {isReady ? 'กำลังเริ่ม...' : 'เริ่มออกกำลังกาย'}
            </Button>
            <p className={cn("text-center text-xs mt-3", isDark ? "text-gray-500" : "text-gray-500")}>
              กดเริ่มเมื่อคุณพร้อมแล้ว
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
