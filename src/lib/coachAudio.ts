/**
 * Pre-recorded Coach Audio System
 * 
 * Each coach has ~60 pre-recorded .wav clips in public/assets/{coachFolder}/
 * Original 21 clips (0-20) + new clips (21-60) generated via Botnoi TTS API.
 * Using local audio avoids calling the Botnoi TTS API for frequently-used phrases.
 */

import type { CoachEventType } from './exerciseConfig';
import type { ExerciseType } from './exerciseConfig';

/**
 * Audio clip categories — each maps to a pre-recorded file per coach
 */
export type AudioCategory =
  // ─── Original 21 categories (files 0-20) ─────────────────────────
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
  | 'change_exercise'   // มาเปลี่ยนท่า
  // ─── Group A: Countdown (file 21) ────────────────────────────────
  | 'countdown'         // สาม สอง หนึ่ง เริ่ม!
  // ─── Group B: Beat Count (files 22-25) ───────────────────────────
  | 'beat_1' | 'beat_2' | 'beat_3' | 'beat_4'
  // ─── Group C: Rep Milestones (files 26-29) ───────────────────────
  | 'rep_1' | 'rep_5' | 'rep_9' | 'rep_10'
  // ─── Group D: Start Exercise (files 30-41) ───────────────────────
  | 'start_arm_raise' | 'start_torso_twist' | 'start_knee_raise'
  | 'start_squat_arm_raise' | 'start_push_up' | 'start_static_lunge'
  | 'start_jump_squat' | 'start_plank_hold' | 'start_mountain_climber'
  | 'start_pistol_squat' | 'start_pushup_shoulder_tap' | 'start_burpee'
  // ─── Group E: Coach Greeting (file 42) ───────────────────────────
  | 'greeting'
  // ─── Group F: Tempo Feedback (files 43-51) ───────────────────────
  | 'tempo_too_fast' | 'tempo_too_fast_mild'
  | 'tempo_too_slow' | 'tempo_too_slow_mild'
  | 'tempo_inconsistent'
  | 'tempo_unbalanced_up' | 'tempo_unbalanced_down'
  | 'tempo_perfect' | 'tempo_good'
  // ─── Group G: Movement Quality (files 52-56) ────────────────────
  | 'movement_too_fast' | 'movement_too_slow'
  | 'movement_jerky' | 'movement_smooth' | 'movement_no_motion'
  // ─── Group J: Session Messages (files 57-60) ────────────────────
  | 'welcome' | 'halfway' | 'session_almost_done' | 'session_complete'
  // ─── Group K: Timer Announcements (files 61-62) ─────────────────
  | 'timer_15s' | 'timer_30s';

// ─── Per-coach audio file mappings ──────────────────────────────────────────

/** Coach ID → folder name under /assets/ */
const COACH_FOLDERS: Record<string, string> = {
  'coach-aiko': 'ไอโกะ',
  'coach-nadia': 'นาเดียร์',
  'coach-nattakan': 'ณัฐกานต์',
  'coach-bread': 'นายเบรด',
  'coach-phuyailee': 'ผู้ใหญ่ลี',
  'coach-alan': 'อลัน',
  'coach-homchan': 'หอมจันทน์',
  'coach-manee': 'มานี',
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
    // ─── New categories (files 21-60) ───
    countdown: '21-นับถอยหลัง.wav',
    beat_1: '22-นับหนึ่ง.wav',
    beat_2: '23-นับสอง.wav',
    beat_3: '24-นับสาม.wav',
    beat_4: '25-นับสี่.wav',
    rep_1: '26-ครั้งที่หนึ่ง.wav',
    rep_5: '27-ครั้งที่ห้า.wav',
    rep_9: '28-ครั้งที่เก้า.wav',
    rep_10: '29-ครั้งที่สิบ.wav',
    start_arm_raise: '30-เริ่มยกแขน.wav',
    start_torso_twist: '31-เริ่มบิดลำตัว.wav',
    start_knee_raise: '32-เริ่มยกเข่า.wav',
    start_squat_arm_raise: '33-เริ่มสควอตยกแขน.wav',
    start_push_up: '34-เริ่มวิดพื้น.wav',
    start_static_lunge: '35-เริ่มลันจ์.wav',
    start_jump_squat: '36-เริ่มกระโดดสควอต.wav',
    start_plank_hold: '37-เริ่มแพลงค์.wav',
    start_mountain_climber: '38-เริ่มปีนเขา.wav',
    start_pistol_squat: '39-เริ่มสควอตขาเดียว.wav',
    start_pushup_shoulder_tap: '40-เริ่มวิดพื้นแตะไหล่.wav',
    start_burpee: '41-เริ่มเบอร์พี.wav',
    greeting: '42-คำทักทาย.wav',
    tempo_too_fast: '43-จังหวะเร็วเกิน.wav',
    tempo_too_fast_mild: '44-จังหวะเร็วนิด.wav',
    tempo_too_slow: '45-จังหวะช้าเกิน.wav',
    tempo_too_slow_mild: '46-จังหวะช้านิด.wav',
    tempo_inconsistent: '47-จังหวะไม่สม่ำเสมอ.wav',
    tempo_unbalanced_up: '48-จังหวะขึ้นเร็ว.wav',
    tempo_unbalanced_down: '49-จังหวะลงเร็ว.wav',
    tempo_perfect: '50-จังหวะเพอร์เฟค.wav',
    tempo_good: '51-จังหวะดี.wav',
    movement_too_fast: '52-เคลื่อนไหวเร็ว.wav',
    movement_too_slow: '53-เคลื่อนไหวช้า.wav',
    movement_jerky: '54-เคลื่อนไหวกระตุก.wav',
    movement_smooth: '55-เคลื่อนไหวดี.wav',
    movement_no_motion: '56-ไม่เคลื่อนไหว.wav',
    welcome: '57-ยินดีต้อนรับ.wav',
    halfway: '58-ผ่านครึ่งทาง.wav',
    session_almost_done: '59-เกือบเสร็จแล้ว.wav',
    session_complete: '60-จบเซสชั่น.wav',
    timer_15s: '61-15วินาทีแล.wav',
    timer_30s: '62-30วินาทีแล.wav',
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
    // ─── New categories (files 21-60) ───
    countdown: '21-นับถอยหลัง.wav',
    beat_1: '22-นับหนึ่ง.wav',
    beat_2: '23-นับสอง.wav',
    beat_3: '24-นับสาม.wav',
    beat_4: '25-นับสี่.wav',
    rep_1: '26-ครั้งที่หนึ่ง.wav',
    rep_5: '27-ครั้งที่ห้า.wav',
    rep_9: '28-ครั้งที่เก้า.wav',
    rep_10: '29-ครั้งที่สิบ.wav',
    start_arm_raise: '30-เริ่มยกแขน.wav',
    start_torso_twist: '31-เริ่มบิดลำตัว.wav',
    start_knee_raise: '32-เริ่มยกเข่า.wav',
    start_squat_arm_raise: '33-เริ่มสควอตยกแขน.wav',
    start_push_up: '34-เริ่มวิดพื้น.wav',
    start_static_lunge: '35-เริ่มลันจ์.wav',
    start_jump_squat: '36-เริ่มกระโดดสควอต.wav',
    start_plank_hold: '37-เริ่มแพลงค์.wav',
    start_mountain_climber: '38-เริ่มปีนเขา.wav',
    start_pistol_squat: '39-เริ่มสควอตขาเดียว.wav',
    start_pushup_shoulder_tap: '40-เริ่มวิดพื้นแตะไหล่.wav',
    start_burpee: '41-เริ่มเบอร์พี.wav',
    greeting: '42-คำทักทาย.wav',
    tempo_too_fast: '43-จังหวะเร็วเกิน.wav',
    tempo_too_fast_mild: '44-จังหวะเร็วนิด.wav',
    tempo_too_slow: '45-จังหวะช้าเกิน.wav',
    tempo_too_slow_mild: '46-จังหวะช้านิด.wav',
    tempo_inconsistent: '47-จังหวะไม่สม่ำเสมอ.wav',
    tempo_unbalanced_up: '48-จังหวะขึ้นเร็ว.wav',
    tempo_unbalanced_down: '49-จังหวะลงเร็ว.wav',
    tempo_perfect: '50-จังหวะเพอร์เฟค.wav',
    tempo_good: '51-จังหวะดี.wav',
    movement_too_fast: '52-เคลื่อนไหวเร็ว.wav',
    movement_too_slow: '53-เคลื่อนไหวช้า.wav',
    movement_jerky: '54-เคลื่อนไหวกระตุก.wav',
    movement_smooth: '55-เคลื่อนไหวดี.wav',
    movement_no_motion: '56-ไม่เคลื่อนไหว.wav',
    welcome: '57-ยินดีต้อนรับ.wav',
    halfway: '58-ผ่านครึ่งทาง.wav',
    session_almost_done: '59-เกือบเสร็จแล้ว.wav',
    session_complete: '60-จบเซสชั่น.wav',
    timer_15s: '61-15วินาทีแล.wav',
    timer_30s: '62-30วินาทีแล.wav',
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
    // ─── New categories (files 21-60) ───
    countdown: '21-นับถอยหลัง.wav',
    beat_1: '22-นับหนึ่ง.wav',
    beat_2: '23-นับสอง.wav',
    beat_3: '24-นับสาม.wav',
    beat_4: '25-นับสี่.wav',
    rep_1: '26-ครั้งที่หนึ่ง.wav',
    rep_5: '27-ครั้งที่ห้า.wav',
    rep_9: '28-ครั้งที่เก้า.wav',
    rep_10: '29-ครั้งที่สิบ.wav',
    start_arm_raise: '30-เริ่มยกแขน.wav',
    start_torso_twist: '31-เริ่มบิดลำตัว.wav',
    start_knee_raise: '32-เริ่มยกเข่า.wav',
    start_squat_arm_raise: '33-เริ่มสควอตยกแขน.wav',
    start_push_up: '34-เริ่มวิดพื้น.wav',
    start_static_lunge: '35-เริ่มลันจ์.wav',
    start_jump_squat: '36-เริ่มกระโดดสควอต.wav',
    start_plank_hold: '37-เริ่มแพลงค์.wav',
    start_mountain_climber: '38-เริ่มปีนเขา.wav',
    start_pistol_squat: '39-เริ่มสควอตขาเดียว.wav',
    start_pushup_shoulder_tap: '40-เริ่มวิดพื้นแตะไหล่.wav',
    start_burpee: '41-เริ่มเบอร์พี.wav',
    greeting: '42-คำทักทาย.wav',
    tempo_too_fast: '43-จังหวะเร็วเกิน.wav',
    tempo_too_fast_mild: '44-จังหวะเร็วนิด.wav',
    tempo_too_slow: '45-จังหวะช้าเกิน.wav',
    tempo_too_slow_mild: '46-จังหวะช้านิด.wav',
    tempo_inconsistent: '47-จังหวะไม่สม่ำเสมอ.wav',
    tempo_unbalanced_up: '48-จังหวะขึ้นเร็ว.wav',
    tempo_unbalanced_down: '49-จังหวะลงเร็ว.wav',
    tempo_perfect: '50-จังหวะเพอร์เฟค.wav',
    tempo_good: '51-จังหวะดี.wav',
    movement_too_fast: '52-เคลื่อนไหวเร็ว.wav',
    movement_too_slow: '53-เคลื่อนไหวช้า.wav',
    movement_jerky: '54-เคลื่อนไหวกระตุก.wav',
    movement_smooth: '55-เคลื่อนไหวดี.wav',
    movement_no_motion: '56-ไม่เคลื่อนไหว.wav',
    welcome: '57-ยินดีต้อนรับ.wav',
    halfway: '58-ผ่านครึ่งทาง.wav',
    session_almost_done: '59-เกือบเสร็จแล้ว.wav',
    session_complete: '60-จบเซสชั่น.wav',
    timer_15s: '61-15วินาทีแล.wav',
    timer_30s: '62-30วินาทีแล.wav',
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
    // ─── New categories (files 21-60) ───
    countdown: '21-นับถอยหลัง.wav',
    beat_1: '22-นับหนึ่ง.wav',
    beat_2: '23-นับสอง.wav',
    beat_3: '24-นับสาม.wav',
    beat_4: '25-นับสี่.wav',
    rep_1: '26-ครั้งที่หนึ่ง.wav',
    rep_5: '27-ครั้งที่ห้า.wav',
    rep_9: '28-ครั้งที่เก้า.wav',
    rep_10: '29-ครั้งที่สิบ.wav',
    start_arm_raise: '30-เริ่มยกแขน.wav',
    start_torso_twist: '31-เริ่มบิดลำตัว.wav',
    start_knee_raise: '32-เริ่มยกเข่า.wav',
    start_squat_arm_raise: '33-เริ่มสควอตยกแขน.wav',
    start_push_up: '34-เริ่มวิดพื้น.wav',
    start_static_lunge: '35-เริ่มลันจ์.wav',
    start_jump_squat: '36-เริ่มกระโดดสควอต.wav',
    start_plank_hold: '37-เริ่มแพลงค์.wav',
    start_mountain_climber: '38-เริ่มปีนเขา.wav',
    start_pistol_squat: '39-เริ่มสควอตขาเดียว.wav',
    start_pushup_shoulder_tap: '40-เริ่มวิดพื้นแตะไหล่.wav',
    start_burpee: '41-เริ่มเบอร์พี.wav',
    greeting: '42-คำทักทาย.wav',
    tempo_too_fast: '43-จังหวะเร็วเกิน.wav',
    tempo_too_fast_mild: '44-จังหวะเร็วนิด.wav',
    tempo_too_slow: '45-จังหวะช้าเกิน.wav',
    tempo_too_slow_mild: '46-จังหวะช้านิด.wav',
    tempo_inconsistent: '47-จังหวะไม่สม่ำเสมอ.wav',
    tempo_unbalanced_up: '48-จังหวะขึ้นเร็ว.wav',
    tempo_unbalanced_down: '49-จังหวะลงเร็ว.wav',
    tempo_perfect: '50-จังหวะเพอร์เฟค.wav',
    tempo_good: '51-จังหวะดี.wav',
    movement_too_fast: '52-เคลื่อนไหวเร็ว.wav',
    movement_too_slow: '53-เคลื่อนไหวช้า.wav',
    movement_jerky: '54-เคลื่อนไหวกระตุก.wav',
    movement_smooth: '55-เคลื่อนไหวดี.wav',
    movement_no_motion: '56-ไม่เคลื่อนไหว.wav',
    welcome: '57-ยินดีต้อนรับ.wav',
    halfway: '58-ผ่านครึ่งทาง.wav',
    session_almost_done: '59-เกือบเสร็จแล้ว.wav',
    session_complete: '60-จบเซสชั่น.wav',
    timer_15s: '61-15วินาทีแล.wav',
    timer_30s: '62-30วินาทีแล.wav',
  },
  'coach-phuyailee': {
    start: '0-มาเริ่มต้น.wav',
    excellent: '1-ยอดเยี่ยมม.wav',
    good_job: '2-เก่งมากเลย.wav',
    continue: '3-เอาล่ะทำต่.wav',
    rest: '4-พักก่อนนะแ.wav',
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
    you_can_do_it: '17-คุณทำได้ลุ.wav',
    fight: '18-สู้ๆครับผม.wav',
    almost_done: '19-ใกล้เสร็จแ.wav',
    change_exercise: '20-มาเปลี่ยนท.wav',
    move_little_more: '8-ขยับมากกว่.wav', // reuse move_more
    // ─── New categories (files 21-60) ───
    countdown: '21-นับถอยหลัง.wav',
    beat_1: '22-นับหนึ่ง.wav',
    beat_2: '23-นับสอง.wav',
    beat_3: '24-นับสาม.wav',
    beat_4: '25-นับสี่.wav',
    rep_1: '26-ครั้งที่หนึ่ง.wav',
    rep_5: '27-ครั้งที่ห้า.wav',
    rep_9: '28-ครั้งที่เก้า.wav',
    rep_10: '29-ครั้งที่สิบ.wav',
    start_arm_raise: '30-เริ่มยกแขน.wav',
    start_torso_twist: '31-เริ่มบิดลำตัว.wav',
    start_knee_raise: '32-เริ่มยกเข่า.wav',
    start_squat_arm_raise: '33-เริ่มสควอตยกแขน.wav',
    start_push_up: '34-เริ่มวิดพื้น.wav',
    start_static_lunge: '35-เริ่มลันจ์.wav',
    start_jump_squat: '36-เริ่มกระโดดสควอต.wav',
    start_plank_hold: '37-เริ่มแพลงค์.wav',
    start_mountain_climber: '38-เริ่มปีนเขา.wav',
    start_pistol_squat: '39-เริ่มสควอตขาเดียว.wav',
    start_pushup_shoulder_tap: '40-เริ่มวิดพื้นแตะไหล่.wav',
    start_burpee: '41-เริ่มเบอร์พี.wav',
    greeting: '42-คำทักทาย.wav',
    tempo_too_fast: '43-จังหวะเร็วเกิน.wav',
    tempo_too_fast_mild: '44-จังหวะเร็วนิด.wav',
    tempo_too_slow: '45-จังหวะช้าเกิน.wav',
    tempo_too_slow_mild: '46-จังหวะช้านิด.wav',
    tempo_inconsistent: '47-จังหวะไม่สม่ำเสมอ.wav',
    tempo_unbalanced_up: '48-จังหวะขึ้นเร็ว.wav',
    tempo_unbalanced_down: '49-จังหวะลงเร็ว.wav',
    tempo_perfect: '50-จังหวะเพอร์เฟค.wav',
    tempo_good: '51-จังหวะดี.wav',
    movement_too_fast: '52-เคลื่อนไหวเร็ว.wav',
    movement_too_slow: '53-เคลื่อนไหวช้า.wav',
    movement_jerky: '54-เคลื่อนไหวกระตุก.wav',
    movement_smooth: '55-เคลื่อนไหวดี.wav',
    movement_no_motion: '56-ไม่เคลื่อนไหว.wav',
    welcome: '57-ยินดีต้อนรับ.wav',
    halfway: '58-ผ่านครึ่งทาง.wav',
    session_almost_done: '59-เกือบเสร็จแล้ว.wav',
    session_complete: '60-จบเซสชั่น.wav',
    // ─── Timer (no own recording — use aiko fallback) ───────────────
    timer_15s: '../ไอโกะ/61-15วินาทีแล.wav',
    timer_30s: '../ไอโกะ/62-30วินาทีแล.wav',
  },
  'coach-alan': {
    start: '0-มาเริ่มต้น.wav',
    excellent: '1-ยอดเยี่ยมม.wav',
    good_job: '2-เก่งมากเลย.wav',
    continue: '3-เอาล่ะทำต่.wav',
    rest: '4-พักก่อนนะแ.wav',
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
    you_can_do_it: '17-คุณทำได้ลุ.wav',
    fight: '18-สู้ๆครับ.wav',
    almost_done: '19-ใกล้เสร็จแ.wav',
    change_exercise: '20-มาเปลี่ยนท.wav',
    move_little_more: '8-ขยับมากกว่.wav', // reuse move_more
    // ─── New categories (files 21-60) ───
    countdown: '21-นับถอยหลัง.wav',
    beat_1: '22-นับหนึ่ง.wav',
    beat_2: '23-นับสอง.wav',
    beat_3: '24-นับสาม.wav',
    beat_4: '25-นับสี่.wav',
    rep_1: '26-ครั้งที่หนึ่ง.wav',
    rep_5: '27-ครั้งที่ห้า.wav',
    rep_9: '28-ครั้งที่เก้า.wav',
    rep_10: '29-ครั้งที่สิบ.wav',
    start_arm_raise: '30-เริ่มยกแขน.wav',
    start_torso_twist: '31-เริ่มบิดลำตัว.wav',
    start_knee_raise: '32-เริ่มยกเข่า.wav',
    start_squat_arm_raise: '33-เริ่มสควอตยกแขน.wav',
    start_push_up: '34-เริ่มวิดพื้น.wav',
    start_static_lunge: '35-เริ่มลันจ์.wav',
    start_jump_squat: '36-เริ่มกระโดดสควอต.wav',
    start_plank_hold: '37-เริ่มแพลงค์.wav',
    start_mountain_climber: '38-เริ่มปีนเขา.wav',
    start_pistol_squat: '39-เริ่มสควอตขาเดียว.wav',
    start_pushup_shoulder_tap: '40-เริ่มวิดพื้นแตะไหล่.wav',
    start_burpee: '41-เริ่มเบอร์พี.wav',
    greeting: '42-คำทักทาย.wav',
    tempo_too_fast: '43-จังหวะเร็วเกิน.wav',
    tempo_too_fast_mild: '44-จังหวะเร็วนิด.wav',
    tempo_too_slow: '45-จังหวะช้าเกิน.wav',
    tempo_too_slow_mild: '46-จังหวะช้านิด.wav',
    tempo_inconsistent: '47-จังหวะไม่สม่ำเสมอ.wav',
    tempo_unbalanced_up: '48-จังหวะขึ้นเร็ว.wav',
    tempo_unbalanced_down: '49-จังหวะลงเร็ว.wav',
    tempo_perfect: '50-จังหวะเพอร์เฟค.wav',
    tempo_good: '51-จังหวะดี.wav',
    movement_too_fast: '52-เคลื่อนไหวเร็ว.wav',
    movement_too_slow: '53-เคลื่อนไหวช้า.wav',
    movement_jerky: '54-เคลื่อนไหวกระตุก.wav',
    movement_smooth: '55-เคลื่อนไหวดี.wav',
    movement_no_motion: '56-ไม่เคลื่อนไหว.wav',
    welcome: '57-ยินดีต้อนรับ.wav',
    halfway: '58-ผ่านครึ่งทาง.wav',
    session_almost_done: '59-เกือบเสร็จแล้ว.wav',
    session_complete: '60-จบเซสชั่น.wav',
    // ─── Timer (no own recording — use aiko fallback) ───────────────
    timer_15s: '../ไอโกะ/61-15วินาทีแล.wav',
    timer_30s: '../ไอโกะ/62-30วินาทีแล.wav',
  },
  'coach-homchan': {
    start: '0-มาเริ่มต้น.wav',
    excellent: '1-ยอดเยี่ยมม.wav',
    good_job: '2-เก่งมากเลย.wav',
    continue: '3-เอาล่ะทำต่.wav',
    rest: '4-พักก่อนนะแ.wav',
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
    you_can_do_it: '17-คุณทำได้ลุ.wav',
    fight: '18-สู้ๆค่ะ.wav',
    almost_done: '19-ใกล้เสร็จแ.wav',
    change_exercise: '20-มาเปลี่ยนท.wav',
    move_little_more: '8-ขยับมากกว่.wav', // reuse move_more
    // ─── New categories (files 21-60) ───
    countdown: '21-นับถอยหลัง.wav',
    beat_1: '22-นับหนึ่ง.wav',
    beat_2: '23-นับสอง.wav',
    beat_3: '24-นับสาม.wav',
    beat_4: '25-นับสี่.wav',
    rep_1: '26-ครั้งที่หนึ่ง.wav',
    rep_5: '27-ครั้งที่ห้า.wav',
    rep_9: '28-ครั้งที่เก้า.wav',
    rep_10: '29-ครั้งที่สิบ.wav',
    start_arm_raise: '30-เริ่มยกแขน.wav',
    start_torso_twist: '31-เริ่มบิดลำตัว.wav',
    start_knee_raise: '32-เริ่มยกเข่า.wav',
    start_squat_arm_raise: '33-เริ่มสควอตยกแขน.wav',
    start_push_up: '34-เริ่มวิดพื้น.wav',
    start_static_lunge: '35-เริ่มลันจ์.wav',
    start_jump_squat: '36-เริ่มกระโดดสควอต.wav',
    start_plank_hold: '37-เริ่มแพลงค์.wav',
    start_mountain_climber: '38-เริ่มปีนเขา.wav',
    start_pistol_squat: '39-เริ่มสควอตขาเดียว.wav',
    start_pushup_shoulder_tap: '40-เริ่มวิดพื้นแตะไหล่.wav',
    start_burpee: '41-เริ่มเบอร์พี.wav',
    greeting: '42-คำทักทาย.wav',
    tempo_too_fast: '43-จังหวะเร็วเกิน.wav',
    tempo_too_fast_mild: '44-จังหวะเร็วนิด.wav',
    tempo_too_slow: '45-จังหวะช้าเกิน.wav',
    tempo_too_slow_mild: '46-จังหวะช้านิด.wav',
    tempo_inconsistent: '47-จังหวะไม่สม่ำเสมอ.wav',
    tempo_unbalanced_up: '48-จังหวะขึ้นเร็ว.wav',
    tempo_unbalanced_down: '49-จังหวะลงเร็ว.wav',
    tempo_perfect: '50-จังหวะเพอร์เฟค.wav',
    tempo_good: '51-จังหวะดี.wav',
    movement_too_fast: '52-เคลื่อนไหวเร็ว.wav',
    movement_too_slow: '53-เคลื่อนไหวช้า.wav',
    movement_jerky: '54-เคลื่อนไหวกระตุก.wav',
    movement_smooth: '55-เคลื่อนไหวดี.wav',
    movement_no_motion: '56-ไม่เคลื่อนไหว.wav',
    welcome: '57-ยินดีต้อนรับ.wav',
    halfway: '58-ผ่านครึ่งทาง.wav',
    session_almost_done: '59-เกือบเสร็จแล้ว.wav',
    session_complete: '60-จบเซสชั่น.wav',
    // ─── Timer (no own recording — use aiko fallback) ───────────────
    timer_15s: '../ไอโกะ/61-15วินาทีแล.wav',
    timer_30s: '../ไอโกะ/62-30วินาทีแล.wav',
  },
  'coach-manee': {
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
    fight: '19-สู้ๆค่ะ~.wav',
    almost_done: '20-ฮึบฮึบใกล้.wav',
    form_correction: '17-ฟอร์มการออ.wav', // reuse form_check
    // ─── New categories (files 21-60) ───
    countdown: '21-นับถอยหลัง.wav',
    beat_1: '22-นับหนึ่ง.wav',
    beat_2: '23-นับสอง.wav',
    beat_3: '24-นับสาม.wav',
    beat_4: '25-นับสี่.wav',
    rep_1: '26-ครั้งที่หนึ่ง.wav',
    rep_5: '27-ครั้งที่ห้า.wav',
    rep_9: '28-ครั้งที่เก้า.wav',
    rep_10: '29-ครั้งที่สิบ.wav',
    start_arm_raise: '30-เริ่มยกแขน.wav',
    start_torso_twist: '31-เริ่มบิดลำตัว.wav',
    start_knee_raise: '32-เริ่มยกเข่า.wav',
    start_squat_arm_raise: '33-เริ่มสควอตยกแขน.wav',
    start_push_up: '34-เริ่มวิดพื้น.wav',
    start_static_lunge: '35-เริ่มลันจ์.wav',
    start_jump_squat: '36-เริ่มกระโดดสควอต.wav',
    start_plank_hold: '37-เริ่มแพลงค์.wav',
    start_mountain_climber: '38-เริ่มปีนเขา.wav',
    start_pistol_squat: '39-เริ่มสควอตขาเดียว.wav',
    start_pushup_shoulder_tap: '40-เริ่มวิดพื้นแตะไหล่.wav',
    start_burpee: '41-เริ่มเบอร์พี.wav',
    greeting: '42-คำทักทาย.wav',
    tempo_too_fast: '43-จังหวะเร็วเกิน.wav',
    tempo_too_fast_mild: '44-จังหวะเร็วนิด.wav',
    tempo_too_slow: '45-จังหวะช้าเกิน.wav',
    tempo_too_slow_mild: '46-จังหวะช้านิด.wav',
    tempo_inconsistent: '47-จังหวะไม่สม่ำเสมอ.wav',
    tempo_unbalanced_up: '48-จังหวะขึ้นเร็ว.wav',
    tempo_unbalanced_down: '49-จังหวะลงเร็ว.wav',
    tempo_perfect: '50-จังหวะเพอร์เฟค.wav',
    tempo_good: '51-จังหวะดี.wav',
    movement_too_fast: '52-เคลื่อนไหวเร็ว.wav',
    movement_too_slow: '53-เคลื่อนไหวช้า.wav',
    movement_jerky: '54-เคลื่อนไหวกระตุก.wav',
    movement_smooth: '55-เคลื่อนไหวดี.wav',
    movement_no_motion: '56-ไม่เคลื่อนไหว.wav',
    welcome: '57-ยินดีต้อนรับ.wav',
    halfway: '58-ผ่านครึ่งทาง.wav',
    session_almost_done: '59-เกือบเสร็จแล้ว.wav',
    session_complete: '60-จบเซสชั่น.wav',
    // ─── Timer (no own recording — use aiko fallback) ───────────────
    timer_15s: '../ไอโกะ/61-15วินาทีแล.wav',
    timer_30s: '../ไอโกะ/62-30วินาทีแล.wav',
  },
};

// ─── CoachEventType → AudioCategory mapping ────────────────────────────────

/**
 * Map a CoachEventType to possible audio categories.
 * Returns an array to allow random selection (variety).
 * Returns null for truly dynamic events that can't be pre-recorded.
 */
export function eventTypeToCategories(eventType: CoachEventType): AudioCategory[] | null {
  switch (eventType) {
    case 'session_start':
      return ['welcome', 'start', 'together'];
    case 'exercise_start':
      return ['start', 'together', 'continue'];
    case 'good_form':
      return ['excellent', 'good_job', 'amazing'];
    case 'movement_smooth':
      return ['movement_smooth', 'excellent', 'good_job'];
    case 'warn_form':
      return ['form_correction', 'straighten_back', 'form_check'];
    case 'bad_form':
      return ['form_correction', 'form_check'];
    case 'halfway':
      return ['halfway', 'fight', 'you_can_do_it'];
    case 'almost_done':
      return ['session_almost_done', 'almost_done', 'fight'];
    case 'exercise_complete':
    case 'target_reps_reached':
      return ['set_complete', 'excellent', 'amazing'];
    case 'session_complete':
      return ['session_complete', 'amazing', 'excellent'];
    case 'movement_too_fast':
      return ['movement_too_fast', 'slow_down'];
    case 'movement_too_slow':
      return ['movement_too_slow', 'speed_up', 'move_more'];
    case 'movement_jerky':
      return ['movement_jerky', 'form_check', 'slow_down'];
    case 'no_motion':
      return ['movement_no_motion', 'move_more', 'start'];
    case 'motion_detected':
      return ['good_job', 'continue'];
    case 'countdown':
      return ['countdown'];
    // Dynamic events with variable content — still need TTS API
    case 'hold_progress':
      return null;
    // rep_completed and rep_counted_audio are handled by getRepAudioCategory()
    case 'rep_completed':
    case 'rep_counted_audio':
      return null;
    default:
      return null;
  }
}

// ─── Exercise-specific audio lookup ─────────────────────────────────────────

/** Map ExerciseType → start_* AudioCategory */
const EXERCISE_START_AUDIO: Record<string, AudioCategory> = {
  arm_raise: 'start_arm_raise',
  torso_twist: 'start_torso_twist',
  knee_raise: 'start_knee_raise',
  squat_arm_raise: 'start_squat_arm_raise',
  push_up: 'start_push_up',
  static_lunge: 'start_static_lunge',
  jump_squat: 'start_jump_squat',
  plank_hold: 'start_plank_hold',
  mountain_climber: 'start_mountain_climber',
  pistol_squat: 'start_pistol_squat',
  pushup_shoulder_tap: 'start_pushup_shoulder_tap',
  burpee: 'start_burpee',
};

/**
 * Get local audio URL for starting a specific exercise.
 * @returns URL path or null if exercise type has no dedicated clip
 */
export function getExerciseStartAudioUrl(coachId: string, exerciseType: string): string | null {
  const category = EXERCISE_START_AUDIO[exerciseType];
  if (!category) return null;
  return getLocalAudioUrl(coachId, category);
}

// ─── Rep milestone audio lookup ─────────────────────────────────────────────

/** Map rep count → rep_* AudioCategory for milestone counts */
const REP_AUDIO: Record<number, AudioCategory> = {
  1: 'rep_1',
  5: 'rep_5',
  9: 'rep_9',
  10: 'rep_10',
};

/**
 * Get local audio for a specific rep count milestone.
 * Only returns audio for milestone reps (1, 5, 9, 10).
 * @returns { url, category } or null if no local audio for this rep number
 */
export function getRepAudioUrl(coachId: string, repCount: number): string | null {
  const category = REP_AUDIO[repCount];
  if (!category) return null;
  return getLocalAudioUrl(coachId, category);
}

// ─── Beat count audio lookup ────────────────────────────────────────────────

/** Map beat number → beat_* AudioCategory */
const BEAT_AUDIO: Record<number, AudioCategory> = {
  1: 'beat_1',
  2: 'beat_2',
  3: 'beat_3',
  4: 'beat_4',
};

/**
 * Get local audio for a beat count number (1-4).
 * @returns URL path or null
 */
export function getBeatAudioUrl(coachId: string, beat: number): string | null {
  const category = BEAT_AUDIO[beat];
  if (!category) return null;
  return getLocalAudioUrl(coachId, category);
}

// ─── Tempo feedback audio lookup ────────────────────────────────────────────

/** Map tempo feedback key → AudioCategory */
const TEMPO_AUDIO: Record<string, AudioCategory> = {
  too_fast: 'tempo_too_fast',
  too_fast_mild: 'tempo_too_fast_mild',
  too_slow: 'tempo_too_slow',
  too_slow_mild: 'tempo_too_slow_mild',
  inconsistent: 'tempo_inconsistent',
  unbalanced_up: 'tempo_unbalanced_up',
  unbalanced_down: 'tempo_unbalanced_down',
  perfect: 'tempo_perfect',
  good: 'tempo_good',
};

/**
 * Get local audio for a tempo feedback type.
 * @returns URL path or null
 */
export function getTempoAudioUrl(coachId: string, tempoKey: string): string | null {
  const category = TEMPO_AUDIO[tempoKey];
  if (!category) return null;
  return getLocalAudioUrl(coachId, category);
}

/**
 * Get the coach greeting audio URL.
 */
export function getGreetingAudioUrl(coachId: string): string | null {
  return getLocalAudioUrl(coachId, 'greeting');
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
