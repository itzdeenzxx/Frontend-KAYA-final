import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Smartphone, Monitor, ArrowLeft, Wifi, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Mode = "mobile" | "bigscreen" | null;

export default function WorkoutMode() {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<Mode>(null);
  const [isPaired, setIsPaired] = useState(false);

  const handleContinue = () => {
    if (selectedMode === "mobile") {
      navigate("/workout");
    } else if (selectedMode === "bigscreen") {
      // Mock pairing
      setIsPaired(true);
      setTimeout(() => navigate("/workout-remote"), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 pt-12 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/dashboard"
          className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Start Workout</h1>
          <p className="text-muted-foreground">Choose how you want to exercise</p>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="space-y-4 mb-8">
        <button
          onClick={() => setSelectedMode("mobile")}
          className={cn(
            "w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left",
            selectedMode === "mobile"
              ? "border-primary bg-coral-light shadow-coral"
              : "border-border hover:border-primary/50"
          )}
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center transition-colors",
                selectedMode === "mobile"
                  ? "gradient-coral text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Smartphone className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">Workout on Mobile</h3>
              <p className="text-muted-foreground text-sm">
                Use your phone directly to follow workout instructions with AI coaching
              </p>
            </div>
            {selectedMode === "mobile" && (
              <div className="w-6 h-6 rounded-full gradient-coral flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
          </div>
        </button>

        <button
          onClick={() => setSelectedMode("bigscreen")}
          className={cn(
            "w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left",
            selectedMode === "bigscreen"
              ? "border-primary bg-coral-light shadow-coral"
              : "border-border hover:border-primary/50"
          )}
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center transition-colors",
                selectedMode === "bigscreen"
                  ? "gradient-coral text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Monitor className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">Cast to Big Screen</h3>
              <p className="text-muted-foreground text-sm">
                Display on your TV or laptop with webcam pose detection. Use your phone as a remote
              </p>
            </div>
            {selectedMode === "bigscreen" && (
              <div className="w-6 h-6 rounded-full gradient-coral flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Pairing Status for Big Screen */}
      {selectedMode === "bigscreen" && (
        <div className="card-elevated p-5 mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <Wifi className={cn("w-5 h-5", isPaired ? "text-nature" : "text-muted-foreground")} />
            <span className="font-medium">Device Pairing</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <p className={cn("font-medium", isPaired ? "text-nature" : "text-energy")}>
                {isPaired ? "Connected to Living Room TV" : "Searching for devices..."}
              </p>
            </div>
            {!isPaired && (
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </div>
      )}

      {/* Continue Button */}
      <Button
        variant="hero"
        size="xl"
        className="w-full"
        disabled={!selectedMode}
        onClick={handleContinue}
      >
        {selectedMode === "bigscreen" && !isPaired ? "Connecting..." : "Continue"}
      </Button>
    </div>
  );
}