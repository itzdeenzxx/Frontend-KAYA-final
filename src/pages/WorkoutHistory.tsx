import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Activity, Calendar, Clock, Flame, Target, TrendingUp, Trophy, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useWorkoutHistory } from '@/hooks/useFirestore';
import { createSampleWorkoutHistory } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

// Helper function to format workout time
const formatWorkoutTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Helper function to format date
const formatDate = (dateString: string | Date | any): string => {
  let date: Date;
  
  // Handle Firestore Timestamp
  if (dateString && typeof dateString === 'object' && dateString.toDate) {
    date = dateString.toDate();
  } 
  // Handle Firestore seconds/nanoseconds format
  else if (dateString && typeof dateString === 'object' && dateString.seconds) {
    date = new Date(dateString.seconds * 1000);
  }
  // Handle regular Date or date string
  else {
    date = new Date(dateString);
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'ไม่สามารถแสดงวันที่ได้';
  }
  
  // Format: DD/MM/YYYY HH:MM น.
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes} น.`;
};

// Helper function to get form quality color
const getFormColor = (score: number) => {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-red-500';
};

const WorkoutHistory = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { lineProfile } = useAuth();
  const { workouts, stats, refreshWorkouts, isLoading, error } = useWorkoutHistory();
  const isDark = theme === 'dark';
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreatingSample, setIsCreatingSample] = useState(false);

  // Initialize workouts on mount
  useEffect(() => {
    const initWorkouts = async () => {
      setIsRefreshing(true);
      await refreshWorkouts(50); // Load more workouts for history page
      setIsRefreshing(false);
    };
    initWorkouts();
  }, [refreshWorkouts]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshWorkouts(50);
    setIsRefreshing(false);
  };

  const handleCreateSampleData = async () => {
    if (!lineProfile?.userId || isCreatingSample) return;
    
    setIsCreatingSample(true);
    try {
      await createSampleWorkoutHistory(lineProfile.userId);
      await refreshWorkouts(50);
    } catch (error) {
      console.error('Error creating sample data:', error);
    } finally {
      setIsCreatingSample(false);
    }
  };

  return (
    <div className={cn(
      "min-h-screen pb-20",
      isDark ? "bg-gray-900" : "bg-gray-50"
    )}>
      {/* Header */}
      <div className={cn(
        "sticky top-0 z-50 backdrop-blur-lg border-b",
        isDark 
          ? "bg-gray-900/80 border-gray-800" 
          : "bg-white/80 border-gray-200"
      )}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  isDark 
                    ? "hover:bg-gray-800 text-gray-300" 
                    : "hover:bg-gray-100 text-gray-600"
                )}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              
              <div>
                <h1 className={cn(
                  "text-2xl font-bold",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  📊 ประวัติการออกกำลังกาย
                </h1>
                <p className={cn(
                  "text-sm",
                  isDark ? "text-gray-400" : "text-gray-600"
                )}>
                  ดูความก้าวหน้าและผลลัพธ์ของคุณ
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {/* Development Only: Sample Data Button */}
              {process.env.NODE_ENV === 'development' && workouts.length === 0 && (
                <Button
                  onClick={handleCreateSampleData}
                  disabled={isCreatingSample}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "text-xs",
                    isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
                  )}
                >
                  {isCreatingSample ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      สร้าง Sample...
                    </>
                  ) : (
                    'สร้าง Sample Data'
                  )}
                </Button>
              )}

              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="ghost"
                size="sm"
                className={cn(
                  "p-2",
                  isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
                )}
              >
                <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Summary Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className={cn(
              "p-4 rounded-2xl border bg-gradient-to-br from-primary/20 to-orange-500/10",
              isDark ? "border-primary/30" : "border-primary/20"
            )}>
              <Trophy className="w-6 h-6 text-primary mb-2" />
              <p className="text-2xl font-bold text-primary">{stats.totalWorkouts}</p>
              <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>รวมทั้งหมด</p>
            </div>
            <div className={cn(
              "p-4 rounded-2xl border bg-gradient-to-br from-green-500/20 to-emerald-500/10",
              isDark ? "border-green-500/30" : "border-green-500/20"
            )}>
              <Flame className="w-6 h-6 text-green-400 mb-2" />
              <p className="text-2xl font-bold text-green-400">{stats.totalCalories.toLocaleString()}</p>
              <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>แคลลอรี่</p>
            </div>
            <div className={cn(
              "p-4 rounded-2xl border bg-gradient-to-br from-blue-500/20 to-cyan-500/10",
              isDark ? "border-blue-500/30" : "border-blue-500/20"
            )}>
              <Clock className="w-6 h-6 text-blue-400 mb-2" />
              <p className="text-lg font-bold text-blue-400 font-mono">{formatWorkoutTime(stats.totalDuration)}</p>
              <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>เวลารวม</p>
            </div>
            <div className={cn(
              "p-4 rounded-2xl border bg-gradient-to-br from-purple-500/20 to-pink-500/10",
              isDark ? "border-purple-500/30" : "border-purple-500/20"
            )}>
              <Target className="w-6 h-6 text-purple-400 mb-2" />
              <p className="text-2xl font-bold text-purple-400">{Math.round(stats.averageAccuracy)}%</p>
              <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>ความแม่นยำ</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && workouts.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className={cn(
                "w-8 h-8 animate-spin mx-auto mb-4",
                isDark ? "text-gray-400" : "text-gray-500"
              )} />
              <p className={cn(
                "text-sm",
                isDark ? "text-gray-400" : "text-gray-500"
              )}>
                กำลังโหลดประวัติ...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="text-red-500">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  เกิดข้อผิดพลาด
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && workouts.length === 0 && (
          <div className="text-center py-12">
            <Activity className={cn(
              "w-16 h-16 mx-auto mb-4",
              isDark ? "text-gray-600" : "text-gray-400"
            )} />
            <h3 className={cn(
              "text-lg font-medium mb-2",
              isDark ? "text-gray-300" : "text-gray-600"
            )}>
              ยังไม่มีประวัติการออกกำลังกาย
            </h3>
            <p className={cn(
              "text-sm",
              isDark ? "text-gray-500" : "text-gray-500"
            )}>
              เริ่มออกกำลังกายเพื่อดูประวัติของคุณ
            </p>
          </div>
        )}

        {/* Workout History List */}
        {!isLoading && !error && workouts.length > 0 && (
          <div className="space-y-4">
            <AnimatePresence>
              {workouts.map((workout, index) => (
                <motion.div
                  key={workout.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={cn(
                    "p-6 rounded-2xl border",
                    isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
                  )}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        isDark ? "bg-primary/20" : "bg-primary/10"
                      )}>
                        <Activity className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">
                          {workout.styleNameTh || workout.styleName || 'ออกกำลังกาย'}
                        </h3>
                        <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                          {formatDate(workout.completedAt || new Date())}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        {Math.round(workout.completionPercentage || 0)}%
                      </p>
                      <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                        สมบูรณ์
                      </p>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className={cn(
                      "p-3 rounded-lg text-center",
                      isDark ? "bg-green-500/20" : "bg-green-50"
                    )}>
                      <Target className="w-5 h-5 text-green-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-green-500">{workout.totalReps || 0}</p>
                      <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>ครั้ง</p>
                    </div>
                    <div className={cn(
                      "p-3 rounded-lg text-center",
                      isDark ? "bg-orange-500/20" : "bg-orange-50"
                    )}>
                      <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-orange-500">{workout.caloriesBurned || 0}</p>
                      <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>cal</p>
                    </div>
                    <div className={cn(
                      "p-3 rounded-lg text-center",
                      isDark ? "bg-blue-500/20" : "bg-blue-50"
                    )}>
                      <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-blue-500 font-mono">
                        {formatWorkoutTime(workout.totalTime || 0)}
                      </p>
                      <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>เวลา</p>
                    </div>
                  </div>

                  {/* Exercise Details */}
                  {workout.exercises && workout.exercises.length > 0 && (
                    <div>
                      <h4 className={cn("font-medium mb-3 text-sm", isDark ? "text-gray-300" : "text-gray-700")}>
                        รายละเอียดท่าออกกำลังกาย:
                      </h4>
                      <div className="space-y-2">
                        {workout.exercises.map((exercise, idx) => (
                          <div key={idx} className={cn(
                            "flex items-center justify-between p-3 rounded-lg",
                            isDark ? "bg-white/5" : "bg-gray-50"
                          )}>
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center",
                                isDark ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"
                              )}>
                                {idx + 1}
                              </span>
                              <span className="text-sm font-medium text-foreground">
                                {exercise.nameTh || exercise.name || `ท่าที่ ${idx + 1}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-right">
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {exercise.reps || 0}/{exercise.targetReps || 0}
                                </p>
                                <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                                  ครั้ง
                                </p>
                              </div>
                              <div>
                                <p className={cn("text-sm font-medium", getFormColor(exercise.formScore || 0))}>
                                  {Math.round(exercise.formScore || 0)}%
                                </p>
                                <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                                  ฟอร์ม
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutHistory;