// AI Coach Popup Component
// Shows coaching messages as popup in top-right corner with TTS support
// Using VAJA TTS API (AI for Thai) with queue system

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
}

// TTS State
interface TTSState {
  isSpeaking: boolean;
  queue: string[];
  currentAudio: HTMLAudioElement | null;
}

const ttsState: TTSState = {
  isSpeaking: false,
  queue: [],
  currentAudio: null,
};

/**
 * Play audio from base64 and wait until finished (with timeout protection)
 */
function playAudio(base64Audio: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio('data:audio/wav;base64,' + base64Audio);
    ttsState.currentAudio = audio;
    
    // Timeout 10 seconds to prevent hanging
    const timeout = setTimeout(() => {
      console.warn('⚠️ Audio playback timeout');
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
  if (ttsState.isSpeaking || ttsState.queue.length === 0) {
    return;
  }
  
  const text = ttsState.queue.shift();
  if (!text) return;
  
  ttsState.isSpeaking = true;
  console.log(`🔊 Speaking: "${text}"`);
  
  try {
    // Add timeout for fetch to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s total timeout
    
    const response = await fetch('/api/aift/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text,
        speaker: 'nana'  // เสียงผู้หญิง ชัดเจน
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`TTS API error: ${response.status}, using fallback`);
      await speakWithWebSpeech(text);
      return;
    }
    
    const result = await response.json();
    
    if (result.success && result.audio_base64) {
      await playAudio(result.audio_base64);
    } else {
      console.warn('TTS API returned no audio:', result);
      // Fallback to Web Speech API
      await speakWithWebSpeech(text);
    }
    
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('TTS request timed out, using fallback');
    } else {
      console.error('TTS Error:', error);
    }
    // Fallback to Web Speech API
    await speakWithWebSpeech(text);
  } finally {
    ttsState.isSpeaking = false;
    // Process next message in queue with small delay
    setTimeout(() => processQueue(), 100);
  }
}

/**
 * Fallback: Use Web Speech API
 */
function speakWithWebSpeech(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve();
      return;
    }
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH';
    utterance.rate = 1.0;
    
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    
    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Add text to TTS queue
 */
function speakText(text: string): void {
  // Don't add duplicates
  if (ttsState.queue.includes(text)) {
    return;
  }
  
  // Limit queue size
  if (ttsState.queue.length > 3) {
    ttsState.queue.shift(); // Remove oldest
  }
  
  ttsState.queue.push(text);
  processQueue();
}

/**
 * Clear TTS queue and stop current audio
 */
function clearTTSQueue(): void {
  ttsState.queue = [];
  if (ttsState.currentAudio) {
    ttsState.currentAudio.pause();
    ttsState.currentAudio = null;
  }
  ttsState.isSpeaking = false;
}

export function AICoachPopup({
  currentMessage,
  isMuted = false,
  onMuteToggle,
  className = '',
}: AICoachPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [displayedMessage, setDisplayedMessage] = useState<CoachMessage | null>(null);
  const lastMessageIdRef = useRef<string>('');
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle new messages
  useEffect(() => {
    if (!currentMessage || currentMessage.id === lastMessageIdRef.current) {
      return;
    }

    lastMessageIdRef.current = currentMessage.id;
    setDisplayedMessage(currentMessage);
    setIsVisible(true);

    // Speak the message if not muted
    if (!isMuted) {
      speakText(currentMessage.text);
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
    const intervals: Partial<Record<CoachEventType, number>> = {
      good_form: 5000,      // Every 5 seconds max
      warn_form: 4000,      // Every 4 seconds max
      bad_form: 3000,       // Every 3 seconds max
      rep_completed: 1000,  // Every second (for counting)
      movement_too_fast: 5000,
      movement_too_slow: 5000,
      movement_smooth: 10000,
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
    const eventType: CoachEventType = 
      quality === 'good' ? 'good_form' :
      quality === 'warn' ? 'warn_form' : 'bad_form';

    if (!this.canSendMessage(eventType)) {
      return null;
    }

    // Track consecutive issues
    if (quality !== 'good') {
      this.consecutiveFormIssues++;
    } else {
      this.consecutiveFormIssues = 0;
    }

    // Only show warnings after consecutive issues
    if (quality === 'warn' && this.consecutiveFormIssues < 3) {
      return null;
    }

    if (quality === 'bad' && this.consecutiveFormIssues < 2) {
      return null;
    }

    // For good form, only 20% chance to show
    if (quality === 'good' && Math.random() > 0.2) {
      return null;
    }

    let text: string;
    if (quality === 'good') {
      text = getRandomMessage(COACH_MESSAGES.good_form);
    } else if (quality === 'warn') {
      text = suggestions[0] || getRandomMessage(COACH_MESSAGES.warn_form);
    } else {
      text = suggestions[0] || getRandomMessage(COACH_MESSAGES.bad_form);
    }

    // Avoid repeats
    if (this.isRepeatedMessage(text)) {
      return null;
    }

    this.lastMessageTime.set(eventType, Date.now());

    return {
      id: this.generateId(),
      text,
      type: eventType,
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
