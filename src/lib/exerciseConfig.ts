// Exercise Configuration - Updated with new exercise system
// Beginner (front-facing): arm_raise, torso_twist, knee_raise
// Intermediate (side-facing): squat_arm_raise, push_up, static_lunge
// Advanced (dynamic): jump_squat, plank_hold, mountain_climber
// Expert (multi-movement): pistol_squat, pushup_shoulder_tap, burpee

export type ExerciseType =
  // Beginner exercises (front-facing camera)
  | 'arm_raise'
  | 'torso_twist'
  | 'knee_raise'
  // Intermediate exercises (side-facing camera)
  | 'squat_arm_raise'
  | 'push_up'
  | 'static_lunge'
  // Advanced exercises (dynamic)
  | 'jump_squat'
  | 'plank_hold'
  | 'mountain_climber'
  // Expert exercises (multi-movement)
  | 'pistol_squat'
  | 'pushup_shoulder_tap'
  | 'burpee';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type FormQuality = 'good' | 'warn' | 'bad';
export type TempoQuality = 'perfect' | 'good' | 'too_fast' | 'too_slow' | 'inconsistent';
export type ExerciseStage = 'up' | 'down' | 'center' | 'left' | 'right' | 'idle' | 'transition' 
  | 'left_up' | 'right_up' | 'squat' | 'plank' | 'jump' | 'hold' | 'tap_left' | 'tap_right';

// Camera orientation for each exercise
export type CameraOrientation = 'front' | 'side';

// Coach Event Types
export type CoachEventType = 
  | 'session_start'
  | 'exercise_start'
  | 'rep_completed'
  | 'rep_counted_audio'
  | 'target_reps_reached'
  | 'good_form'
  | 'warn_form'
  | 'bad_form'
  | 'halfway'
  | 'almost_done'
  | 'exercise_complete'
  | 'session_complete'
  | 'countdown'
  | 'movement_too_fast'
  | 'movement_too_slow'
  | 'movement_jerky'
  | 'movement_smooth'
  | 'motion_detected'
  | 'no_motion'
  | 'hold_progress';

// Exercise definitions with thresholds
export interface ExerciseDefinition {
  id: ExerciseType;
  name: string;
  nameTh: string;
  description: string;
  descriptionTh: string;
  icon: string;
  camera: CameraOrientation;
  isTimeBased?: boolean; // For exercises like plank_hold
  // Stage detection thresholds
  stages: string[];
  thresholds: Record<string, number>;
}

export const EXERCISES: Record<ExerciseType, ExerciseDefinition> = {
  // ============================================
  // === BEGINNER EXERCISES (Front-facing) ===
  // ============================================
  
  arm_raise: {
    id: 'arm_raise',
    name: 'Arm Raise',
    nameTh: 'ยกแขนขึ้น-ลง',
    description: 'Raise both arms up and down. Focus on shoulder mobility and symmetry.',
    descriptionTh: 'ยกแขนทั้งสองข้างขึ้นลง เน้นคลายไหล่และดูสมมาตรซ้าย-ขวา',
    icon: 'arm',
    camera: 'front',
    stages: ['up', 'down'],
    thresholds: {
      up_angle: 150,      // angle >= 150° means arms fully up
      down_angle: 50,     // angle <= 50° means arms down
      symmetry_diff: 30,  // max angle diff between arms for symmetry check
    }
  },
  
  torso_twist: {
    id: 'torso_twist',
    name: 'Torso Twist',
    nameTh: 'บิดลำตัวซ้าย-ขวา',
    description: 'Twist torso left and right. Measure angle between shoulder line and hip line.',
    descriptionTh: 'บิดลำตัวไปซ้ายและขวา เน้นคลายหลังและเอว วัดมุมระหว่างเส้นไหล่กับเส้นสะโพก 20-40°',
    icon: 'torso',
    camera: 'front',
    stages: ['center', 'left', 'right'],
    thresholds: {
      min_twist_angle: 20,  // minimum twist angle in degrees
      max_twist_angle: 40,  // maximum twist angle for good form
      twist_threshold: 0.12, // horizontal offset for twist detection
    }
  },
  
  knee_raise: {
    id: 'knee_raise',
    name: 'Knee Raise',
    nameTh: 'ยกเข่าสลับ',
    description: 'Alternate knee raises. Hip flexion angle > 80° to pass.',
    descriptionTh: 'ยกเข่าสลับซ้ายขวา ใช้เตรียมร่างกาย/คาร์ดิโอเบาๆ มุมสะโพก > 80°',
    icon: 'leg',
    camera: 'side', // Side camera is more accurate
    stages: ['up', 'down'],
    thresholds: {
      up_angle: 80,      // hip flexion angle > 80° means knee is raised
      down_angle: 160,   // hip flexion angle > 160° means leg is down
    }
  },

  // ============================================
  // === INTERMEDIATE EXERCISES (Side-facing) ===
  // ============================================

  squat_arm_raise: {
    id: 'squat_arm_raise',
    name: 'Squat with Arm Raise',
    nameTh: 'สควอตพร้อมยกแขน',
    description: 'Squat while raising arms. Knee < 95° down, > 150° up, arms > 140°.',
    descriptionTh: 'นั่งสควอตพร้อมยกแขนขึ้น ฝึกกล้ามเนื้อขา สะโพก และไหล่',
    icon: 'squat-arm',
    camera: 'side',
    stages: ['down', 'up'],
    thresholds: {
      knee_down_angle: 95,   // knee angle < 95° when squatting down
      knee_up_angle: 150,    // knee angle > 150° when standing up
      arm_up_angle: 140,     // arm angle > 140° when raised
      arm_down_angle: 60,    // arm angle < 60° when down
    }
  },

  push_up: {
    id: 'push_up',
    name: 'Push-up',
    nameTh: 'วิดพื้น',
    description: 'Standard push-up. Elbow < 90° down, > 160° up. Focus on chest, arms, and core.',
    descriptionTh: 'วิดพื้น เน้นอก แขน และ core ศอก < 90° ตอนลง / > 160° ตอนขึ้น',
    icon: 'pushup',
    camera: 'side',
    stages: ['down', 'up'],
    thresholds: {
      elbow_down_angle: 90,   // elbow angle < 90° when down
      elbow_up_angle: 160,    // elbow angle > 160° when up
      body_alignment: 15,      // max deviation from straight line
    }
  },

  static_lunge: {
    id: 'static_lunge',
    name: 'Static Lunge',
    nameTh: 'ลันจ์ยืน',
    description: 'Static lunge position. Front knee ~90°. Trains legs and balance.',
    descriptionTh: 'ท่าลันจ์ค้าง ฝึกขาและการทรงตัว เข่าหน้า ~90°',
    icon: 'lunge',
    camera: 'side',
    stages: ['down', 'up'],
    thresholds: {
      front_knee_angle: 90,   // target front knee angle
      knee_tolerance: 15,     // ±15° tolerance
      back_knee_angle: 100,   // back knee angle reference
    }
  },

  // ============================================
  // === ADVANCED EXERCISES (Dynamic) ===
  // ============================================

  jump_squat: {
    id: 'jump_squat',
    name: 'Jump Squat',
    nameTh: 'กระโดดสควอต',
    description: 'Jump squat with explosive power. Knee < 95° + detect airborne phase.',
    descriptionTh: 'กระโดดพร้อมทำสควอต ตรวจจับช่วงลอยตัว ฝึกพลังระเบิด',
    icon: 'jump-squat',
    camera: 'side',
    stages: ['squat', 'jump', 'down'],
    thresholds: {
      knee_squat_angle: 95,     // knee angle < 95° in squat
      knee_standing_angle: 160,  // knee angle > 160° when standing
      jump_height_ratio: 0.05,   // vertical movement threshold for jump detection
      land_threshold: 0.02,      // landing detection threshold
    }
  },

  plank_hold: {
    id: 'plank_hold',
    name: 'Plank Hold',
    nameTh: 'ท่าแพลงค์',
    description: 'Hold plank position. Body alignment deviation < 10°. Time-based scoring.',
    descriptionTh: 'ท่าแพลงค์ค้าง ลำตัวตรง (shoulder-hip-ankle deviation < 10°) จับเวลาแทนนับครั้ง',
    icon: 'plank',
    camera: 'side',
    isTimeBased: true,
    stages: ['hold', 'idle'],
    thresholds: {
      body_alignment_max: 10,   // max deviation from straight line in degrees
      min_hold_time: 5,         // minimum seconds to count as valid hold
      shoulder_hip_angle: 180,  // target angle for straight body
      hip_ankle_angle: 180,     // target angle for straight body
    }
  },

  mountain_climber: {
    id: 'mountain_climber',
    name: 'Mountain Climber',
    nameTh: 'ปีนเขา',
    description: 'Mountain climber exercise. Measures hip flexion and speed.',
    descriptionTh: 'ท่าปีนเขา วัด hip flexion และความเร็ว',
    icon: 'mountain',
    camera: 'side',
    stages: ['left_up', 'right_up', 'down'],
    thresholds: {
      hip_flexion_angle: 70,    // hip flexion angle when knee is up
      hip_extended_angle: 160,  // hip angle when leg is back
      min_speed: 0.08,          // minimum movement speed
      step_cooldown: 200,       // ms between steps
    }
  },

  // ============================================
  // === EXPERT EXERCISES (Multi-movement) ===
  // ============================================

  pistol_squat: {
    id: 'pistol_squat',
    name: 'Pistol Squat',
    nameTh: 'สควอตขาเดียว',
    description: 'Single-leg squat. Knee < 90°. Requires excellent balance.',
    descriptionTh: 'สควอตขาเดียว เข่า < 90° ต้อง balance ดี',
    icon: 'pistol',
    camera: 'side',
    stages: ['down', 'up'],
    thresholds: {
      knee_angle: 90,           // standing knee angle < 90° when down
      extended_leg_angle: 160,  // extended leg should be straight
      balance_threshold: 0.1,   // hip stability threshold
    }
  },

  pushup_shoulder_tap: {
    id: 'pushup_shoulder_tap',
    name: 'Push-up + Shoulder Tap',
    nameTh: 'วิดพื้น + แตะไหล่',
    description: 'Push-up followed by shoulder taps. Check symmetry and body tilt.',
    descriptionTh: 'วิดพื้นแล้วแตะไหล่สลับ เช็คสมมาตรและการเอียงลำตัว',
    icon: 'pushup-tap',
    camera: 'front',
    stages: ['down', 'up', 'tap_left', 'tap_right'],
    thresholds: {
      elbow_down_angle: 90,     // elbow angle < 90° when down
      elbow_up_angle: 160,      // elbow angle > 160° when up
      tilt_threshold: 0.1,      // body tilt threshold during tap
      tap_height: 0.15,         // hand must rise this much for tap
    }
  },

  burpee: {
    id: 'burpee',
    name: 'Burpee',
    nameTh: 'เบอร์พี',
    description: 'Full burpee with state machine: squat → plank → jump.',
    descriptionTh: 'เบอร์พีเต็มรูปแบบ ใช้ state machine (squat → plank → jump)',
    icon: 'burpee',
    camera: 'side',
    stages: ['squat', 'plank', 'jump', 'up'],
    thresholds: {
      squat_knee_angle: 100,    // knee angle in squat position
      plank_body_angle: 170,    // body should be relatively straight in plank
      jump_height_ratio: 0.05,  // vertical movement for jump detection
      phase_hold_time: 200,     // ms to confirm each phase
    }
  }
};

// Difficulty level settings
export interface DifficultySettings {
  duration: number;      // seconds per exercise
  minReps: number;       // minimum target reps
  tempo: string;         // "up-down" seconds (e.g., "2-2")
  upDuration: number;    // seconds for up phase
  downDuration: number;  // seconds for down phase
  formStrictness: number; // 0-1, higher = stricter form checking
  restTime: number;      // seconds between exercises
  emoji: string;
  holdDuration?: number; // for time-based exercises like plank
}

export const DIFFICULTY_LEVELS: Record<DifficultyLevel, DifficultySettings> = {
  beginner: {
    duration: 30,
    minReps: 5,
    tempo: '3-3',
    upDuration: 3,
    downDuration: 3,
    formStrictness: 0.6,
    restTime: 15,
    emoji: '🌱',
    holdDuration: 15,
  },
  intermediate: {
    duration: 45,
    minReps: 10,
    tempo: '2-2',
    upDuration: 2,
    downDuration: 2,
    formStrictness: 0.75,
    restTime: 10,
    emoji: '💪',
    holdDuration: 30,
  },
  advanced: {
    duration: 60,
    minReps: 15,
    tempo: '1.5-1.5',
    upDuration: 1.5,
    downDuration: 1.5,
    formStrictness: 0.85,
    restTime: 5,
    emoji: '🔥',
    holdDuration: 45,
  },
  expert: {
    duration: 90,
    minReps: 20,
    tempo: '1-1',
    upDuration: 1,
    downDuration: 1,
    formStrictness: 0.95,
    restTime: 0,
    emoji: '⚡',
    holdDuration: 60,
  }
};

// Tempo analysis thresholds
export const TEMPO_CONFIG = {
  IDEAL_UP_DURATION: 2.0,
  IDEAL_DOWN_DURATION: 2.0,
  IDEAL_TOTAL_DURATION: 4.0,
  TEMPO_TOLERANCE: 0.5,
  BEAT_INTERVAL: 0.5, // seconds per beat count
  MIN_REP_DURATION: 1.0,
  MAX_REP_DURATION: 10.0,
};

// Visual guide target poses (normalized coordinates 0-1)
export interface TargetPose {
  [jointName: string]: { x: number; y: number };
}

export const TARGET_POSES: Record<ExerciseType, Record<string, TargetPose>> = {
  // === BEGINNER EXERCISES ===
  arm_raise: {
    up: {
      left_shoulder: { x: 0.6, y: 0.35 },
      right_shoulder: { x: 0.4, y: 0.35 },
      left_elbow: { x: 0.7, y: 0.2 },
      right_elbow: { x: 0.3, y: 0.2 },
      left_wrist: { x: 0.75, y: 0.1 },
      right_wrist: { x: 0.25, y: 0.1 },
    },
    down: {
      left_shoulder: { x: 0.6, y: 0.35 },
      right_shoulder: { x: 0.4, y: 0.35 },
      left_elbow: { x: 0.65, y: 0.5 },
      right_elbow: { x: 0.35, y: 0.5 },
      left_wrist: { x: 0.68, y: 0.65 },
      right_wrist: { x: 0.32, y: 0.65 },
    }
  },
  
  torso_twist: {
    center: {
      left_shoulder: { x: 0.6, y: 0.35 },
      right_shoulder: { x: 0.4, y: 0.35 },
    },
    left: {
      left_shoulder: { x: 0.55, y: 0.35 },
      right_shoulder: { x: 0.35, y: 0.38 },
    },
    right: {
      left_shoulder: { x: 0.65, y: 0.38 },
      right_shoulder: { x: 0.45, y: 0.35 },
    }
  },
  
  knee_raise: {
    up: {
      left_hip: { x: 0.55, y: 0.55 },
      left_knee: { x: 0.55, y: 0.45 },
      left_ankle: { x: 0.52, y: 0.55 },
      right_hip: { x: 0.45, y: 0.55 },
      right_knee: { x: 0.45, y: 0.75 },
      right_ankle: { x: 0.45, y: 0.95 },
    },
    down: {
      left_hip: { x: 0.55, y: 0.55 },
      left_knee: { x: 0.55, y: 0.75 },
      left_ankle: { x: 0.55, y: 0.95 },
      right_hip: { x: 0.45, y: 0.55 },
      right_knee: { x: 0.45, y: 0.75 },
      right_ankle: { x: 0.45, y: 0.95 },
    }
  },

  // === INTERMEDIATE EXERCISES ===
  squat_arm_raise: {
    down: {
      left_hip: { x: 0.55, y: 0.65 },
      left_knee: { x: 0.55, y: 0.8 },
      left_ankle: { x: 0.55, y: 0.95 },
      right_hip: { x: 0.45, y: 0.65 },
      right_knee: { x: 0.45, y: 0.8 },
      right_ankle: { x: 0.45, y: 0.95 },
      left_shoulder: { x: 0.6, y: 0.4 },
      right_shoulder: { x: 0.4, y: 0.4 },
      left_wrist: { x: 0.7, y: 0.25 },
      right_wrist: { x: 0.3, y: 0.25 },
    },
    up: {
      left_hip: { x: 0.55, y: 0.55 },
      left_knee: { x: 0.55, y: 0.75 },
      left_ankle: { x: 0.55, y: 0.95 },
      right_hip: { x: 0.45, y: 0.55 },
      right_knee: { x: 0.45, y: 0.75 },
      right_ankle: { x: 0.45, y: 0.95 },
      left_shoulder: { x: 0.6, y: 0.35 },
      right_shoulder: { x: 0.4, y: 0.35 },
      left_wrist: { x: 0.65, y: 0.5 },
      right_wrist: { x: 0.35, y: 0.5 },
    }
  },

  push_up: {
    down: {
      left_shoulder: { x: 0.45, y: 0.35 },
      left_elbow: { x: 0.35, y: 0.45 },
      left_wrist: { x: 0.30, y: 0.55 },
      left_hip: { x: 0.55, y: 0.45 },
      left_ankle: { x: 0.75, y: 0.55 },
    },
    up: {
      left_shoulder: { x: 0.40, y: 0.30 },
      left_elbow: { x: 0.35, y: 0.35 },
      left_wrist: { x: 0.30, y: 0.45 },
      left_hip: { x: 0.55, y: 0.40 },
      left_ankle: { x: 0.75, y: 0.50 },
    }
  },

  static_lunge: {
    down: {
      left_hip: { x: 0.45, y: 0.50 },
      left_knee: { x: 0.35, y: 0.65 },
      left_ankle: { x: 0.30, y: 0.90 },
      right_hip: { x: 0.50, y: 0.50 },
      right_knee: { x: 0.60, y: 0.75 },
      right_ankle: { x: 0.70, y: 0.90 },
    },
    up: {
      left_hip: { x: 0.45, y: 0.45 },
      left_knee: { x: 0.40, y: 0.60 },
      left_ankle: { x: 0.35, y: 0.90 },
      right_hip: { x: 0.50, y: 0.45 },
      right_knee: { x: 0.55, y: 0.70 },
      right_ankle: { x: 0.65, y: 0.90 },
    }
  },

  // === ADVANCED EXERCISES ===
  jump_squat: {
    squat: {
      left_hip: { x: 0.55, y: 0.65 },
      left_knee: { x: 0.6, y: 0.8 },
      left_ankle: { x: 0.55, y: 0.95 },
      right_hip: { x: 0.45, y: 0.65 },
      right_knee: { x: 0.4, y: 0.8 },
      right_ankle: { x: 0.45, y: 0.95 },
    },
    jump: {
      left_hip: { x: 0.55, y: 0.5 },
      left_knee: { x: 0.55, y: 0.65 },
      left_ankle: { x: 0.55, y: 0.85 },
      right_hip: { x: 0.45, y: 0.5 },
      right_knee: { x: 0.45, y: 0.65 },
      right_ankle: { x: 0.45, y: 0.85 },
    },
    down: {
      left_hip: { x: 0.55, y: 0.55 },
      left_knee: { x: 0.55, y: 0.75 },
      left_ankle: { x: 0.55, y: 0.95 },
      right_hip: { x: 0.45, y: 0.55 },
      right_knee: { x: 0.45, y: 0.75 },
      right_ankle: { x: 0.45, y: 0.95 },
    }
  },

  plank_hold: {
    hold: {
      left_shoulder: { x: 0.30, y: 0.40 },
      left_elbow: { x: 0.25, y: 0.50 },
      left_hip: { x: 0.50, y: 0.45 },
      left_ankle: { x: 0.75, y: 0.50 },
    },
    idle: {
      left_hip: { x: 0.55, y: 0.55 },
      left_knee: { x: 0.55, y: 0.75 },
      left_ankle: { x: 0.55, y: 0.95 },
    }
  },

  mountain_climber: {
    left_up: {
      left_hip: { x: 0.40, y: 0.45 },
      left_knee: { x: 0.30, y: 0.50 },
      left_ankle: { x: 0.25, y: 0.55 },
      right_hip: { x: 0.50, y: 0.45 },
      right_knee: { x: 0.65, y: 0.50 },
      right_ankle: { x: 0.75, y: 0.55 },
    },
    right_up: {
      left_hip: { x: 0.40, y: 0.45 },
      left_knee: { x: 0.55, y: 0.50 },
      left_ankle: { x: 0.65, y: 0.55 },
      right_hip: { x: 0.50, y: 0.45 },
      right_knee: { x: 0.40, y: 0.50 },
      right_ankle: { x: 0.35, y: 0.55 },
    },
    down: {
      left_hip: { x: 0.45, y: 0.45 },
      left_knee: { x: 0.60, y: 0.50 },
      left_ankle: { x: 0.70, y: 0.55 },
      right_hip: { x: 0.50, y: 0.45 },
      right_knee: { x: 0.65, y: 0.50 },
      right_ankle: { x: 0.75, y: 0.55 },
    }
  },

  // === EXPERT EXERCISES ===
  pistol_squat: {
    down: {
      left_hip: { x: 0.45, y: 0.60 },
      left_knee: { x: 0.40, y: 0.75 },
      left_ankle: { x: 0.35, y: 0.90 },
      right_hip: { x: 0.50, y: 0.55 },
      right_knee: { x: 0.60, y: 0.55 },
      right_ankle: { x: 0.70, y: 0.60 },
    },
    up: {
      left_hip: { x: 0.45, y: 0.50 },
      left_knee: { x: 0.45, y: 0.70 },
      left_ankle: { x: 0.45, y: 0.90 },
      right_hip: { x: 0.50, y: 0.50 },
      right_knee: { x: 0.50, y: 0.70 },
      right_ankle: { x: 0.50, y: 0.90 },
    }
  },

  pushup_shoulder_tap: {
    down: {
      left_shoulder: { x: 0.6, y: 0.35 },
      right_shoulder: { x: 0.4, y: 0.35 },
      left_elbow: { x: 0.65, y: 0.45 },
      right_elbow: { x: 0.35, y: 0.45 },
      left_hip: { x: 0.55, y: 0.55 },
      right_hip: { x: 0.45, y: 0.55 },
    },
    up: {
      left_shoulder: { x: 0.6, y: 0.30 },
      right_shoulder: { x: 0.4, y: 0.30 },
      left_elbow: { x: 0.65, y: 0.35 },
      right_elbow: { x: 0.35, y: 0.35 },
      left_hip: { x: 0.55, y: 0.50 },
      right_hip: { x: 0.45, y: 0.50 },
    },
    tap_left: {
      left_shoulder: { x: 0.55, y: 0.30 },
      right_shoulder: { x: 0.35, y: 0.32 },
      left_wrist: { x: 0.40, y: 0.30 },
      left_hip: { x: 0.55, y: 0.50 },
      right_hip: { x: 0.45, y: 0.52 },
    },
    tap_right: {
      left_shoulder: { x: 0.65, y: 0.32 },
      right_shoulder: { x: 0.45, y: 0.30 },
      right_wrist: { x: 0.60, y: 0.30 },
      left_hip: { x: 0.55, y: 0.52 },
      right_hip: { x: 0.45, y: 0.50 },
    }
  },

  burpee: {
    squat: {
      left_hip: { x: 0.55, y: 0.65 },
      left_knee: { x: 0.60, y: 0.80 },
      left_ankle: { x: 0.55, y: 0.95 },
      left_shoulder: { x: 0.55, y: 0.45 },
    },
    plank: {
      left_shoulder: { x: 0.30, y: 0.40 },
      left_hip: { x: 0.55, y: 0.45 },
      left_ankle: { x: 0.80, y: 0.50 },
    },
    jump: {
      left_hip: { x: 0.55, y: 0.45 },
      left_knee: { x: 0.55, y: 0.60 },
      left_ankle: { x: 0.55, y: 0.80 },
      left_shoulder: { x: 0.55, y: 0.25 },
      left_wrist: { x: 0.60, y: 0.10 },
    },
    up: {
      left_hip: { x: 0.55, y: 0.55 },
      left_knee: { x: 0.55, y: 0.75 },
      left_ankle: { x: 0.55, y: 0.95 },
      left_shoulder: { x: 0.55, y: 0.35 },
    }
  }
};

// Visual guide thresholds
export const VISUAL_GUIDE_CONFIG = {
  ERROR_THRESHOLD: 0.08,  // Red highlight if distance > 0.08
  WARN_THRESHOLD: 0.05,   // Orange warning if distance > 0.05
  TARGET_OPACITY: 0.3,
  COLORS: {
    target: '#64B5F6',      // Light blue for target skeleton
    error: '#FF5252',       // Red for errors
    correct: '#4CAF50',     // Green for correct
    trajectory: '#FFEB3B',  // Yellow for movement trails
    arrow: '#FF9800',       // Orange for correction arrows
  }
};

// Pre-defined Thai coach messages
export const COACH_MESSAGES = {
  welcome: 'สวัสดีครับ! พร้อมออกกำลังกายกันเถอะ',
  
  start_exercise: {
    // Beginner (front-facing camera)
    arm_raise: 'เริ่มท่ายกแขนขึ้นลงครับ หันหน้าเข้ากล้องนะครับ 🌱',
    torso_twist: 'เริ่มท่าบิดลำตัวครับ หันหน้าเข้ากล้องนะครับ 🌱',
    knee_raise: 'เริ่มท่ายกเข่าสลับครับ หันข้างเข้ากล้องนะครับ 🌱',
    // Intermediate (side-facing camera)
    squat_arm_raise: 'เริ่มท่าสควอตพร้อมยกแขนครับ หันข้างเข้ากล้องนะครับ 💪',
    push_up: 'เริ่มท่าวิดพื้นครับ หันข้างเข้ากล้อง วางกล้องต่ำระดับพื้นให้เห็นตัวทั้งตัวนะครับ 💪',
    static_lunge: 'เริ่มท่าลันจ์ยืนครับ หันข้างเข้ากล้องนะครับ 💪',
    // Advanced (side-facing camera)
    jump_squat: 'เริ่มท่ากระโดดสควอตครับ หันข้างเข้ากล้อง เผื่อพื้นที่กระโดดด้วยนะครับ 🔥',
    plank_hold: 'เริ่มท่าแพลงค์ครับ หันข้างเข้ากล้อง วางกล้องต่ำระดับพื้นให้เห็นตัวทั้งตัวนะครับ 🔥',
    mountain_climber: 'เริ่มท่าปีนเขาครับ หันข้างเข้ากล้อง วางกล้องต่ำระดับพื้นนะครับ 🔥',
    // Expert
    pistol_squat: 'เริ่มท่าสควอตขาเดียวครับ หันข้างเข้ากล้องนะครับ ⚡',
    pushup_shoulder_tap: 'เริ่มท่าวิดพื้นแตะไหล่ครับ หันหน้าเข้ากล้อง วางกล้องต่ำระดับพื้นนะครับ ⚡',
    burpee: 'เริ่มท่าเบอร์พีครับ หันข้างเข้ากล้อง วางกล้องต่ำและเผื่อพื้นที่กระโดดด้วยนะครับ ⚡',
  },
  
  countdown: [
    'สาม',
    'สอง',
    'หนึ่ง',
    'เริ่ม!',
  ],
  
  rep_count: (count: number) => `ครบ ${count} ครั้งแล้วครับ!`,
  
  target_reached: (count: number) => `🎯 ครบ ${count} ครั้งแล้ว! เยี่ยมมาก!`,
  
  hold_progress: (seconds: number) => `ค้างไว้ ${seconds} วินาทีแล้ว! สู้ๆ!`,
  
  good_form: [
    'เยี่ยมมากครับ!',
    'ดีมากครับ!',
    'ฟอร์มสวยมาก!',
    'เก่งมากครับ!',
    'ทำได้ดีมาก!',
    'สุดยอดครับ!',
    'ยอดเยี่ยม!',
    'ดีขึ้นเรื่อยๆ ครับ!',
  ],
  
  warn_form: [
    'ระวังฟอร์มนิดนึงนะครับ',
    'พยายามยืดให้เต็มที่ครับ',
    'ช้าลงหน่อยครับ',
    'ปรับฟอร์มอีกนิดครับ',
    'ลองเคลื่อนไหวช้าๆ ครับ',
  ],
  
  bad_form: [
    'หยุดก่อนครับ ปรับฟอร์มใหม่',
    'ลองใหม่อีกครั้งครับ',
    'พักสักครู่แล้วลองใหม่นะครับ',
  ],
  
  halfway: 'ผ่านไปครึ่งทางแล้ว! สู้ๆ ครับ!',
  
  almost_done: 'เหลืออีกนิดเดียวครับ! สู้ๆ!',
  
  exercise_complete: (count: number) => `เยี่ยมมาก! ทำได้ ${count} ครั้งครับ!`,
  
  session_complete: 'ยอดเยี่ยมครับ! ออกกำลังกายครบทุกท่าแล้ว!',
  
  // Tempo feedback
  tempo: {
    too_fast: '⚡ เร็วเกินไป! ลดความเร็วลงครับ นับ 1-2-3-4',
    too_fast_mild: 'ลองช้าลงอีกนิดครับ',
    too_slow: '🐢 ช้าไปครับ เพิ่มความเร็วหน่อย',
    too_slow_mild: 'ลองเร็วขึ้นอีกนิดครับ',
    inconsistent: 'พยายามทำให้จังหวะสม่ำเสมอครับ',
    unbalanced_up: 'ลองลดลงช้าๆ เท่ากับขึ้นครับ',
    unbalanced_down: 'ลองยกขึ้นช้าๆ เท่ากับลงครับ',
    perfect: '🌟 จังหวะสมบูรณ์แบบ! เยี่ยมมาก!',
    good: 'จังหวะดีครับ ทำต่อไป!',
  },
  
  // Movement quality (from optical flow analysis)
  movement: {
    too_fast: '⚡ เร็วเกินไป! ลดความเร็วลงครับ ควบคุมการเคลื่อนไหว',
    too_slow: 'ลองเพิ่มความเร็วขึ้นอีกหน่อยครับ',
    jerky: 'พยายามเคลื่อนไหวให้ราบรื่นขึ้นครับ',
    smooth: 'การเคลื่อนไหวราบรื่นดีมาก! 🌟',
    no_motion: 'เริ่มเคลื่อนไหวได้เลยครับ สู้ๆ!',
  },
  
  // Form-specific feedback
  form_feedback: {
    arm_raise: {
      asymmetric: 'ยกแขนให้เท่ากันทั้งสองข้างครับ',
      not_full: 'ยกแขนให้สูงกว่านี้ครับ (ต้อง > 150°)',
      shoulder_uneven: 'ระวังไหล่ให้เสมอกันครับ',
    },
    torso_twist: {
      hip_moving: 'ล็อคสะโพกไว้ บิดแค่ลำตัวครับ',
      shoulder_drop: 'ไหล่ให้ขนานพื้นครับ',
      not_enough: 'บิดให้ถึง 20-40° ครับ',
    },
    knee_raise: {
      leaning: 'ยืนตรงๆ อย่าเอนตัวครับ',
      knee_low: 'ยกเข่าให้สูงกว่านี้ครับ (มุมสะโพก > 80°)',
    },
    push_up: {
      elbow_not_low: 'งอศอกให้มากกว่านี้ครับ (< 90°)',
      elbow_not_straight: 'ยืดศอกให้ตรงครับ (> 160°)',
      hips_sagging: 'อย่าให้สะโพกตกครับ',
    },
    plank_hold: {
      hips_high: 'ลดสะโพกลงให้ตรงกับลำตัวครับ',
      hips_low: 'ยกสะโพกขึ้นหน่อยครับ',
      good_hold: 'ดีมาก! ค้างไว้เลยครับ',
    },
    burpee: {
      incomplete_squat: 'ย่อตัวให้ลึกกว่านี้ครับ',
      no_jump: 'อย่าลืมกระโดดตอนลุกครับ',
      good_sequence: 'ลำดับท่าถูกต้อง! เยี่ยม!',
    },
  },
  
  // Beat counting for tempo guidance
  beat_count: ['หนึ่ง', 'สอง', 'สาม', 'สี่'],
  
  // Direction hints for visual guide
  direction_hints: {
    move_left: 'ขยับซ้าย',
    move_right: 'ขยับขวา', 
    move_up: 'ยกขึ้น',
    move_down: 'ลดลง',
  },
  
  // Camera orientation hints
  camera_hints: {
    front: 'หันหน้าเข้ากล้องครับ',
    side: 'ยืนด้านข้างครับ',
  },
};

// Helper function to get random message from array
export function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

// Exercise order for each difficulty level
export const KAYA_BEGINNER_ORDER: ExerciseType[] = ['arm_raise', 'torso_twist', 'knee_raise'];
export const KAYA_INTERMEDIATE_ORDER: ExerciseType[] = ['squat_arm_raise', 'push_up', 'static_lunge'];
export const KAYA_ADVANCED_ORDER: ExerciseType[] = ['jump_squat', 'plank_hold', 'mountain_climber'];
export const KAYA_EXPERT_ORDER: ExerciseType[] = ['pistol_squat', 'pushup_shoulder_tap', 'burpee'];

// Legacy export for backward compatibility
export const KAYA_EXERCISE_ORDER = KAYA_BEGINNER_ORDER;

// MediaPipe landmark indices
export const LANDMARK_INDICES = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};
