import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Brain, 
  Sparkles, 
  Check,
  Target,
  Flame,
  Heart,
  Dumbbell,
  Wind,
  Timer,
  Zap,
  Moon,
  Sun,
  Coffee,
  Activity,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

// Question types
interface QuizOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  description: string;
  options: QuizOption[];
}

// Quiz questions data
const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: 'เป้าหมายหลักของคุณคืออะไร?',
    description: 'เลือกเป้าหมายที่คุณต้องการบรรลุมากที่สุด',
    options: [
      { id: 'weight_loss', label: 'ลดน้ำหนัก', icon: <Flame className="w-6 h-6" />, description: 'เผาผลาญไขมัน ลดน้ำหนัก' },
      { id: 'muscle_gain', label: 'สร้างกล้ามเนื้อ', icon: <Dumbbell className="w-6 h-6" />, description: 'เพิ่มมวลกล้ามเนื้อ' },
      { id: 'flexibility', label: 'ความยืดหยุ่น', icon: <Wind className="w-6 h-6" />, description: 'เพิ่มความยืดหยุ่นร่างกาย' },
      { id: 'endurance', label: 'ความทนทาน', icon: <Heart className="w-6 h-6" />, description: 'เพิ่มความแข็งแรงหัวใจ' },
    ]
  },
  {
    id: 2,
    question: 'ระดับความฟิตปัจจุบันของคุณ?',
    description: 'เลือกระดับที่ตรงกับคุณมากที่สุด',
    options: [
      { id: 'beginner', label: 'มือใหม่', icon: <Coffee className="w-6 h-6" />, description: 'เพิ่งเริ่มต้นออกกำลังกาย' },
      { id: 'intermediate', label: 'ปานกลาง', icon: <Activity className="w-6 h-6" />, description: 'ออกกำลังกายเป็นประจำ' },
      { id: 'advanced', label: 'ขั้นสูง', icon: <Zap className="w-6 h-6" />, description: 'มีประสบการณ์มาก' },
      { id: 'athlete', label: 'นักกีฬา', icon: <TrendingUp className="w-6 h-6" />, description: 'ฝึกซ้อมอย่างจริงจัง' },
    ]
  },
  {
    id: 3,
    question: 'คุณมีเวลาออกกำลังกายกี่นาที?',
    description: 'เลือกช่วงเวลาที่คุณสะดวก',
    options: [
      { id: '15min', label: '15 นาที', icon: <Timer className="w-6 h-6" />, description: 'ออกกำลังกายสั้นๆ เร่งด่วน' },
      { id: '30min', label: '30 นาที', icon: <Timer className="w-6 h-6" />, description: 'ช่วงเวลาพอดี' },
      { id: '45min', label: '45 นาที', icon: <Timer className="w-6 h-6" />, description: 'ออกกำลังกายเต็มที่' },
      { id: '60min', label: '60+ นาที', icon: <Timer className="w-6 h-6" />, description: 'เวลาเหลือเฟือ' },
    ]
  },
  {
    id: 4,
    question: 'คุณชอบออกกำลังกายช่วงไหน?',
    description: 'เลือกช่วงเวลาที่คุณมักออกกำลังกาย',
    options: [
      { id: 'morning', label: 'เช้า', icon: <Sun className="w-6 h-6" />, description: 'ตื่นมาออกกำลังกายทันที' },
      { id: 'afternoon', label: 'บ่าย', icon: <Coffee className="w-6 h-6" />, description: 'หลังเลิกงาน/เรียน' },
      { id: 'evening', label: 'เย็น', icon: <Activity className="w-6 h-6" />, description: 'ก่อนอาหารเย็น' },
      { id: 'night', label: 'กลางคืน', icon: <Moon className="w-6 h-6" />, description: 'ก่อนนอน' },
    ]
  },
  {
    id: 5,
    question: 'คุณชอบการออกกำลังกายแบบไหน?',
    description: 'เลือกสไตล์ที่คุณชอบมากที่สุด',
    options: [
      { id: 'intense', label: 'หนักหน่วง', icon: <Flame className="w-6 h-6" />, description: 'HIIT, Cardio เข้มข้น' },
      { id: 'moderate', label: 'ปานกลาง', icon: <Dumbbell className="w-6 h-6" />, description: 'สมดุลทั้งหนักและเบา' },
      { id: 'gentle', label: 'เบาสบาย', icon: <Wind className="w-6 h-6" />, description: 'โยคะ, ยืดเหยียด' },
      { id: 'fun', label: 'สนุกสนาน', icon: <Sparkles className="w-6 h-6" />, description: 'เต้น, ตามจังหวะเพลง' },
    ]
  },
];

export default function AIWorkoutQuiz() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const question = quizQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;
  const selectedAnswer = answers[question.id];

  const handleSelectOption = (optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [question.id]: optionId
    }));
  };

  const handleNext = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Complete quiz - analyze and save results
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsAnalyzing(true);

    // Save quiz answers to localStorage for AI to use
    localStorage.setItem('kaya_ai_quiz_answers', JSON.stringify(answers));
    localStorage.setItem('kaya_workout_style', 'ai-personalized');
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsAnalyzing(false);
    navigate('/workout-intro');
  };

  // Analyzing screen
  if (isAnalyzing) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center",
        isDark ? "bg-black text-white" : "bg-gray-50 text-gray-900"
      )}>
        {/* Animated Background */}
        {isDark && (
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-black to-black" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[150px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        )}
        
        <div className="relative z-10 text-center px-6">
          <div className="w-24 h-24 mx-auto mb-8 relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-orange-500 animate-spin" style={{ animationDuration: '3s' }} />
            <div className={cn(
              "absolute inset-1 rounded-full flex items-center justify-center",
              isDark ? "bg-black" : "bg-gray-50"
            )}>
              <Brain className="w-10 h-10 text-primary animate-pulse" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-3">AI กำลังวิเคราะห์...</h2>
          <p className={cn("text-lg", isDark ? "text-gray-400" : "text-gray-600")}>
            กำลังสร้างโปรแกรมที่เหมาะกับคุณโดยเฉพาะ
          </p>
          
          <div className="flex justify-center gap-2 mt-8">
            {[0, 1, 2].map((i) => (
              <div 
                key={i}
                className="w-3 h-3 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen relative overflow-hidden",
      isDark ? "bg-black text-white" : "bg-gray-50 text-gray-900"
    )}>
      {/* Background */}
      {isDark && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black" />
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute top-1/3 -left-40 w-60 h-60 bg-purple-500/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      )}

      <div className="relative z-10 min-h-screen flex flex-col px-4 md:px-6 pt-6 pb-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/workout-selection"
            className={cn(
              "w-10 h-10 rounded-xl backdrop-blur-sm flex items-center justify-center transition-all border",
              isDark 
                ? "bg-white/10 border-white/10 hover:bg-white/20" 
                : "bg-white border-gray-200 shadow-sm hover:bg-gray-100"
            )}
          >
            <ArrowLeft className={cn("w-5 h-5", isDark ? "text-white" : "text-gray-700")} />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <span className="font-semibold">AI Personalized</span>
            </div>
          </div>
          <div className={cn(
            "px-3 py-1 rounded-full text-sm font-medium",
            isDark ? "bg-white/10" : "bg-gray-100"
          )}>
            {currentQuestion + 1} / {quizQuestions.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className={cn(
            "h-2 rounded-full overflow-hidden",
            isDark ? "bg-white/10" : "bg-gray-200"
          )}>
            <div 
              className="h-full bg-gradient-to-r from-primary to-orange-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="flex-1">
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-primary" />
              <span className={cn("text-sm font-medium", isDark ? "text-gray-400" : "text-gray-500")}>
                คำถามที่ {question.id}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              {question.question}
            </h2>
            <p className={cn("text-base", isDark ? "text-gray-400" : "text-gray-600")}>
              {question.description}
            </p>
          </div>

          {/* Options */}
          <div className="grid gap-3">
            {question.options.map((option, index) => (
              <button
                key={option.id}
                onClick={() => handleSelectOption(option.id)}
                className={cn(
                  "w-full p-4 rounded-2xl border-2 transition-all duration-300 text-left animate-in fade-in slide-in-from-bottom-4",
                  selectedAnswer === option.id
                    ? "border-primary bg-primary/10"
                    : isDark 
                      ? "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                      : "border-gray-200 bg-white hover:border-gray-300 shadow-sm"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                    selectedAnswer === option.id
                      ? "bg-primary text-white"
                      : isDark 
                        ? "bg-white/10 text-gray-400"
                        : "bg-gray-100 text-gray-600"
                  )}>
                    {selectedAnswer === option.id ? <Check className="w-6 h-6" /> : option.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{option.label}</p>
                    {option.description && (
                      <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                        {option.description}
                      </p>
                    )}
                  </div>
                  {selectedAnswer === option.id && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-8 pt-4">
          {currentQuestion > 0 && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              className={cn(
                "flex-1 h-14 text-lg rounded-xl",
                isDark 
                  ? "border-white/20 bg-white/5 hover:bg-white/10" 
                  : "border-gray-300"
              )}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              ย้อนกลับ
            </Button>
          )}
          
          <Button
            onClick={handleNext}
            disabled={!selectedAnswer}
            className={cn(
              "flex-1 h-14 text-lg rounded-xl bg-gradient-to-r from-primary to-orange-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed",
              currentQuestion === 0 && "w-full"
            )}
          >
            {currentQuestion === quizQuestions.length - 1 ? (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                วิเคราะห์ด้วย AI
              </>
            ) : (
              <>
                ถัดไป
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
