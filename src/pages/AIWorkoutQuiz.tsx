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
  TrendingUp,
  AlertTriangle,
  User,
  Shield,
  Footprints,
  Eye,
  Ban
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import type { WorkoutExercise } from '@/lib/workoutStyles';

// Question types
interface QuizOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  description: string;
  options: QuizOption[];
}

// ===== Comprehensive Quiz Questions for Personalization =====
const quizQuestions: QuizQuestion[] = [
  {
    id: 'goal',
    question: 'เป้าหมายหลักของคุณคืออะไร?',
    description: 'เลือกเป้าหมายที่คุณต้องการบรรลุมากที่สุด',
    options: [
      { id: 'lose_weight', label: 'ลดน้ำหนัก / เผาผลาญไขมัน', icon: <Flame className="w-6 h-6" />, description: 'เน้นท่าเบิร์นแคลอรี่สูง' },
      { id: 'build_muscle', label: 'เสริมสร้างกล้ามเนื้อ', icon: <Dumbbell className="w-6 h-6" />, description: 'เน้นท่าใช้แรงต้าน' },
      { id: 'improve_flexibility', label: 'เพิ่มความยืดหยุ่น', icon: <Wind className="w-6 h-6" />, description: 'เน้นยืดเหยียดร่างกาย' },
      { id: 'improve_cardio', label: 'เพิ่มความทนทานหัวใจ-ปอด', icon: <Heart className="w-6 h-6" />, description: 'เน้นคาร์ดิโอ เพิ่มความฟิต' },
      { id: 'general_health', label: 'ดูแลสุขภาพทั่วไป', icon: <Shield className="w-6 h-6" />, description: 'สมดุลทุกด้าน ออกกำลังสม่ำเสมอ' },
    ]
  },
  {
    id: 'fitness_level',
    question: 'ระดับความฟิตปัจจุบันของคุณเป็นอย่างไร?',
    description: 'ตอบตามจริง เพื่อให้ AI แนะนำท่าที่เหมาะสมและปลอดภัยที่สุด',
    options: [
      { id: 'beginner', label: 'มือใหม่', icon: <Coffee className="w-6 h-6" />, description: 'ไม่ค่อยได้ออกกำลังกาย หรือเพิ่งเริ่มต้น' },
      { id: 'intermediate', label: 'ปานกลาง', icon: <Activity className="w-6 h-6" />, description: 'ออกกำลังกาย 2-3 ครั้ง/สัปดาห์' },
      { id: 'advanced', label: 'ขั้นสูง', icon: <Zap className="w-6 h-6" />, description: 'ออกกำลังกาย 4-5 ครั้ง/สัปดาห์ มีความชำนาญ' },
      { id: 'athlete', label: 'นักกีฬา', icon: <TrendingUp className="w-6 h-6" />, description: 'ฝึกซ้อมอย่างจริงจังทุกวัน' },
    ]
  },
  {
    id: 'available_time',
    question: 'วันนี้คุณมีเวลาออกกำลังกายเท่าไหร่?',
    description: 'AI จะปรับจำนวนท่าและความเข้มข้นตามเวลาของคุณ',
    options: [
      { id: '10min', label: '10 นาที', icon: <Timer className="w-6 h-6" />, description: 'ออกกำลังสั้นๆ เร็วๆ 2-3 ท่า' },
      { id: '20min', label: '20 นาที', icon: <Timer className="w-6 h-6" />, description: 'พอดี 3-4 ท่ากำลังดี' },
      { id: '30min', label: '30 นาที', icon: <Timer className="w-6 h-6" />, description: 'ได้ท่าเต็มชุด 4-5 ท่า' },
      { id: '45min_plus', label: '45+ นาที', icon: <Timer className="w-6 h-6" />, description: 'เวลาเหลือเฟือ ทำได้เต็มที่' },
    ]
  },
  {
    id: 'focus_area',
    question: 'คุณอยากเน้นส่วนไหนของร่างกาย?',
    description: 'AI จะเลือกท่าที่กระจายตรงกลุ่มกล้ามเนื้อที่คุณต้องการ',
    options: [
      { id: 'upper_body', label: 'ท่อนบน (แขน ไหล่ หลัง)', icon: <Dumbbell className="w-6 h-6" />, description: 'ยกแขน บิดลำตัว เน้นร่างกายส่วนบน' },
      { id: 'lower_body', label: 'ท่อนล่าง (ขา สะโพก ก้น)', icon: <Footprints className="w-6 h-6" />, description: 'สควอต ยกเข่า วิ่ง เน้นขาและก้น' },
      { id: 'core', label: 'แกนกลาง (หน้าท้อง เอว)', icon: <Target className="w-6 h-6" />, description: 'บิดลำตัว สควอตบิด เน้นแกนกลาง' },
      { id: 'full_body', label: 'ทั้งตัว (กระจายทุกส่วน)', icon: <User className="w-6 h-6" />, description: 'ผสมท่าหลากหลาย ครอบคลุมทั้งร่างกาย' },
    ]
  },
  {
    id: 'workout_preference',
    question: 'คุณชอบสไตล์การออกกำลังกายแบบไหน?',
    description: 'เลือกรูปแบบที่คุณสนุกด้วยมากที่สุด',
    options: [
      { id: 'intense_fast', label: 'หนักและเร็ว', icon: <Flame className="w-6 h-6" />, description: 'ท่ากระโดด วิ่ง เน้น Power & Speed' },
      { id: 'moderate_balanced', label: 'สมดุล ปานกลาง', icon: <Activity className="w-6 h-6" />, description: 'ผสมท่าหนักเบา ไม่หักโหม' },
      { id: 'slow_controlled', label: 'ช้า ควบคุมฟอร์ม', icon: <Eye className="w-6 h-6" />, description: 'เน้นทำช้าๆ ฟอร์มถูกต้อง' },
      { id: 'fun_variety', label: 'สนุก หลากหลาย', icon: <Sparkles className="w-6 h-6" />, description: 'เปลี่ยนท่าบ่อย ไม่ซ้ำจำเจ' },
    ]
  },
  {
    id: 'physical_limitations',
    question: 'คุณมีข้อจำกัดทางร่างกายหรือไม่?',
    description: 'ข้อมูลนี้สำคัญมาก AI จะหลีกเลี่ยงท่าที่อาจเป็นอันตราย',
    options: [
      { id: 'none', label: 'ไม่มีข้อจำกัด', icon: <Check className="w-6 h-6" />, description: 'ร่างกายแข็งแรงดี ทำได้ทุกท่า' },
      { id: 'knee_problem', label: 'ปัญหาเข่า/ข้อต่อ', icon: <AlertTriangle className="w-6 h-6" />, description: 'ไม่ควรกระโดดหรือท่าลงน้ำหนักเข่ามาก' },
      { id: 'back_problem', label: 'ปัญหาหลัง/กระดูกสันหลัง', icon: <AlertTriangle className="w-6 h-6" />, description: 'ไม่ควรบิดลำตัวแรงหรือก้มมาก' },
      { id: 'general_caution', label: 'ต้องการความระมัดระวัง', icon: <Shield className="w-6 h-6" />, description: 'มีโรคประจำตัว หรือเพิ่งหายป่วย' },
    ]
  },
  {
    id: 'age_range',
    question: 'อายุของคุณอยู่ในช่วงไหน?',
    description: 'AI จะปรับความเข้มข้นให้เหมาะกับวัย',
    options: [
      { id: 'under_18', label: 'ต่ำกว่า 18 ปี', icon: <Sparkles className="w-6 h-6" />, description: 'วัยเรียน พลังงานเยอะ' },
      { id: '18_30', label: '18 - 30 ปี', icon: <Zap className="w-6 h-6" />, description: 'วัยทำงาน/เรียน พร้อมลุย' },
      { id: '31_50', label: '31 - 50 ปี', icon: <Activity className="w-6 h-6" />, description: 'วัยทำงาน เน้นสุขภาพ' },
      { id: 'over_50', label: '50 ปีขึ้นไป', icon: <Heart className="w-6 h-6" />, description: 'วัยอาวุโส เน้นปลอดภัย' },
    ]
  },
  {
    id: 'preferred_time',
    question: 'คุณมักจะออกกำลังกายช่วงเวลาไหน?',
    description: 'AI จะปรับความเข้มข้นตามช่วงเวลาที่ร่างกายพร้อม',
    options: [
      { id: 'morning', label: 'เช้า (6-9 น.)', icon: <Sun className="w-6 h-6" />, description: 'ตื่นมาออกกำลังกายปลุกร่างกาย' },
      { id: 'afternoon', label: 'กลางวัน (12-15 น.)', icon: <Coffee className="w-6 h-6" />, description: 'พักเที่ยงหรือช่วงบ่าย' },
      { id: 'evening', label: 'เย็น (16-19 น.)', icon: <Activity className="w-6 h-6" />, description: 'หลังเลิกงาน/เรียน' },
      { id: 'night', label: 'กลางคืน (20 น. เป็นต้นไป)', icon: <Moon className="w-6 h-6" />, description: 'ก่อนนอน ไม่ควรหนักเกินไป' },
    ]
  },
];

// ===== Gemma3 API Response Types =====
interface GemmaExerciseRecommendation {
  exercise_id: string;
  reps: number;
  reason: string;
  exercise_data?: {
    id: string;
    name: string;
    nameTh: string;
    difficulty: string;
    icon: string;
    description: string;
  };
}

interface GemmaWorkoutSummary {
  total_exercises: number;
  estimated_duration_minutes: number;
  estimated_calories: number;
  difficulty_label: string;
  personalized_message: string;
}

interface GemmaRecommendResponse {
  success: boolean;
  recommended_exercises: GemmaExerciseRecommendation[];
  workout_summary: GemmaWorkoutSummary;
}

export default function AIWorkoutQuiz() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeStatus, setAnalyzeStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

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
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  // ===== Build readable quiz summary for Gemma =====
  const buildQuizSummaryForAI = (): Record<string, string> => {
    const labelMap: Record<string, Record<string, string>> = {
      goal: {
        lose_weight: 'ลดน้ำหนัก เผาผลาญไขมัน',
        build_muscle: 'เสริมสร้างกล้ามเนื้อ',
        improve_flexibility: 'เพิ่มความยืดหยุ่นร่างกาย',
        improve_cardio: 'เพิ่มความทนทานหัวใจและปอด',
        general_health: 'ดูแลสุขภาพทั่วไป',
      },
      fitness_level: {
        beginner: 'มือใหม่ เพิ่งเริ่มต้น',
        intermediate: 'ปานกลาง ออกกำลังกาย 2-3 ครั้ง/สัปดาห์',
        advanced: 'ขั้นสูง ออกกำลังกาย 4-5 ครั้ง/สัปดาห์',
        athlete: 'นักกีฬา ฝึกซ้อมทุกวัน',
      },
      available_time: {
        '10min': '10 นาที (สั้นๆ เร็วๆ)',
        '20min': '20 นาที',
        '30min': '30 นาที',
        '45min_plus': '45 นาทีขึ้นไป',
      },
      focus_area: {
        upper_body: 'เน้นร่างกายท่อนบน (แขน ไหล่ หลัง)',
        lower_body: 'เน้นร่างกายท่อนล่าง (ขา สะโพก ก้น)',
        core: 'เน้นแกนกลาง (หน้าท้อง เอว)',
        full_body: 'ทั้งตัว กระจายทุกส่วน',
      },
      workout_preference: {
        intense_fast: 'ชอบท่าหนักและเร็ว เน้น Power & Speed',
        moderate_balanced: 'ชอบสมดุล ปานกลาง',
        slow_controlled: 'ชอบช้า ควบคุมฟอร์ม',
        fun_variety: 'ชอบสนุก หลากหลาย เปลี่ยนท่าบ่อย',
      },
      physical_limitations: {
        none: 'ไม่มีข้อจำกัดทางร่างกาย',
        knee_problem: 'มีปัญหาเข่า/ข้อต่อ ไม่ควรกระโดด',
        back_problem: 'มีปัญหาหลัง/กระดูกสันหลัง ไม่ควรบิดแรง',
        general_caution: 'ต้องการความระมัดระวังเป็นพิเศษ',
      },
      age_range: {
        under_18: 'ต่ำกว่า 18 ปี',
        '18_30': '18-30 ปี',
        '31_50': '31-50 ปี',
        over_50: '50 ปีขึ้นไป',
      },
      preferred_time: {
        morning: 'ออกกำลังกายตอนเช้า (6-9 น.)',
        afternoon: 'ออกกำลังกายตอนกลางวัน (12-15 น.)',
        evening: 'ออกกำลังกายตอนเย็น (16-19 น.)',
        night: 'ออกกำลังกายตอนกลางคืน (20 น. เป็นต้นไป)',
      },
    };

    const summary: Record<string, string> = {};
    for (const [questionId, answerId] of Object.entries(answers)) {
      const readable = labelMap[questionId]?.[answerId] || answerId;
      summary[questionId] = readable;
    }
    return summary;
  };

  // ===== Call Gemma3 API for recommendation =====
  const callGemmaRecommend = async (): Promise<GemmaRecommendResponse | null> => {
    const quizSummary = buildQuizSummaryForAI();

    console.log('📤 [AI Quiz] Sending quiz answers to API:', quizSummary);

    try {
      const response = await fetch('/api/gemma/workout-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizAnswers: quizSummary }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data._note) {
        console.warn('⚠️ [AI Quiz] API used fallback:', data._note);
      }

      if (data.success) {
        console.log('✅ [AI Quiz] API Response:', JSON.stringify(data, null, 2));
        console.log('🏋️ [AI Quiz] Recommended exercises:', data.recommended_exercises.map((ex: GemmaExerciseRecommendation) => `${ex.exercise_id} (${ex.reps} reps) - ${ex.reason}`));
        console.log('📊 [AI Quiz] Workout summary:', data.workout_summary);
        return data as GemmaRecommendResponse;
      }
      throw new Error(data.error || 'Unknown API error');
    } catch (err) {
      console.error('❌ [AI Quiz] Gemma workout recommend failed:', err);
      return null;
    }
  };

  // ===== Convert Gemma response to WorkoutExercise[] and save =====
  const saveAIWorkoutPlan = (response: GemmaRecommendResponse) => {
    const exercises: WorkoutExercise[] = response.recommended_exercises.map(rec => ({
      name: rec.exercise_data?.name || rec.exercise_id,
      nameTh: rec.exercise_data?.nameTh || rec.exercise_id,
      duration: null,
      reps: rec.reps,
      icon: rec.exercise_data?.icon || 'fire',
      description: rec.reason,
      kayaExercise: rec.exercise_id as WorkoutExercise['kayaExercise'],
    }));

    // Save to localStorage for the workout flow to pick up
    localStorage.setItem('kaya_ai_quiz_answers', JSON.stringify(answers));
    localStorage.setItem('kaya_ai_recommended_exercises', JSON.stringify(exercises));
    localStorage.setItem('kaya_ai_workout_summary', JSON.stringify(response.workout_summary));
    localStorage.setItem('kaya_workout_style', 'ai-personalized');
  };

  // ===== Handle quiz completion - call Gemma3 =====
  const handleComplete = async () => {
    setIsAnalyzing(true);
    setError(null);
    setAnalyzeStatus('กำลังส่งข้อมูลไปยัง AI...');

    try {
      setAnalyzeStatus('AI Gemma3 กำลังวิเคราะห์ข้อมูลของคุณ...');
      const gemmaResponse = await callGemmaRecommend();

      if (gemmaResponse) {
        console.log('🎯 [AI Quiz] Using AI-generated workout plan');
        setAnalyzeStatus('กำลังสร้างโปรแกรมออกกำลังกาย...');
        saveAIWorkoutPlan(gemmaResponse);

        await new Promise(resolve => setTimeout(resolve, 800));
        setAnalyzeStatus('เสร็จสิ้น! กำลังพาไปหน้าเตรียมพร้อม...');
        await new Promise(resolve => setTimeout(resolve, 500));

        setIsAnalyzing(false);
        navigate('/workout-intro');
      } else {
        // Fallback: use local logic when API fails
        console.warn('🔄 [AI Quiz] API failed — using CLIENT-SIDE FALLBACK');
        setAnalyzeStatus('ใช้ระบบแนะนำสำรอง...');
        const fallbackPlan = getLocalFallback();
        console.log('🔄 [AI Quiz] Fallback plan:', JSON.stringify(fallbackPlan, null, 2));
        saveAIWorkoutPlan(fallbackPlan);

        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsAnalyzing(false);
        navigate('/workout-intro');
      }
    } catch (err) {
      console.error('Quiz completion error:', err);
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
      setIsAnalyzing(false);
    }
  };

  // ===== Local fallback when API fails =====
  const getLocalFallback = (): GemmaRecommendResponse => {
    const fitnessLevel = answers['fitness_level'] || 'beginner';

    const exerciseMap: Record<string, GemmaExerciseRecommendation[]> = {
      beginner: [
        { exercise_id: 'arm_raise', reps: 10, reason: 'ท่าพื้นฐานยืดกล้ามเนื้อไหล่และแขน', exercise_data: { id: 'arm_raise', name: 'Arm Raise', nameTh: 'ยกแขนขึ้น-ลง', difficulty: 'beginner', icon: 'kaya-arm', description: 'ยืดกล้ามเนื้อไหล่' } },
        { exercise_id: 'torso_twist', reps: 10, reason: 'บิดลำตัวเบาๆ ยืดแกนกลาง', exercise_data: { id: 'torso_twist', name: 'Torso Twist', nameTh: 'บิดลำตัวซ้าย-ขวา', difficulty: 'beginner', icon: 'kaya-torso', description: 'ยืดแกนกลาง' } },
        { exercise_id: 'knee_raise', reps: 10, reason: 'ยกเข่าสลับฝึกขาและหน้าท้อง', exercise_data: { id: 'knee_raise', name: 'Knee Raise', nameTh: 'ยกเข่าสลับ', difficulty: 'beginner', icon: 'kaya-knee', description: 'ฝึกขาและหน้าท้อง' } },
      ],
      intermediate: [
        { exercise_id: 'arm_raise', reps: 10, reason: 'วอร์มอัพยืดกล้ามเนื้อ', exercise_data: { id: 'arm_raise', name: 'Arm Raise', nameTh: 'ยกแขนขึ้น-ลง', difficulty: 'beginner', icon: 'kaya-arm', description: 'วอร์มอัพ' } },
        { exercise_id: 'squat_arm_raise', reps: 12, reason: 'ฝึกขาและไหล่พร้อมกัน', exercise_data: { id: 'squat_arm_raise', name: 'Squat with Arm Raise', nameTh: 'สควอตพร้อมยกแขน', difficulty: 'intermediate', icon: 'kaya-squat-arm', description: 'ขาและไหล่' } },
        { exercise_id: 'squat_twist', reps: 10, reason: 'เสริมแกนกลางและขา', exercise_data: { id: 'squat_twist', name: 'Squat with Twist', nameTh: 'สควอตพร้อมบิดลำตัว', difficulty: 'intermediate', icon: 'kaya-squat-twist', description: 'แกนกลาง' } },
        { exercise_id: 'high_knee_raise', reps: 20, reason: 'คาร์ดิโอปานกลาง', exercise_data: { id: 'high_knee_raise', name: 'High Knee Raise', nameTh: 'ยกเข่าสูง', difficulty: 'intermediate', icon: 'kaya-high-knee', description: 'คาร์ดิโอ' } },
      ],
      advanced: [
        { exercise_id: 'arm_raise', reps: 15, reason: 'วอร์มอัพ', exercise_data: { id: 'arm_raise', name: 'Arm Raise', nameTh: 'ยกแขนขึ้น-ลง', difficulty: 'beginner', icon: 'kaya-arm', description: 'วอร์มอัพ' } },
        { exercise_id: 'jump_squat_arm_raise', reps: 15, reason: 'ฝึกพลังระเบิด', exercise_data: { id: 'jump_squat_arm_raise', name: 'Jump Squat with Arm Raise', nameTh: 'กระโดดสควอต', difficulty: 'advanced', icon: 'kaya-jump-squat', description: 'พลังระเบิด' } },
        { exercise_id: 'standing_twist', reps: 20, reason: 'แกนกลางเข้มข้น', exercise_data: { id: 'standing_twist', name: 'Standing Twist', nameTh: 'บิดลำตัว', difficulty: 'advanced', icon: 'kaya-standing-twist', description: 'แกนกลาง' } },
        { exercise_id: 'running_in_place', reps: 30, reason: 'คาร์ดิโอเข้มข้น', exercise_data: { id: 'running_in_place', name: 'Running in Place', nameTh: 'วิ่งอยู่กับที่', difficulty: 'advanced', icon: 'kaya-running', description: 'คาร์ดิโอ' } },
      ],
      athlete: [
        { exercise_id: 'squat_arm_raise', reps: 15, reason: 'วอร์มอัพ', exercise_data: { id: 'squat_arm_raise', name: 'Squat with Arm Raise', nameTh: 'สควอตยกแขน', difficulty: 'intermediate', icon: 'kaya-squat-arm', description: 'วอร์มอัพ' } },
        { exercise_id: 'modified_burpee', reps: 12, reason: 'ฝึกทั้งตัว', exercise_data: { id: 'modified_burpee', name: 'Modified Burpee', nameTh: 'เบอร์พี', difficulty: 'expert', icon: 'kaya-burpee', description: 'ทั้งตัว' } },
        { exercise_id: 'jump_twist', reps: 15, reason: 'ความคล่องแคล่ว', exercise_data: { id: 'jump_twist', name: 'Jump Twist', nameTh: 'กระโดดบิดลำตัว', difficulty: 'expert', icon: 'kaya-jump-twist', description: 'คล่องแคล่ว' } },
        { exercise_id: 'sprint_knee_raises', reps: 40, reason: 'ท้าทายสุดขีด', exercise_data: { id: 'sprint_knee_raises', name: 'Sprint Knee Raises', nameTh: 'สปรินต์ยกเข่า', difficulty: 'expert', icon: 'kaya-sprint', description: 'ท้าทาย' } },
      ],
    };

    const selected = exerciseMap[fitnessLevel] || exerciseMap['beginner'];
    return {
      success: true,
      recommended_exercises: selected,
      workout_summary: {
        total_exercises: selected.length,
        estimated_duration_minutes: selected.length * 5,
        estimated_calories: selected.length * 30,
        difficulty_label: fitnessLevel === 'beginner' ? 'ง่าย' : fitnessLevel === 'intermediate' ? 'ปานกลาง' : 'หนัก',
        personalized_message: 'โปรแกรมนี้เหมาะกับคุณ สู้ๆ!',
      },
    };
  };

  // ===== Analyzing screen =====
  if (isAnalyzing) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center",
        isDark ? "bg-black text-white" : "bg-gray-50 text-gray-900"
      )}>
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
          
          <h2 className="text-2xl font-bold mb-3">AI Gemma3 กำลังวิเคราะห์...</h2>
          <p className={cn("text-lg mb-2", isDark ? "text-gray-400" : "text-gray-600")}>
            กำลังสร้างโปรแกรมที่เหมาะกับคุณโดยเฉพาะ
          </p>
          <p className={cn("text-sm", isDark ? "text-gray-500" : "text-gray-400")}>
            {analyzeStatus}
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
              <span className={cn("text-xs px-2 py-0.5 rounded-full", isDark ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary")}>
                Gemma3
              </span>
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

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-3">
            <Ban className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium">{error}</p>
              <button 
                onClick={() => setError(null)} 
                className="text-sm underline mt-1"
              >
                ปิด
              </button>
            </div>
          </div>
        )}

        {/* Question */}
        <div className="flex-1">
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-primary" />
              <span className={cn("text-sm font-medium", isDark ? "text-gray-400" : "text-gray-500")}>
                คำถามที่ {currentQuestion + 1}
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
                ส่งให้ AI วิเคราะห์
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
