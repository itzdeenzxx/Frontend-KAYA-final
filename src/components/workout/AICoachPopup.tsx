// AI Coach Popup Component
// Shows coaching messages as popup in top-right corner with TTS support
// Using Botnoi TTS API with queue system

import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, MessageCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CoachEventType,
  FormQuality,
  TempoQuality,
  COACH_MESSAGES,
  getRandomMessage,
  ExerciseType,
} from '@/lib/exerciseConfig';
import { getLocalAudioForEvent, playLocalAudio } from '@/lib/coachAudio';

// Coach message interface
export interface CoachMessage {
  id: string;
  text: string;
  type: CoachEventType;
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
}

interface AICoachPopupProps {
  currentMessage: CoachMessage | null;
  isMuted?: boolean;
  onMuteToggle?: () => void;
  className?: string;
  coachId?: string;   // Coach ID for local audio lookup
  speaker?: string;   // Botnoi speaker voice ID (fallback)
  ttsEnabled?: boolean;
  ttsSpeed?: number;
}

// Queue item: either local audio URL or text for API
interface QueueItem {
  text: string;
  localUrl?: string; // If set, play this instead of calling API
}

// TTS State
interface TTSState {
  isSpeaking: boolean;
  queue: QueueItem[];
  currentAudio: HTMLAudioElement | null;
  speaker: string;
  coachId: string;
  ttsSpeed: number;
}

/**
 * Event types that should ONLY show as popup — NO TTS.
 * These are already spoken by WorkoutUI (local pre-recorded audio),
 * so AICoachPopup must not speak them to avoid duplicate/overlapping speech.
 */
const POPUP_ONLY_TYPES = new Set<CoachEventType>([
  'rep_completed',        // WorkoutUI speakRepCount handles reps 1,5,9,10
  'rep_counted_audio',    // same
  'exercise_start',       // WorkoutUI speakExerciseInstruction handles this
  'session_start',        // WorkoutUI speakCoachIntroduction handles this
  'target_reps_reached',  // WorkoutUI plays 'set_complete' audio
  'good_form',            // WorkoutUI form feedback effect handles these
  'warn_form',            // WorkoutUI plays 'form_check' / 'stretch_up'
  'bad_form',             // WorkoutUI plays 'form_correction' / 'stretch_up'
  'hold_form',            // WorkoutUI handles hold guidance
  'halfway',              // WorkoutUI plays 'halfway' audio
  'almost_done',          // WorkoutUI plays 'session_almost_done' audio
  'movement_too_fast',    // WorkoutUI plays 'tempo_too_fast'
  'movement_too_slow',    // WorkoutUI plays 'tempo_too_slow'
  'movement_jerky',       // WorkoutUI plays 'movement_jerky'
  'movement_smooth',      // no separate audio needed
  'no_motion',            // WorkoutUI plays 'move_more'
]);

const ttsState: TTSState = {
  isSpeaking: false,
  queue: [],
  currentAudio: null,
  speaker: '26',
  coachId: 'coach-aiko',
  ttsSpeed: 1.0,
};

// Generation counter: incremented each time stopCoachPopupAudio() is called.
// In-flight fetch/play functions compare against this to detect cancellation.
let _stopGeneration = 0;
// AbortController for the currently in-flight Botnoi API fetch (if any).
let _ttsAbortController: AbortController | null = null;
// Set to true by WorkoutUI while it is playing audio — AICoachPopup waits.
let _workoutUIAudioPlaying = false;

/**
 * Called by WorkoutUI to prevent AICoachPopup from talking over workout audio.
 * When `playing` goes from true → false, the queued items are retried.
 */
export function setWorkoutUIAudioPlaying(playing: boolean): void {
  _workoutUIAudioPlaying = playing;
  // When WorkoutUI finishes, kick the popup queue so pending items can play.
  if (!playing && !ttsState.isSpeaking && ttsState.queue.length > 0) {
    setTimeout(() => processQueue(), 150);
  }
}

/**
 * Play audio from base64 and wait until finished (with timeout protection)
 */
function playAudio(base64Audio: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio('data:audio/wav;base64,' + base64Audio);
    ttsState.currentAudio = audio;
    audio.playbackRate = ttsState.ttsSpeed || 1.0;
    
    // Timeout 10 seconds to prevent hanging
    const timeout = setTimeout(() => {
      console.warn('⚠️ Audio playback timeout');
      audio.pause();
      ttsState.currentAudio = null;
      resolve();
    }, 10000);
    
    audio.onended = () => {
      clearTimeout(timeout);
      ttsState.currentAudio = null;
      resolve();
    };
    
    audio.onerror = (e) => {
      clearTimeout(timeout);
      console.error('Audio error:', e);
      ttsState.currentAudio = null;
      resolve();
    };
    
    audio.play().catch((e) => {
      clearTimeout(timeout);
      console.error('Audio play failed:', e);
      ttsState.currentAudio = null;
      resolve();
    });
  });
}

/**
 * Process TTS queue - speak one message at a time
 */
async function processQueue(): Promise<void> {
  // Wait if WorkoutUI is currently playing or if we're already processing
  if (ttsState.isSpeaking || ttsState.queue.length === 0 || _workoutUIAudioPlaying) {
    return;
  }
  
  const item = ttsState.queue.shift();
  if (!item) return;
  
  if (!item.text) return;

  // Capture generation — if it changes during async ops, discard the result
  const myGeneration = _stopGeneration;
  
  ttsState.isSpeaking = true;

  // ── Path A: Play local pre-recorded audio ────────────────────────────
  if (item.localUrl) {
    console.log(`🔊 [CoachPopup] Playing LOCAL audio: "${item.localUrl}"`);
    try {
      const audio = new Audio(item.localUrl);
      ttsState.currentAudio = audio;
      audio.playbackRate = ttsState.ttsSpeed || 1.0;
      
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('⚠️ Local audio playback timeout');
          audio.pause();
          ttsState.currentAudio = null;
          resolve();
        }, 10000);
        
        audio.onended = () => { clearTimeout(timeout); ttsState.currentAudio = null; resolve(); };
        audio.onerror = () => { clearTimeout(timeout); ttsState.currentAudio = null; resolve(); };
        audio.play().catch(() => { clearTimeout(timeout); ttsState.currentAudio = null; resolve(); });
      });
    } catch (e) {
      console.warn('🔊 [CoachPopup] Local audio failed, falling back to API:', e);
      if (_stopGeneration === myGeneration && !_workoutUIAudioPlaying) {
        await processQueueItemAPI(item.text, myGeneration);
      }
    }
    ttsState.isSpeaking = false;
    if (_stopGeneration === myGeneration) setTimeout(() => processQueue(), 100);
    return;
  }

  // ── Path B: Call Botnoi TTS API ──────────────────────────────────────
  await processQueueItemAPI(item.text, myGeneration);
  ttsState.isSpeaking = false;
  if (_stopGeneration === myGeneration) setTimeout(() => processQueue(), 100);
}

/**
 * Call Botnoi TTS API and play the result (fallback path).
 * myGeneration is compared after each await to detect cancellation.
 */
async function processQueueItemAPI(text: string, myGeneration: number): Promise<void> {
  console.log(`🔊 [CoachPopup] Botnoi speaking: "${text}" | speaker: ${ttsState.speaker}`);
  
  try {
    let audioBase64: string | null = null;

    // Call Botnoi TTS API
    try {
      const controller = new AbortController();
      _ttsAbortController = controller;
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const botnoiRes = await fetch('/api/aift/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, speaker: ttsState.speaker }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      _ttsAbortController = null;

      // Abort if stopCoachPopupAudio() or WorkoutUI took over while we were fetching
      if (_stopGeneration !== myGeneration || _workoutUIAudioPlaying) return;

      if (botnoiRes.ok) {
        const result = await botnoiRes.json();
        if (result.success && result.audio_base64) {
          audioBase64 = result.audio_base64;
          console.log('🔊 [CoachPopup] Botnoi TTS success');
        }
      } else {
        console.warn(`🔊 [CoachPopup] Botnoi TTS failed: ${botnoiRes.status}`);
      }
    } catch (e: unknown) {
      _ttsAbortController = null;
      const errMsg = e instanceof Error ? (e.name === 'AbortError' ? 'cancelled' : e.message) : 'unknown';
      console.warn('🔊 [CoachPopup] Botnoi TTS error:', errMsg);
      return; // abort or timeout — don't play anything
    }

    // Final generation/gate check before playing
    if (_stopGeneration !== myGeneration || _workoutUIAudioPlaying) return;

    // Play audio if we got it, otherwise skip silently
    if (audioBase64) {
      await playAudio(audioBase64);
    } else {
      console.warn('🔊 [CoachPopup] Botnoi TTS failed, skipping silently');
    }
    
  } catch (error: unknown) {
    console.error('TTS Error:', error);
  }
}

/**
 * Add text to TTS queue
 */
function speakText(text: string, speaker?: string, eventType?: CoachEventType): void {
  // Update speaker if provided
  if (speaker) {
    ttsState.speaker = speaker;
  }

  // Skip TTS for event types handled by WorkoutUI (avoid duplicate speech)
  if (eventType && POPUP_ONLY_TYPES.has(eventType)) {
    console.log(`🔇 [CoachPopup] Popup-only: skip TTS for "${eventType}"`);
    return;
  }
  
  // Don't add duplicates
  if (ttsState.queue.some(item => item.text === text)) {
    return;
  }
  
  // Limit queue size
  if (ttsState.queue.length > 3) {
    ttsState.queue.shift(); // Remove oldest
  }
  
  // Try to resolve local audio for this event type
  let localUrl: string | undefined;
  if (eventType) {
    const local = getLocalAudioForEvent(ttsState.coachId, eventType);
    if (local) {
      localUrl = local.url;
      console.log(`🔊 [CoachPopup] Resolved local audio: ${local.category} → ${local.url}`);
    }
  }
  
  ttsState.queue.push({ text, localUrl });
  processQueue();
}

/**
 * Clear TTS queue, abort any in-flight fetch, and stop current audio.
 * Called by WorkoutUI before it starts speaking (exercise instruction, rep count, etc.)
 */
export function stopCoachPopupAudio(): void {
  _stopGeneration++;           // invalidate all in-flight processQueue / processQueueItemAPI
  if (_ttsAbortController) {   // cancel in-flight Botnoi API fetch immediately
    _ttsAbortController.abort();
    _ttsAbortController = null;
  }
  ttsState.queue = [];
  if (ttsState.currentAudio) {
    ttsState.currentAudio.pause();
    ttsState.currentAudio = null;
  }
  ttsState.isSpeaking = false;
}

/**
 * Clear TTS queue and stop current audio (internal use).
 */
function clearTTSQueue(): void {
  stopCoachPopupAudio();
}

export function AICoachPopup({
  currentMessage,
  isMuted = false,
  onMuteToggle,
  className = '',
  coachId = 'coach-aiko',
  speaker = '26',
  ttsEnabled = true,
  ttsSpeed = 1.0,
}: AICoachPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [displayedMessage, setDisplayedMessage] = useState<CoachMessage | null>(null);
  const lastMessageIdRef = useRef<string>('');
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset TTS queue on mount (new workout session)
  useEffect(() => {
    stopCoachPopupAudio();
    return () => stopCoachPopupAudio(); // cleanup on unmount
  }, []);

  // Update TTS state from props
  useEffect(() => {
    ttsState.speaker = speaker;
    ttsState.coachId = coachId;
    ttsState.ttsSpeed = ttsSpeed;
    console.log('🔊 [CoachPopup] TTS settings updated:', { coachId, speaker, ttsEnabled, ttsSpeed });
  }, [coachId, speaker, ttsSpeed]);

  // Handle new messages
  useEffect(() => {
    if (!currentMessage || currentMessage.id === lastMessageIdRef.current) {
      return;
    }

    lastMessageIdRef.current = currentMessage.id;
    setDisplayedMessage(currentMessage);
    setIsVisible(true);

    // Speak the message if not muted AND TTS is enabled in settings
    if (!isMuted && ttsEnabled) {
      speakText(currentMessage.text, speaker, currentMessage.type);
    } else if (!ttsEnabled) {
      console.log('🔇 [CoachPopup] TTS disabled in settings, not speaking');
    }

    // Clear previous timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    // Auto-hide after delay based on message length
    const displayDuration = Math.max(3000, currentMessage.text.length * 100);
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, displayDuration);

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [currentMessage, isMuted]);

  // Get styling based on message type
  const getMessageStyle = (type: CoachEventType) => {
    switch (type) {
      case 'good_form':
      case 'rep_completed':
      case 'target_reps_reached':
      case 'movement_smooth':
        return 'bg-green-500/90 border-green-400';
      case 'warn_form':
      case 'movement_too_fast':
      case 'movement_too_slow':
      case 'movement_jerky':
        return 'bg-orange-500/90 border-orange-400';
      case 'bad_form':
        return 'bg-red-500/90 border-red-400';
      case 'halfway':
      case 'almost_done':
        return 'bg-blue-500/90 border-blue-400';
      case 'exercise_start':
      case 'session_start':
        return 'bg-purple-500/90 border-purple-400';
      default:
        return 'bg-gray-800/90 border-gray-600';
    }
  };

  // Get icon based on message type
  const getMessageIcon = (type: CoachEventType) => {
    switch (type) {
      case 'good_form':
      case 'rep_completed':
      case 'target_reps_reached':
      case 'movement_smooth':
        return '🎉';
      case 'warn_form':
        return '⚠️';
      case 'bad_form':
        return '❌';
      case 'movement_too_fast':
        return '⚡';
      case 'movement_too_slow':
        return '🐢';
      case 'movement_jerky':
        return '📊';
      case 'halfway':
        return '🏃';
      case 'almost_done':
        return '🔥';
      case 'exercise_start':
        return '🏋️';
      case 'session_start':
        return '👋';
      case 'no_motion':
        return '💤';
      default:
        return '💬';
    }
  };

  return (
    <div className={cn('fixed top-24 right-6 z-50', className)}>
      {/* Mute Toggle Button */}
      <button
        onClick={onMuteToggle}
        className="absolute -left-12 top-0 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        title={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {/* Message Popup */}
      <div
        className={cn(
          'transform transition-all duration-300 ease-out',
          isVisible
            ? 'translate-x-0 opacity-100 scale-100'
            : 'translate-x-full opacity-0 scale-95'
        )}
      >
        {displayedMessage && (
          <div
            className={cn(
              'max-w-sm rounded-2xl border-2 p-4 shadow-2xl backdrop-blur-sm',
              getMessageStyle(displayedMessage.type)
            )}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="text-3xl flex-shrink-0">
                {getMessageIcon(displayedMessage.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-white/80" />
                  <span className="text-xs font-medium text-white/80 uppercase tracking-wide">
                    AI Coach
                  </span>
                </div>
                <p className="text-white font-medium text-lg leading-snug">
                  {displayedMessage.text}
                </p>
              </div>
            </div>

            {/* Speaking indicator */}
            {!isMuted && (
              <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/20">
                <Volume2 className="w-4 h-4 text-white/60" />
                <div className="flex gap-1">
                  <span className="w-1 h-3 bg-white/60 rounded-full animate-pulse" />
                  <span className="w-1 h-3 bg-white/60 rounded-full animate-pulse delay-75" />
                  <span className="w-1 h-3 bg-white/60 rounded-full animate-pulse delay-150" />
                </div>
                <span className="text-xs text-white/60 ml-1">กำลังพูด...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// AI Coach Service - Manages message generation and timing
export class AICoachService {
  private lastMessageTime: Map<CoachEventType, number> = new Map();
  private consecutiveFormIssues: number = 0;
  private messageHistory: string[] = [];
  private minMessageInterval = 2000; // 2 seconds minimum between messages

  // Generate a unique message ID
  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Check if enough time has passed for this event type
  private canSendMessage(type: CoachEventType): boolean {
    const lastTime = this.lastMessageTime.get(type) || 0;
    const now = Date.now();
    
    // Different intervals for different message types
    // Priority: warnings (1) > hold/count (2) > encouragement (3)
    const intervals: Partial<Record<CoachEventType, number>> = {
      // PRIORITY 1: Warnings - show more frequently
      bad_form: 2000,       // Every 2 seconds (most urgent)
      warn_form: 2500,      // Every 2.5 seconds
      // PRIORITY 2: Hold/Count feedback
      hold_form: 600,       // Very frequent for "hold it" feedback
      rep_completed: 800,   // Quick counting feedback
      // PRIORITY 3: Encouragement - less frequent
      good_form: 8000,      // Every 8 seconds (low priority)
      movement_too_fast: 4000,
      movement_too_slow: 4000,
      movement_smooth: 15000, // Very rare encouragement
    };

    const interval = intervals[type] || this.minMessageInterval;
    return now - lastTime >= interval;
  }

  // Avoid repeating recent messages
  private isRepeatedMessage(text: string): boolean {
    if (this.messageHistory.includes(text)) {
      return true;
    }
    
    this.messageHistory.push(text);
    if (this.messageHistory.length > 5) {
      this.messageHistory.shift();
    }
    
    return false;
  }

  // Generate message for session start
  getSessionStartMessage(): CoachMessage {
    return {
      id: this.generateId(),
      text: COACH_MESSAGES.welcome,
      type: 'session_start',
      timestamp: Date.now(),
      priority: 'high',
    };
  }

  // Generate message for exercise start
  getExerciseStartMessage(exerciseType: ExerciseType): CoachMessage {
    const text = COACH_MESSAGES.start_exercise[exerciseType];
    return {
      id: this.generateId(),
      text,
      type: 'exercise_start',
      timestamp: Date.now(),
      priority: 'high',
    };
  }

  // Generate message for rep completed
  getRepCompletedMessage(count: number): CoachMessage | null {
    if (!this.canSendMessage('rep_completed')) {
      return null;
    }
    
    this.lastMessageTime.set('rep_completed', Date.now());
    
    return {
      id: this.generateId(),
      text: COACH_MESSAGES.rep_count(count),
      type: 'rep_completed',
      timestamp: Date.now(),
      priority: 'medium',
    };
  }

  // Generate message for target reps reached
  getTargetReachedMessage(count: number): CoachMessage {
    return {
      id: this.generateId(),
      text: COACH_MESSAGES.target_reached(count),
      type: 'target_reps_reached',
      timestamp: Date.now(),
      priority: 'high',
    };
  }

  // Generate message for form feedback
  getFormFeedbackMessage(
    quality: FormQuality,
    suggestions: string[]
  ): CoachMessage | null {
    // Check if this is a "hold it" feedback (always show these immediately)
    const isHoldFeedback = suggestions.length > 0 && suggestions[0].includes('ค้างไว้');
    
    // Use hold_form event type for hold feedback (shorter cooldown)
    const eventType: CoachEventType = 
      isHoldFeedback ? 'hold_form' :
      quality === 'good' ? 'good_form' :
      quality === 'warn' ? 'warn_form' : 'bad_form';

    if (!this.canSendMessage(eventType)) {
      return null;
    }

    // Track consecutive issues (skip for hold feedback)
    if (!isHoldFeedback) {
      if (quality !== 'good') {
        this.consecutiveFormIssues++;
      } else {
        this.consecutiveFormIssues = 0;
      }

      // PRIORITY 1: Show warnings quickly (after fewer issues)
      // Only show warnings after consecutive issues
      if (quality === 'warn' && this.consecutiveFormIssues < 2) {
        return null;
      }

      if (quality === 'bad' && this.consecutiveFormIssues < 1) {
        return null;
      }
      
      // PRIORITY 3: Good form encouragement - very rare (only 10% chance)
      if (quality === 'good' && Math.random() > 0.1) {
        return null;
      }
    }

    let text: string;
    if (isHoldFeedback || quality === 'good') {
      // Use specific suggestion if available (like "ค้างไว้"), otherwise random
      text = suggestions[0] || getRandomMessage(COACH_MESSAGES.good_form);
    } else if (quality === 'warn') {
      text = suggestions[0] || getRandomMessage(COACH_MESSAGES.warn_form);
    } else {
      text = suggestions[0] || getRandomMessage(COACH_MESSAGES.bad_form);
    }

    // Avoid repeats (but allow hold feedback to repeat since it's guidance)
    if (!isHoldFeedback && this.isRepeatedMessage(text)) {
      return null;
    }

    this.lastMessageTime.set(eventType, Date.now());

    return {
      id: this.generateId(),
      text,
      type: isHoldFeedback ? 'good_form' : eventType, // Display as good_form style
      timestamp: Date.now(),
      priority: quality === 'bad' ? 'high' : 'medium',
    };
  }

  // Generate message for tempo feedback
  getTempoFeedbackMessage(quality: TempoQuality, feedback: string): CoachMessage | null {
    const eventType: CoachEventType = 
      quality === 'too_fast' ? 'movement_too_fast' :
      quality === 'too_slow' ? 'movement_too_slow' : 'good_form';

    if (!this.canSendMessage(eventType)) {
      return null;
    }

    if (!feedback || this.isRepeatedMessage(feedback)) {
      return null;
    }

    this.lastMessageTime.set(eventType, Date.now());

    return {
      id: this.generateId(),
      text: feedback,
      type: eventType,
      timestamp: Date.now(),
      priority: quality === 'perfect' ? 'low' : 'medium',
    };
  }

  // Generate message for movement quality
  getMovementFeedbackMessage(feedback: string | null): CoachMessage | null {
    if (!feedback) return null;

    const isFast = feedback.includes('เร็ว');
    const isSlow = feedback.includes('ช้า');
    const isJerky = feedback.includes('ราบรื่น') && feedback.includes('ขึ้น');
    const isSmooth = feedback.includes('ราบรื่น') && feedback.includes('ดี');
    const noMotion = feedback.includes('เริ่มเคลื่อนไหว');

    let eventType: CoachEventType = 'good_form';
    if (isFast) eventType = 'movement_too_fast';
    else if (isSlow) eventType = 'movement_too_slow';
    else if (isJerky) eventType = 'movement_jerky';
    else if (isSmooth) eventType = 'movement_smooth';
    else if (noMotion) eventType = 'no_motion';

    if (!this.canSendMessage(eventType)) {
      return null;
    }

    if (this.isRepeatedMessage(feedback)) {
      return null;
    }

    this.lastMessageTime.set(eventType, Date.now());

    return {
      id: this.generateId(),
      text: feedback,
      type: eventType,
      timestamp: Date.now(),
      priority: 'medium',
    };
  }

  // Generate halfway message
  getHalfwayMessage(): CoachMessage {
    return {
      id: this.generateId(),
      text: COACH_MESSAGES.halfway,
      type: 'halfway',
      timestamp: Date.now(),
      priority: 'medium',
    };
  }

  // Generate almost done message
  getAlmostDoneMessage(): CoachMessage {
    return {
      id: this.generateId(),
      text: COACH_MESSAGES.almost_done,
      type: 'almost_done',
      timestamp: Date.now(),
      priority: 'medium',
    };
  }

  // Generate exercise complete message
  getExerciseCompleteMessage(repCount: number): CoachMessage {
    return {
      id: this.generateId(),
      text: COACH_MESSAGES.exercise_complete(repCount),
      type: 'exercise_complete',
      timestamp: Date.now(),
      priority: 'high',
    };
  }

  // Generate session complete message
  getSessionCompleteMessage(): CoachMessage {
    return {
      id: this.generateId(),
      text: COACH_MESSAGES.session_complete,
      type: 'session_complete',
      timestamp: Date.now(),
      priority: 'high',
    };
  }

  // Reset service state
  reset(): void {
    this.lastMessageTime.clear();
    this.consecutiveFormIssues = 0;
    this.messageHistory = [];
  }
}

export default AICoachPopup;
