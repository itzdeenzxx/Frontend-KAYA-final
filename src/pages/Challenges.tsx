import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Clock, Target, Calendar, Star, Gift, RefreshCw, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useChallenges } from '@/hooks/useFirestore';
import { ChallengeCard } from '@/components/gamification/ChallengeCard';
import type { Challenge } from '@/lib/types';

type ChallengeFilter = 'all' | 'daily' | 'weekly' | 'monthly';

const Challenges = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { challenges, claimReward, refreshChallenges, cleanDuplicates, isLoading, error } = useChallenges();
  
  const isDark = theme === 'dark';
  const [selectedFilter, setSelectedFilter] = useState<ChallengeFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);

  // Initialize challenges on mount
  useEffect(() => {
    const initChallenges = async () => {
      setIsRefreshing(true);
      await refreshChallenges();
      setIsRefreshing(false);
    };
    initChallenges();
  }, [refreshChallenges]);

  // Filter challenges based on selected type
  const filteredChallenges = challenges.filter(challenge => {
    if (selectedFilter === 'all') return true;
    return challenge.type === selectedFilter;
  });

  // Group challenges by completion status
  const completedChallenges = filteredChallenges.filter(c => c.current >= c.target);
  const inProgressChallenges = filteredChallenges.filter(c => c.current < c.target);

  const filterButtons = [
    { 
      id: 'all' as ChallengeFilter, 
      label: 'ทั้งหมด', 
      icon: Target, 
      color: 'from-blue-500 to-cyan-500',
      count: challenges.length
    },
    { 
      id: 'daily' as ChallengeFilter, 
      label: 'รายวัน', 
      icon: Calendar, 
      color: 'from-green-500 to-emerald-500',
      count: challenges.filter(c => c.type === 'daily').length
    },
    { 
      id: 'weekly' as ChallengeFilter, 
      label: 'รายสัปดาห์', 
      icon: Clock, 
      color: 'from-orange-500 to-red-500',
      count: challenges.filter(c => c.type === 'weekly').length
    },
    { 
      id: 'monthly' as ChallengeFilter, 
      label: 'รายเดือน', 
      icon: Trophy, 
      color: 'from-purple-500 to-pink-500',
      count: challenges.filter(c => c.type === 'monthly').length
    },
  ];

  const handleClaimReward = async (challengeId: string) => {
    const result = await claimReward(challengeId);
    if (result.success) {
      // Refresh challenges to update UI
      await refreshChallenges();
    }
    return result;
  };

  const handleCleanDuplicates = async () => {
    setIsCleaningDuplicates(true);
    try {
      const success = await cleanDuplicates();
      if (success) {
        // Show success feedback and refresh
        await refreshChallenges();
      }
    } finally {
      setIsCleaningDuplicates(false);
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
          {/* Top Header */}
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
                  🏆 ภารกิจ
                </h1>
                <p className={cn(
                  "text-sm",
                  isDark ? "text-gray-400" : "text-gray-600"
                )}>
                  ทำภารกิจเพื่อรับรางวัล
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCleanDuplicates}
                disabled={isCleaningDuplicates}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all",
                  isDark 
                    ? "bg-red-500/20 text-red-300 hover:bg-red-500/30 disabled:bg-red-500/10 disabled:text-red-500" 
                    : "bg-red-100 text-red-700 hover:bg-red-200 disabled:bg-red-50 disabled:text-red-400"
                )}
              >
                {isCleaningDuplicates ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    กำลังลบข้อมูลซ้ำ...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    ลบข้อมูลซ้ำ
                  </>
                )}
              </button>
              
              <div className={cn(
                "px-3 py-2 rounded-full text-sm font-medium",
                isDark ? "bg-white/10 text-white" : "bg-gray-100 text-gray-700"
              )}>
                <Gift className="w-4 h-4 inline mr-1" />
                {completedChallenges.length}/{challenges.length}
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mt-4">
            <div className={cn(
              "flex gap-2 p-1 rounded-xl",
              isDark ? "bg-gray-800/50" : "bg-gray-100"
            )}>
              {filterButtons.map((filter) => {
                const Icon = filter.icon;
                const isActive = selectedFilter === filter.id;
                
                return (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter.id)}
                    className={cn(
                      "relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200",
                      isActive
                        ? isDark 
                          ? "bg-white/10 text-white shadow-lg" 
                          : "bg-white text-gray-900 shadow-lg"
                        : isDark 
                          ? "text-gray-400 hover:text-gray-300 hover:bg-gray-700/50" 
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeFilter"
                        className={cn(
                          "absolute inset-0 rounded-lg",
                          `bg-gradient-to-r ${filter.color} opacity-10`
                        )}
                      />
                    )}
                    
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{filter.label}</span>
                    
                    {filter.count > 0 && (
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        isActive
                          ? isDark 
                            ? "bg-white/20 text-white" 
                            : "bg-gray-200 text-gray-700"
                          : isDark 
                            ? "bg-gray-700 text-gray-300" 
                            : "bg-gray-200 text-gray-600"
                      )}>
                        {filter.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Loading State */}
        {isLoading && (
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
                กำลังโหลดภารกิจ...
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
        {!isLoading && !error && filteredChallenges.length === 0 && (
          <div className="text-center py-12">
            <Target className={cn(
              "w-16 h-16 mx-auto mb-4",
              isDark ? "text-gray-600" : "text-gray-400"
            )} />
            <h3 className={cn(
              "text-lg font-medium mb-2",
              isDark ? "text-gray-300" : "text-gray-600"
            )}>
              ไม่พบภารกิจ
            </h3>
            <p className={cn(
              "text-sm",
              isDark ? "text-gray-500" : "text-gray-500"
            )}>
              {selectedFilter === 'all' 
                ? 'ยังไม่มีภารกิจใดๆ ในขณะนี้' 
                : `ไม่พบภารกิจ${filterButtons.find(f => f.id === selectedFilter)?.label}`}
            </p>
          </div>
        )}

        {/* Challenges Content */}
        {!isLoading && !error && filteredChallenges.length > 0 && (
          <div className="space-y-6">
            {/* In Progress Challenges */}
            {inProgressChallenges.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Target className={cn(
                    "w-5 h-5",
                    isDark ? "text-blue-400" : "text-blue-600"
                  )} />
                  <h2 className={cn(
                    "text-lg font-semibold",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    ภารกิจที่กำลังดำเนินการ
                  </h2>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    isDark ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-700"
                  )}>
                    {inProgressChallenges.length}
                  </span>
                </div>
                
                <motion.div 
                  className="grid gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <AnimatePresence>
                    {inProgressChallenges.map((challenge) => (
                      <motion.div
                        key={challenge.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChallengeCard challenge={challenge} onClaimReward={handleClaimReward} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>
            )}

            {/* Completed Challenges */}
            {completedChallenges.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className={cn(
                    "w-5 h-5",
                    isDark ? "text-green-400" : "text-green-600"
                  )} />
                  <h2 className={cn(
                    "text-lg font-semibold",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    ภารกิจที่เสร็จสิ้น
                  </h2>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    isDark ? "bg-green-500/20 text-green-300" : "bg-green-100 text-green-700"
                  )}>
                    {completedChallenges.length}
                  </span>
                </div>
                
                <motion.div 
                  className="grid gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <AnimatePresence>
                    {completedChallenges.map((challenge) => (
                      <motion.div
                        key={challenge.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChallengeCard challenge={challenge} onClaimReward={handleClaimReward} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Challenges;
