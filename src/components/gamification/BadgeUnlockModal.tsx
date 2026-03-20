import { AnimatePresence, motion } from 'framer-motion';
import { Share2, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Confetti } from '@/components/mouseRunning/Confetti';

interface BadgeUnlockModalProps {
  open: boolean;
  userName: string;
  badgeNames: string[];
  isDark: boolean;
  onClose: () => void;
  onShare: () => Promise<void>;
}

export function BadgeUnlockModal({
  open,
  userName,
  badgeNames,
  isDark,
  onClose,
  onShare,
}: BadgeUnlockModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            className="fixed inset-0 z-[91] flex items-center justify-center p-4"
          >
            <Confetti className="z-0" />
            <div
              className={cn(
                'relative z-10 w-full max-w-md rounded-3xl border p-6 shadow-2xl',
                isDark ? 'bg-zinc-950 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
              )}
            >
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'absolute right-3 top-3 rounded-full p-2 transition-colors',
                  isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                )}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 text-black flex items-center justify-center shadow-lg">
                <Sparkles className="w-8 h-8" />
              </div>

              <h3 className="text-2xl font-bold text-center">ปลดล็อกเหรียญใหม่!</h3>
              <p className={cn('mt-2 text-center text-sm', isDark ? 'text-gray-300' : 'text-gray-600')}>
                {userName} ได้รับ {badgeNames.length} เหรียญ
              </p>

              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {badgeNames.map((name) => (
                  <span
                    key={name}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium',
                      isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'
                    )}
                  >
                    {name}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    'flex-1 rounded-xl px-4 py-2 text-sm border',
                    isDark ? 'border-white/15 bg-white/5 hover:bg-white/10' : 'border-gray-200 bg-white hover:bg-gray-100'
                  )}
                >
                  ปิด
                </button>
                <button
                  type="button"
                  onClick={onShare}
                  className="flex-1 rounded-xl px-4 py-2 text-sm bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium hover:opacity-90 inline-flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  แชร์ใน LINE
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
