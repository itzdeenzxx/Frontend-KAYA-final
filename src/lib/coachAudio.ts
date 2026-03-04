/**
 * Pre-recorded Coach Audio System
 * 
 * Each coach has ~21 pre-recorded .wav clips in public/assets/{coachFolder}/
 * These cover common workout phrases (encouragement, form feedback, tempo, etc.)
 * Using local audio avoids calling the Botnoi TTS API for frequently-used phrases.
 */

import type { CoachEventType } from './exerciseConfig';

/**
 * Audio clip categories — each maps to a pre-recorded file per coach
 */
export type AudioCategory =
  | 'start'             // มาเริ่มต้น
  | 'excellent'         // ยอดเยี่ยม
  | 'good_job'          // เก่งมาก
  | 'continue'          // เอาล่ะทำต่อ
  | 'rest'              // พักก่อน
  | 'form_correction'   // ท่าผิด / ฟอร์ม
  | 'move_more'         // ขยับตัวอีก / ขยับมากกว่า
  | 'straighten_back'   // ทำหลังให้ตรง
  | 'stretch_up'        // ยืดตัวขึ้น
  | 'move_little_more'  // ขยับอีกนิด
  | 'speed_up'          // เร็วขึ้น
  | 'slow_down'         // ช้าลง
  | 'dont_forget_rest'  // อย่าลืมพัก
  | 'amazing'           // สุดยอด
  | 'set_complete'      // จบเซ็ตนี้
  | 'move_closer'       // ขยับตัวเข้า
  | 'together'          // เรามาทำไปพร้อมกัน
  | 'form_check'        // ฟอร์มการออกกำลังกาย
  | 'you_can_do_it'     // คุณทำได้
  | 'fight'             // สู้ๆ / อย่ายอมแพ้
  | 'almost_done'       // ใกล้เสร็จ / ฮึบฮึบ
  | 'change_exercise';  // มาเปลี่ยนท่า

// ─── Per-coach audio file mappings ──────────────────────────────────────────

/** Coach ID → folder name under /assets/ */
const COACH_FOLDERS: Record<string, string> = {
  'coach-aiko': 'ไอโกะ',
  'coach-nadia': 'นาเดียร์',
  'coach-nattakan': 'ณัฐกานต์',
  'coach-bread': 'นายเบรด',
};

/** Category → filename per coach */
const AUDIO_FILES: Record<string, Record<AudioCategory, string>> = {
  'coach-aiko': {
    start: '0-มาเริ่มต้น.wav',
    excellent: '1-ยอดเยี่ยมม.wav',
    good_job: '2-เก่งมากเลย.wav',
    continue: '3-เอาล่ะทำต่.wav',
    rest: '4-พักก่อนนะแ.wav',
    change_exercise: '5-เอาล่ะมาเป.wav',
    move_more: '6-ขยับตัวอีก.wav',
    straighten_back: '7-ทำหลังให้ต.wav',
    stretch_up: '8-ยืดตัวขึ้น.wav',
    move_little_more: '9-ขยับอีกนิด.wav',
    speed_up: '10-เร็วขึ้นกว.wav',
    slow_down: '11-ช้าลงหน่อย.wav',
    dont_forget_rest: '12-อย่าลืมพัก.wav',
    amazing: '13-สุดยอดคุณ.wav',
    set_complete: '14-จบเช็ตนี้แ.wav',
    move_closer: '15-ขยับตัวเข้.wav',
    together: '16-เรามาทำไปพ.wav',
    form_check: '17-ฟอร์มการออ.wav',
    you_can_do_it: '18-คุณทำได้ลุ.wav',
    fight: '19-สู้ๆค่ะ.wav',
    almost_done: '20-ฮึบฮึบใกล้.wav',
    form_correction: '17-ฟอร์มการออ.wav', // reuse form_check
  },
  'coach-nadia': {
    start: '0-มาเริ่มต้น.wav',
    excellent: '1-ยอดเยี่ยมม.wav',
    good_job: '2-เก่งมากค่ะ.wav',
    continue: '3-เอาล่ะทำต่.wav',
    rest: '4-พักก่อนแล้.wav',
    form_correction: '5-ท่าผิดขยับ.wav',
    straighten_back: '6-ทำหลังให้ต.wav',
    stretch_up: '7-ยืดตัวขึ้น.wav',
    move_more: '8-ขยับมากกว่.wav',
    speed_up: '9-เร็วขึ้นกว.wav',
    slow_down: '10-ช้าลงหน่อย.wav',
    dont_forget_rest: '11-อย่าลืมพัก.wav',
    amazing: '12-สุดยอดคุณ.wav',
    set_complete: '13-จบเช็ตนี้แ.wav',
    move_closer: '14-ขยับตัวเข้.wav',
    together: '15-เรามาทำไปพ.wav',
    form_check: '16-ฟอร์มการออ.wav',
    you_can_do_it: '17-คุณต้องทำไ.wav',
    fight: '18-สู้สู้ค่ะค.wav',
    almost_done: '19-ใกล้เสร็จแ.wav',
    change_exercise: '20-มาเปลี่ยนท.wav',
    move_little_more: '8-ขยับมากกว่.wav', // reuse move_more
  },
  'coach-nattakan': {
    start: '0-มาเริ่มต้น.wav',
    excellent: '1-ยอดเยี่ยมม.wav',
    good_job: '2-เก่งมากเลย.wav',
    continue: '3-เอาล่ะทำต่.wav',
    rest: '4-พักก่อนนะแ.wav',
    move_more: '5-ขยับตัวอีก.wav',
    straighten_back: '6-ทำหลังให้ต.wav',
    stretch_up: '7-ยืดตัวขึ้น.wav',
    move_little_more: '8-ขยับอีกนิด.wav',
    speed_up: '9-เร็วขึ้นกว.wav',
    slow_down: '10-ช้าลงหน่อย.wav',
    dont_forget_rest: '11-อย่าลืมพัก.wav',
    amazing: '12-สุดยอดคุณ.wav',
    set_complete: '13-จบเช็ตนี้แ.wav',
    move_closer: '14-ขยับตัวเข้.wav',
    together: '15-เรามาทำไปพ.wav',
    form_check: '16-ฟอร์มการออ.wav',
    you_can_do_it: '17-คุณทำได้ลุ.wav',
    fight: '18-สู้ๆครับ.wav',
    almost_done: '19-ฮึบฮึบใกล้.wav',
    change_exercise: '20-มาเปลี่ยนท.wav',
    form_correction: '16-ฟอร์มการออ.wav', // reuse form_check
  },
  'coach-bread': {
    start: '0-มาเริ่มต้น.wav',
    excellent: '1-ยอดเยี่ยมม.wav',
    good_job: '2-เก่งมาก.wav',
    continue: '3-เอาล่ะทำต่.wav',
    rest: '4-พักก่อนนะแ.wav',
    form_correction: '5-ท่าผิดขยับ.wav',
    straighten_back: '6-ทำหลังให้ต.wav',
    stretch_up: '7-ยืดตัวขึ้น.wav',
    move_more: '8-ขยับมากกว่.wav',
    speed_up: '9-เร็วขึ้นกว.wav',
    slow_down: '10-ช้าลงหน่อย.wav',
    dont_forget_rest: '11-อย่าลืมพัก.wav',
    amazing: '12-โครตสุดยอด.wav',
    set_complete: '13-จบเช็ตนี้แ.wav',
    move_closer: '14-ขยับตัวเข้.wav',
    together: '15-เรามาทำไปพ.wav',
    form_check: '16-ฟอร์มการออ.wav',
    you_can_do_it: '17-ต้องทำได้ท.wav',
    fight: '18-อย่ายอมแพ้.wav',
    almost_done: '19-ใกล้เสร็จแ.wav',
    change_exercise: '20-มาเปลี่ยนท.wav',
    move_little_more: '8-ขยับมากกว่.wav', // reuse move_more
  },
};

// ─── CoachEventType → AudioCategory mapping ────────────────────────────────

/**
 * Map a CoachEventType to possible audio categories.
 * Returns an array to allow random selection (variety).
 * Returns null for dynamic events (rep counts, countdowns) that need TTS API.
 */
export function eventTypeToCategories(eventType: CoachEventType): AudioCategory[] | null {
  switch (eventType) {
    case 'session_start':
      return ['start', 'together'];
    case 'exercise_start':
      return ['start', 'together', 'continue'];
    case 'good_form':
    case 'movement_smooth':
      return ['excellent', 'good_job', 'amazing'];
    case 'warn_form':
      return ['form_correction', 'straighten_back', 'form_check'];
    case 'bad_form':
      return ['form_correction', 'form_check'];
    case 'halfway':
      return ['fight', 'you_can_do_it', 'together'];
    case 'almost_done':
      return ['almost_done', 'fight'];
    case 'exercise_complete':
    case 'target_reps_reached':
      return ['set_complete', 'excellent', 'amazing'];
    case 'session_complete':
      return ['set_complete', 'amazing', 'excellent'];
    case 'movement_too_fast':
      return ['slow_down'];
    case 'movement_too_slow':
      return ['speed_up', 'move_more'];
    case 'movement_jerky':
      return ['form_check', 'slow_down'];
    case 'no_motion':
      return ['move_more', 'start'];
    // Dynamic events — need TTS API (include numbers, dynamic text)
    case 'rep_completed':
    case 'rep_counted_audio':
    case 'countdown':
    case 'hold_progress':
    case 'motion_detected':
      return null;
    default:
      return null;
  }
}

// ─── Audio URL & Playback ───────────────────────────────────────────────────

/**
 * Get the URL for a pre-recorded audio clip.
 * @returns URL path (e.g. "/assets/ไอโกะ/0-มาเริ่มต้น.wav") or null
 */
export function getLocalAudioUrl(coachId: string, category: AudioCategory): string | null {
  const folder = COACH_FOLDERS[coachId];
  const files = AUDIO_FILES[coachId];
  if (!folder || !files) return null;

  const filename = files[category];
  if (!filename) return null;

  return `/assets/${folder}/${filename}`;
}

/**
 * Pick a random audio category for an event type and resolve the URL.
 * @returns { url, category } or null if no local audio available
 */
export function getLocalAudioForEvent(
  coachId: string,
  eventType: CoachEventType
): { url: string; category: AudioCategory } | null {
  const categories = eventTypeToCategories(eventType);
  if (!categories || categories.length === 0) return null;

  // Shuffle and try each category until one resolves to a file
  const shuffled = [...categories].sort(() => Math.random() - 0.5);
  for (const cat of shuffled) {
    const url = getLocalAudioUrl(coachId, cat);
    if (url) return { url, category: cat };
  }

  return null;
}

/**
 * Play a local .wav file and return a promise that resolves when done.
 * The returned HTMLAudioElement can be used to stop playback.
 */
export function playLocalAudio(
  url: string,
  speed: number = 1.0
): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.playbackRate = speed;
    audio.onended = () => resolve(audio);
    audio.onerror = (e) => reject(e);
    audio.play().catch(reject);
  });
}
