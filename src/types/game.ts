export type GameState = 'IDLE' | 'GREEN_LIGHT' | 'YELLOW_LIGHT' | 'RED_LIGHT' | 'HIT' | 'WIN';
export type GameMode = 'SINGLE' | 'MULTIPLAYER';
export type PlayerSide = 'LEFT' | 'RIGHT';

export interface Level {
  id: string;
  name: string;
  description: string;
  theme: LevelTheme;
  config: GameConfig;
  icon: string;
}

export interface LevelTheme {
  background: string;
  primaryColor: string;
  accentColor: string;
  bgGradient: string;
}

export interface GameConfig {
  greenLightMinDuration: number;
  greenLightMaxDuration: number;
  yellowLightDuration: number;
  redLightMinDuration: number;
  redLightMaxDuration: number;
  goalDistance: number;
  speedMultiplier: number;
  penaltyPercent: number;
  movementThreshold: number; // Higher = less strict
}

export interface PlayerState {
  position: number;
  score: number;
  hitCount: number;
  isRunning: boolean;
  stepCount: number;
  hasWon: boolean;
}

export const LEVELS: Level[] = [
  {
    id: 'easy',
    name: 'Sunny Meadow',
    description: 'Relaxed pace, gentle timing',
    icon: '🌈',
    theme: {
      background: 'from-green-900/50 to-background',
      primaryColor: 'hsl(142 76% 50%)',
      accentColor: 'hsl(45 100% 60%)',
      bgGradient: 'linear-gradient(180deg, hsl(142 40% 20%), hsl(100 30% 10%))'
    },
    config: {
      greenLightMinDuration: 6000,
      greenLightMaxDuration: 10000,
      yellowLightDuration: 3500,
      redLightMinDuration: 1500,
      redLightMaxDuration: 2500,
      goalDistance: 80,
      speedMultiplier: 7,
      penaltyPercent: 0.2,
      movementThreshold: 0.025
    }
  },
  {
    id: 'medium',
    name: 'Urban Sprint',
    description: 'Balanced challenge',
    icon: '🏙️',
    theme: {
      background: 'from-orange-900/50 to-background',
      primaryColor: 'hsl(35 95% 55%)',
      accentColor: 'hsl(200 90% 55%)',
      bgGradient: 'linear-gradient(180deg, hsl(35 40% 18%), hsl(220 25% 12%))'
    },
    config: {
      greenLightMinDuration: 4000,
      greenLightMaxDuration: 7000,
      yellowLightDuration: 2500,
      redLightMinDuration: 2000,
      redLightMaxDuration: 3500,
      goalDistance: 100,
      speedMultiplier: 5,
      penaltyPercent: 0.35,
      movementThreshold: 0.018
    }
  },
  {
    id: 'hard',
    name: 'Nightmare Alley',
    description: 'Razor-sharp reflexes needed',
    icon: '💀',
    theme: {
      background: 'from-red-900/50 to-background',
      primaryColor: 'hsl(0 85% 55%)',
      accentColor: 'hsl(270 60% 60%)',
      bgGradient: 'linear-gradient(180deg, hsl(0 50% 12%), hsl(270 30% 8%))'
    },
    config: {
      greenLightMinDuration: 2000,
      greenLightMaxDuration: 4000,
      yellowLightDuration: 1200,
      redLightMinDuration: 2500,
      redLightMaxDuration: 5000,
      goalDistance: 120,
      speedMultiplier: 4,
      penaltyPercent: 0.5,
      movementThreshold: 0.01
    }
  },
  {
    id: 'party',
    name: 'Disco Dash',
    description: 'Wild and unpredictable!',
    icon: '🪩',
    theme: {
      background: 'from-purple-900/50 to-background',
      primaryColor: 'hsl(280 80% 60%)',
      accentColor: 'hsl(180 80% 55%)',
      bgGradient: 'linear-gradient(180deg, hsl(280 50% 18%), hsl(320 40% 12%))'
    },
    config: {
      greenLightMinDuration: 1000,
      greenLightMaxDuration: 3000,
      yellowLightDuration: 800,
      redLightMinDuration: 500,
      redLightMaxDuration: 2000,
      goalDistance: 80,
      speedMultiplier: 8,
      penaltyPercent: 0.15,
      movementThreshold: 0.022
    }
  }
];

export const DEFAULT_GAME_CONFIG: GameConfig = LEVELS[1].config;
