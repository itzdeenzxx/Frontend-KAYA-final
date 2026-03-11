import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  Volume2,
  VolumeX,
  Dumbbell,
  Flame,
  PersonStanding,
  Heart,
  Brain,
  Target,
  Zap,
  Camera,
  CameraOff,
  Activity,
  Bone,
  Eye,
  EyeOff,
  Music,
  Wind,
  Waves,
  Footprints,
  ArrowUp,
  RotateCcw,
  ArrowUpFromLine,
  Mic,
  MicOff,
  Loader2,
  Smartphone,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaPipePose } from "@/hooks/useMediaPipePose";
import { SkeletonOverlay } from "@/components/shared/SkeletonOverlay";
import { getWorkoutStyle, getExercisesForStyle, WorkoutExercise } from "@/lib/workoutStyles";
import BigScreenMusicPlayer from "@/components/music/BigScreenMusicPlayer";
import { useExerciseAnalysis } from "@/hooks/useExerciseAnalysis";
import { VisualPoseGuide, StageIndicator, BeatCounter } from "@/components/workout/VisualPoseGuide";
import { AICoachPopup, stopCoachPopupAudio } from "@/components/workout/AICoachPopup";
import { ExerciseType, EXERCISES } from "@/lib/exerciseConfig";
import { getExerciseStartAudioUrl, getRepAudioUrl, getGreetingAudioUrl, getLocalAudioUrl } from "@/lib/coachAudio";
import type { AudioCategory } from "@/lib/coachAudio";
import { WorkoutLoader } from "@/components/shared/WorkoutLoader";
import { useAuth } from "@/contexts/AuthContext";
import { getUserSettings, DEFAULT_TTS_SETTINGS } from "@/lib/firestore";
import { getCoachById, Coach, migrateSpeakerId, migrateCoachId } from "@/lib/coachConfig";
import {
  subscribeToSession,
  updateSessionState,
  clearRemoteAction,
  clearTTSState,
  updateRepsCount,
  endSession,
  WorkoutSession,
  RemoteAction,
} from "@/lib/session";

// Rep count messages
const REP_MESSAGES: Record<number, string> = {
  1: "หนึ่ง! เริ่มต้นดีครับ!",
  5: "ห้า! ครึ่งทางแล้ว สู้ๆ ครับ!",
  9: "เก้า! อีกครั้งสุดท้ายแล้วครับ!",
  10: "สิบ! เสร็จสิ้นท่านี้แล้ว เก่งมากๆ ครับ!",
};

type VoiceStatus = "idle" | "recording" | "processing" | "thinking" | "speaking";

const exerciseIconsLarge: Record<string, React.ReactNode> = {
  run: <PersonStanding className="w-20 h-20" />,
  muscle: <Dumbbell className="w-20 h-20" />,
  leg: <PersonStanding className="w-20 h-20" />,
  weight: <Dumbbell className="w-20 h-20" />,
  fire: <Flame className="w-20 h-20" />,
  yoga: <Heart className="w-20 h-20" />,
  'kaya-arm': <ArrowUp className="w-20 h-20" />,
  'kaya-torso': <RotateCcw className="w-20 h-20" />,
  'kaya-knee': <ArrowUpFromLine className="w-20 h-20" />,
  'kaya-squat-arm': <Dumbbell className="w-20 h-20" />,
  'kaya-pushup': <Dumbbell className="w-20 h-20" />,
  'kaya-lunge': <PersonStanding className="w-20 h-20" />,
  'kaya-jump-squat': <Zap className="w-20 h-20" />,
  'kaya-plank': <Activity className="w-20 h-20" />,
  'kaya-mountain': <Flame className="w-20 h-20" />,
  'kaya-pistol': <Target className="w-20 h-20" />,
  'kaya-pushup-tap': <Dumbbell className="w-20 h-20" />,
  'kaya-burpee': <Flame className="w-20 h-20" />,
};

const styleIcons: Record<string, React.ReactNode> = {
  rhythm: <Music className="w-5 h-5" />,
  slow: <Wind className="w-5 h-5" />,
  stretch: <PersonStanding className="w-5 h-5" />,
  'kaya-stretch': <Target className="w-5 h-5" />,
  'kaya-intermediate': <Target className="w-5 h-5" />,
  'kaya-advanced': <Zap className="w-5 h-5" />,
  'kaya-expert': <Flame className="w-5 h-5" />,
  hiit: <Flame className="w-5 h-5" />,
  strength: <Dumbbell className="w-5 h-5" />,
  cardio: <Heart className="w-5 h-5" />,
  yoga: <Waves className="w-5 h-5" />,
  dance: <Footprints className="w-5 h-5" />,
  'ai-personalized': <Brain className="w-5 h-5" />,
};

const coachMessages = [
  "ทำได้ดีมาก! เกร็งกล้ามเนื้อแกนกลางไว้!",
  "เยี่ยมไปเลย! สู้ๆ อีกนิด!",
  "เกือบเสร็จแล้ว! อย่ายอมแพ้!",
  "จังหวะดีมาก! ทำต่อไป!",
  "อย่าลืมหายใจให้สม่ำเสมอ!",
  "ท่าทางดีมาก! AI กำลังวิเคราะห์!",
];

const REST_DURATION = 30;

export default function WorkoutBigScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pairingCode = searchParams.get("code") || "";
  const { userProfile, healthData } = useAuth();

  // ─── Session / Remote state ───
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [lastAction, setLastAction] = useState<RemoteAction | null>(null);
  const [showActionIndicator, setShowActionIndicator] = useState(false);

  // Get workout style from session (sent by mobile) or fallback
  const selectedStyleId = session?.workoutStyle || localStorage.getItem("kaya_workout_style");
  const selectedStyle = getWorkoutStyle(selectedStyleId);
  const exercises = useMemo(() => getExercisesForStyle(selectedStyleId), [selectedStyleId]);

  const isKayaWorkout =
    selectedStyleId === "kaya-stretch" ||
    selectedStyleId === "kaya-intermediate" ||
    selectedStyleId === "kaya-advanced" ||
    selectedStyleId === "kaya-expert";

  const [currentExercise, setCurrentExercise] = useState(0);
  const [timeLeft, setTimeLeft] = useState(exercises[0]?.duration || 0);
  const [isPaused, setIsPaused] = useState(false);
  const [coachMessage, setCoachMessage] = useState(coachMessages[0]);
  const [totalTime, setTotalTime] = useState(0);

  // Rest period state
  const [showRestScreen, setShowRestScreen] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(REST_DURATION);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);

  // Rep counter animation
  const [showRepCounter, setShowRepCounter] = useState(false);
  const [displayRep, setDisplayRep] = useState(0);
  const lastRepRef = useRef(0);
  const lastSpokenRepRef = useRef(0);
  const lastFormAudioTimeRef = useRef<number>(Date.now());
  const halfwayPlayedRef = useRef(false);
  const timeMilestone30Ref = useRef(false);
  const timeMilestone15Ref = useRef(false);
  const lastTempoAudioTimeRef = useRef<number>(Date.now());
  const lastTempoQualityRef = useRef<string>("");
  const lastMotionAudioTimeRef = useRef<number>(Date.now());
  const lastVisibilityAudioTimeRef = useRef<number>(Date.now());
  const bodyInvisibleSinceRef = useRef<number>(0);
  const stageUpEnteredTimeRef = useRef<number>(0);
  const holdCountdownRef = useRef<number>(4);
  const holdAnnouncedRef = useRef<boolean>(false);

  // TTS audio refs
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenExerciseRef = useRef(-1);
  const coachIntroSpokenRef = useRef(false);
  const isTtsSpeakingRef = useRef(false);
  const speakTTSInProgressRef = useRef(false);
  const navigatedRef = useRef(false);
  const playCoachAudioRef = useRef<(category: AudioCategory, onEnd?: () => void) => void>(() => {});
  const speakCoachIntroductionRef = useRef<() => void>(() => {});
  const handleNextRef = useRef<() => void>(() => {});
  const ttsCoachRef = useRef<typeof ttsCoach>(null);
  const ttsSpeakerRef = useRef<string>(DEFAULT_TTS_SETTINGS.speaker);
  const ttsEnabledRef = useRef<boolean>(DEFAULT_TTS_SETTINGS.enabled);
  const ttsSpeedRef = useRef<number>(DEFAULT_TTS_SETTINGS.speed);

  // Voice Coach state
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const pcmDataRef = useRef<Float32Array[]>([]);

  // Exercise results
  const exerciseResultsRef = useRef<Array<{
    name: string;
    nameTh: string;
    reps: number;
    targetReps: number;
    formScore: number;
    duration: number;
  }>>([]);
  const exerciseStartTimeRef = useRef(Date.now());
  const screenshotsRef = useRef<string[]>([]);

  // Loading / camera
  const [showLoader, setShowLoader] = useState(true);
  const [showScreenshotFlash, setShowScreenshotFlash] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowLoader(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cameraError, setCameraError] = useState<string>("");
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const debugCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);

  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showOpticalFlow, setShowOpticalFlow] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: 1920, height: 1080 });
  const [mediaPipeEnabled] = useState(true);
  const [showVisualGuide, setShowVisualGuide] = useState(false);

  // TTS settings
  const [ttsEnabled, setTtsEnabled] = useState(DEFAULT_TTS_SETTINGS.enabled);
  const [ttsSpeed, setTtsSpeed] = useState(DEFAULT_TTS_SETTINGS.speed);
  const [ttsSpeaker, setTtsSpeaker] = useState(DEFAULT_TTS_SETTINGS.speaker);
  const [ttsCoach, setTtsCoach] = useState<Coach | null>(null);
  const [ttsCoachId, setTtsCoachId] = useState<string>("coach-aiko");
  const [customCoachForLLM, setCustomCoachForLLM] = useState<{ name: string; personality: string; gender: "male" | "female" } | null>(null);
  const ttsSettingsLoadedRef = useRef(false);

  // Load TTS settings
  useEffect(() => {
    const loadTTSSettings = async () => {
      if (userProfile?.lineUserId) {
        try {
          const settings = await getUserSettings(userProfile.lineUserId);
          if (settings?.tts) {
            const loadedEnabled = settings.tts.enabled ?? DEFAULT_TTS_SETTINGS.enabled;
            const loadedSpeed = settings.tts.speed ?? DEFAULT_TTS_SETTINGS.speed;
            const loadedSpeaker = migrateSpeakerId(settings.tts.speaker);
            setTtsEnabled(loadedEnabled);
            setTtsSpeed(loadedSpeed);
            setTtsSpeaker(loadedSpeaker);
          }
          if (settings?.selectedCoachId) {
            const validCoachId = migrateCoachId(settings.selectedCoachId);
            setTtsCoachId(validCoachId);
            if (validCoachId === "coach-custom") {
              const { getCustomCoach } = await import("@/lib/firestore");
              const { buildCoachFromCustom } = await import("@/lib/coachConfig");
              const custom = await getCustomCoach(userProfile.lineUserId);
              if (custom) {
                setTtsCoach(buildCoachFromCustom(custom));
                setCustomCoachForLLM({ name: custom.name, personality: custom.personality, gender: custom.gender });
              }
            } else {
              const coach = getCoachById(validCoachId);
              if (coach) {
                ttsCoachRef.current = coach;
                setTtsCoach(coach);
              }
            }
          }
          ttsSettingsLoadedRef.current = true;
        } catch (err) {
          console.warn("Failed to load TTS settings:", err);
          ttsSettingsLoadedRef.current = true;
        }
      } else {
        ttsSettingsLoadedRef.current = true;
      }
    };
    loadTTSSettings();
  }, [userProfile?.lineUserId]);

  // MediaPipe pose detection
  const { landmarks, opticalFlowPoints, getFlowHistory, isLoading: mediaPipeLoading } = useMediaPipePose(
    videoRef,
    { enabled: cameraReady && cameraEnabled && isKayaWorkout && mediaPipeEnabled }
  );

  const currentKayaExercise = exercises[currentExercise]?.kayaExercise as ExerciseType | undefined;

  const kayaAnalysis = useExerciseAnalysis(
    isKayaWorkout && mediaPipeEnabled ? landmarks : [],
    {
      enabled: isKayaWorkout && mediaPipeEnabled && !!currentKayaExercise && !showLoader,
      difficulty: "beginner",
      exerciseType: currentKayaExercise,
    }
  );

  // ─── Camera setup ───
  useEffect(() => {
    if (!cameraEnabled) {
      if (cameraStream) { cameraStream.getTracks().forEach((t) => t.stop()); setCameraStream(null); }
      return;
    }
    if (cameraStream) return;
    let cancelled = false;
    navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: "user" },
      audio: false,
    }).then((stream) => {
      if (!cancelled) { setCameraStream(stream); setCameraError(""); }
      else stream.getTracks().forEach((t) => t.stop());
    }).catch((error) => {
      if (!cancelled) { console.error("Camera error:", error); setCameraError("ไม่สามารถเข้าถึงกล้องได้"); }
    });
    return () => { cancelled = true; };
  }, [cameraEnabled, cameraStream]);

  useEffect(() => {
    if (!cameraEnabled) {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }
    if (showLoader || !cameraStream || !videoRef.current) return;
    if (videoRef.current.srcObject === cameraStream) return;

    const attachCamera = async () => {
      if (!videoRef.current) return;
      videoRef.current.srcObject = cameraStream;
      try { await videoRef.current.play(); setAutoplayBlocked(false); }
      catch { setAutoplayBlocked(true); }
      setCameraReady(true);
      videoRef.current.onloadedmetadata = () => {
        if (videoRef.current && containerRef.current) {
          setVideoDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
        }
      };
    };
    attachCamera();

    const handleResize = () => {
      if (containerRef.current) {
        setVideoDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
      } else {
        setVideoDimensions({ width: window.innerWidth, height: window.innerHeight });
      }
    };
    window.addEventListener("resize", handleResize);
    requestAnimationFrame(handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraEnabled, showLoader, cameraStream]);

  // Debug canvas
  useEffect(() => {
    let interval: number | null = null;
    if (isKayaWorkout && cameraEnabled) {
      interval = window.setInterval(() => {
        const video = videoRef.current;
        const canvas = debugCanvasRef.current;
        if (!video || !canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        try { ctx.drawImage(video, 0, 0, canvas.width, canvas.height); } catch { /* ignore */ }
      }, 250);
    }
    return () => { if (interval) window.clearInterval(interval); };
  }, [isKayaWorkout, cameraEnabled]);

  const currentExerciseIsTimeBased = (() => {
    const kayaEx = exercises[currentExercise]?.kayaExercise as ExerciseType | undefined;
    if (!kayaEx) return false;
    return EXERCISES[kayaEx]?.isTimeBased === true;
  })();

  // ─── Timer ───
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setTotalTime((prev) => prev + 1);
      if (exercises[currentExercise].duration) {
        let shouldCountDown: boolean;
        if (!isKayaWorkout) shouldCountDown = true;
        else if (currentExerciseIsTimeBased) shouldCountDown = kayaAnalysis.stage === "hold";
        else shouldCountDown = kayaAnalysis.isBodyVisible;
        if (shouldCountDown) {
          setTimeLeft((prev) => {
            if (prev <= 1) { handleNextRef.current(); return 0; }
            return prev - 1;
          });
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused, currentExercise, isKayaWorkout, kayaAnalysis.isBodyVisible, kayaAnalysis.stage, currentExerciseIsTimeBased]);

  useEffect(() => {
    const interval = setInterval(() => setCoachMessage(coachMessages[Math.floor(Math.random() * coachMessages.length)]), 8000);
    return () => clearInterval(interval);
  }, []);

  // Save exercise result
  const saveCurrentExerciseResult = useCallback(() => {
    const exerciseData = exercises[currentExercise];
    if (!exerciseData) return;
    const duration = Math.floor((Date.now() - exerciseStartTimeRef.current) / 1000);
    exerciseResultsRef.current[currentExercise] = {
      name: exerciseData.name,
      nameTh: exerciseData.nameTh,
      reps: isKayaWorkout ? kayaAnalysis.reps : (exerciseData.reps || 0),
      targetReps: exerciseData.reps || 10,
      formScore: isKayaWorkout ? kayaAnalysis.formScore : 80,
      duration,
    };
    exerciseStartTimeRef.current = Date.now();
  }, [currentExercise, exercises, isKayaWorkout, kayaAnalysis]);

  // Finish workout
  const finishWorkout = useCallback(async () => {
    saveCurrentExerciseResult();
    const results = exerciseResultsRef.current;
    const totalReps = results.reduce((sum, e) => sum + (e?.reps || 0), 0);
    const avgFormScore = results.length > 0 ? Math.round(results.reduce((sum, e) => sum + (e?.formScore || 0), 0) / results.length) : 80;
    const completionPct = Math.round(
      (results.reduce((sum, e) => sum + Math.min(e?.reps || 0, e?.targetReps || 10), 0) /
        results.reduce((sum, e) => sum + (e?.targetReps || 10), 0)) * 100
    );
    const navState = {
      styleName: selectedStyle?.name || "Workout",
      styleNameTh: selectedStyle?.nameTh || "ออกกำลังกาย",
      exercises: results.filter(Boolean),
      totalTime, totalReps, averageFormScore: avgFormScore, caloriesBurned: 0, completionPercentage: completionPct,
      screenshots: screenshotsRef.current,
    };
    if (pairingCode) await endSession(pairingCode);
    const doNavigate = () => {
      if (navigatedRef.current) return;
      navigatedRef.current = true;
      navigate("/workout-complete", { state: { results: navState } });
    };
    playCoachAudioRef.current("session_complete", () => { playCoachAudioRef.current("amazing", doNavigate); });
    setTimeout(doNavigate, 9000);
  }, [navigate, saveCurrentExerciseResult, selectedStyle, totalTime, pairingCode]);

  // Rest period helpers
  const showRestPeriod = useCallback(() => {
    setShowRestScreen(true);
    setRestTimeLeft(REST_DURATION);
    setIsPaused(true);
    setTimeout(() => playCoachAudioRef.current(Math.random() < 0.5 ? "rest" : "dont_forget_rest"), 200);
  }, []);

  const skipRest = useCallback(() => {
    setShowRestScreen(false);
    setIsPaused(false);
    if (currentExercise < exercises.length - 1) {
      const isLast = currentExercise === exercises.length - 2;
      const doAdvance = () => {
        kayaAnalysis.nextExercise();
        lastSpokenExerciseRef.current = -1;
        lastRepRef.current = 0;
        setCurrentExercise((prev) => prev + 1);
        setExerciseCompleted(false);
      };
      const doChange = () => playCoachAudioRef.current("change_exercise", doAdvance);
      if (isLast) playCoachAudioRef.current("session_almost_done", doChange);
      else doChange();
    } else {
      finishWorkout();
    }
  }, [currentExercise, exercises.length, kayaAnalysis, finishWorkout]);

  // Beat countdown during rest
  useEffect(() => {
    if (!showRestScreen || restTimeLeft <= 0 || restTimeLeft > 4) return;
    const beatMap: Record<number, "beat_4" | "beat_3" | "beat_2" | "beat_1"> = { 4: "beat_4", 3: "beat_3", 2: "beat_2", 1: "beat_1" };
    const cat = beatMap[restTimeLeft];
    if (cat) playCoachAudioRef.current(cat);
  }, [showRestScreen, restTimeLeft]);

  // Time milestone audio
  useEffect(() => {
    if (!currentExerciseIsTimeBased || exerciseCompleted) return;
    const dur = exercises[currentExercise]?.duration ?? 0;
    if (!isTtsSpeakingRef.current) {
      if (timeLeft === 30 && !timeMilestone30Ref.current && dur > 35) { timeMilestone30Ref.current = true; playCoachAudioRef.current("timer_30s"); }
      else if (timeLeft === 15 && !timeMilestone15Ref.current) { timeMilestone15Ref.current = true; playCoachAudioRef.current("timer_15s"); }
    }
  }, [currentExerciseIsTimeBased, exerciseCompleted, timeLeft, currentExercise, exercises]);

  // Tempo feedback
  useEffect(() => {
    if (!isKayaWorkout || exerciseCompleted || showRestScreen || kayaAnalysis.reps < 5) return;
    const quality = kayaAnalysis.tempoQuality;
    if (quality !== "too_fast" && quality !== "too_slow" && quality !== "inconsistent") return;
    const now = Date.now();
    if (now - lastTempoAudioTimeRef.current < 10000) return;
    if (quality === lastTempoQualityRef.current && now - lastTempoAudioTimeRef.current < 20000) return;
    if (isTtsSpeakingRef.current) return;
    const map: Partial<Record<string, AudioCategory>> = { too_fast: "tempo_too_fast", too_slow: "tempo_too_slow", inconsistent: "tempo_inconsistent" };
    const cat = map[quality]; if (!cat) return;
    lastTempoAudioTimeRef.current = now; lastTempoQualityRef.current = quality;
    playCoachAudioRef.current(cat);
  }, [isKayaWorkout, exerciseCompleted, showRestScreen, kayaAnalysis.tempoQuality]);

  // Body visibility audio
  useEffect(() => {
    if (!isKayaWorkout || exerciseCompleted || showRestScreen) return;
    if (kayaAnalysis.isBodyVisible) { bodyInvisibleSinceRef.current = 0; return; }
    bodyInvisibleSinceRef.current = Date.now();
    const timer = setTimeout(() => {
      if (bodyInvisibleSinceRef.current === 0) return;
      const now = Date.now();
      if (now - lastVisibilityAudioTimeRef.current < 10000 || isTtsSpeakingRef.current) return;
      lastVisibilityAudioTimeRef.current = now;
      playCoachAudioRef.current("move_closer");
    }, 3000);
    return () => clearTimeout(timer);
  }, [isKayaWorkout, exerciseCompleted, showRestScreen, kayaAnalysis.isBodyVisible]);

  // Motion quality audio
  useEffect(() => {
    if (!isKayaWorkout || exerciseCompleted || showRestScreen || !kayaAnalysis.isBodyVisible) return;
    const { isMoving, smoothness } = kayaAnalysis.motionQuality;
    const now = Date.now();
    if (now - lastMotionAudioTimeRef.current < 8000 || isTtsSpeakingRef.current) return;
    if (!isMoving && kayaAnalysis.reps > 0) { lastMotionAudioTimeRef.current = now; playCoachAudioRef.current("move_more"); }
    else if (isMoving && smoothness === "jerky") { lastMotionAudioTimeRef.current = now; playCoachAudioRef.current("movement_jerky"); }
  }, [isKayaWorkout, exerciseCompleted, showRestScreen, kayaAnalysis.isBodyVisible, kayaAnalysis.motionQuality, kayaAnalysis.reps]);

  // Arm raise hold countdown
  useEffect(() => {
    if (!isKayaWorkout || currentKayaExercise !== "arm_raise" || exerciseCompleted) return;
    if (kayaAnalysis.stage !== "up") { stageUpEnteredTimeRef.current = 0; holdCountdownRef.current = 4; holdAnnouncedRef.current = false; return; }
    if (stageUpEnteredTimeRef.current === 0) {
      stageUpEnteredTimeRef.current = Date.now(); holdCountdownRef.current = 4; holdAnnouncedRef.current = true;
      const t3 = setTimeout(() => { if (stageUpEnteredTimeRef.current !== 0) playCoachAudioRef.current("beat_3"); }, 100);
      const t2 = setTimeout(() => { if (stageUpEnteredTimeRef.current !== 0) playCoachAudioRef.current("beat_2"); }, 1000);
      const t1 = setTimeout(() => { if (stageUpEnteredTimeRef.current !== 0) playCoachAudioRef.current("beat_1"); }, 1900);
      return () => { clearTimeout(t3); clearTimeout(t2); clearTimeout(t1); };
    }
  }, [isKayaWorkout, currentKayaExercise, exerciseCompleted, kayaAnalysis.stage]);

  // Rest timer
  useEffect(() => {
    if (!showRestScreen) return;
    if (restTimeLeft <= 0) { skipRest(); return; }
    const timer = setInterval(() => setRestTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [showRestScreen, restTimeLeft, skipRest]);

  // ─── Audio system ───
  const stopAllTTS = useCallback(() => {
    if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current.currentTime = 0; ttsAudioRef.current = null; }
    isTtsSpeakingRef.current = false;
    speakTTSInProgressRef.current = false;
    stopCoachPopupAudio();
  }, []);

  const playCoachAudio = useCallback((category: AudioCategory, onEnd?: () => void): void => {
    if (!ttsEnabledRef.current) { onEnd?.(); return; }
    const coachId = ttsCoachRef.current?.id ?? "coach-aiko";
    const url = getLocalAudioUrl(coachId, category) ?? getLocalAudioUrl("coach-aiko", category);
    if (!url) { onEnd?.(); return; }
    stopAllTTS();
    isTtsSpeakingRef.current = true;
    const audio = new Audio(url);
    ttsAudioRef.current = audio;
    audio.playbackRate = ttsSpeedRef.current || 1.0;
    let ended = false;
    const handleEnd = () => { if (ended) return; ended = true; ttsAudioRef.current = null; isTtsSpeakingRef.current = false; onEnd?.(); };
    audio.onended = handleEnd; audio.onerror = handleEnd; audio.play().catch(handleEnd);
  }, [stopAllTTS]);

  useEffect(() => { playCoachAudioRef.current = playCoachAudio; }, [playCoachAudio]);

  useEffect(() => {
    return () => { if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current = null; } stopCoachPopupAudio(); };
  }, []);

  useEffect(() => { ttsCoachRef.current = ttsCoach; }, [ttsCoach]);
  useEffect(() => { ttsSpeakerRef.current = ttsSpeaker; }, [ttsSpeaker]);
  useEffect(() => { ttsEnabledRef.current = ttsEnabled; }, [ttsEnabled]);
  useEffect(() => { ttsSpeedRef.current = ttsSpeed; }, [ttsSpeed]);

  // Speak TTS via API
  const speakTTS = useCallback(async (text: string, forcePlay: boolean = false): Promise<void> => {
    if (!ttsEnabledRef.current) return;
    if (isRecording && !forcePlay) return;
    if (speakTTSInProgressRef.current) return;
    speakTTSInProgressRef.current = true;
    if (forcePlay && isRecording) {
      if (audioStreamRef.current) { audioStreamRef.current.getTracks().forEach((t) => t.stop()); audioStreamRef.current = null; }
      if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
      setIsRecording(false);
    }
    try {
      const currentSpeaker = ttsCoachRef.current?.voiceId || ttsSpeakerRef.current || "26";
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const response = await fetch("/api/aift/tts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, speaker: currentSpeaker }), signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response?.ok) { speakTTSInProgressRef.current = false; return; }
      const result = await response.json();
      if (!result.audio_base64) { speakTTSInProgressRef.current = false; return; }
      if (isRecording && !forcePlay) { speakTTSInProgressRef.current = false; return; }
      const audioData = atob(result.audio_base64);
      const arr = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) arr[i] = audioData.charCodeAt(i);
      const audioUrl = URL.createObjectURL(new Blob([arr], { type: "audio/wav" }));
      stopAllTTS(); isTtsSpeakingRef.current = true; speakTTSInProgressRef.current = true;
      return new Promise((resolve) => {
        const audio = new Audio(audioUrl);
        ttsAudioRef.current = audio; audio.playbackRate = ttsSpeedRef.current || 1.0;
        audio.onended = () => { URL.revokeObjectURL(audioUrl); ttsAudioRef.current = null; isTtsSpeakingRef.current = false; speakTTSInProgressRef.current = false; resolve(); };
        audio.onerror = () => { isTtsSpeakingRef.current = false; speakTTSInProgressRef.current = false; resolve(); };
        audio.play().catch(() => { isTtsSpeakingRef.current = false; speakTTSInProgressRef.current = false; resolve(); });
      });
    } catch { isTtsSpeakingRef.current = false; speakTTSInProgressRef.current = false; }
  }, [isRecording, stopAllTTS]);

  // Speak rep count
  const speakRepCount = useCallback(async (rep: number) => {
    const message = REP_MESSAGES[rep];
    if (message && rep > lastSpokenRepRef.current) {
      lastSpokenRepRef.current = rep;
      if (isTtsSpeakingRef.current) return;
      const localUrl = getRepAudioUrl(ttsCoachRef.current?.id ?? "coach-aiko", rep);
      if (localUrl) {
        try {
          stopAllTTS(); isTtsSpeakingRef.current = true;
          return new Promise<void>((resolve) => {
            const audio = new Audio(localUrl); ttsAudioRef.current = audio; audio.playbackRate = ttsSpeedRef.current || 1.0;
            audio.onended = () => { ttsAudioRef.current = null; isTtsSpeakingRef.current = false; resolve(); };
            audio.onerror = () => { ttsAudioRef.current = null; isTtsSpeakingRef.current = false; resolve(); };
            audio.play().catch(() => { ttsAudioRef.current = null; isTtsSpeakingRef.current = false; resolve(); });
          });
        } catch { /* skip */ }
      }
    }
  }, [stopAllTTS]);

  // Form feedback audio
  useEffect(() => {
    if (!isKayaWorkout || exerciseCompleted || !kayaAnalysis.isBodyVisible) return;
    const quality = kayaAnalysis.formQuality;
    const score = kayaAnalysis.formScore;
    const now = Date.now();
    if (isTtsSpeakingRef.current || now - lastFormAudioTimeRef.current < 8000) return;
    if (quality === "bad" && score < 50) {
      lastFormAudioTimeRef.current = now;
      const lean = kayaAnalysis.formFeedback?.issues?.some((i) => i.includes("เอนตัว") || i.includes("ลำตัวเอียง"));
      playCoachAudioRef.current(lean ? "stretch_up" : "form_correction");
    } else if (quality === "warn" && score < 70) {
      lastFormAudioTimeRef.current = now;
      const lean = kayaAnalysis.formFeedback?.issues?.some((i) => i.includes("เอนตัว") || i.includes("ลำตัวเอียง"));
      playCoachAudioRef.current(lean ? "stretch_up" : "form_check");
    }
  }, [isKayaWorkout, exerciseCompleted, kayaAnalysis.isBodyVisible, kayaAnalysis.formQuality, kayaAnalysis.formScore]);

  // Rep counter animation
  useEffect(() => {
    const targetReps = exercises[currentExercise]?.reps || 10;
    if (isKayaWorkout && kayaAnalysis.reps > lastRepRef.current && kayaAnalysis.reps > 0 && kayaAnalysis.reps <= targetReps) {
      setDisplayRep(kayaAnalysis.reps); setShowRepCounter(true);
      const half = Math.floor(targetReps / 2) + 1;
      if (REP_MESSAGES[kayaAnalysis.reps]) speakRepCount(kayaAnalysis.reps);
      else if (kayaAnalysis.reps === half && !halfwayPlayedRef.current && !isTtsSpeakingRef.current) { halfwayPlayedRef.current = true; playCoachAudioRef.current("halfway"); }
      else if (kayaAnalysis.reps < targetReps && !isTtsSpeakingRef.current && currentKayaExercise !== "arm_raise" && kayaAnalysis.reps % 3 === 0) playCoachAudioRef.current("good_job");
      const timeout = setTimeout(() => setShowRepCounter(false), 800);
      lastRepRef.current = kayaAnalysis.reps;
      return () => clearTimeout(timeout);
    }
  }, [isKayaWorkout, kayaAnalysis.reps, kayaAnalysis.formScore, currentExercise, exercises, speakRepCount]);

  // Reset refs on exercise change
  useEffect(() => {
    lastRepRef.current = 0; lastSpokenRepRef.current = 0; halfwayPlayedRef.current = false;
    timeMilestone30Ref.current = false; timeMilestone15Ref.current = false;
    lastTempoAudioTimeRef.current = Date.now(); lastTempoQualityRef.current = "";
    lastMotionAudioTimeRef.current = Date.now(); lastVisibilityAudioTimeRef.current = Date.now();
    lastFormAudioTimeRef.current = Date.now();
    stageUpEnteredTimeRef.current = 0; holdCountdownRef.current = 4; holdAnnouncedRef.current = false;
  }, [currentExercise]);

  // Screenshot helpers
  const captureScreenshotForVoice = useCallback((): string | null => {
    const video = videoRef.current; if (!video) return null;
    const canvas = document.createElement("canvas"); canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d"); if (!ctx) return null;
    ctx.translate(canvas.width, 0); ctx.scale(-1, 1); ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.7);
  }, []);

  const pcmToWav = useCallback((pcmData: Float32Array[], sampleRate: number): File => {
    const totalLength = pcmData.reduce((a, c) => a + c.length, 0);
    const combined = new Float32Array(totalLength); let offset = 0;
    for (const chunk of pcmData) { combined.set(chunk, offset); offset += chunk.length; }
    const blockAlign = 2; const dataSize = combined.length * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize); const view = new DataView(buffer);
    const ws = (pos: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(pos + i, str.charCodeAt(i)); };
    ws(0, "RIFF"); view.setUint32(4, 36 + dataSize, true); ws(8, "WAVE"); ws(12, "fmt ");
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true); view.setUint16(34, 16, true); ws(36, "data"); view.setUint32(40, dataSize, true);
    let pos = 44;
    for (let i = 0; i < combined.length; i++) {
      const s = Math.max(-1, Math.min(1, combined[i]));
      view.setInt16(pos, s < 0 ? s * 0x8000 : s * 0x7FFF, true); pos += 2;
    }
    return new File([buffer], "voice.wav", { type: "audio/wav" });
  }, []);

  // Voice recording
  const startVoiceRecording = useCallback(async () => {
    if (isRecording) return; stopAllTTS();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true } });
      audioStreamRef.current = stream;
      const audioCtx = new AudioContext({ sampleRate: 16000 }); audioContextRef.current = audioCtx;
      if (audioCtx.state === "suspended") await audioCtx.resume();
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(2048, 1, 1);
      const pcmChunks: Float32Array[] = []; pcmDataRef.current = pcmChunks;
      processor.onaudioprocess = (e) => { pcmChunks.push(new Float32Array(e.inputBuffer.getChannelData(0))); };
      source.connect(processor); processor.connect(audioCtx.destination);
      mediaRecorderRef.current = { processor, source, pcmChunks } as unknown as MediaRecorder;
      setIsRecording(true); setVoiceStatus("recording");
    } catch (error) { console.error("Failed to start recording:", error); }
  }, [isRecording, stopAllTTS]);

  const stopVoiceRecording = useCallback(async () => {
    if (!isRecording) return;
    setVoiceStatus("processing");
    await new Promise((r) => setTimeout(r, 200));
    try {
      const refs = mediaRecorderRef.current as unknown as { processor: ScriptProcessorNode; source: MediaStreamAudioSourceNode; pcmChunks: Float32Array[] } | null;
      const pcmData = refs?.pcmChunks || pcmDataRef.current;
      const sampleRate = audioContextRef.current?.sampleRate || 16000;
      if (refs) { refs.processor.disconnect(); refs.source.disconnect(); }
      if (audioStreamRef.current) { audioStreamRef.current.getTracks().forEach((t) => t.stop()); audioStreamRef.current = null; }
      if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
      mediaRecorderRef.current = null; pcmDataRef.current = [];
      if (pcmData.length === 0 || pcmData.reduce((a, c) => a + c.length, 0) < 8000) { setVoiceStatus("idle"); setIsRecording(false); return; }

      const audioFile = pcmToWav(pcmData, sampleRate);
      const formData = new FormData(); formData.append("file", audioFile); formData.append("instruction", "ถอดเสียงเป็นข้อความภาษาไทย");
      const sttRes = await fetch("/api/aift/audioqa", { method: "POST", body: formData });
      if (!sttRes.ok) throw new Error("STT failed");
      const sttResult = await sttRes.json();
      let transcript = "";
      if (typeof sttResult === "string") transcript = sttResult;
      else if (sttResult?.content) transcript = String(sttResult.content);
      else if (sttResult?.text) transcript = String(sttResult.text);
      if (!transcript?.trim()) { setVoiceStatus("idle"); setIsRecording(false); return; }

      const screenshot = captureScreenshotForVoice(); setVoiceStatus("thinking");
      const ex = exercises[currentExercise];
      const userContext = {
        name: userProfile?.nickname || userProfile?.displayName || "ผู้ใช้",
        weight: healthData?.weight, height: healthData?.height, age: healthData?.age,
        gender: healthData?.gender, bmi: healthData?.bmi, activityLevel: healthData?.activityLevel,
        healthGoals: healthData?.healthGoals, currentExercise: ex?.nameTh || ex?.name,
        reps: isKayaWorkout ? kayaAnalysis.reps : undefined, targetReps: ex?.reps || 10,
        nextExercises: exercises.slice(currentExercise + 1).map((e) => e.nameTh || e.name),
      };
      const llmRes = await fetch("/api/gemma/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: transcript, imageBase64: screenshot, userContext, coachId: ttsCoachId, customCoach: customCoachForLLM || undefined }),
      });
      if (!llmRes.ok) throw new Error("LLM failed");
      const llmResult = await llmRes.json();
      setVoiceStatus("speaking");
      await speakTTS(llmResult?.response || "ขอโทษครับ ผมไม่เข้าใจคำถาม", true);
      setVoiceStatus("idle");
    } catch (error) { console.error("Voice interaction error:", error); setVoiceStatus("idle"); }
    setIsRecording(false); mediaRecorderRef.current = null;
  }, [isRecording, pcmToWav, captureScreenshotForVoice, exercises, currentExercise, userProfile, healthData, isKayaWorkout, kayaAnalysis.reps, speakTTS]);

  // Speak exercise instruction
  const speakExerciseInstruction = useCallback(async (exercise: WorkoutExercise) => {
    if (!exercise || !ttsEnabledRef.current) return;
    stopAllTTS();
    const coachId = ttsCoachRef.current?.id ?? "coach-aiko";
    if (exercise.kayaExercise) {
      const localUrl = getExerciseStartAudioUrl(coachId, exercise.kayaExercise);
      if (localUrl) {
        try {
          isTtsSpeakingRef.current = true;
          return new Promise<void>((resolve) => {
            const audio = new Audio(localUrl); ttsAudioRef.current = audio; audio.playbackRate = ttsSpeedRef.current || 1.0;
            audio.onended = () => { ttsAudioRef.current = null; isTtsSpeakingRef.current = false; resolve(); };
            audio.onerror = () => { ttsAudioRef.current = null; isTtsSpeakingRef.current = false; resolve(); };
            audio.play().catch(() => { ttsAudioRef.current = null; isTtsSpeakingRef.current = false; resolve(); });
          });
        } catch { isTtsSpeakingRef.current = false; }
      }
    }
  }, [stopAllTTS]);

  // Coach introduction
  const speakCoachIntroduction = useCallback(async () => {
    if (!ttsEnabledRef.current) return;
    const exercise = exercises[0];
    if (exercise?.kayaExercise) {
      setTimeout(() => speakExerciseInstruction(exercise), 500);
    } else {
      const coachId = ttsCoachRef.current?.id ?? "coach-aiko";
      if (getGreetingAudioUrl(coachId)) playCoachAudioRef.current("greeting");
    }
  }, [exercises, speakExerciseInstruction]);
  useEffect(() => { speakCoachIntroductionRef.current = speakCoachIntroduction; }, [speakCoachIntroduction]);

  useEffect(() => {
    if (showLoader || coachIntroSpokenRef.current) return;
    coachIntroSpokenRef.current = true; lastSpokenExerciseRef.current = 0;
    const waitAndSpeak = async () => {
      let waited = 0;
      while (!ttsSettingsLoadedRef.current && waited < 3000) { await new Promise((r) => setTimeout(r, 100)); waited += 100; }
      speakCoachIntroductionRef.current();
    };
    const timeout = setTimeout(() => waitAndSpeak(), 500);
    return () => clearTimeout(timeout);
  }, [showLoader]);

  useEffect(() => {
    if (showLoader || lastSpokenExerciseRef.current === currentExercise) return;
    const exercise = exercises[currentExercise];
    if (exercise) { lastSpokenExerciseRef.current = currentExercise; const t = setTimeout(() => speakExerciseInstruction(exercise), 500); return () => clearTimeout(t); }
  }, [currentExercise, showLoader, exercises, speakExerciseInstruction]);

  // Auto-advance
  useEffect(() => {
    if (!isKayaWorkout || exerciseCompleted || showRestScreen) return;
    const kayaExType = exercises[currentExercise]?.kayaExercise as ExerciseType | undefined;
    if (kayaExType && EXERCISES[kayaExType]?.isTimeBased) return;
    const targetReps = exercises[currentExercise]?.reps || 10;
    if (targetReps > 0 && kayaAnalysis.reps >= targetReps) {
      setExerciseCompleted(true); saveCurrentExerciseResult();
      const timeout = setTimeout(() => {
        playCoachAudioRef.current("set_complete", () => {
          playCoachAudioRef.current("amazing", () => {
            if (currentExercise < exercises.length - 1) showRestPeriod();
            else finishWorkout();
          });
        });
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [isKayaWorkout, kayaAnalysis.reps, currentExercise, exercises, exerciseCompleted, showRestScreen, saveCurrentExerciseResult, kayaAnalysis, finishWorkout, showRestPeriod]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    stopAllTTS(); saveCurrentExerciseResult();
    if (currentExercise < exercises.length - 1) {
      if (isKayaWorkout) kayaAnalysis.nextExercise();
      lastSpokenExerciseRef.current = -1; setExerciseCompleted(false);
      setCurrentExercise((prev) => prev + 1);
      setTimeLeft(exercises[currentExercise + 1].duration || 0);
    } else finishWorkout();
  }, [currentExercise, exercises, isKayaWorkout, kayaAnalysis, saveCurrentExerciseResult, finishWorkout, stopAllTTS]);

  useEffect(() => { handleNextRef.current = handleNext; }, [handleNext]);

  const handlePrevious = useCallback(() => {
    if (currentExercise > 0) {
      stopAllTTS();
      if (isKayaWorkout) kayaAnalysis.previousExercise();
      lastSpokenExerciseRef.current = -1; setExerciseCompleted(false);
      setCurrentExercise((prev) => prev - 1);
      setTimeLeft(exercises[currentExercise - 1].duration || 0);
    }
  }, [currentExercise, exercises, isKayaWorkout, kayaAnalysis, stopAllTTS]);

  const handleStop = useCallback(async () => {
    stopAllTTS();
    if (pairingCode) await endSession(pairingCode);
    navigate("/dashboard");
  }, [stopAllTTS, pairingCode, navigate]);

  const toggleCamera = () => setCameraEnabled(!cameraEnabled);

  const captureScreenshot = useCallback(() => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas"); canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d"); if (!ctx) return;
      ctx.translate(canvas.width, 0); ctx.scale(-1, 1); ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.font = "bold 24px sans-serif"; ctx.fillStyle = "white"; ctx.strokeStyle = "black"; ctx.lineWidth = 3; ctx.textAlign = "left";
      const currentEx = exercises[currentExercise]; const text = `${currentEx?.nameTh || "ออกกำลังกาย"}`;
      ctx.strokeText(text, 20, 40); ctx.fillText(text, 20, 40);
      if (isKayaWorkout) { const repsText = (currentEx?.duration && !currentEx?.reps) ? `${formatTime(timeLeft)} เหลือ` : `${kayaAnalysis.reps} ครั้ง`; ctx.strokeText(repsText, 20, 70); ctx.fillText(repsText, 20, 70); }
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      if (screenshotsRef.current.length < 5) screenshotsRef.current.push(dataUrl);
      setShowScreenshotFlash(true); setTimeout(() => setShowScreenshotFlash(false), 200);
    } catch (error) { console.error("Screenshot failed:", error); }
  }, [exercises, currentExercise, isKayaWorkout, kayaAnalysis.reps, timeLeft]);

  // ─── Remote Control ───
  const lastTtsTimestampRef = useRef<number>(0);

  const playRemoteTTSAudio = useCallback(async (audioBase64: string) => {
    try {
      setVoiceStatus("speaking");
      if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current = null; }
      const audioData = atob(audioBase64);
      const arr = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) arr[i] = audioData.charCodeAt(i);
      const audioUrl = URL.createObjectURL(new Blob([arr], { type: "audio/wav" }));
      const audio = new Audio(audioUrl); ttsAudioRef.current = audio;
      audio.onended = async () => { URL.revokeObjectURL(audioUrl); ttsAudioRef.current = null; setVoiceStatus("idle"); if (pairingCode) await clearTTSState(pairingCode); };
      audio.onerror = () => setVoiceStatus("idle");
      await audio.play();
    } catch { setVoiceStatus("idle"); }
  }, [pairingCode]);

  // Use refs for handlers to avoid re-subscribing on every render
  const handleRemoteActionRef = useRef<(action: RemoteAction) => void>(() => {});
  const playRemoteTTSAudioRef = useRef<(audioBase64: string) => void>(() => {});
  const lastActionTimestampRef = useRef<number>(0);

  const handleRemoteAction = useCallback(async (action: RemoteAction) => {
    setShowActionIndicator(true);
    setTimeout(() => setShowActionIndicator(false), 1000);
    switch (action.type) {
      case "play": setIsPaused(false); break;
      case "pause": setIsPaused(true); break;
      case "next": handleNext(); break;
      case "previous": handlePrevious(); break;
      case "end": handleStop(); break;
      case "toggleSkeleton": setShowSkeleton((prev) => !prev); break;
    }
    if (pairingCode) await clearRemoteAction(pairingCode);
  }, [pairingCode, handleNext, handlePrevious, handleStop]);

  useEffect(() => { handleRemoteActionRef.current = handleRemoteAction; }, [handleRemoteAction]);
  useEffect(() => { playRemoteTTSAudioRef.current = playRemoteTTSAudio; }, [playRemoteTTSAudio]);

  // Subscribe to session – only depends on pairingCode to avoid re-subscribing
  useEffect(() => {
    if (!pairingCode) return;
    const unsubscribe = subscribeToSession(pairingCode, (updatedSession) => {
      if (updatedSession) {
        setSession(updatedSession);
        if (updatedSession.remoteAction && updatedSession.remoteAction.timestamp !== lastActionTimestampRef.current) {
          lastActionTimestampRef.current = updatedSession.remoteAction.timestamp;
          setLastAction(updatedSession.remoteAction);
          handleRemoteActionRef.current(updatedSession.remoteAction);
        }
        if (updatedSession.status === "ended") navigate("/dashboard");
        if (updatedSession.ttsState && updatedSession.ttsState.timestamp !== lastTtsTimestampRef.current && updatedSession.ttsState.audioBase64) {
          lastTtsTimestampRef.current = updatedSession.ttsState.timestamp;
          playRemoteTTSAudioRef.current(updatedSession.ttsState.audioBase64);
        }
      }
    });
    updateSessionState(pairingCode, { status: "active" });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairingCode]);

  // Sync exercise state to session – only when values actually change
  const lastSyncedExerciseRef = useRef<number>(-1);
  const lastSyncedPausedRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (!pairingCode) return;
    if (currentExercise === lastSyncedExerciseRef.current && isPaused === lastSyncedPausedRef.current) return;
    lastSyncedExerciseRef.current = currentExercise;
    lastSyncedPausedRef.current = isPaused;
    updateSessionState(pairingCode, { currentExercise, isPaused });
  }, [currentExercise, isPaused, pairingCode]);

  // Sync reps – debounced & deduped
  const lastSyncedRepsRef = useRef<number>(0);
  useEffect(() => {
    if (!isKayaWorkout || !pairingCode || kayaAnalysis.reps <= 0) return;
    if (kayaAnalysis.reps === lastSyncedRepsRef.current) return;
    lastSyncedRepsRef.current = kayaAnalysis.reps;
    updateRepsCount(pairingCode, kayaAnalysis.reps);
  }, [isKayaWorkout, pairingCode, kayaAnalysis.reps]);

  // ─── Derived values ───
  const exercise = exercises[currentExercise];
  const progress = ((currentExercise + 1) / exercises.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ─── Loading screen ───
  if (showLoader) {
    return <WorkoutLoader status={{ cameraReady, mediaPipeReady: !mediaPipeLoading, cameraError: cameraError || undefined }} onComplete={() => setShowLoader(false)} />;
  }

  // ─── Rest Period Screen ───
  if (showRestScreen) {
    const nextExercise = exercises[currentExercise + 1];
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-6">
        {pairingCode && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5">
            {session?.status === "active" || session?.status === "connected" ? (
              <><Smartphone className="w-4 h-4 text-green-400" /><span className="text-white text-xs">Connected</span><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /></>
            ) : (
              <><Wifi className="w-4 h-4 text-yellow-400" /><span className="text-white text-xs">Waiting...</span></>
            )}
          </div>
        )}
        <div className="relative w-48 h-48 mb-8">
          <svg className="w-full h-full -rotate-90">
            <circle cx="96" cy="96" r="88" stroke="white" strokeOpacity="0.2" strokeWidth="8" fill="none" />
            <circle cx="96" cy="96" r="88" stroke="url(#restGradient)" strokeWidth="8" fill="none" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 88} strokeDashoffset={2 * Math.PI * 88 * (1 - restTimeLeft / REST_DURATION)} className="transition-all duration-1000" />
            <defs><linearGradient id="restGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#22c55e" /><stop offset="100%" stopColor="#16a34a" /></linearGradient></defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-white">{restTimeLeft}</span>
            <span className="text-white/60 text-sm">วินาที</span>
          </div>
        </div>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">🎉 เยี่ยมมาก!</h2>
          <p className="text-white/70">พักสักครู่แล้วไปท่าต่อไปกัน</p>
        </div>
        {nextExercise && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 w-full max-w-sm">
            <p className="text-white/60 text-sm mb-2">ท่าถัดไป</p>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center text-3xl">{nextExercise.icon || "🏃"}</div>
              <div>
                <h3 className="text-xl font-bold text-white">{nextExercise.nameTh || nextExercise.name}</h3>
                <p className="text-white/60">{nextExercise.reps ? `${nextExercise.reps} ครั้ง` : nextExercise.duration ? `${nextExercise.duration} วิ` : ""}</p>
              </div>
            </div>
          </div>
        )}
        <div className="flex gap-4">
          <button onClick={skipRest} className="px-8 py-4 bg-primary rounded-xl text-white font-semibold text-lg hover:bg-primary/90 transition-colors">ข้ามพัก →</button>
          <button onClick={finishWorkout} className="px-8 py-4 bg-white/10 backdrop-blur-sm rounded-xl text-white font-medium hover:bg-white/20 transition-colors">จบการออกกำลังกาย</button>
        </div>
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex justify-between text-white/60 text-sm mb-2"><span>ความคืบหน้า</span><span>{currentExercise + 1} / {exercises.length}</span></div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${((currentExercise + 1) / exercises.length) * 100}%` }} /></div>
        </div>
      </div>
    );
  }

  // ─── Main Desktop View ───
  return (
    <div ref={containerRef} className="fixed inset-0 bg-black overflow-hidden">
      {showScreenshotFlash && <div className="absolute inset-0 bg-white z-50 animate-flash" />}

      {/* Camera View */}
      <div className="absolute inset-0">
        {!cameraEnabled ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-4"><CameraOff className="w-12 h-12 text-white/50" /></div>
            <p className="text-white/70 text-xl">กล้องปิดอยู่</p>
            <button onClick={toggleCamera} className="mt-4 px-6 py-3 bg-primary rounded-xl text-white font-medium hover:bg-primary/90 transition-colors">เปิดกล้อง</button>
          </div>
        ) : cameraError ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mb-4"><CameraOff className="w-12 h-12 text-red-400" /></div>
            <p className="text-white/70 text-xl">{cameraError}</p>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted onCanPlay={() => setCameraReady(true)} className="w-full h-full object-cover scale-x-[-1]" style={{ backgroundColor: "#000" }} />
            {autoplayBlocked && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button onClick={async () => { try { await videoRef.current?.play(); setAutoplayBlocked(false); setCameraError(""); } catch { setCameraError("ไม่สามารถเริ่มวิดีโอได้ กรุณาแตะหน้าจออีกครั้ง"); } }} className="px-6 py-3 bg-primary text-white rounded-xl shadow-lg">เปิดกล้อง (แตะเพื่อเริ่ม)</button>
              </div>
            )}
            {cameraEnabled && (showSkeleton || showOpticalFlow) && (
              <SkeletonOverlay landmarks={landmarks} opticalFlowPoints={opticalFlowPoints} getFlowHistory={getFlowHistory} showSkeleton={showSkeleton} showOpticalFlow={showOpticalFlow} width={videoDimensions.width} height={videoDimensions.height} mirrored={true} />
            )}
            {isKayaWorkout && cameraEnabled && showVisualGuide && currentKayaExercise && (
              <VisualPoseGuide exerciseType={currentKayaExercise} landmarks={landmarks} currentStage={kayaAnalysis.stage} targetStage={kayaAnalysis.targetStage} corrections={kayaAnalysis.corrections} formScore={kayaAnalysis.formScore} width={videoDimensions.width} height={videoDimensions.height} mirrored={true} />
            )}
          </>
        )}
      </div>

      {/* KAYA AI Coach Popup */}
      {isKayaWorkout && <AICoachPopup currentMessage={kayaAnalysis.coachMessage} coachId={ttsCoachId} speaker={ttsCoach?.voiceId || ttsSpeaker} ttsEnabled={ttsEnabled} ttsSpeed={ttsSpeed} />}

      {/* KAYA Stage Indicator */}
      {isKayaWorkout && currentKayaExercise && (
        <div className="absolute top-24 left-6 z-20">
          <StageIndicator exerciseType={currentKayaExercise} currentStage={kayaAnalysis.stage} targetStage={kayaAnalysis.targetStage} formScore={kayaAnalysis.formScore} reps={kayaAnalysis.reps} />
        </div>
      )}

      {/* KAYA Form Score Badge */}
      {isKayaWorkout && kayaAnalysis.isBodyVisible && (
        <div className="absolute top-24 right-6 z-20">
          <div className={cn("px-4 py-3 rounded-2xl backdrop-blur-md border text-center min-w-[100px]",
            kayaAnalysis.formScore >= 80 ? "bg-green-500/20 border-green-500/30" : kayaAnalysis.formScore >= 50 ? "bg-yellow-500/20 border-yellow-500/30" : "bg-red-500/20 border-red-500/30")}>
            <p className="text-white/60 text-xs mb-0.5">ฟอร์ม</p>
            <p className={cn("text-3xl font-black", kayaAnalysis.formScore >= 80 ? "text-green-400" : kayaAnalysis.formScore >= 50 ? "text-yellow-400" : "text-red-400")}>{kayaAnalysis.formScore}%</p>
          </div>
        </div>
      )}

      {/* KAYA Beat Counter */}
      {isKayaWorkout && kayaAnalysis.tempoAnalysis && (
        <div className="absolute top-40 right-6 z-20">
          <BeatCounter beatCount={kayaAnalysis.tempoAnalysis.beatCount} tempoQuality={kayaAnalysis.tempoAnalysis.tempoQuality} />
        </div>
      )}

      {/* Rep Counter Animation */}
      {showRepCounter && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div className="animate-rep-popup">
            <span className="text-[150px] font-black text-primary drop-shadow-2xl" style={{ textShadow: "0 0 60px rgba(221, 110, 83, 0.8), 0 0 120px rgba(221, 110, 83, 0.4)" }}>{displayRep}</span>
          </div>
        </div>
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
        <button onClick={handleStop} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"><X className="w-5 h-5" /></button>

        {selectedStyle && (
          <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border text-xs", `bg-gradient-to-r ${selectedStyle.bgGradient} border-white/20`)}>
            {styleIcons[selectedStyle.id] || <Dumbbell className="w-3 h-3" />}
            <span className="font-medium text-white">{selectedStyle.name}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {pairingCode && (
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5">
              {session?.status === "active" || session?.status === "connected" ? (
                <><Smartphone className="w-4 h-4 text-green-400" /><span className="text-white text-xs">Connected</span><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /></>
              ) : (
                <><Wifi className="w-4 h-4 text-yellow-400" /><span className="text-white text-xs">Waiting...</span></>
              )}
            </div>
          )}
          {pairingCode && <div className="bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5"><span className="text-white font-mono text-xs tracking-widest">{pairingCode}</span></div>}
          <div className="text-white text-lg font-mono bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">{formatTime(totalTime)}</div>
          {isKayaWorkout && (
            <button onClick={() => setShowSkeleton(!showSkeleton)} className={cn("w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors", showSkeleton ? "bg-green-500 text-white" : "bg-black/30 text-white/70 hover:bg-black/50")}>
              {showSkeleton ? <Bone className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          )}
          {isKayaWorkout && (
            <button onClick={() => setShowVisualGuide(!showVisualGuide)} className={cn("w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors", showVisualGuide ? "bg-primary text-white" : "bg-black/30 text-white/70 hover:bg-black/50")}>
              <Target className="w-4 h-4" />
            </button>
          )}
          <button onClick={captureScreenshot} className="w-10 h-10 rounded-full bg-black/30 text-white/70 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center transition-colors"><Camera className="w-4 h-4" /></button>
          <button onClick={toggleCamera} className={cn("w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors", cameraEnabled ? "bg-black/30 text-white/70 hover:bg-black/50" : "bg-red-500/30 text-red-400")}>
            {cameraEnabled ? <Eye className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
          </button>
          <button onClick={() => { const next = !ttsEnabled; setTtsEnabled(next); ttsEnabledRef.current = next; if (!next) stopAllTTS(); }} className={cn("w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors", ttsEnabled ? "bg-black/30 text-white/70 hover:bg-black/50" : "bg-red-500/30 text-red-400")}>
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Voice Status */}
      {voiceStatus !== "idle" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <div className={cn("px-4 py-2 rounded-full backdrop-blur-md text-sm font-medium inline-flex items-center gap-2",
            voiceStatus === "recording" && "bg-red-500/80 text-white",
            voiceStatus === "processing" && "bg-yellow-500/80 text-white",
            voiceStatus === "thinking" && "bg-blue-500/80 text-white",
            voiceStatus === "speaking" && "bg-green-500/80 text-white"
          )}>
            {voiceStatus === "recording" && <><span className="w-2 h-2 bg-white rounded-full animate-pulse" />กำลังฟัง...</>}
            {voiceStatus === "processing" && <><Loader2 className="w-4 h-4 animate-spin" />น้องกายกำลังวิเคราะห์ตัวคุณอยู่...</>}
            {voiceStatus === "thinking" && <><Loader2 className="w-4 h-4 animate-spin" />น้องกายกำลังคิด...</>}
            {voiceStatus === "speaking" && <><Volume2 className="w-4 h-4" />น้องกายกำลังพูด...</>}
          </div>
        </div>
      )}

      {/* Remote Action Indicator */}
      {showActionIndicator && lastAction && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="bg-white/20 backdrop-blur-md rounded-3xl p-8 animate-pulse">
            {lastAction.type === "play" && <Play className="w-24 h-24 text-white" />}
            {lastAction.type === "pause" && <Pause className="w-24 h-24 text-white" />}
            {lastAction.type === "next" && <SkipForward className="w-24 h-24 text-white" />}
            {lastAction.type === "previous" && <SkipBack className="w-24 h-24 text-white" />}
          </div>
        </div>
      )}

      {/* Bottom Exercise Display */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
        <div className="mb-4">
          <div className="flex justify-between text-white/60 text-xs mb-1"><span>{currentExercise + 1} / {exercises.length}</span><span>{Math.round(progress)}%</span></div>
          <div className="h-1 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} /></div>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-16 h-16 rounded-xl bg-primary/20 backdrop-blur-sm flex items-center justify-center border border-primary/30"><Activity className="w-8 h-8 text-primary" /></div>
              <div>
                <h2 className="text-xl font-bold text-white">{exercise?.nameTh || exercise?.name}</h2>
                {isKayaWorkout ? (
                  <div className="flex items-center gap-2 mt-1">
                    {exercise?.duration && !exercise?.reps ? (
                      <><span className="text-2xl font-bold text-primary">{formatTime(timeLeft)}</span><span className="text-white/60 text-sm">เหลือ</span></>
                    ) : (
                      <><span className="text-2xl font-bold text-primary">{Math.min(kayaAnalysis.reps, exercise?.reps || 10)}</span><span className="text-white/60 text-sm">/ {exercise?.reps || 10} ครั้ง</span></>
                    )}
                  </div>
                ) : (
                  <p className="text-white/60 text-sm">{exercise?.duration ? `${formatTime(timeLeft)} เหลือ` : `${exercise?.reps} ครั้ง`}</p>
                )}
              </div>
            </div>
            {isKayaWorkout && kayaAnalysis.isBodyVisible && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-white/50 text-xs">ฟอร์ม</span>
                <div className="w-24 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-500", kayaAnalysis.formScore >= 80 ? "bg-green-500" : kayaAnalysis.formScore >= 50 ? "bg-yellow-500" : "bg-red-500")} style={{ width: `${kayaAnalysis.formScore}%` }} />
                </div>
                <span className={cn("text-xs font-bold", kayaAnalysis.formScore >= 80 ? "text-green-400" : kayaAnalysis.formScore >= 50 ? "text-yellow-400" : "text-red-400")}>{kayaAnalysis.formScore}%</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onMouseDown={startVoiceRecording} onMouseUp={stopVoiceRecording} disabled={voiceStatus === "processing" || voiceStatus === "thinking" || voiceStatus === "speaking"}
              className={cn("w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center transition-all",
                isRecording ? "bg-red-500 animate-pulse scale-110" : voiceStatus === "processing" || voiceStatus === "thinking" ? "bg-yellow-500" : voiceStatus === "speaking" ? "bg-green-500" : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600",
                (voiceStatus === "processing" || voiceStatus === "thinking" || voiceStatus === "speaking") && "opacity-70")}>
              {voiceStatus === "processing" || voiceStatus === "thinking" ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : voiceStatus === "speaking" ? <Volume2 className="w-5 h-5 text-white" /> : isRecording ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
            </button>
            <button onClick={handlePrevious} disabled={currentExercise === 0} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white disabled:opacity-30 hover:bg-white/20 transition-colors"><SkipBack className="w-5 h-5" /></button>
            <button onClick={() => { if (!isPaused) stopAllTTS(); setIsPaused(!isPaused); }} className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary/90 transition-colors">
              {isPaused ? <Play className="w-6 h-6 ml-1" /> : <Pause className="w-6 h-6" />}
            </button>
            <button onClick={handleNext} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"><SkipForward className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      {/* Music Player */}
      {pairingCode && <BigScreenMusicPlayer pairingCode={pairingCode} musicState={session?.musicState} />}

      {isPaused && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10">
          <span className="text-lg text-yellow-400 font-semibold animate-pulse">PAUSED</span>
        </div>
      )}

      <style>{`
        @keyframes rep-popup { 0% { transform: scale(0.5); opacity: 0; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); opacity: 0; } }
        .animate-rep-popup { animation: rep-popup 0.8s ease-out forwards; }
        @keyframes flash { 0% { opacity: 0.9; } 100% { opacity: 0; } }
        .animate-flash { animation: flash 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
}