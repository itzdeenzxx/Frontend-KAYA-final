import { useState } from 'react';
import { GameState, GameMode } from '@/types/game';
import { MouseIcon } from './icons/MouseIcon';
import { CheeseIcon } from './icons/CheeseIcon';
import { HowToPlay } from './HowToPlay';

interface GameOverlayProps {
  gameState: GameState;
  player2GameState?: GameState;
  score: number;
  player2Score?: number;
  elapsedTime: number;
  hitCount: number;
  onStart: () => void;
  onRestart: () => void;
  onBack?: () => void;
  gameMode?: GameMode;
  isNewRecord?: boolean;
  personalBest?: number;
  levelId?: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getStarRating(score: number, hitCount: number): number {
  if (hitCount === 0) return 3;
  if (hitCount <= 2) return 2;
  return 1;
}

export function GameOverlay({ 
  gameState, 
  player2GameState,
  score, 
  player2Score,
  elapsedTime, 
  hitCount,
  onStart, 
  onRestart,
  onBack,
  gameMode = 'SINGLE',
  isNewRecord = false,
  personalBest = 0,
  levelId = '',
}: GameOverlayProps) {
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  
  const isMultiplayerWin = gameMode === 'MULTIPLAYER' && (gameState === 'WIN' || player2GameState === 'WIN');
  const player1Won = gameState === 'WIN';
  
  // HIT message
  if (gameState === 'HIT') {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
        {/* Screen-edge danger vignette */}
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(220,38,38,0.25) 100%)', animation: 'hitVignette 0.5s ease-out' }} />

        <div className="text-center" style={{ animation: 'hitImpact 0.5s cubic-bezier(0.22, 1, 0.36, 1)' }}>
          {/* Impact ring */}
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="absolute w-32 h-32 rounded-full"
              style={{ border: '3px solid rgba(239,68,68,0.4)', animation: 'hitRingExpand 0.6s ease-out forwards', opacity: 0 }} />
            <div className="absolute w-32 h-32 rounded-full"
              style={{ border: '2px solid rgba(239,68,68,0.2)', animation: 'hitRingExpand 0.6s ease-out 0.1s forwards', opacity: 0 }} />
            {/* X mark */}
            <svg viewBox="0 0 80 80" className="w-20 h-20 md:w-28 md:h-28" style={{ filter: 'drop-shadow(0 0 20px rgba(239,68,68,0.6))' }}>
              <circle cx="40" cy="40" r="35" fill="none" stroke="#ef4444" strokeWidth="3" opacity="0.4" />
              <circle cx="40" cy="40" r="28" fill="rgba(220,38,38,0.15)" stroke="#ef4444" strokeWidth="2" />
              <path d="M28 28 L52 52 M52 28 L28 52" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Label */}
          <div className="relative">
            <div className="text-4xl md:text-5xl font-black uppercase tracking-[0.2em]"
              style={{ color: '#fca5a5', textShadow: '0 0 30px rgba(239,68,68,0.5), 0 2px 0 rgba(0,0,0,0.4)' }}>
              VIOLATION
            </div>
            <div className="mt-2 px-4 py-1 rounded-lg inline-block"
              style={{ background: 'rgba(127,29,29,0.5)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <span className="text-xs md:text-sm font-bold text-red-300/80 uppercase tracking-widest">
                Movement detected during red light
              </span>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes hitImpact {
            0% { transform: scale(1.6); opacity: 0; }
            40% { transform: scale(0.95); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes hitRingExpand {
            0% { transform: scale(0.3); opacity: 0.8; }
            100% { transform: scale(1.8); opacity: 0; }
          }
          @keyframes hitVignette {
            0% { opacity: 0; }
            30% { opacity: 1; }
            100% { opacity: 0.7; }
          }
        `}</style>
      </div>
    );
  }

  if (gameState === 'GREEN_LIGHT' || gameState === 'YELLOW_LIGHT' || gameState === 'RED_LIGHT') {
    if (!isMultiplayerWin) return null;
  }

  if (showHowToPlay) {
    return <HowToPlay onClose={() => setShowHowToPlay(false)} onStart={onStart} />;
  }

  // ===== MAIN MENU (IDLE) =====
  if (gameState === 'IDLE') {
    return (
      <div className="absolute inset-0 z-50 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d2147 30%, #0f0c29 60%, #1a0a3e 100%)' }}>
        {/* Animated stars/particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white" style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.7 + 0.3,
              animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }} />
          ))}
          {/* Glow orbs */}
          <div className="absolute w-64 h-64 rounded-full opacity-20 blur-3xl" 
            style={{ background: 'radial-gradient(circle, #4f46e5, transparent)', top: '10%', left: '20%', animation: 'float 8s ease-in-out infinite' }} />
          <div className="absolute w-48 h-48 rounded-full opacity-15 blur-3xl" 
            style={{ background: 'radial-gradient(circle, #06b6d4, transparent)', bottom: '20%', right: '15%', animation: 'float 6s ease-in-out infinite reverse' }} />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-full px-4 py-8">
          {/* Game Logo */}
          <div className="relative mb-8">
            <div className="flex items-end justify-center gap-1 mb-2">
              <MouseIcon className="w-20 h-28 drop-shadow-2xl" levelId={levelId} style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))' }} />
              <CheeseIcon className="w-16 h-12 drop-shadow-xl -ml-3" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-center leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-300 to-cyan-400"
                style={{ filter: 'drop-shadow(0 0 20px rgba(52,211,153,0.5))' }}>
                RUN or
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400"
                style={{ filter: 'drop-shadow(0 0 20px rgba(251,146,60,0.5))' }}>
                FREEZE!
              </span>
            </h1>
            <p className="text-center text-cyan-300/60 text-sm font-medium tracking-[0.3em] uppercase mt-2">
              Red Light Green Light
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 w-full max-w-xs">
            {/* Start Game Button */}
            <button onClick={onStart}
              className="group relative w-full py-5 rounded-2xl font-black text-xl text-white uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)',
                boxShadow: '0 6px 0 #14532d, 0 8px 20px rgba(34,197,94,0.4), inset 0 2px 0 rgba(255,255,255,0.2)',
              }}>
              <div className="flex items-center justify-center gap-3">
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white drop-shadow-lg" >
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Start Game
              </div>
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%)' }} />
            </button>

            {/* How to Play Button */}
            <button onClick={() => setShowHowToPlay(true)}
              className="group relative w-full py-4 rounded-2xl font-bold text-lg text-white uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
                boxShadow: '0 5px 0 #1e3a8a, 0 7px 16px rgba(59,130,246,0.35), inset 0 2px 0 rgba(255,255,255,0.2)',
              }}>
              <div className="flex items-center justify-center gap-3">
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                How to Play
              </div>
            </button>

            {/* Exit Button */}
            {onBack && (
              <button onClick={onBack}
                className="group relative w-full py-4 rounded-2xl font-bold text-lg text-white/80 uppercase tracking-wider transition-all duration-200 hover:scale-105 hover:text-white active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1.5px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}>
                <div className="flex items-center justify-center gap-3">
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  Exit
                </div>
              </button>
            )}
          </div>

          {/* Bottom tip */}
          <div className="mt-8 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 backdrop-blur-sm">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-cyan-300/60" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
            <p className="text-white/50 text-xs font-medium">
              Full body must be visible to camera
            </p>
          </div>
        </div>

        <style>{`
          @keyframes twinkle {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.5); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0) translateX(0); }
            33% { transform: translateY(-20px) translateX(10px); }
            66% { transform: translateY(10px) translateX(-10px); }
          }
        `}</style>
      </div>
    );
  }

  // ===== WIN / COMPLETE SCREEN =====
  if (gameState === 'WIN' || isMultiplayerWin) {
    const stars = getStarRating(score, hitCount);
    
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #041e1a 0%, #064e3b 25%, #065f46 50%, #047857 75%, #059669 100%)' }}>
        
        {/* Animated radial burst */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-10"
            style={{ 
              background: 'repeating-conic-gradient(rgba(255,255,255,0.06) 0deg 5deg, transparent 5deg 10deg)',
              animation: 'winSpin 30s linear infinite',
              borderRadius: '50%',
            }} />
          {/* Light shafts */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-full opacity-10"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.2), transparent 60%)', clipPath: 'polygon(40% 0%, 60% 0%, 80% 100%, 20% 100%)' }} />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="absolute rounded-full"
              style={{
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
                background: ['#fbbf24', '#34d399', '#ffffff'][i % 3],
                left: `${Math.random() * 100}%`,
                bottom: '-5%',
                opacity: 0,
                animation: `winParticle ${4 + Math.random() * 4}s ease-out ${Math.random() * 3}s infinite`,
              }} />
          ))}
        </div>

        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)' }} />

        <div className="relative z-10 text-center px-4 max-w-sm mx-auto" style={{ animation: 'winSlideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          
          {/* Stars row */}
          <div className="flex justify-center items-end gap-3 mb-4">
            {[1, 2, 3].map((i) => {
              const earned = i <= stars;
              const isMiddle = i === 2;
              return (
                <div key={i} className="relative" style={{ animation: earned ? `winStarDrop 0.5s cubic-bezier(0.34,1.56,0.64,1) ${0.3 + i * 0.15}s both` : undefined }}>
                  {earned && (
                    <div className="absolute inset-0 -m-2 blur-lg opacity-40"
                      style={{ background: 'radial-gradient(circle, #fbbf24, transparent)' }} />
                  )}
                  <svg viewBox="0 0 50 50" className={`${isMiddle ? 'w-16 h-16 md:w-20 md:h-20' : 'w-12 h-12 md:w-14 md:h-14'}`}
                    style={{ filter: earned ? 'drop-shadow(0 4px 12px rgba(234,179,8,0.5))' : 'none', transform: !isMiddle ? 'translateY(8px)' : undefined }}>
                    <defs>
                      <linearGradient id={`starGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={earned ? '#fde68a' : '#475569'} />
                        <stop offset="100%" stopColor={earned ? '#d97706' : '#334155'} />
                      </linearGradient>
                    </defs>
                    <path d="M25 3 L30 18 L46 20 L34 31 L37 47 L25 40 L13 47 L16 31 L4 20 L20 18 Z"
                      fill={`url(#starGrad${i})`}
                      stroke={earned ? '#fbbf24' : '#4b5563'}
                      strokeWidth="1.5" />
                    {earned && (
                      <path d="M25 8 L28 18 L38 19 L31 26 L33 36 L25 31 L17 36 L19 26 L12 19 L22 18 Z"
                        fill="rgba(255,255,255,0.15)" />
                    )}
                  </svg>
                </div>
              );
            })}
          </div>

          {/* COMPLETE / Winner banner */}
          <div className="relative mb-5">
            <div className="inline-block relative">
              {/* Banner background */}
              <div className="px-8 py-2 rounded-lg"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }}>
                <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-[0.2em]"
                  style={{ textShadow: '0 2px 0 rgba(0,0,0,0.3), 0 0 30px rgba(52,211,153,0.3)' }}>
                  {gameMode === 'MULTIPLAYER' 
                    ? (player1Won ? 'P1 WINS' : 'P2 WINS')
                    : 'COMPLETE'
                  }
                </h2>
              </div>
              {/* Decorative lines */}
              <div className="absolute top-1/2 -left-8 w-6 h-px bg-gradient-to-l from-white/30 to-transparent" />
              <div className="absolute top-1/2 -right-8 w-6 h-px bg-gradient-to-r from-white/30 to-transparent" />
            </div>
          </div>

          {/* Character */}
          <div className="relative inline-block mb-4">
            <div className="relative" style={{ animation: 'winCharBounce 2s ease-in-out infinite' }}>
              <MouseIcon className="w-20 h-28 md:w-24 md:h-32 mx-auto" 
                color={player1Won ? 'pink' : 'blue'}
                levelId={levelId}
                style={{ filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.3))' }} />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-3 rounded-full blur-md opacity-30"
              style={{ background: '#000' }} />
          </div>

          {gameMode === 'MULTIPLAYER' ? (
            <div className="flex justify-center gap-4 mb-6">
              {[
                { label: 'Player 1', val: score, color: '#60a5fa', borderColor: 'rgba(96,165,250,0.3)' },
                { label: 'Player 2', val: player2Score, color: '#f472b6', borderColor: 'rgba(244,114,182,0.3)' },
              ].map((p, i) => (
                <div key={i} className="rounded-xl px-5 py-3 min-w-[100px]"
                  style={{
                    background: 'linear-gradient(180deg, rgba(10,14,30,0.7), rgba(6,8,20,0.85))',
                    border: `1.5px solid ${p.borderColor}`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 16px rgba(0,0,0,0.3)`,
                  }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: p.color }}>{p.label}</p>
                  <p className="font-black text-2xl text-white" style={{ textShadow: `0 0 12px ${p.color}44` }}>{p.val}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-6">
              {isNewRecord && (
                <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-lg"
                  style={{
                    background: 'linear-gradient(90deg, rgba(251,191,36,0.15), rgba(251,191,36,0.08))',
                    border: '1px solid rgba(251,191,36,0.3)',
                    animation: 'newRecordPulse 2s ease-in-out infinite',
                  }}>
                  <svg viewBox="0 0 20 20" className="w-4 h-4"><path d="M10 1l2.5 5.5L18 7.5l-4 4 1 5.5L10 14.5 4.5 17l1-5.5-4-4 5.5-1z" fill="#fbbf24" /></svg>
                  <span className="text-yellow-300 font-bold text-xs uppercase tracking-wider">New Personal Best</span>
                  <svg viewBox="0 0 20 20" className="w-4 h-4"><path d="M10 1l2.5 5.5L18 7.5l-4 4 1 5.5L10 14.5 4.5 17l1-5.5-4-4 5.5-1z" fill="#fbbf24" /></svg>
                </div>
              )}

              {/* Score panel */}
              <div className="rounded-xl px-6 py-4 mx-auto max-w-[220px]"
                style={{
                  background: 'linear-gradient(180deg, rgba(10,14,30,0.7), rgba(6,8,20,0.85))',
                  border: '1.5px solid rgba(52,211,153,0.2)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 16px rgba(0,0,0,0.3)',
                }}>
                <p className="text-emerald-300/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Score</p>
                <p className="text-4xl md:text-5xl font-black text-white tabular-nums"
                  style={{ textShadow: '0 0 20px rgba(52,211,153,0.3)' }}>{score}</p>
                <div className="h-px my-2" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-300/50 flex items-center gap-1">
                    <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" /><path d="M8 4v4l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    {formatTime(elapsedTime)}
                  </span>
                  {personalBest > 0 && (
                    <span className="text-yellow-400/60 flex items-center gap-1">
                      <svg viewBox="0 0 16 16" className="w-3 h-3"><path d="M8 1l2 4.4L14.4 6l-3.2 3.2.8 4.4L8 11.5 3.6 13.6l.8-4.4L1.2 6 5.6 5.4z" fill="currentColor" /></svg>
                      {personalBest}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3 w-full max-w-[260px] mx-auto">
            <button onClick={onRestart}
              className="group relative w-full py-4 rounded-xl font-black text-lg text-white uppercase tracking-wider transition-all duration-200 hover:scale-[1.03] active:scale-95 overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
                boxShadow: '0 4px 0 #1e3a8a, 0 6px 20px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.1), transparent 50%)' }} />
              <div className="relative flex items-center justify-center gap-2">
                <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none">
                  <path d="M3 10a7 7 0 1 1 2 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M3 16V10h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Play Again
              </div>
            </button>
            {onBack && (
              <button onClick={onBack}
                className="group w-full py-3.5 rounded-xl font-bold text-base text-white/70 uppercase tracking-wider transition-all duration-200 hover:scale-[1.03] hover:text-white active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1.5px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}>
                Exit
              </button>
            )}
          </div>
        </div>

        <style>{`
          @keyframes winSpin {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
          }
          @keyframes winSlideUp {
            from { transform: translateY(40px) scale(0.9); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
          @keyframes winStarDrop {
            from { transform: translateY(-30px) scale(0) rotate(-20deg); opacity: 0; }
            to { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
          }
          @keyframes winCharBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }
          @keyframes winParticle {
            0% { opacity: 0; transform: translateY(0); }
            10% { opacity: 0.8; }
            100% { opacity: 0; transform: translateY(-100vh) translateX(${-30 + Math.random() * 60}px); }
          }
          @keyframes newRecordPulse {
            0%, 100% { border-color: rgba(251,191,36,0.3); }
            50% { border-color: rgba(251,191,36,0.6); }
          }
        `}</style>
      </div>
    );
  }

  return null;
}
