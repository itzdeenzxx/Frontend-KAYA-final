import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  User, 
  Scale, 
  Ruler, 
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  PartyPopper,
  Heart,
  TrendingDown,
  Check,
  AlertTriangle,
  AlertCircle,
  UserCircle,
  Users,
  Volume2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CoachSelector } from "@/components/coach";
import { getCoachById } from "@/lib/coachConfig";

interface OnboardingData {
  nickname: string;
  weight: number;
  height: number;
  age: number;
  gender: "male" | "female" | "other";
  selectedCoachId?: string;
}

interface OnboardingProps {
  lineDisplayName?: string;
  onComplete: (data: OnboardingData & { bmi: number }) => void;
}

// BMI Categories with icons instead of emoji
const getBMICategory = (bmi: number): { label: string; color: string; bgColor: string; icon: React.ReactNode; description: string } => {
  if (bmi < 18.5) {
    return { 
      label: "น้ำหนักน้อย", 
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      icon: <TrendingDown className="w-5 h-5" />,
      description: "คุณอาจต้องการเพิ่มน้ำหนักเพื่อสุขภาพที่ดี"
    };
  } else if (bmi < 23) {
    return { 
      label: "น้ำหนักปกติ", 
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      icon: <Check className="w-5 h-5" />,
      description: "ยอดเยี่ยม! น้ำหนักของคุณอยู่ในเกณฑ์ที่ดี"
    };
  } else if (bmi < 25) {
    return { 
      label: "น้ำหนักเกิน", 
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      icon: <AlertTriangle className="w-5 h-5" />,
      description: "ลองออกกำลังกายเพิ่มขึ้นอีกนิดนะ"
    };
  } else if (bmi < 30) {
    return { 
      label: "อ้วนระดับ 1", 
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      icon: <AlertCircle className="w-5 h-5" />,
      description: "มาเริ่มต้นดูแลสุขภาพไปด้วยกันนะ"
    };
  } else {
    return { 
      label: "อ้วนระดับ 2", 
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      icon: <AlertCircle className="w-5 h-5" />,
      description: "KAYA จะช่วยคุณเริ่มต้นการเปลี่ยนแปลง"
    };
  }
};

// Calculate BMI
const calculateBMI = (weight: number, height: number): number => {
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
};

// Confetti component
const Confetti = () => {
  const colors = ["#dd6e53", "#FFD700", "#00CED1", "#FF69B4", "#98FB98", "#DDA0DD"];
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full"
          style={{
            backgroundColor: colors[i % colors.length],
            left: `${Math.random() * 100}%`,
            top: -20,
          }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{
            y: window.innerHeight + 100,
            opacity: [1, 1, 0],
            rotate: Math.random() * 720 - 360,
            x: Math.random() * 200 - 100,
          }}
          transition={{
            duration: Math.random() * 2 + 2,
            delay: Math.random() * 0.5,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
};

export default function Onboarding({ lineDisplayName, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    nickname: lineDisplayName || "",
    weight: 0,
    height: 0,
    age: 0,
    gender: "male",
    selectedCoachId: undefined,
  });

  const totalSteps = 5;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    const bmi = calculateBMI(data.weight, data.height);
    setShowConfetti(true);
    
    // Delay to show confetti animation
    setTimeout(() => {
      onComplete({ ...data, bmi: Math.round(bmi * 10) / 10 });
    }, 3000);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.nickname.length >= 2;
      case 2:
        return data.weight > 0 && data.height > 0;
      case 3:
        return data.age > 0;
      case 4:
        return !!data.selectedCoachId;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const bmi = data.weight > 0 && data.height > 0 ? calculateBMI(data.weight, data.height) : 0;
  const bmiCategory = getBMICategory(bmi);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {showConfetti && <Confetti />}
      
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl gradient-coral flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">KAYA</span>
        </div>
        
        {/* Progress bar */}
        <div className="flex gap-2 mb-2">
          {[...Array(totalSteps)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-300",
                i < step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">ขั้นตอนที่ {step} จาก {totalSteps}</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Step 1: Nickname */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">ยินดีต้อนรับ</h2>
                <p className="text-muted-foreground">เราอยากรู้จักคุณมากขึ้น</p>
              </div>

              <div className="space-y-4">
                <Label htmlFor="nickname" className="text-base">ชื่อเล่นของคุณ</Label>
                <Input
                  id="nickname"
                  placeholder="ใส่ชื่อเล่นที่คุณชอบ"
                  value={data.nickname}
                  onChange={(e) => setData({ ...data, nickname: e.target.value })}
                  className="h-14 text-lg"
                />
                <p className="text-sm text-muted-foreground">
                  ชื่อนี้จะแสดงในแอปและ Leaderboard
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 2: Weight & Height */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Scale className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">ข้อมูลร่างกาย</h2>
                <p className="text-muted-foreground">เพื่อคำนวณ BMI และแนะนำโปรแกรมที่เหมาะสม</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="weight" className="text-base flex items-center gap-2">
                    <Scale className="w-4 h-4" /> น้ำหนัก (กิโลกรัม)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="เช่น 65"
                    value={data.weight || ""}
                    onChange={(e) => setData({ ...data, weight: Number(e.target.value) })}
                    className="h-14 text-lg mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="height" className="text-base flex items-center gap-2">
                    <Ruler className="w-4 h-4" /> ส่วนสูง (เซนติเมตร)
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="เช่น 170"
                    value={data.height || ""}
                    onChange={(e) => setData({ ...data, height: Number(e.target.value) })}
                    className="h-14 text-lg mt-2"
                  />
                </div>
              </div>

              {/* Live BMI Preview */}
              {bmi > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-card rounded-2xl p-4 border"
                >
                  <p className="text-sm text-muted-foreground mb-1">BMI ของคุณ</p>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold">{bmi.toFixed(1)}</span>
                    <div className={cn("flex items-center gap-1", bmiCategory.color)}>
                      {bmiCategory.icon}
                      <span className="text-lg">{bmiCategory.label}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 3: Age */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">อายุและเพศ</h2>
                <p className="text-muted-foreground">เพื่อปรับแต่งโปรแกรมให้เหมาะสม</p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="age" className="text-base">อายุ (ปี)</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="เช่น 25"
                    value={data.age || ""}
                    onChange={(e) => setData({ ...data, age: Number(e.target.value) })}
                    className="h-14 text-lg mt-2"
                  />
                </div>

                <div>
                  <Label className="text-base mb-3 block">เพศ</Label>
                  <RadioGroup
                    value={data.gender}
                    onValueChange={(value) => setData({ ...data, gender: value as "male" | "female" | "other" })}
                    className="grid grid-cols-3 gap-3"
                  >
                    {[
                      { value: "male", label: "ชาย", icon: <User className="w-6 h-6" /> },
                      { value: "female", label: "หญิง", icon: <UserCircle className="w-6 h-6" /> },
                      { value: "other", label: "อื่นๆ", icon: <Users className="w-6 h-6" /> },
                    ].map((option) => (
                      <div key={option.value}>
                        <RadioGroupItem
                          value={option.value}
                          id={option.value}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={option.value}
                          className={cn(
                            "flex flex-col items-center justify-center rounded-xl border-2 p-4 cursor-pointer transition-all",
                            "hover:border-primary/50",
                            data.gender === option.value
                              ? "border-primary bg-primary/10"
                              : "border-muted"
                          )}
                        >
                          <span className={cn("mb-1", data.gender === option.value ? "text-primary" : "text-muted-foreground")}>{option.icon}</span>
                          <span className="text-sm font-medium">{option.label}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Coach Selection */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Volume2 className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">เลือกโค้ชของคุณ</h2>
                <p className="text-muted-foreground">โค้ชที่จะคอยให้กำลังใจและแนะนำคุณ</p>
              </div>

              <CoachSelector
                selectedCoachId={data.selectedCoachId}
                onSelect={(coachId) => setData({ ...data, selectedCoachId: coachId })}
                showPreview={true}
              />

              {data.selectedCoachId && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-primary/10 rounded-xl p-4 border border-primary/20"
                >
                  <p className="text-sm text-center">
                    <span className="font-semibold">{getCoachById(data.selectedCoachId)?.nameTh}</span> จะเป็นโค้ชของคุณ!
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 5: Summary & BMI Result */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">พร้อมแล้ว</h2>
                <p className="text-muted-foreground">นี่คือสรุปข้อมูลของคุณ</p>
              </div>

              {/* Summary Card */}
              <div className="bg-card rounded-2xl p-5 border space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ชื่อเล่น</p>
                    <p className="font-semibold text-lg">{data.nickname}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground">น้ำหนัก</p>
                    <p className="font-semibold">{data.weight} กก.</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground">ส่วนสูง</p>
                    <p className="font-semibold">{data.height} ซม.</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground">อายุ</p>
                    <p className="font-semibold">{data.age} ปี</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground">เพศ</p>
                    <p className="font-semibold">
                      {data.gender === "male" ? "ชาย" : data.gender === "female" ? "หญิง" : "อื่นๆ"}
                    </p>
                  </div>
                </div>
              </div>

              {/* BMI Result Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-6 border border-primary/20"
              >
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">ค่าดัชนีมวลกาย (BMI)</p>
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <span className="text-5xl font-bold">{bmi.toFixed(1)}</span>
                    <div className="text-left">
                      <div className={cn("flex items-center gap-1 mb-1", bmiCategory.color)}>
                        <div className={cn("p-1 rounded-full", bmiCategory.bgColor)}>
                          {bmiCategory.icon}
                        </div>
                      </div>
                      <p className={cn("text-sm font-medium", bmiCategory.color)}>
                        {bmiCategory.label}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {bmiCategory.description}
                  </p>
                </div>

                {/* BMI Scale */}
                <div className="mt-4">
                  <div className="h-3 rounded-full bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 via-orange-500 to-red-500 relative">
                    <motion.div
                      initial={{ left: "0%" }}
                      animate={{ left: `${Math.min(Math.max((bmi - 15) / 25 * 100, 0), 100)}%` }}
                      transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
                      className="absolute -top-1 w-5 h-5 bg-white rounded-full border-2 border-primary shadow-lg transform -translate-x-1/2"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>15</span>
                    <span>18.5</span>
                    <span>23</span>
                    <span>25</span>
                    <span>30</span>
                    <span>40</span>
                  </div>
                </div>
              </motion.div>

              {/* Motivation */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center p-4 bg-muted/30 rounded-xl"
              >
                <PartyPopper className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm">
                  <span className="font-semibold">KAYA</span> พร้อมช่วยให้คุณบรรลุเป้าหมายสุขภาพแล้ว!
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-6 py-6 bg-background border-t">
        <div className="flex gap-3">
          {step > 1 && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleBack}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              ย้อนกลับ
            </Button>
          )}
          
          {step < totalSteps ? (
            <Button
              variant="hero"
              size="lg"
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1"
            >
              ถัดไป
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              variant="hero"
              size="lg"
              onClick={handleComplete}
              disabled={showConfetti}
              className="flex-1"
            >
              {showConfetti ? (
                <>
                  <PartyPopper className="w-4 h-4 mr-2 animate-bounce" />
                  กำลังเข้าสู่แอป...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  เริ่มต้นใช้งาน KAYA
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
