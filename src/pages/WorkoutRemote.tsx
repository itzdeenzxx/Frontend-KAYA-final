import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, Volume2, Vibrate, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const exercises = [
  { name: "Jumping Jacks", duration: 30 },
  { name: "Push-ups", reps: 15 },
  { name: "High Knees", duration: 30 },
  { name: "Squats", reps: 20 },
  { name: "Burpees", duration: 30 },
  { name: "Plank", duration: 45 },
];

export default function WorkoutRemote() {
  const navigate = useNavigate();
  const [currentExercise, setCurrentExercise] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const handleNext = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise((prev) => prev + 1);
      if (vibrationEnabled && navigator.vibrate) {
        navigator.vibrate(100);
      }
    } else {
      navigate("/dashboard");
    }
  };

  const handlePlayPause = () => {
    setIsPaused(!isPaused);
    if (vibrationEnabled && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const exercise = exercises[currentExercise];
  const progress = ((currentExercise + 1) / exercises.length) * 100;

  return (
    <div className="min-h-screen bg-foreground flex flex-col text-background">
      {/* Header */}
      <div className="px-6 pt-12 pb-4">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/dashboard"
            className="w-10 h-10 rounded-xl bg-background/10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-nature animate-pulse" />
            <span className="text-sm">Connected to TV</span>
          </div>
          <button
            onClick={() => setVibrationEnabled(!vibrationEnabled)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              vibrationEnabled ? "bg-primary" : "bg-background/10"
            }`}
          >
            <Vibrate className="w-5 h-5" />
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-2">Remote Control</h1>
        <p className="text-background/60">Control your workout on the big screen</p>
      </div>

      {/* Current Exercise Card */}
      <div className="px-6 py-4">
        <div className="gradient-coral rounded-2xl p-6 shadow-coral">
          <p className="text-primary-foreground/80 text-sm mb-1">Now Playing</p>
          <h2 className="text-2xl font-bold text-primary-foreground mb-2">{exercise.name}</h2>
          <p className="text-primary-foreground/80">
            {exercise.duration ? `${exercise.duration} seconds` : `${exercise.reps ?? 0} reps`}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="px-6 py-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-background/60">Progress</span>
          <span>
            {currentExercise + 1} / {exercises.length}
          </span>
        </div>
        <div className="h-2 bg-background/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="px-6 py-4 flex-1">
        <h3 className="text-sm text-background/60 mb-4">Live Stats</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-background/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">12:34</p>
            <p className="text-xs text-background/60">Time</p>
          </div>
          <div className="bg-background/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">156</p>
            <p className="text-xs text-background/60">Calories</p>
          </div>
          <div className="bg-background/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">124</p>
            <p className="text-xs text-background/60">BPM</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 pb-12 safe-area-inset-bottom">
        <div className="flex items-center justify-center gap-6">
          <Button
            variant="glass"
            size="icon"
            className="w-16 h-16 rounded-full bg-background/10 hover:bg-background/20 border-0"
          >
            <Volume2 className="w-6 h-6" />
          </Button>
          <Button
            variant="hero"
            size="icon"
            className="w-24 h-24 rounded-full"
            onClick={handlePlayPause}
          >
            {isPaused ? <Play className="w-10 h-10" /> : <Pause className="w-10 h-10" />}
          </Button>
          <Button
            variant="glass"
            size="icon"
            className="w-16 h-16 rounded-full bg-background/10 hover:bg-background/20 border-0"
            onClick={handleNext}
          >
            <SkipForward className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}