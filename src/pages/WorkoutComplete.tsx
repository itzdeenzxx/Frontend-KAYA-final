// Workout Complete Summary Page
// Shows workout results, calories burned, form score, and shareable card

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Trophy,
  Flame,
  Clock,
  Target,
  Activity,
  Share2,
  Download,
  Home,
  ChevronRight,
  Star,
  Sparkles,
  Heart,
  Camera,
  Twitter,
  Facebook,
  Link,
  Check,
  Zap,
} from 'lucide-react';
import type { WorkoutResults } from '@/types/workout';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { addWorkoutToDailyStats, incrementChallengeProgress, updateUserPoints, updateUserStreak, saveWorkoutSession } from '@/lib/firestore';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import liff from '@line/liff';

// Calculate calories based on workout intensity and duration
function calculateCalories(
  totalTime: number, // seconds
  totalReps: number,
  averageFormScore: number
): number {
  // Base calories per minute for light exercise
  const baseCaloriesPerMinute = 5;
  const minutes = totalTime / 60;
  
  // Intensity multiplier based on reps
  const intensityMultiplier = Math.min(1 + (totalReps / 50), 2);
  
  // Form quality bonus (better form = more effective calories)
  const formBonus = 0.8 + (averageFormScore / 500);
  
  return Math.round(baseCaloriesPerMinute * minutes * intensityMultiplier * formBonus);
}

// Achievement badges based on performance
interface Achievement {
  id: string;
  name: string;
  nameTh: string;
  icon: React.ReactNode;
  color: string;
  condition: (results: WorkoutResults) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'perfect_form',
    name: 'Perfect Form',
    nameTh: 'ฟอร์มเพอร์เฟค',
    icon: <Star className="w-6 h-6" />,
    color: 'from-yellow-400 to-orange-500',
    condition: (r) => r.averageFormScore >= 90,
  },
  {
    id: 'workout_complete',
    name: 'Workout Complete',
    nameTh: 'ออกกำลังครบ',
    icon: <Trophy className="w-6 h-6" />,
    color: 'from-purple-400 to-pink-500',
    condition: (r) => r.completionPercentage >= 100,
  },
  {
    id: 'calorie_burner',
    name: 'Calorie Burner',
    nameTh: 'เผาผลาญสุด',
    icon: <Flame className="w-6 h-6" />,
    color: 'from-red-400 to-orange-500',
    condition: (r) => r.caloriesBurned >= 50,
  },
  {
    id: 'rep_master',
    name: 'Rep Master',
    nameTh: 'ทำครบทุกครั้ง',
    icon: <Target className="w-6 h-6" />,
    color: 'from-green-400 to-emerald-500',
    condition: (r) => r.exercises.every(e => e.reps >= e.targetReps),
  },
  {
    id: 'endurance',
    name: 'Endurance Star',
    nameTh: 'อดทนเยี่ยม',
    icon: <Clock className="w-6 h-6" />,
    color: 'from-blue-400 to-cyan-500',
    condition: (r) => r.totalTime >= 300, // 5 minutes
  },
  {
    id: 'first_timer',
    name: 'First Step',
    nameTh: 'ก้าวแรก',
    icon: <Heart className="w-6 h-6" />,
    color: 'from-pink-400 to-rose-500',
    condition: () => true, // Everyone gets this!
  },
];

export default function WorkoutComplete() {
  const navigate = useNavigate();
  const location = useLocation();
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLineSharing, setIsLineSharing] = useState(false);
  const { lineProfile, refreshUser } = useAuth();

  // Get workout results from location state or use mock data
  const results: WorkoutResults = location.state?.results || {
    styleName: 'KAYA Stretch',
    styleNameTh: 'ยืดเหยียด KAYA',
    exercises: [
      { name: 'Arm Raise', nameTh: 'ยกแขนขึ้น-ลง', reps: 10, targetReps: 10, formScore: 85, duration: 60 },
      { name: 'Torso Twist', nameTh: 'บิดลำตัว', reps: 8, targetReps: 10, formScore: 78, duration: 50 },
      { name: 'Knee Raise', nameTh: 'ยกเข่าสลับ', reps: 10, targetReps: 10, formScore: 92, duration: 55 },
    ],
    totalTime: 165,
    totalReps: 28,
    averageFormScore: 85,
    caloriesBurned: 0,
    completionPercentage: 93,
    screenshots: [],
  };

  // Calculate calories if not provided
  if (!results.caloriesBurned) {
    results.caloriesBurned = calculateCalories(
      results.totalTime,
      results.totalReps,
      results.averageFormScore
    );
  }

  // Save workout data to Firebase
  useEffect(() => {
    const saveWorkoutData = async () => {
      if (!lineProfile?.userId || isSaved) return;
      
      try {
        // Save to daily stats (calories, workout time, total workouts)
        await addWorkoutToDailyStats(
          lineProfile.userId,
          results.caloriesBurned,
          results.totalTime
        );

        // Save detailed workout history
        await saveWorkoutSession({
          userId: lineProfile.userId,
          styleName: results.styleName,
          styleNameTh: results.styleNameTh,
          totalTime: results.totalTime,
          totalReps: results.totalReps,
          caloriesBurned: results.caloriesBurned,
          completionPercentage: results.completionPercentage,
          averageFormScore: results.averageFormScore,
          exercises: results.exercises.map(exercise => ({
            name: exercise.name,
            nameTh: exercise.nameTh,
            reps: exercise.reps,
            targetReps: exercise.targetReps,
            formScore: exercise.formScore,
            duration: exercise.duration,
          })),
        });
        
        // Update challenges
        // 1. Increment workout challenge
        await incrementChallengeProgress(lineProfile.userId, 'workout', 1);
        
        // 2. Increment calories challenge
        await incrementChallengeProgress(lineProfile.userId, 'calories', results.caloriesBurned);
        
        // 3. Add points based on total reps completed (1 point per rep)
        if (results.totalReps > 0) {
          await updateUserPoints(lineProfile.userId, results.totalReps);
        }
        
        // 4. Update streak (tracks consecutive days of activity)
        await updateUserStreak(lineProfile.userId);
        
        // 5. Refresh user profile in global state so Dashboard shows updated streak/points
        await refreshUser();
        
        setIsSaved(true);
        console.log('Workout data saved to Firebase successfully!', {
          calories: results.caloriesBurned,
          time: results.totalTime,
          reps: results.totalReps,
          pointsEarned: results.totalReps,
          exercises: results.exercises.length
        });
      } catch (error) {
        console.error('Error saving workout data:', error);
      }
    };
    
    saveWorkoutData();
  }, [lineProfile?.userId, results.caloriesBurned, results.totalTime, results.totalReps, isSaved, refreshUser]);

  // Get earned achievements
  const earnedAchievements = ACHIEVEMENTS.filter(a => a.condition(results));

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get form quality color
  const getFormColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Get form quality text
  const getFormText = (score: number) => {
    if (score >= 90) return 'เยี่ยมมาก!';
    if (score >= 80) return 'ดีมาก';
    if (score >= 70) return 'ดี';
    if (score >= 60) return 'พอใช้';
    return 'ต้องปรับปรุง';
  };

  // Capture share card as image
  const captureShareCard = async (): Promise<string | null> => {
    if (!shareCardRef.current) return null;
    
    setIsCapturing(true);
    try {
      // Dynamic import html2canvas to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#1a1a2e',
        scale: 2,
        useCORS: true,
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error capturing share card:', error);
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  // Download share card
  const handleDownload = async () => {
    const dataUrl = await captureShareCard();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `kaya-workout-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  // Share to LINE via shareTargetPicker with stats image
  const handleShareLine = async () => {
    setShowShareMenu(false);
    setIsLineSharing(true);

    try {
      // 1. Capture the share card as image
      const dataUrl = await captureShareCard();
      if (!dataUrl) throw new Error('Failed to capture share card');

      // 2. Upload to Firebase Storage to get a public URL
      const blob = await (await fetch(dataUrl)).blob();
      const userId = lineProfile?.userId || 'anonymous';
      const fileName = `workout-${Date.now()}.png`;
      const storageRef = ref(storage, `workout-shares/${userId}/${fileName}`);
      await uploadBytes(storageRef, blob, { contentType: 'image/png' });
      const imageUrl = await getDownloadURL(storageRef);

      // 3. Check if shareTargetPicker is available
      if (!liff.isApiAvailable('shareTargetPicker')) {
        // Fallback: open LINE share URL
        const shareText = `🎯 เพิ่งออกกำลังกายกับ KAYA เสร็จ!\n💪 ${results.totalReps} ครั้ง\n🔥 ${results.caloriesBurned} แคลอรี่\n⭐ ฟอร์ม ${results.averageFormScore}%`;
        window.open(
          `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(shareText)}`,
          '_blank'
        );
        return;
      }

      // 4. Build Flex Message with image
      const appUrl = "https://miniapp.line.me/2008680520-UNJtwcRg";
      const profileName = lineProfile?.displayName || 'KAYA User';

      const flexMessage: any = {
        type: 'flex',
        altText: `🎯 ${profileName} เพิ่งออกกำลังกายกับ KAYA! 💪 ${results.totalReps} ครั้ง 🔥 ${results.caloriesBurned} แคลอรี่`,
        contents: {
          type: 'bubble',
          size: 'mega',
          hero: {
            type: 'image',
            url: imageUrl,
            size: 'full',
            aspectRatio: '1:1',
            aspectMode: 'cover',
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: `${profileName} ออกกำลังกายเสร็จแล้ว! 🎉`,
                weight: 'bold',
                size: 'lg',
                color: '#ffffff',
                wrap: true,
              },
              {
                type: 'text',
                text: results.styleNameTh,
                size: 'sm',
                color: '#aaaaaa',
                margin: 'sm',
              },
              {
                type: 'separator',
                margin: 'lg',
                color: '#333333',
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                      { type: 'text', text: String(results.totalReps), size: 'xl', weight: 'bold', color: '#dd6e53', align: 'center' },
                      { type: 'text', text: 'ครั้ง', size: 'xxs', color: '#888888', align: 'center' },
                    ],
                    flex: 1,
                  },
                  { type: 'separator', color: '#444444' },
                  {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                      { type: 'text', text: `🔥 ${results.caloriesBurned}`, size: 'xl', weight: 'bold', color: '#ff8c00', align: 'center' },
                      { type: 'text', text: 'แคลอรี่', size: 'xxs', color: '#888888', align: 'center' },
                    ],
                    flex: 1,
                  },
                  { type: 'separator', color: '#444444' },
                  {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                      { type: 'text', text: `${results.averageFormScore}%`, size: 'xl', weight: 'bold', color: '#4CAF50', align: 'center' },
                      { type: 'text', text: 'ฟอร์ม', size: 'xxs', color: '#888888', align: 'center' },
                    ],
                    flex: 1,
                  },
                ],
                margin: 'lg',
                paddingTop: 'md',
                paddingBottom: 'md',
              },
              {
                type: 'text',
                text: '💪 มาออกกำลังกายด้วยกัน!',
                size: 'md',
                color: '#ffffff',
                align: 'center',
                margin: 'lg',
                weight: 'bold',
              },
            ],
            backgroundColor: '#1a1a2e',
            paddingAll: '20px',
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'button',
                action: { type: 'uri', label: 'เข้าใช้งาน KAYA', uri: appUrl },
                style: 'primary',
                color: '#dd6e53',
                height: 'sm',
              },
            ],
            backgroundColor: '#1a1a2e',
            paddingAll: '15px',
            paddingTop: '0px',
          },
        },
      };

      await liff.shareTargetPicker([flexMessage]);
    } catch (error) {
      console.error('LINE share failed:', error);
      // Fallback to URL-based share
      const shareText = `🎯 เพิ่งออกกำลังกายกับ KAYA เสร็จ!\n💪 ${results.totalReps} ครั้ง\n🔥 ${results.caloriesBurned} แคลอรี่`;
      window.open(
        `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(shareText)}`,
        '_blank'
      );
    } finally {
      setIsLineSharing(false);
    }
  };

  // Share functions
  const handleShare = async (platform: string) => {
    const shareText = `🎯 เพิ่งออกกำลังกายกับ KAYA เสร็จ!\n💪 ${results.totalReps} ครั้ง\n🔥 ${results.caloriesBurned} แคลอรี่\n⭐ ฟอร์ม ${results.averageFormScore}%\n\n#KAYAFitness #ออกกำลังกาย`;
    const shareUrl = window.location.origin;

    switch (platform) {
      case 'native':
        if (navigator.share) {
          const dataUrl = await captureShareCard();
          const blob = dataUrl ? await (await fetch(dataUrl)).blob() : null;
          const file = blob ? new File([blob], 'kaya-workout.png', { type: 'image/png' }) : null;
          
          try {
            await navigator.share({
              title: 'KAYA Workout Complete!',
              text: shareText,
              url: shareUrl,
              ...(file && navigator.canShare?.({ files: [file] }) ? { files: [file] } : {}),
            });
          } catch (error) {
            console.log('Share cancelled');
          }
        }
        break;
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
          '_blank'
        );
        break;
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
          '_blank'
        );
        break;
      case 'copy':
        await navigator.clipboard.writeText(shareText + '\n' + shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
    }
    setShowShareMenu(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Confetti animation */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="confetti absolute animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#9B59B6', '#3498DB'][i % 5],
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-orange-500 mb-4 shadow-lg">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">🎉 ยินดีด้วย!</h1>
          <p className="text-muted-foreground">คุณออกกำลังกายเสร็จเรียบร้อยแล้ว</p>
        </div>

        {/* Share Card (Capture Area) */}
        <div
          ref={shareCardRef}
          className="max-w-md mx-auto mb-8 p-6 rounded-3xl shadow-2xl"
          style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}
        >
          {/* Card Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg" style={{ color: '#ffffff' }}>KAYA Fitness</h2>
              <p className="text-sm" style={{ color: '#aaaaaa' }}>{results.styleNameTh}</p>
            </div>
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 rounded-2xl" style={{ backgroundColor: '#2a2a4a' }}>
              <div className="text-3xl font-bold" style={{ color: '#ff6b6b' }}>{results.totalReps}</div>
              <div className="text-xs" style={{ color: '#aaaaaa' }}>ครั้ง</div>
            </div>
            <div className="text-center p-3 rounded-2xl" style={{ backgroundColor: '#2a2a4a' }}>
              <div className="flex items-center justify-center gap-1">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-3xl font-bold text-orange-500">{results.caloriesBurned}</span>
              </div>
              <div className="text-xs" style={{ color: '#aaaaaa' }}>แคลอรี่</div>
            </div>
            <div className="text-center p-3 rounded-2xl" style={{ backgroundColor: '#2a2a4a' }}>
              <div className="text-3xl font-bold" style={{ color: '#4ecdc4' }}>{formatTime(results.totalTime)}</div>
              <div className="text-xs" style={{ color: '#aaaaaa' }}>เวลา</div>
            </div>
          </div>

          {/* Completion & Form Score */}
          <div className="space-y-4 mb-6">
            {/* Completion */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: '#cccccc' }}>ความสำเร็จ</span>
                <span className="font-bold text-primary">{results.completionPercentage}%</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: '#333355' }}>
                <div
                  className="h-full bg-gradient-to-r from-primary to-orange-500 rounded-full transition-all duration-1000"
                  style={{ width: `${results.completionPercentage}%` }}
                />
              </div>
            </div>

            {/* Form Score */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: '#cccccc' }}>คะแนนฟอร์ม</span>
                <span className={cn("font-bold", getFormColor(results.averageFormScore))}>
                  {results.averageFormScore}% - {getFormText(results.averageFormScore)}
                </span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: '#333355' }}>
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    results.averageFormScore >= 80 ? "bg-green-500" :
                    results.averageFormScore >= 60 ? "bg-yellow-500" : "bg-red-500"
                  )}
                  style={{ width: `${results.averageFormScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Achievements */}
          {earnedAchievements.length > 0 && (
            <div className="mb-4">
              <p className="text-sm mb-3" style={{ color: '#cccccc' }}>🏆 รางวัลที่ได้รับ</p>
              <div className="flex flex-wrap gap-2">
                {earnedAchievements.slice(0, 4).map((achievement) => (
                  <div
                    key={achievement.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-full text-sm text-white",
                      `bg-gradient-to-r ${achievement.color}`
                    )}
                  >
                    {achievement.icon}
                    <span className="font-medium">{achievement.nameTh}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Branding */}
          <div className="text-center pt-4" style={{ borderTop: '1px solid #333355' }}>
            <p className="text-xs" style={{ color: '#888888' }}>
              Powered by <span className="font-bold" style={{ color: '#ff6b6b' }}>KAYA</span> AI Fitness
            </p>
          </div>
        </div>

        {/* Exercise Details */}
        <div className="max-w-md mx-auto mb-8">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
            <Activity className="w-5 h-5 text-primary" />
            รายละเอียดท่าออกกำลังกาย
          </h3>
          <div className="space-y-3">
            {results.exercises.map((exercise, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">{idx + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-black">{exercise.nameTh}</p>
                    <p className="text-sm text-muted-foreground">
                      {exercise.reps}/{exercise.targetReps} ครั้ง
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn("font-bold", getFormColor(exercise.formScore))}>
                    {exercise.formScore}%
                  </div>  
                  <div className="text-xs text-muted-foreground">ฟอร์ม</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workout Screenshots */}
        {results.screenshots && results.screenshots.length > 0 && (
          <div className="max-w-md mx-auto mb-8">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              รูปภาพระหว่างออกกำลังกาย
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {results.screenshots.map((screenshot, idx) => (
                <div
                  key={idx}
                  className="relative aspect-video rounded-xl overflow-hidden bg-muted border border-border/50 cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => {
                    // Open in new window for full view
                    const win = window.open();
                    if (win) {
                      win.document.write(`<img src="${screenshot}" style="max-width:100%;height:auto;"/>`);
                    }
                  }}
                >
                  <img
                    src={screenshot}
                    alt={`Workout moment ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 right-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                    <span className="text-xs text-white">📸 {idx + 1}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              กดที่รูปเพื่อดูขนาดเต็ม
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="max-w-md mx-auto space-y-3">
          {/* Share Button */}
          <div className="relative">
            <Button
              className="w-full h-14 text-lg bg-gradient-to-r from-primary to-orange-500 hover:opacity-90 rounded-2xl"
              onClick={() => setShowShareMenu(!showShareMenu)}
            >
              <Share2 className="w-5 h-5 mr-2" />
              แชร์ผลงาน
            </Button>

            {/* Share Menu */}
            {showShareMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 p-4 rounded-2xl bg-card border border-border shadow-xl animate-slide-up">
                <p className="text-sm text-muted-foreground mb-3 text-center">แชร์ไปยัง</p>
                <div className="grid grid-cols-5 gap-2">
                  {navigator.share && (
                    <button
                      onClick={() => handleShare('native')}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-muted transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <Share2 className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs">แชร์</span>
                    </button>
                  )}
                  <button
                    onClick={handleShareLine}
                    disabled={isLineSharing}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#00B900] flex items-center justify-center">
                      {isLineSharing ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="text-white font-bold text-sm">LINE</span>
                      )}
                    </div>
                    <span className="text-xs">{isLineSharing ? 'กำลังส่ง...' : 'LINE'}</span>
                  </button>
                  <button
                    onClick={() => handleShare('facebook')}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center">
                      <Facebook className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs">Facebook</span>
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                      <Twitter className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs">X</span>
                  </button>
                  <button
                    onClick={() => handleShare('copy')}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      {copied ? <Check className="w-5 h-5 text-green-500" /> : <Link className="w-5 h-5" />}
                    </div>
                    <span className="text-xs">{copied ? 'คัดลอกแล้ว!' : 'คัดลอก'}</span>
                  </button>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={handleDownload}
                    disabled={isCapturing}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isCapturing ? 'กำลังสร้างรูป...' : 'บันทึกรูปภาพ'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Home Button */}
          <Button
            variant="outline"
            className="w-full h-14 text-lg rounded-2xl"
            onClick={() => navigate('/dashboard')}
          >
            <Home className="w-5 h-5 mr-2" />
            กลับหน้าหลัก
          </Button>

          {/* Workout Again Button */}
          <Button
            variant="ghost"
            className="w-full h-12 rounded-2xl text-primary hover:text-primary"
            onClick={() => navigate('/workout-selection')}
          >
            <Zap className="w-5 h-5 mr-2" />
            ออกกำลังกายอีกครั้ง
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        .confetti {
          width: 10px;
          height: 10px;
          animation: confetti 3s ease-in-out infinite;
        }
        
        .animate-confetti {
          animation: confetti 3s ease-in-out infinite;
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-slide-up {
          animation: slide-up 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
