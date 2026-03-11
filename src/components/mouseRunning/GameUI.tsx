import { LevelTheme } from '@/types/game';

interface GameUIProps {
  steps: number;
  score: number;
  isRunning: boolean;
  elapsedTime: number;
  hitCount: number;
  player2Score?: number;
  player2Steps?: number;
  levelTheme?: LevelTheme;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/* ── Reusable panel shell ── */
function HudPanel({ children, accentColor, className = '' }: { children: React.ReactNode; accentColor: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(180deg, rgba(10,14,30,0.82) 0%, rgba(6,8,20,0.92) 100%)',
        borderRadius: '14px',
        border: `1.5px solid ${accentColor}40`,
        boxShadow: `0 2px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 24px ${accentColor}12`,
      }}>
      {/* Top highlight bar */}
      <div className="absolute top-0 left-2 right-2 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}55, transparent)` }} />
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 4px)' }} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function GameUI({ steps, score, isRunning, elapsedTime, hitCount, player2Score, player2Steps, levelTheme }: GameUIProps) {
  const isMultiplayer = player2Score !== undefined;
  const primary = levelTheme?.primaryColor || '#4ade80';
  const accent = levelTheme?.accentColor || primary;

  return (
    <div className="absolute top-3 right-2 z-30 flex flex-col items-end gap-2 w-[156px]">

      {/* ── Timer + Score composite panel ── */}
      <HudPanel accentColor={primary} className="w-full">
        <div className="px-3 py-2">
          {/* Timer row */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none">
                <circle cx="12" cy="13" r="8" stroke="#60a5fa" strokeWidth="2" />
                <line x1="12" y1="8" x2="12" y2="13" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="13" x2="15" y2="15" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="3" x2="12" y2="5" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[15px] font-black tabular-nums tracking-wider"
              style={{ color: '#93c5fd', textShadow: '0 0 8px rgba(96,165,250,0.5)' }}>
              {formatTime(elapsedTime)}
            </span>
          </div>

          {/* Divider */}
          <div className="h-px mb-1.5" style={{ background: `linear-gradient(90deg, transparent, ${primary}33, transparent)` }} />

          {/* Score row */}
          <div className="flex items-center justify-between">
            {isMultiplayer && <span className="text-[9px] font-black text-blue-400 tracking-wider">P1</span>}
            <div className="flex items-center gap-1.5">
              <svg viewBox="0 0 20 20" className="w-4 h-4">
                <path d="M10 1l2.5 5.5L18 7.5l-4 4 1 5.5L10 14.5 4.5 17l1-5.5-4-4 5.5-1z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.8" />
              </svg>
              <span className="text-sm font-black text-yellow-400 tabular-nums" style={{ textShadow: '0 0 6px rgba(251,191,36,0.4)' }}>{score}</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-1">
              <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="none">
                <path d="M2 18 L5 10 L10 14 L15 6 L18 10" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm font-bold tabular-nums" style={{ color: primary }}>{steps}</span>
            </div>
          </div>

          {/* P2 row */}
          {isMultiplayer && (
            <>
              <div className="h-px mt-1.5 mb-1.5" style={{ background: 'linear-gradient(90deg, transparent, rgba(244,114,182,0.3), transparent)' }} />
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-pink-400 tracking-wider">P2</span>
                <div className="flex items-center gap-1.5">
                  <svg viewBox="0 0 20 20" className="w-4 h-4">
                    <path d="M10 1l2.5 5.5L18 7.5l-4 4 1 5.5L10 14.5 4.5 17l1-5.5-4-4 5.5-1z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.8" />
                  </svg>
                  <span className="text-sm font-black text-yellow-400 tabular-nums">{player2Score}</span>
                </div>
                <div className="w-px h-3 bg-white/10" />
                <div className="flex items-center gap-1">
                  <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="none">
                    <path d="M2 18 L5 10 L10 14 L15 6 L18 10" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-sm font-bold text-pink-300 tabular-nums">{player2Steps}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </HudPanel>

      {/* ── Hit counter ── */}
      {hitCount > 0 && (
        <HudPanel accentColor="#ef4444">
          <div className="flex items-center gap-2 px-3 py-1.5">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2" />
              <path d="M15 9l-6 6M9 9l6 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-sm font-black text-red-400 tabular-nums" style={{ textShadow: '0 0 8px rgba(239,68,68,0.4)' }}>
              HIT x{hitCount}
            </span>
          </div>
        </HudPanel>
      )}

      {/* ── Running status ── */}
      {!isMultiplayer && (
        <HudPanel accentColor={isRunning ? primary : '#475569'}>
          <div className="flex items-center gap-2 px-3 py-1.5">
            {/* Animated status dot ring */}
            <div className="relative w-4 h-4 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full transition-colors duration-200"
                style={{ backgroundColor: isRunning ? primary : '#334155', boxShadow: isRunning ? `0 0 8px ${primary}` : 'none' }} />
              {isRunning && (
                <div className="absolute inset-0 rounded-full border-2 border-transparent animate-ping"
                  style={{ borderColor: `${primary}55` }} />
              )}
            </div>
            <span className="text-xs font-black uppercase tracking-widest"
              style={{ color: isRunning ? primary : '#64748b', textShadow: isRunning ? `0 0 8px ${primary}55` : 'none' }}>
              {isRunning ? 'RUNNING' : 'IDLE'}
            </span>
          </div>
        </HudPanel>
      )}

      <style>{`
        @keyframes hudGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
