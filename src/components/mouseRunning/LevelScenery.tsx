import { Level } from '@/types/game';

interface LevelSceneryProps {
  level: Level;
}

/** Per-level themed scenery/decoration overlays rendered during gameplay */
export function LevelScenery({ level }: LevelSceneryProps) {
  switch (level.id) {
    case 'easy':
      return <EasyScenery />;
    case 'medium':
      return <MediumScenery />;
    case 'hard':
      return <HardScenery />;
    case 'party':
      return <PartyScenery />;
    default:
      return null;
  }
}

/* ── Sunny Meadow ── */
function EasyScenery() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
      {/* Sky gradient - more visible */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(135,206,250,0.35) 0%, rgba(144,238,144,0.12) 50%, rgba(34,139,34,0.15) 85%, rgba(34,139,34,0.25) 100%)' }} />

      {/* Ground / grass field at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[18%]"
        style={{ background: 'linear-gradient(0deg, rgba(34,139,34,0.4), rgba(34,139,34,0.15) 60%, transparent)' }} />

      {/* Rolling hills silhouette */}
      <div className="absolute bottom-[12%] left-0 right-0 h-20 opacity-20">
        <svg viewBox="0 0 800 60" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0 60 Q100 10 200 40 Q350 -5 450 35 Q550 5 650 30 Q750 10 800 25 L800 60 Z" fill="#166534" />
        </svg>
      </div>

      {/* Trees silhouettes on sides */}
      <div className="absolute bottom-[14%] left-[3%] opacity-15">
        <svg viewBox="0 0 40 60" className="w-10 h-16 md:w-14 md:h-20">
          <ellipse cx="20" cy="18" rx="16" ry="18" fill="#166534" />
          <ellipse cx="20" cy="10" rx="12" ry="14" fill="#15803d" />
          <rect x="17" y="32" width="6" height="18" rx="2" fill="#854d0e" />
        </svg>
      </div>
      <div className="absolute bottom-[16%] left-[10%] opacity-10">
        <svg viewBox="0 0 30 50" className="w-8 h-12 md:w-10 md:h-16">
          <ellipse cx="15" cy="15" rx="12" ry="15" fill="#15803d" />
          <rect x="12" y="26" width="5" height="14" rx="2" fill="#92400e" />
        </svg>
      </div>
      <div className="absolute bottom-[15%] right-[5%] opacity-12">
        <svg viewBox="0 0 40 60" className="w-10 h-16 md:w-14 md:h-20">
          <ellipse cx="20" cy="18" rx="16" ry="18" fill="#166534" />
          <ellipse cx="20" cy="10" rx="12" ry="14" fill="#15803d" />
          <rect x="17" y="32" width="6" height="18" rx="2" fill="#854d0e" />
        </svg>
      </div>
      <div className="absolute bottom-[17%] right-[14%] opacity-8">
        <svg viewBox="0 0 30 50" className="w-7 h-11 md:w-9 md:h-14">
          <ellipse cx="15" cy="15" rx="11" ry="14" fill="#15803d" />
          <rect x="12" y="26" width="5" height="14" rx="2" fill="#92400e" />
        </svg>
      </div>

      {/* Sun with halo */}
      <div className="absolute top-6 right-[15%] w-16 h-16 md:w-20 md:h-20">
        <div className="absolute inset-0 -m-8 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #fbbf24, transparent 65%)' }} />
        <svg viewBox="0 0 60 60" className="w-full h-full opacity-50">
          <circle cx="30" cy="30" r="12" fill="#fbbf24" />
          <circle cx="30" cy="30" r="20" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.4">
            <animate attributeName="r" values="18;22;18" dur="4s" repeatCount="indefinite" />
          </circle>
          {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
            <line key={a} x1="30" y1="30"
              x2={30 + 26 * Math.cos(a * Math.PI / 180)}
              y2={30 + 26 * Math.sin(a * Math.PI / 180)}
              stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
          ))}
        </svg>
      </div>

      {/* Floating clouds */}
      {[
        { top: '5%', left: '-8%', size: 'w-32', delay: '0s', dur: '45s', opacity: 0.35 },
        { top: '14%', left: '25%', size: 'w-22', delay: '10s', dur: '50s', opacity: 0.22 },
        { top: '8%', left: '55%', size: 'w-28', delay: '20s', dur: '38s', opacity: 0.3 },
        { top: '20%', left: '80%', size: 'w-18', delay: '5s', dur: '55s', opacity: 0.18 },
      ].map((c, i) => (
        <div key={i} className={`absolute ${c.size}`}
          style={{ top: c.top, left: c.left, opacity: c.opacity, animation: `driftRight ${c.dur} linear ${c.delay} infinite` }}>
          <svg viewBox="0 0 100 40" className="w-full h-full">
            <ellipse cx="50" cy="25" rx="40" ry="12" fill="white" />
            <ellipse cx="35" cy="18" rx="20" ry="12" fill="white" />
            <ellipse cx="65" cy="18" rx="22" ry="10" fill="white" />
          </svg>
        </div>
      ))}

      {/* Grass blades */}
      <div className="absolute bottom-0 left-0 right-0 h-8 opacity-30">
        <svg viewBox="0 0 400 20" preserveAspectRatio="none" className="w-full h-full">
          {Array.from({ length: 60 }).map((_, i) => {
            const x = i * 6.7 + Math.random() * 3;
            const h = 8 + Math.random() * 12;
            return (
              <line key={i} x1={x} y1="20" x2={x + (Math.random() - 0.5) * 5} y2={20 - h}
                stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" opacity={0.4 + Math.random() * 0.5} />
            );
          })}
        </svg>
      </div>

      {/* Butterflies / fireflies */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="absolute rounded-full"
          style={{
            width: `${1.5 + Math.random() * 1.5}px`,
            height: `${1.5 + Math.random() * 1.5}px`,
            background: i < 3 ? '#fde68a' : '#bbf7d0',
            left: `${10 + Math.random() * 80}%`,
            top: `${25 + Math.random() * 50}%`,
            animation: `firefly ${3 + Math.random() * 4}s ease-in-out ${Math.random() * 4}s infinite alternate`,
            opacity: 0,
            boxShadow: i < 3 ? '0 0 5px #fbbf24' : '0 0 4px #4ade80',
          }} />
      ))}

      {/* God-rays from sun */}
      <div className="absolute top-0 right-[10%] w-40 h-[55%] opacity-[0.06]"
        style={{ background: 'linear-gradient(180deg, rgba(251,191,36,0.5), transparent)', clipPath: 'polygon(35% 0%, 65% 0%, 85% 100%, 15% 100%)' }} />

      <style>{`
        @keyframes driftRight {
          from { transform: translateX(-120%); }
          to { transform: translateX(120vw); }
        }
        @keyframes firefly {
          0% { opacity: 0; transform: translate(0, 0); }
          50% { opacity: 0.7; }
          100% { opacity: 0; transform: translate(${20 - Math.random() * 40}px, ${-10 - Math.random() * 20}px); }
        }
      `}</style>
    </div>
  );
}

/* ── Urban Sprint ── */
function MediumScenery() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
      {/* Night sky gradient */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.3) 0%, rgba(30,41,59,0.2) 40%, rgba(245,158,11,0.1) 80%, rgba(245,158,11,0.18) 100%)' }} />

      {/* Road / asphalt ground */}
      <div className="absolute bottom-0 left-0 right-0 h-[15%]"
        style={{ background: 'linear-gradient(0deg, rgba(30,30,40,0.35), rgba(30,30,40,0.15) 60%, transparent)' }} />

      {/* Road markings */}
      <div className="absolute bottom-[3%] left-0 right-0 flex justify-center gap-8 opacity-15">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-6 h-0.5 bg-yellow-400 rounded-full" />
        ))}
      </div>

      {/* City skyline silhouette – taller, more detailed */}
      <div className="absolute bottom-[10%] left-0 right-0 opacity-20">
        <svg viewBox="0 0 800 180" preserveAspectRatio="none" className="w-full h-36 md:h-40">
          {/* Back row buildings (darker) */}
          <rect x="0" y="50" width="55" height="130" fill="#1e293b" />
          <rect x="60" y="10" width="40" height="170" fill="#0f172a" />
          <rect x="105" y="55" width="50" height="125" fill="#1e293b" />
          <rect x="160" y="0" width="45" height="180" fill="#0f172a" />
          <rect x="210" y="30" width="55" height="150" fill="#1e293b" />
          <rect x="270" y="18" width="35" height="162" fill="#0f172a" />
          <rect x="310" y="45" width="60" height="135" fill="#1e293b" />
          <rect x="380" y="5" width="50" height="175" fill="#0f172a" />
          <rect x="435" y="28" width="40" height="152" fill="#1e293b" />
          <rect x="480" y="55" width="55" height="125" fill="#0f172a" />
          <rect x="540" y="12" width="45" height="168" fill="#1e293b" />
          <rect x="590" y="38" width="35" height="142" fill="#0f172a" />
          <rect x="630" y="5" width="60" height="175" fill="#1e293b" />
          <rect x="695" y="32" width="48" height="148" fill="#0f172a" />
          <rect x="750" y="45" width="50" height="135" fill="#1e293b" />
          {/* Antennas */}
          <line x1="182" y1="0" x2="182" y2="-15" stroke="#334155" strokeWidth="2" />
          <circle cx="182" cy="-15" r="1.5" fill="#ef4444" opacity="0.8">
            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
          </circle>
          <line x1="405" y1="5" x2="405" y2="-10" stroke="#334155" strokeWidth="2" />
          <circle cx="405" cy="-10" r="1.5" fill="#ef4444" opacity="0.6">
            <animate attributeName="opacity" values="0.6;0.1;0.6" dur="3s" repeatCount="indefinite" />
          </circle>
          {/* Windows */}
          {Array.from({ length: 70 }).map((_, i) => {
            const bx = [10, 68, 115, 168, 220, 278, 320, 390, 443, 490, 548, 598, 645, 703, 758];
            const bi = i % bx.length;
            return (
              <rect key={i}
                x={bx[bi] + Math.random() * 28}
                y={30 + Math.floor(i / bx.length) * 20 + Math.random() * 15}
                width="3.5" height="4.5" rx="0.5"
                fill="#fef3c7" opacity={0.25 + Math.random() * 0.55}>
                {Math.random() > 0.5 && (
                  <animate attributeName="opacity" values={`${0.2 + Math.random() * 0.3};${0.5 + Math.random() * 0.4};${0.2 + Math.random() * 0.3}`}
                    dur={`${2 + Math.random() * 4}s`} repeatCount="indefinite" />
                )}
              </rect>
            );
          })}
        </svg>
      </div>

      {/* Street lamps */}
      {[{ x: '6%' }, { x: '94%' }].map((lamp, i) => (
        <div key={i} className="absolute bottom-[12%] opacity-25" style={{ left: lamp.x }}>
          <svg viewBox="0 0 10 40" className="w-3 h-12">
            <rect x="4" y="10" width="2" height="30" fill="#94a3b8" />
            <rect x="1" y="6" width="8" height="5" rx="2" fill="#fbbf24" opacity="0.6" />
            <circle cx="5" cy="8" r="6" fill="#fbbf24" opacity="0.15">
              <animate attributeName="opacity" values="0.15;0.25;0.15" dur="3s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      ))}

      {/* Neon signs on building edges */}
      <div className="absolute top-[18%] left-[2%] w-1 h-28 opacity-30 rounded-full"
        style={{ background: 'linear-gradient(180deg, transparent, #f59e0b, #f59e0b, transparent)', animation: 'neonPulse 3s ease-in-out infinite', boxShadow: '0 0 8px #f59e0b' }} />
      <div className="absolute top-[30%] right-[1%] w-1 h-20 opacity-25 rounded-full"
        style={{ background: 'linear-gradient(180deg, transparent, #3b82f6, #3b82f6, transparent)', animation: 'neonPulse 4s ease-in-out 1s infinite', boxShadow: '0 0 8px #3b82f6' }} />
      <div className="absolute top-[55%] left-[1%] w-1 h-16 opacity-20 rounded-full"
        style={{ background: 'linear-gradient(180deg, transparent, #ec4899, transparent)', animation: 'neonPulse 3.5s ease-in-out 2s infinite', boxShadow: '0 0 6px #ec4899' }} />

      {/* Horizontal traffic headlight streaks */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="absolute"
          style={{
            width: `${15 + Math.random() * 20}px`,
            height: '1.5px',
            background: i % 2 === 0 ? '#f59e0b' : '#ef4444',
            bottom: `${2 + i * 2}%`,
            left: '-5%',
            animation: `carLight ${2.5 + i * 0.8}s linear ${i * 1.2}s infinite`,
            opacity: 0.35,
            borderRadius: '2px',
            boxShadow: `0 0 6px ${i % 2 === 0 ? '#f59e0b' : '#ef4444'}`,
          }} />
      ))}

      {/* Smog / dust particles */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="absolute rounded-full"
          style={{
            width: `${4 + Math.random() * 5}px`,
            height: `${4 + Math.random() * 5}px`,
            background: 'rgba(245,158,11,0.12)',
            left: `${Math.random() * 100}%`,
            top: `${35 + Math.random() * 45}%`,
            animation: `urbanDust ${5 + Math.random() * 4}s ease-in-out ${Math.random() * 4}s infinite`,
            opacity: 0,
            filter: 'blur(1.5px)',
          }} />
      ))}

      {/* Stars in the night sky */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="absolute rounded-full bg-white"
          style={{
            width: '1.5px',
            height: '1.5px',
            left: `${8 + Math.random() * 84}%`,
            top: `${3 + Math.random() * 20}%`,
            opacity: 0.15 + Math.random() * 0.2,
            animation: `starTwinkle ${2 + Math.random() * 3}s ease-in-out ${Math.random() * 3}s infinite alternate`,
          }} />
      ))}

      <style>{`
        @keyframes neonPulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.4; }
        }
        @keyframes carLight {
          from { transform: translateX(-20px); }
          to { transform: translateX(110vw); }
        }
        @keyframes urbanDust {
          0% { opacity: 0; transform: translateX(0) translateY(0); }
          30% { opacity: 0.25; }
          100% { opacity: 0; transform: translateX(35px) translateY(-25px); }
        }
        @keyframes starTwinkle {
          0% { opacity: 0.1; }
          100% { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}

/* ── Nightmare Alley ── */
function HardScenery() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
      {/* Blood-red/purple atmospheric gradient */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(30,0,20,0.3) 0%, rgba(127,29,29,0.15) 40%, rgba(80,10,10,0.25) 100%)' }} />

      {/* Cracked/scorched ground at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[18%]"
        style={{ background: 'linear-gradient(0deg, rgba(40,5,5,0.45), rgba(60,10,10,0.2) 60%, transparent)' }} />

      {/* Jagged ruins / broken structures silhouette */}
      <div className="absolute bottom-[12%] left-0 right-0 opacity-20">
        <svg viewBox="0 0 800 100" preserveAspectRatio="none" className="w-full h-24 md:h-28">
          {/* Broken pillars and ruins */}
          <polygon points="0,100 0,65 15,60 20,45 25,50 30,100" fill="#1a0000" />
          <polygon points="50,100 50,35 55,28 60,20 65,30 75,38 80,100" fill="#2a0505" />
          <polygon points="120,100 120,50 130,42 140,55 145,40 150,48 155,100" fill="#1a0000" />
          <polygon points="200,100 200,25 210,15 215,5 220,12 230,28 235,100" fill="#2a0505" />
          <polygon points="300,100 305,55 315,45 320,60 325,38 328,45 335,100" fill="#1a0000" />
          <polygon points="400,100 400,30 410,20 420,10 425,18 430,25 440,100" fill="#2a0505" />
          <polygon points="500,100 505,48 515,35 520,50 530,42 535,100" fill="#1a0000" />
          <polygon points="580,100 580,22 590,12 600,8 605,15 615,30 620,100" fill="#2a0505" />
          <polygon points="680,100 685,55 695,40 700,50 710,35 715,45 720,100" fill="#1a0000" />
          <polygon points="760,100 760,38 770,25 780,30 790,20 800,35 800,100" fill="#2a0505" />
          {/* Bare dead tree */}
          <line x1="170" y1="55" x2="170" y2="25" stroke="#3d0d0d" strokeWidth="3" />
          <line x1="170" y1="30" x2="160" y2="18" stroke="#3d0d0d" strokeWidth="1.5" />
          <line x1="170" y1="35" x2="182" y2="22" stroke="#3d0d0d" strokeWidth="1.5" />
          <line x1="170" y1="40" x2="158" y2="32" stroke="#3d0d0d" strokeWidth="1" />
          {/* Another dead tree */}
          <line x1="650" y1="50" x2="650" y2="20" stroke="#3d0d0d" strokeWidth="2.5" />
          <line x1="650" y1="25" x2="640" y2="14" stroke="#3d0d0d" strokeWidth="1.5" />
          <line x1="650" y1="30" x2="662" y2="18" stroke="#3d0d0d" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Creeping fog at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 opacity-25"
        style={{ 
          background: 'linear-gradient(0deg, rgba(80,10,10,0.5), rgba(60,5,5,0.3) 40%, transparent)',
          animation: 'fogDrift 12s ease-in-out infinite alternate',
        }} />
      {/* Second fog layer for depth */}
      <div className="absolute bottom-0 left-0 right-0 h-20 opacity-15"
        style={{ 
          background: 'linear-gradient(0deg, rgba(100,20,20,0.4), transparent)',
          animation: 'fogDrift 8s ease-in-out 3s infinite alternate-reverse',
        }} />

      {/* Dark crimson fog in center */}
      <div className="absolute inset-0 opacity-12"
        style={{ background: 'radial-gradient(ellipse at center 65%, rgba(127,29,29,0.45), transparent 65%)' }} />

      {/* Floating embers / sparks rising */}
      {Array.from({ length: 16 }).map((_, i) => (
        <div key={i} className="absolute rounded-full"
          style={{
            width: `${1 + Math.random() * 2.5}px`,
            height: `${1 + Math.random() * 2.5}px`,
            background: i % 3 === 0 ? '#ef4444' : i % 3 === 1 ? '#f59e0b' : '#fbbf24',
            left: `${Math.random() * 100}%`,
            bottom: `${Math.random() * 30}%`,
            animation: `ember ${3 + Math.random() * 5}s ease-out ${Math.random() * 5}s infinite`,
            opacity: 0,
            boxShadow: `0 0 4px ${i % 3 === 0 ? '#ef4444' : '#f59e0b'}`,
          }} />
      ))}

      {/* Menacing eyes in shadows */}
      {[
        { left: '4%', top: '28%', size: 'w-10 h-5' },
        { left: '90%', top: '48%', size: 'w-9 h-4' },
        { left: '7%', top: '62%', size: 'w-8 h-4' },
        { left: '88%', top: '35%', size: 'w-7 h-3' },
      ].map((pos, i) => (
        <div key={i} className={`absolute ${pos.size}`} style={{ left: pos.left, top: pos.top, animation: `eyeBlink 6s ease-in-out ${i * 2.5}s infinite` }}>
          <svg viewBox="0 0 30 12" className="w-full h-full opacity-25">
            <ellipse cx="8" cy="6" rx="5" ry="3" fill="#ef4444">
              <animate attributeName="ry" values="3;0.5;3" dur="0.3s" begin={`${4 + i * 2.5}s`} repeatCount="1" />
            </ellipse>
            <ellipse cx="22" cy="6" rx="5" ry="3" fill="#ef4444">
              <animate attributeName="ry" values="3;0.5;3" dur="0.3s" begin={`${4 + i * 2.5}s`} repeatCount="1" />
            </ellipse>
            <circle cx="7" cy="5" r="1.5" fill="#ff8888" opacity="0.6" />
            <circle cx="21" cy="5" r="1.5" fill="#ff8888" opacity="0.6" />
          </svg>
        </div>
      ))}

      {/* Heavy vignette */}
      <div className="absolute inset-0 opacity-55"
        style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.9) 100%)' }} />

      {/* Lightning flash */}
      <div className="absolute inset-0 bg-white opacity-0"
        style={{ animation: 'lightning 8s ease-in-out 3s infinite' }} />

      {/* Dripping blood effect on edges */}
      <div className="absolute top-0 left-[8%] w-1 h-12 opacity-15 rounded-b-full"
        style={{ background: 'linear-gradient(180deg, transparent, #7f1d1d, #991b1b)', animation: 'drip 5s ease-in 0s infinite' }} />
      <div className="absolute top-0 left-[72%] w-0.5 h-8 opacity-10 rounded-b-full"
        style={{ background: 'linear-gradient(180deg, transparent, #7f1d1d)', animation: 'drip 7s ease-in 2s infinite' }} />
      <div className="absolute top-0 right-[15%] w-1 h-10 opacity-12 rounded-b-full"
        style={{ background: 'linear-gradient(180deg, transparent, #991b1b)', animation: 'drip 6s ease-in 4s infinite' }} />

      {/* Cracks / scratches overlay */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ 
          backgroundImage: `repeating-linear-gradient(52deg, transparent, transparent 97%, rgba(255,60,60,0.4) 97%, rgba(255,60,60,0.4) 100%)`,
          backgroundSize: '180px 180px',
        }} />

      <style>{`
        @keyframes ember {
          0% { opacity: 0; transform: translateY(0) translateX(0) scale(1); }
          15% { opacity: 0.9; }
          100% { opacity: 0; transform: translateY(-250px) translateX(${-25 + Math.random() * 50}px) scale(0.2); }
        }
        @keyframes eyeBlink {
          0%, 88%, 100% { opacity: 0.25; }
          90%, 96% { opacity: 0; }
        }
        @keyframes lightning {
          0%, 93%, 95.5%, 97.5%, 100% { opacity: 0; }
          94% { opacity: 0.12; }
          96% { opacity: 0.06; }
          98% { opacity: 0.03; }
        }
        @keyframes fogDrift {
          0% { transform: translateX(-20px); }
          100% { transform: translateX(20px); }
        }
        @keyframes drip {
          0% { transform: translateY(-100%); opacity: 0; }
          30% { opacity: 0.15; }
          100% { transform: translateY(30px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ── Disco Dash ── */
function PartyScenery() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
      {/* Rotating color sweep */}
      <div className="absolute inset-0 opacity-[0.08]"
        style={{
          background: 'conic-gradient(from 0deg at 50% 50%, #a855f7, #06b6d4, #f59e0b, #ef4444, #ec4899, #a855f7)',
          animation: 'discoSpin 10s linear infinite',
        }} />

      {/* Dance floor tiles at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[16%] opacity-20"
        style={{ background: 'linear-gradient(0deg, rgba(168,85,247,0.35), rgba(6,182,212,0.15) 60%, transparent)' }}>
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-2 gap-px opacity-60">
          {Array.from({ length: 16 }).map((_, i) => {
            const colors = ['#a855f7', '#06b6d4', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6'];
            return (
              <div key={i} className="rounded-sm"
                style={{
                  background: colors[i % colors.length],
                  opacity: 0.15,
                  animation: `tileFlash ${1 + Math.random() * 2}s ease-in-out ${Math.random() * 2}s infinite alternate`,
                }} />
            );
          })}
        </div>
      </div>

      {/* Disco ball at top center – bigger */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-12 md:w-16 md:h-16">
        {/* String */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-3 bg-gray-400 opacity-20" />
        <svg viewBox="0 0 40 40" className="w-full h-full opacity-30">
          <circle cx="20" cy="20" r="15" fill="url(#discoBallGrad)" />
          <circle cx="20" cy="20" r="15" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
          {/* More detailed facets */}
          {Array.from({ length: 16 }).map((_, i) => (
            <rect key={i}
              x={9 + (i % 4) * 5.5} y={9 + Math.floor(i / 4) * 5.5}
              width="3.5" height="3.5" rx="0.5"
              fill="rgba(255,255,255,0.35)"
              style={{ animation: `discoBallFacet ${0.3 + Math.random() * 0.8}s ease-in-out ${Math.random()}s infinite alternate` }} />
          ))}
          {/* Shine highlight */}
          <circle cx="14" cy="14" r="4" fill="rgba(255,255,255,0.15)" />
          <defs>
            <radialGradient id="discoBallGrad">
              <stop offset="0%" stopColor="rgba(220,220,220,0.35)" />
              <stop offset="100%" stopColor="rgba(100,100,100,0.12)" />
            </radialGradient>
          </defs>
        </svg>
        {/* Rotation glimmer */}
        <div className="absolute inset-0 rounded-full opacity-15"
          style={{ background: 'conic-gradient(from 0deg, transparent, rgba(255,255,255,0.3), transparent, rgba(255,255,255,0.2), transparent)', animation: 'discoSpin 4s linear infinite' }} />
      </div>

      {/* Disco reflection dots – colorful scattered light */}
      {Array.from({ length: 22 }).map((_, i) => {
        const colors = ['#a855f7', '#06b6d4', '#f59e0b', '#ec4899', '#22c55e', '#3b82f6', '#f43e5c'];
        return (
          <div key={i} className="absolute rounded-full"
            style={{
              width: `${3 + Math.random() * 7}px`,
              height: `${3 + Math.random() * 7}px`,
              background: colors[i % colors.length],
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `discoDot ${0.8 + Math.random() * 1.5}s ease-in-out ${Math.random() * 2}s infinite alternate`,
              opacity: 0,
              boxShadow: `0 0 8px ${colors[i % colors.length]}`,
              filter: 'blur(0.5px)',
            }} />
        );
      })}

      {/* Stage spotlights from top */}
      {[
        { left: '5%', color: '#a855f7', delay: '0s', w: '4px' },
        { left: '25%', color: '#06b6d4', delay: '0.7s', w: '3px' },
        { left: '50%', color: '#ec4899', delay: '1.4s', w: '4px' },
        { left: '75%', color: '#f59e0b', delay: '0.3s', w: '3px' },
        { left: '95%', color: '#22c55e', delay: '1s', w: '3px' },
      ].map((beam, i) => (
        <div key={i} className="absolute top-0 origin-top"
          style={{
            left: beam.left,
            width: beam.w,
            height: '100%',
            background: `linear-gradient(180deg, ${beam.color}66, ${beam.color}22 40%, transparent 60%)`,
            animation: `beamSway 3.5s ease-in-out ${beam.delay} infinite alternate`,
            opacity: 0.3,
            filter: 'blur(1px)',
          }} />
      ))}

      {/* Musical notes floating up */}
      {['♪', '♫', '♩', '♬'].map((note, i) => (
        <div key={i} className="absolute text-xs opacity-0"
          style={{
            left: `${15 + i * 20}%`,
            bottom: '10%',
            color: ['#a855f7', '#06b6d4', '#ec4899', '#f59e0b'][i],
            animation: `noteFloat ${4 + i}s ease-out ${i * 1.5}s infinite`,
            textShadow: `0 0 6px ${['#a855f7', '#06b6d4', '#ec4899', '#f59e0b'][i]}`,
          }}>
          {note}
        </div>
      ))}

      {/* Star bursts */}
      {Array.from({ length: 4 }).map((_, i) => {
        const x = 15 + i * 22;
        const y = 15 + Math.random() * 55;
        return (
          <svg key={i} viewBox="0 0 20 20" className="absolute w-4 h-4 opacity-0"
            style={{
              left: `${x}%`, top: `${y}%`,
              animation: `starBurst ${1.5 + Math.random() * 2}s ease-in-out ${Math.random() * 3}s infinite`,
            }}>
            <path d="M10 0 L11.5 7 L18 5 L13 10 L18 15 L11.5 13 L10 20 L8.5 13 L2 15 L7 10 L2 5 L8.5 7 Z"
              fill="white" opacity="0.6" />
          </svg>
        );
      })}

      <style>{`
        @keyframes discoSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes discoDot {
          0% { opacity: 0; transform: scale(0.4); }
          100% { opacity: 0.6; transform: scale(1.4); }
        }
        @keyframes beamSway {
          0% { transform: rotate(-12deg); }
          100% { transform: rotate(12deg); }
        }
        @keyframes discoBallFacet {
          0% { opacity: 0.15; }
          100% { opacity: 0.7; }
        }
        @keyframes tileFlash {
          0% { opacity: 0.08; }
          100% { opacity: 0.3; }
        }
        @keyframes noteFloat {
          0% { opacity: 0; transform: translateY(0) rotate(0deg); }
          20% { opacity: 0.4; }
          100% { opacity: 0; transform: translateY(-120px) rotate(20deg); }
        }
        @keyframes starBurst {
          0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
          50% { opacity: 0.55; transform: scale(1.3) rotate(45deg); }
        }
      `}</style>
    </div>
  );
}
