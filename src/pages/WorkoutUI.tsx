import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, X, Volume2, MessageCircle, Dumbbell, Flame, PersonStanding, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import aiCoach from "@/assets/ai-coach.png";

// Map icon names to components
const exerciseIcons: Record<string, React.ReactNode> = {
  run: <PersonStanding className="w-16 h-16" />,
  muscle: <Dumbbell className="w-16 h-16" />,
  leg: <PersonStanding className="w-16 h-16" />,
  weight: <Dumbbell className="w-16 h-16" />,
  fire: <Flame className="w-16 h-16" />,
  yoga: <Heart className="w-16 h-16" />,
};

const exercises = [
  { name: "Jumping Jacks", duration: 30, reps: null, icon: "run" },
  { name: "Push-ups", duration: null, reps: 15, icon: "muscle" },
  { name: "High Knees", duration: 30, reps: null, icon: "leg" },
  { name: "Squats", duration: null, reps: 20, icon: "weight" },
  { name: "Burpees", duration: 30, reps: null, icon: "fire" },
  { name: "Plank", duration: 45, reps: null, icon: "yoga" },
];

const coachMessages = [
  "Great form! Keep your core tight!",
  "You're doing amazing! Push through!",
  "Almost there! Don't give up!",
  "Perfect pace! Keep it up!",
  "Remember to breathe steadily!",
];

export default function WorkoutUI() {
  const navigate = useNavigate();
  const [currentExercise, setCurrentExercise] = useState(0);
  const [timeLeft, setTimeLeft] = useState(exercises[0].duration || 0);
  const [isPaused, setIsPaused] = useState(false);
  const [showCoach, setShowCoach] = useState(true);
  const [coachMessage, setCoachMessage] = useState(coachMessages[0]);
  const [totalTime, setTotalTime] = useState(0);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setTotalTime((prev) => prev + 1);

      if (exercises[currentExercise].duration) {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleNext();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, currentExercise]);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCoachMessage(coachMessages[Math.floor(Math.random() * coachMessages.length)]);
    }, 8000);

    return () => clearInterval(messageInterval);
  }, []);

  const handleNext = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise((prev) => prev + 1);
      const nextExercise = exercises[currentExercise + 1];
      setTimeLeft(nextExercise.duration || 0);
    } else {
      navigate("/dashboard");
    }
  };

  const handleStop = () => {
    navigate("/dashboard");
  };

  const exercise = exercises[currentExercise];
  const progress = ((currentExercise + 1) / exercises.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={handleStop} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Time</p>
            <p className="text-xl font-bold">{formatTime(totalTime)}</p>
          </div>
          <button className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full gradient-coral rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2 text-center">
          Exercise {currentExercise + 1} of {exercises.length}
        </p>
      </div>

      {/* Main Exercise Display */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary animate-float">
          {exerciseIcons[exercise.icon] || <Dumbbell className="w-16 h-16" />}
        </div>
        <h2 className="text-3xl font-bold mb-2 text-center">{exercise.name}</h2>
        {exercise.duration ? (
          <div className="text-6xl font-bold text-primary">{timeLeft}s</div>
        ) : (
          <div className="text-6xl font-bold text-primary">{exercise.reps ?? 0} reps</div>
        )}
      </div>

      {/* AI Coach Bubble */}
      {showCoach && (
        <div className="px-6 mb-4 animate-slide-up">
          <div className="card-elevated p-4 flex items-start gap-3">
            <img src={aiCoach} alt="AI Coach" className="w-12 h-12 rounded-full object-cover" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">AI Coach</span>
                <span className="w-2 h-2 rounded-full bg-nature animate-pulse" />
              </div>
              <p className="text-sm text-muted-foreground">{coachMessage}</p>
            </div>
            <button onClick={() => setShowCoach(false)} className="text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="px-6 pb-8 safe-area-inset-bottom">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="w-14 h-14 rounded-full"
            onClick={handleStop}
          >
            <X className="w-6 h-6" />
          </Button>
          <Button
            variant="hero"
            size="icon"
            className="w-20 h-20 rounded-full"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? <Play className="w-8 h-8" /> : <Pause className="w-8 h-8" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-14 h-14 rounded-full"
            onClick={handleNext}
          >
            <SkipForward className="w-6 h-6" />
          </Button>
        </div>

        {!showCoach && (
          <button
            onClick={() => setShowCoach(true)}
            className="fixed bottom-28 right-6 w-14 h-14 rounded-full gradient-coral shadow-coral flex items-center justify-center animate-scale-in"
          >
            <MessageCircle className="w-6 h-6 text-primary-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}