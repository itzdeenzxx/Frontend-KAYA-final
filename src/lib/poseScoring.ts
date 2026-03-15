// Pose Scoring API service
// Each rep is scored individually, then summed and divided by targetReps

const BASE_URL =
  import.meta.env.VITE_POSE_SCORING_BASE_URL;

// Map internal exercise types to API pose names
const EXERCISE_TO_POSE: Record<string, string> = {
  arm_raise: "ArmRaise",
  knee_raise: "KneeRaise",
  push_up: "Push-up",
  squat_arm_raise: "SquatArmRaise",
  torso_twist: "TorsoTwist",
};

// Number of frames to capture (backwards) per rep for each exercise
export const REP_FRAME_COUNT: Record<string, number> = {
  arm_raise: 45,
  knee_raise: 70,
  push_up: 22,
  squat_arm_raise: 45,
  torso_twist: 29,
};

export interface PoseScoreResult {
  lstm_score: number;
  cnn_score: number;
  avg_score: number;
  lstm_error: number;
  cnn_error: number;
  move_gate: number;
  move_ratio: number;
}

export interface RepScore extends PoseScoreResult {
  repIndex: number;
}

export interface ExerciseAIScore {
  repScores: RepScore[];
  avgLstmScore: number;
  avgCnnScore: number;
  avgScore: number;
}

export function isScoringSupported(exerciseType: string): boolean {
  return exerciseType in EXERCISE_TO_POSE;
}

export function getPoseName(exerciseType: string): string | null {
  return EXERCISE_TO_POSE[exerciseType] || null;
}

/**
 * Score a single rep by sending its frames to /predict
 */
export async function scoreRep(
  exerciseType: string,
  frames: [number, number][][],
  repIndex: number
): Promise<RepScore | null> {
  const poseName = getPoseName(exerciseType);
  if (!poseName) return null;
  if (frames.length < 2) {
    console.warn(`[PoseScoring] Rep ${repIndex + 1}: skipped — only ${frames.length} frame(s)`);
    return null;
  }

  console.log(`[PoseScoring] Rep ${repIndex + 1}: sending ${frames.length} frames to /predict (pose=${poseName})`);

  try {
    const res = await fetch(`${BASE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pose_name: poseName,
        raw_frames: frames,
      }),
    });

    const data = await res.json();
    console.log(`[PoseScoring] Rep ${repIndex + 1} — backend response:`, JSON.stringify(data, null, 2));

    if (data.success) {
      const s = data.scores;
      console.log(
        `[PoseScoring] Rep ${repIndex + 1} scores → ` +
        `lstm=${s.lstm_score} | cnn=${s.cnn_score} | avg=${s.avg_score} | ` +
        `move_gate=${s.move_gate} | move_ratio=${s.move_ratio}`
      );
      return {
        repIndex,
        lstm_score: s.lstm_score,
        cnn_score: s.cnn_score,
        avg_score: s.avg_score,
        lstm_error: s.lstm_error,
        cnn_error: s.cnn_error,
        move_gate: s.move_gate,
        move_ratio: s.move_ratio,
      };
    }

    console.error(`[PoseScoring] Rep ${repIndex + 1} — API error:`, data.error);
    return null;
  } catch (error) {
    console.error(`[PoseScoring] Rep ${repIndex + 1} — network error:`, error);
    return null;
  }
}

/**
 * Score all reps for one exercise.
 * Average = sum of rep scores / targetReps (not actual reps).
 * Incomplete reps count as 0, so user must complete all reps for 100%.
 */
export async function scoreExerciseReps(
  exerciseType: string,
  repsFrames: [number, number][][][],
  targetReps: number
): Promise<ExerciseAIScore | null> {
  if (!isScoringSupported(exerciseType)) return null;
  if (repsFrames.length === 0) return null;

  const poseName = getPoseName(exerciseType);
  console.log(
    `\n🤖 [PoseScoring] === Scoring exercise: ${exerciseType} (${poseName}) ===\n` +
    `   Completed reps: ${repsFrames.length} / target: ${targetReps}\n` +
    `   Frames per rep: [${repsFrames.map(f => f.length).join(', ')}]`
  );

  // Score each rep individually
  const promises = repsFrames.map((frames, idx) => scoreRep(exerciseType, frames, idx));
  const results = await Promise.all(promises);

  const repScores: RepScore[] = [];
  for (const r of results) {
    if (r) repScores.push(r);
  }

  if (repScores.length === 0) {
    console.warn(`[PoseScoring] No valid scores returned for ${exerciseType}`);
    return null;
  }

  // Average = sum / targetReps (not actual reps)
  // Reps not completed count as 0 → user must finish all reps for full score
  const divisor = Math.max(targetReps, 1);

  const avgLstmScore = Math.round(
    (repScores.reduce((sum, r) => sum + r.lstm_score, 0) / divisor) * 10
  ) / 10;
  const avgCnnScore = Math.round(
    (repScores.reduce((sum, r) => sum + r.cnn_score, 0) / divisor) * 10
  ) / 10;
  const avgScore = Math.round(
    (repScores.reduce((sum, r) => sum + r.avg_score, 0) / divisor) * 10
  ) / 10;

  console.log(
    `\n✅ [PoseScoring] === ${exerciseType} result (${repScores.length} scored / ${targetReps} target) ===\n` +
    `   LSTM avg : ${avgLstmScore}%\n` +
    `   CNN  avg : ${avgCnnScore}%\n` +
    `   Overall  : ${avgScore}% (sum ÷ ${divisor} targetReps)`
  );

  return {
    repScores,
    avgLstmScore,
    avgCnnScore,
    avgScore,
  };
}
