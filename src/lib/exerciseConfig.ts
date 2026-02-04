// Exercise Configuration - Ported from KAYA/config.py
// 3 exercises: arm_raise, torso_twist, knee_raise
// + 3 intermediate exercises: squat_arm_raise, squat_twist, high_knee_raise

export type ExerciseType =
  | 'arm_raise'
  | 'torso_twist'
  | 'knee_raise'
  | 'squat_arm_raise'
  | 'squat_twist'
  | 'high_knee_raise'
  // Advanced exercises
  | 'jump_squat_arm_raise'
  | 'standing_twist'
  | 'running_in_place'
  // Expert exercises
  | 'modified_burpee'
  | 'jump_twist'
  | 'sprint_knee_raises';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type FormQuality = 'good' | 'warn' | 'bad';
export type TempoQuality = 'perfect' | 'good' | 'too_fast' | 'too_slow' | 'inconsistent';
export type ExerciseStage = 'up' | 'down' | 'center' | 'left' | 'right' | 'idle' | 'transition' | 'left_up' | 'right_up';

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
  | 'no_motion';

// Exercise definitions with thresholds
export interface ExerciseDefinition {
  id: ExerciseType;
  name: string;
  nameTh: string;
  description: string;
  descriptionTh: string;
  icon: string;
  // Stage detection thresholds
  stages: string[];
  thresholds: Record<string, number>;
}

export const EXERCISES: Record<ExerciseType, ExerciseDefinition> = {
  arm_raise: {
    id: 'arm_raise',
    name: 'Arm Raise',
    nameTh: 'ยกแขนขึ้น-ลง',
    description: 'Raise both arms up and down',
    descriptionTh: 'ยกแขนทั้งสองข้างขึ้นลง',
    icon: 'arm',
    stages: ['up', 'down'],
    thresholds: {
      up_angle: 130,    // angle >= 130 means arms up (stricter for better form)
      down_angle: 50,   // angle <= 50 means arms down
      symmetry_diff: 35, // max angle diff between arms
    }
  },
  torso_twist: {
    id: 'torso_twist',
    name: 'Torso Twist',
    nameTh: 'บิดลำตัวซ้าย-ขวา',
    description: 'Twist torso left and right',
    descriptionTh: 'บิดลำตัวไปซ้ายและขวา',
    icon: 'torso',
    stages: ['center', 'left', 'right'],
    thresholds: {
      twist_threshold: 0.12, // slightly tighter for more accurate detection
    }
  },
  knee_raise: {
    id: 'knee_raise',
    name: 'Knee Raise',
    nameTh: 'ยกเข่าสลับ',
    description: 'Alternate knee raises',
    descriptionTh: 'ยกเข่าสลับซ้ายขวา',
    icon: 'leg',
    stages: ['up', 'down'],
    thresholds: {
      up_angle: 100,    // angle < 100 means knee is raised (slightly relaxed)
      down_angle: 150, // angle > 150 means knee is down
    }
  },

  // Intermediate exercises
  squat_arm_raise: {
    id: 'squat_arm_raise',
    name: 'Squat with Arm Raise',
    nameTh: 'สควอตพร้อมยกแขนเหนือศีรษะ',
    description: 'Perform a squat while raising arms overhead',
    descriptionTh: 'นั่งสควอตพร้อมยกแขนขึ้น ระบบตรวจจับมุมเข่า 90-160 องศา และมุมแขน ฝึกกล้ามเนื้อขา สะโพก และไหล่',
    icon: 'squat-arm',
    stages: ['down', 'up'],
    thresholds: {
      knee_min_angle: 90,
      knee_max_angle: 160,
      arm_up_angle: 120,
      arm_down_angle: 60,
    }
  },

  squat_twist: {
    id: 'squat_twist',
    name: 'Squat with Twist',
    nameTh: 'สควอตพร้อมบิดลำตัว',
    description: 'Perform a squat with a torso twist',
    descriptionTh: 'นั่งสควอตพร้อมบิดลำตัว ระบบวิเคราะห์ท่าซับซ้อนที่ผสม 2 ท่า เพิ่มความท้าทาย',
    icon: 'squat-twist',
    stages: ['down_center', 'down_left', 'down_right', 'up'],
    thresholds: {
      knee_min_angle: 90,
      knee_max_angle: 160,
      twist_threshold: 0.12,
    }
  },

  high_knee_raise: {
    id: 'high_knee_raise',
    name: 'High Knee Raise',
    nameTh: 'ยกเข่าสูงในท่ายืน',
    description: 'Raise knee above waist level while standing',
    descriptionTh: 'ยกเข่าให้สูงกว่าระดับเอว ระบบวัดความสูงของเข่า เหมาะสำหรับคาร์ดิโอ',
    icon: 'high-knee',
    stages: ['up', 'down'],
    thresholds: {
      knee_height_ratio: 0.05, // knee.y should be < hip.y - ratio
      up_angle: 80,    // hip-knee angle when raised
      down_angle: 160, // hip-knee angle when down
    }
  },

  // === ADVANCED EXERCISES ===

  jump_squat_arm_raise: {
    id: 'jump_squat_arm_raise',
    name: 'Jump Squat with Arm Raise',
    nameTh: 'กระโดดสควอตพร้อมยกแขน',
    description: 'Jump squat with arm raise - detects vertical movement for explosive power training',
    descriptionTh: 'กระโดดพร้อมทำสควอตและยกแขน ระบบตรวจจับการกระโดด (Vertical Movement) ฝึกพลังระเบิด',
    icon: 'jump-squat',
    stages: ['squat', 'jump', 'land'],
    thresholds: {
      knee_min_angle: 90,      // squat position
      knee_max_angle: 160,     // standing position
      arm_up_angle: 120,       // arms up during jump
      arm_down_angle: 60,      // arms down in squat
      jump_height_ratio: 0.05, // vertical movement threshold for jump detection
      land_threshold: 0.02,    // landing detection threshold
    }
  },

  standing_twist: {
    id: 'standing_twist',
    name: 'Standing Twist',
    nameTh: 'บิดลำตัวในท่ายืน',
    description: 'Fast continuous standing torso twists - measures speed and smoothness',
    descriptionTh: 'บิดลำตัวอย่างรวดเร็วและต่อเนื่อง ระบบวัดความเร็วและความราบรื่น',
    icon: 'standing-twist',
    stages: ['center', 'left', 'right'],
    thresholds: {
      twist_threshold: 0.12,     // offset for twist detection
      min_twist_speed: 0.08,     // minimum angular velocity
      smoothness_threshold: 0.7, // smoothness score 0-1
    }
  },

  running_in_place: {
    id: 'running_in_place',
    name: 'Running in Place',
    nameTh: 'วิ่งยกเข่าอยู่กับที่',
    description: 'Running in place with high knees - counts steps using optical flow',
    descriptionTh: 'วิ่งยกเข่าสูงอยู่กับที่ ระบบนับจำนวนก้าวด้วย Optical Flow เหมาะสำหรับคาร์ดิโอ',
    icon: 'running',
    stages: ['left_up', 'right_up', 'both_down'],
    thresholds: {
      knee_height_ratio: 0.03,  // knee must rise above this relative to hip
      step_cooldown: 200,       // ms between step counts
      min_step_height: 0.05,    // minimum vertical knee movement
    }
  },

  // === EXPERT EXERCISES ===

  modified_burpee: {
    id: 'modified_burpee',
    name: 'Modified Burpee',
    nameTh: 'เบอร์พีแบบไม่วิดพื้น',
    description: 'Modified burpee (no push-up) - detects 3 phases: down, up, jump',
    descriptionTh: 'ลงนอน-ลุกขึ้น-กระโดด ระบบตรวจจับ 3 Phase ท่าทางที่ซับซ้อนที่สุด',
    icon: 'burpee',
    stages: ['standing', 'down', 'jump'],
    thresholds: {
      down_ratio: 0.6,          // hip.y must be below this ratio of shoulder
      standing_ratio: 0.4,      // hip.y above this when standing
      jump_height_ratio: 0.05,  // vertical movement for jump
      phase_hold_time: 300,     // ms to hold each phase
    }
  },

  jump_twist: {
    id: 'jump_twist',
    name: 'Jump Twist',
    nameTh: 'กระโดดบิดลำตัวกลางอากาศ',
    description: 'Jump with mid-air torso twist - analyzes airborne movement for agility training',
    descriptionTh: 'กระโดดพร้อมบิดลำตัว ระบบวิเคราะห์การเคลื่อนไหวกลางอากาศ ฝึกความคล่องแคล่ว',
    icon: 'jump-twist',
    stages: ['ground', 'air_twist_left', 'air_twist_right', 'land'],
    thresholds: {
      jump_height_ratio: 0.04,  // vertical movement for jump
      twist_threshold: 0.10,    // twist detection in air
      air_time_min: 200,        // minimum airborne time in ms
    }
  },

  sprint_knee_raises: {
    id: 'sprint_knee_raises',
    name: 'Sprint Knee Raises',
    nameTh: 'วิ่งสปรินต์ยกเข่า',
    description: 'Fast sprint-style knee raises - measures speed and step count',
    descriptionTh: 'วิ่งยกเข่าอย่างรวดเร็ว ระบบวัดความเร็วและจำนวนก้าว ท้าทายที่สุด',
    icon: 'sprint',
    stages: ['left_up', 'right_up', 'transition'],
    thresholds: {
      knee_height_ratio: 0.08,  // higher knee requirement
      min_speed: 0.15,          // minimum movement speed
      step_cooldown: 150,       // faster step detection
      target_spm: 180,          // target steps per minute
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
    emoji: '🌱'
  },
  intermediate: {
    duration: 45,
    minReps: 10,
    tempo: '2-2',
    upDuration: 2,
    downDuration: 2,
    formStrictness: 0.75,
    restTime: 10,
    emoji: '💪'
  },
  advanced: {
    duration: 60,
    minReps: 15,
    tempo: '1.5-1.5',
    upDuration: 1.5,
    downDuration: 1.5,
    formStrictness: 0.85,
    restTime: 5,
    emoji: '🔥'
  },
  expert: {
    duration: 90,
    minReps: 20,
    tempo: '1-1',
    upDuration: 1,
    downDuration: 1,
    formStrictness: 0.95,
    restTime: 0,
    emoji: '⚡'
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
  // Intermediate exercise target poses
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
  squat_twist: {
    down_center: {
      left_shoulder: { x: 0.6, y: 0.45 },
      right_shoulder: { x: 0.4, y: 0.45 },
      left_hip: { x: 0.55, y: 0.65 },
      right_hip: { x: 0.45, y: 0.65 },
      left_knee: { x: 0.55, y: 0.8 },
      right_knee: { x: 0.45, y: 0.8 },
    },
    down_left: {
      left_shoulder: { x: 0.55, y: 0.45 },
      right_shoulder: { x: 0.35, y: 0.48 },
      left_hip: { x: 0.55, y: 0.65 },
      right_hip: { x: 0.45, y: 0.65 },
    },
    down_right: {
      left_shoulder: { x: 0.65, y: 0.48 },
      right_shoulder: { x: 0.45, y: 0.45 },
      left_hip: { x: 0.55, y: 0.65 },
      right_hip: { x: 0.45, y: 0.65 },
    },
    up: {
      left_shoulder: { x: 0.6, y: 0.35 },
      right_shoulder: { x: 0.4, y: 0.35 },
      left_hip: { x: 0.55, y: 0.55 },
      right_hip: { x: 0.45, y: 0.55 },
    }
  },
  high_knee_raise: {
    up: {
      left_hip: { x: 0.55, y: 0.55 },
      left_knee: { x: 0.55, y: 0.4 },
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

  // === ADVANCED EXERCISES TARGET POSES ===

  jump_squat_arm_raise: {
    squat: {
      left_hip: { x: 0.55, y: 0.65 },
      left_knee: { x: 0.6, y: 0.8 },
      left_ankle: { x: 0.55, y: 0.95 },
      right_hip: { x: 0.45, y: 0.65 },
      right_knee: { x: 0.4, y: 0.8 },
      right_ankle: { x: 0.45, y: 0.95 },
      left_shoulder: { x: 0.6, y: 0.45 },
      right_shoulder: { x: 0.4, y: 0.45 },
      left_wrist: { x: 0.65, y: 0.55 },
      right_wrist: { x: 0.35, y: 0.55 },
    },
    jump: {
      left_hip: { x: 0.55, y: 0.5 },
      left_knee: { x: 0.55, y: 0.65 },
      left_ankle: { x: 0.55, y: 0.85 },
      right_hip: { x: 0.45, y: 0.5 },
      right_knee: { x: 0.45, y: 0.65 },
      right_ankle: { x: 0.45, y: 0.85 },
      left_shoulder: { x: 0.6, y: 0.3 },
      right_shoulder: { x: 0.4, y: 0.3 },
      left_wrist: { x: 0.7, y: 0.1 },
      right_wrist: { x: 0.3, y: 0.1 },
    },
    land: {
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

  standing_twist: {
    center: {
      left_shoulder: { x: 0.6, y: 0.35 },
      right_shoulder: { x: 0.4, y: 0.35 },
      left_hip: { x: 0.55, y: 0.55 },
      right_hip: { x: 0.45, y: 0.55 },
    },
    left: {
      left_shoulder: { x: 0.5, y: 0.35 },
      right_shoulder: { x: 0.3, y: 0.38 },
      left_hip: { x: 0.55, y: 0.55 },
      right_hip: { x: 0.45, y: 0.55 },
    },
    right: {
      left_shoulder: { x: 0.7, y: 0.38 },
      right_shoulder: { x: 0.5, y: 0.35 },
      left_hip: { x: 0.55, y: 0.55 },
      right_hip: { x: 0.45, y: 0.55 },
    }
  },

  running_in_place: {
    left_up: {
      left_hip: { x: 0.55, y: 0.55 },
      left_knee: { x: 0.55, y: 0.42 },
      left_ankle: { x: 0.52, y: 0.55 },
      right_hip: { x: 0.45, y: 0.55 },
      right_knee: { x: 0.45, y: 0.75 },
      right_ankle: { x: 0.45, y: 0.95 },
    },
    right_up: {
      left_hip: { x: 0.55, y: 0.55 },
      left_knee: { x: 0.55, y: 0.75 },
      left_ankle: { x: 0.55, y: 0.95 },
      right_hip: { x: 0.45, y: 0.55 },
      right_knee: { x: 0.45, y: 0.42 },
      right_ankle: { x: 0.48, y: 0.55 },
    },
    both_down: {
      left_hip: { x: 0.55, y: 0.55 },
      left_knee: { x: 0.55, y: 0.75 },
      left_ankle: { x: 0.55, y: 0.95 },
      right_hip: { x: 0.45, y: 0.55 },
      right_knee: { x: 0.45, y: 0.75 },
      right_ankle: { x: 0.45, y: 0.95 },
    }
  },

  // === EXPERT EXERCISES TARGET POSES ===

  modified_burpee: {
    standing: {
      left_hip: { x: 0.55, y: 0.55 },
      left_knee: { x: 0.55, y: 0.75 },
      left_ankle: { x: 0.55, y: 0.95 },
      right_hip: { x: 0.45, y: 0.55 },
      right_knee: { x: 0.45, y: 0.75 },
      right_ankle: { x: 0.45, y: 0.95 },
      left_shoulder: { x: 0.6, y: 0.35 },
      right_shoulder: { x: 0.4, y: 0.35 },
    },
    down: {
      left_hip: { x: 0.55, y: 0.75 },
      left_knee: { x: 0.55, y: 0.85 },
      left_ankle: { x: 0.55, y: 0.95 },
      right_hip: { x: 0.45, y: 0.75 },
      right_knee: { x: 0.45, y: 0.85 },
      right_ankle: { x: 0.45, y: 0.95 },
      left_shoulder: { x: 0.6, y: 0.65 },
      right_shoulder: { x: 0.4, y: 0.65 },
    },
    jump: {
      left_hip: { x: 0.55, y: 0.45 },
      left_knee: { x: 0.55, y: 0.6 },
      left_ankle: { x: 0.55, y: 0.8 },
      right_hip: { x: 0.45, y: 0.45 },
      right_knee: { x: 0.45, y: 0.6 },
      right_ankle: { x: 0.45, y: 0.8 },
      left_shoulder: { x: 0.6, y: 0.25 },
      right_shoulder: { x: 0.4, y: 0.25 },
      left_wrist: { x: 0.7, y: 0.1 },
      right_wrist: { x: 0.3, y: 0.1 },
    }
  },

  jump_twist: {
    ground: {
      left_hip: { x: 0.55, y: 0.55 },
      left_knee: { x: 0.55, y: 0.75 },
      left_ankle: { x: 0.55, y: 0.95 },
      right_hip: { x: 0.45, y: 0.55 },
      right_knee: { x: 0.45, y: 0.75 },
      right_ankle: { x: 0.45, y: 0.95 },
      left_shoulder: { x: 0.6, y: 0.35 },
      right_shoulder: { x: 0.4, y: 0.35 },
    },
    air_twist_left: {
      left_hip: { x: 0.5, y: 0.45 },
      left_knee: { x: 0.5, y: 0.6 },
      left_ankle: { x: 0.5, y: 0.8 },
      right_hip: { x: 0.4, y: 0.48 },
      right_knee: { x: 0.4, y: 0.63 },
      right_ankle: { x: 0.4, y: 0.83 },
      left_shoulder: { x: 0.55, y: 0.28 },
      right_shoulder: { x: 0.35, y: 0.32 },
    },
    air_twist_right: {
      left_hip: { x: 0.6, y: 0.48 },
      left_knee: { x: 0.6, y: 0.63 },
      left_ankle: { x: 0.6, y: 0.83 },
      right_hip: { x: 0.5, y: 0.45 },
      right_knee: { x: 0.5, y: 0.6 },
      right_ankle: { x: 0.5, y: 0.8 },
      left_shoulder: { x: 0.65, y: 0.32 },
      right_shoulder: { x: 0.45, y: 0.28 },
    },
    land: {
      left_hip: { x: 0.55, y: 0.55 },
      left_knee: { x: 0.55, y: 0.75 },
      left_ankle: { x: 0.55, y: 0.95 },
      right_hip: { x: 0.45, y: 0.55 },
      right_knee: { x: 0.45, y: 0.75 },
      right_ankle: { x: 0.45, y: 0.95 },
      left_shoulder: { x: 0.6, y: 0.35 },
      right_shoulder: { x: 0.4, y: 0.35 },
    }
  },

  sprint_knee_raises: {
    left_up: {
      left_hip: { x: 0.55, y: 0.55 },
      left_knee: { x: 0.55, y: 0.38 },
      left_ankle: { x: 0.52, y: 0.52 },
      right_hip: { x: 0.45, y: 0.55 },
      right_knee: { x: 0.45, y: 0.75 },
      right_ankle: { x: 0.45, y: 0.95 },
    },
    right_up: {
      left_hip: { x: 0.55, y: 0.55 },
      left_knee: { x: 0.55, y: 0.75 },
      left_ankle: { x: 0.55, y: 0.95 },
      right_hip: { x: 0.45, y: 0.55 },
      right_knee: { x: 0.45, y: 0.38 },
      right_ankle: { x: 0.48, y: 0.52 },
    },
    transition: {
      left_hip: { x: 0.55, y: 0.55 },
      left_knee: { x: 0.55, y: 0.65 },
      left_ankle: { x: 0.55, y: 0.85 },
      right_hip: { x: 0.45, y: 0.55 },
      right_knee: { x: 0.45, y: 0.65 },
      right_ankle: { x: 0.45, y: 0.85 },
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
    arm_raise: 'เริ่มท่ายกแขนขึ้น-ลง ได้เลยครับ!',
    torso_twist: 'เริ่มท่าบิดลำตัว ได้เลยครับ!',
    knee_raise: 'เริ่มท่ายกเข่าสลับ ได้เลยครับ!',
    squat_arm_raise: 'เริ่มท่าสควอตพร้อมยกแขน ได้เลยครับ!',
    squat_twist: 'เริ่มท่าสควอตพร้อมบิดลำตัว ได้เลยครับ!',
    high_knee_raise: 'เริ่มท่ายกเข่าสูงในท่ายืน ได้เลยครับ!',
    // Advanced exercises
    jump_squat_arm_raise: 'เริ่มท่ากระโดดสควอตพร้อมยกแขน ได้เลยครับ! 💪',
    standing_twist: 'เริ่มท่าบิดลำตัวในท่ายืน ได้เลยครับ! 🔥',
    running_in_place: 'เริ่มวิ่งยกเข่าอยู่กับที่ ได้เลยครับ! 🏃',
    // Expert exercises
    modified_burpee: 'เริ่มท่าเบอร์พี ได้เลยครับ! สุดยอดมาก! ⚡',
    jump_twist: 'เริ่มท่ากระโดดบิดลำตัว ได้เลยครับ! ⭐',
    sprint_knee_raises: 'เริ่มวิ่งสปรินต์ยกเข่า ได้เลยครับ! ท้าทายที่สุด! 🏆',
  },
  
  countdown: [
    'สาม',
    'สอง',
    'หนึ่ง',
    'เริ่ม!',
  ],
  
  rep_count: (count: number) => `ครบ ${count} ครั้งแล้วครับ!`,
  
  target_reached: (count: number) => `🎯 ครบ ${count} ครั้งแล้ว! เยี่ยมมาก!`,
  
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
      not_full: 'ยกแขนให้สูงกว่านี้ครับ',
      shoulder_uneven: 'ระวังไหล่ให้เสมอกันครับ',
    },
    torso_twist: {
      hip_moving: 'ล็อคสะโพกไว้ บิดแค่ลำตัวครับ',
      shoulder_drop: 'ไหล่ให้ขนานพื้นครับ',
    },
    knee_raise: {
      leaning: 'ยืนตรงๆ อย่าเอนตัวครับ',
      knee_low: 'ยกเข่าให้สูงกว่านี้ครับ',
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
};

// Helper function to get random message from array
export function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

// Exercise order for KAYA workout (basic)
export const KAYA_EXERCISE_ORDER: ExerciseType[] = ['arm_raise', 'torso_twist', 'knee_raise'];

// Exercise order for KAYA intermediate workout
export const KAYA_INTERMEDIATE_ORDER: ExerciseType[] = ['squat_arm_raise', 'squat_twist', 'high_knee_raise'];

// Exercise order for KAYA advanced workout
export const KAYA_ADVANCED_ORDER: ExerciseType[] = ['jump_squat_arm_raise', 'standing_twist', 'running_in_place'];

// Exercise order for KAYA expert workout
export const KAYA_EXPERT_ORDER: ExerciseType[] = ['modified_burpee', 'jump_twist', 'sprint_knee_raises'];

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
