import { LEVELS, Level, GameMode } from '@/types/game';
import { MouseIcon } from './icons/MouseIcon';
import { PlayersIcon } from './icons/PlayersIcon';
import { LevelIcon } from './icons/LevelIcon';

interface LevelSelectProps {
  onSelectLevel: (level: Level) => void;
  onSelectMode: (mode: GameMode) => void;
  selectedMode: GameMode;
  onBack: () => void;
}

export function LevelSelect({ onSelectLevel, onSelectMode, selectedMode, onBack }: LevelSelectProps) {
  const levelColors: Record<string, { from: string; to: string; glow: string; border: string }> = {
    easy:   { from: '#22c55e', to: '#15803d', glow: 'rgba(34,197,94,0.5)', border: '#4ade80' },
    medium: { from: '#f59e0b', to: '#b45309', glow: 'rgba(245,158,11,0.5)', border: '#fbbf24' },
    hard:   { from: '#ef4444', to: '#991b1b', glow: 'rgba(239,68,68,0.5)', border: '#f87171' },
    party:  { from: '#a855f7', to: '#6b21a8', glow: 'rgba(168,85,247,0.5)', border: '#c084fc' },
  };

  return (
    <div className="absolute inset-0 z-50 overflow-auto"
      style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d2147 30%, #0f0c29 60%, #1a0a3e 100%)' }}>
      {/* Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white" style={{
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.6 + 0.2,
            animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }} />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 py-6 min-h-full">
        {/* Header */}
        <div className="text-center mb-6">
          <MouseIcon className="w-14 h-20 mx-auto mb-2 drop-shadow-lg" />
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider"
            style={{ textShadow: '0 2px 0 rgba(0,0,0,0.3), 0 0 20px rgba(52,211,153,0.3)' }}>
            Select Game Mode
          </h1>
        </div>

        {/* Player Mode Toggle */}
        <div className="w-full max-w-md mb-6">
          <div className="p-1 rounded-2xl inline-flex w-full"
            style={{ background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => onSelectMode('SINGLE')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-base transition-all duration-300 ${
                selectedMode === 'SINGLE'
                  ? 'text-white shadow-lg'
                  : 'text-white/50 hover:text-white/80'
              }`}
              style={selectedMode === 'SINGLE' ? {
                background: 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)',
                boxShadow: '0 4px 12px rgba(34,197,94,0.4)',
              } : {}}>
              <PlayersIcon className="w-8 h-6" count={1} />
              <span>1 Player</span>
            </button>
            <button onClick={() => onSelectMode('MULTIPLAYER')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-base transition-all duration-300 ${
                selectedMode === 'MULTIPLAYER'
                  ? 'text-white shadow-lg'
                  : 'text-white/50 hover:text-white/80'
              }`}
              style={selectedMode === 'MULTIPLAYER' ? {
                background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
                boxShadow: '0 4px 12px rgba(59,130,246,0.4)',
              } : {}}>
              <PlayersIcon className="w-10 h-6" count={2} />
              <span>2 Players</span>
            </button>
          </div>
        </div>

        {/* Level Cards Grid */}
        <div className="w-full max-w-lg grid grid-cols-2 gap-3 md:gap-4 mb-6">
          {LEVELS.map((level) => {
            const colors = levelColors[level.id] || levelColors.medium;
            const diffStars = level.id === 'easy' ? 1 : level.id === 'medium' ? 2 : level.id === 'hard' ? 3 : 2;
            
            return (
              <button key={level.id} onClick={() => onSelectLevel(level)}
                className="group relative rounded-2xl p-4 text-left transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden"
                style={{
                  background: `linear-gradient(160deg, ${colors.from}22 0%, ${colors.to}33 100%)`,
                  border: `2px solid ${colors.border}55`,
                  boxShadow: `0 4px 20px ${colors.glow.replace('0.5', '0.15')}`,
                }}>
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ boxShadow: `inset 0 0 30px ${colors.glow.replace('0.5', '0.2')}, 0 0 40px ${colors.glow.replace('0.5', '0.25')}` }} />
                
                {/* Party mode bg shimmer */}
                {level.id === 'party' && (
                  <div className="absolute inset-0 opacity-20 overflow-hidden rounded-2xl">
                    <div className="absolute w-20 h-20 rounded-full bg-pink-500 blur-xl animate-pulse" style={{ top: '10%', left: '5%' }} />
                    <div className="absolute w-16 h-16 rounded-full bg-cyan-500 blur-xl animate-pulse" style={{ bottom: '10%', right: '5%', animationDelay: '0.5s' }} />
                  </div>
                )}
                
                {/* Icon */}
                <div className="mb-2 relative z-10 drop-shadow-lg">
                  <LevelIcon levelId={level.id} className="w-10 h-10" />
                </div>
                
                {/* Name */}
                <h3 className="font-bold text-base text-white relative z-10 mb-0.5">{level.name}</h3>
                <p className="text-[11px] text-white/50 relative z-10 mb-2">{level.description}</p>
                
                {/* Bars */}
                <div className="space-y-1.5 relative z-10 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40 w-10">Speed</span>
                    <div className="flex gap-0.5 flex-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-1.5 flex-1 rounded-full"
                          style={{
                            background: i <= Math.ceil(level.config.speedMultiplier / 2) ? colors.from : 'rgba(255,255,255,0.1)',
                            boxShadow: i <= Math.ceil(level.config.speedMultiplier / 2) ? `0 0 4px ${colors.glow}` : 'none',
                          }} />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40 w-10">Risk</span>
                    <div className="flex gap-0.5 flex-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-1.5 flex-1 rounded-full"
                          style={{
                            background: i <= Math.ceil(level.config.penaltyPercent * 10) ? '#ef4444' : 'rgba(255,255,255,0.1)',
                            boxShadow: i <= Math.ceil(level.config.penaltyPercent * 10) ? '0 0 4px rgba(239,68,68,0.5)' : 'none',
                          }} />
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Stars */}
                <div className="flex gap-0.5 relative z-10">
                  {[1, 2, 3].map((i) => (
                    <svg key={i} viewBox="0 0 24 24" className="w-4 h-4"
                      fill={i <= diffStars ? '#fbbf24' : 'rgba(255,255,255,0.15)'}
                      style={{ filter: i <= diffStars ? 'drop-shadow(0 0 3px rgba(251,191,36,0.6))' : 'none' }}>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Multiplayer note */}
        {selectedMode === 'MULTIPLAYER' && (
          <div className="w-full max-w-md mb-4 p-3 rounded-xl text-center"
            style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <p className="text-blue-300 text-xs font-medium">
              <PlayersIcon className="w-5 h-4 inline-block mr-1 align-middle" count={2} />
              Both players stand in front of the camera<br />
              Left = <span className="text-blue-400 font-bold">Blue Mouse</span> · Right = <span className="text-pink-400 font-bold">Pink Mouse</span>
            </p>
          </div>
        )}

        {/* Back button */}
        <button onClick={onBack}
          className="group flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white/60 hover:text-white transition-all duration-200 hover:bg-white/5"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          <svg viewBox="0 0 24 24" className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
