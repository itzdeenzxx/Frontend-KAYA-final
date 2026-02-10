import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Trash2, Play, Loader2, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { VoiceReference } from '@/lib/coachConfig';

interface VoiceRefsManagerProps {
  userId: string;
  isDark: boolean;
  voiceRefs: VoiceReference[];
  onChange: (refs: VoiceReference[]) => void;
  maxRefs?: number;
  gender?: 'female' | 'male';
}

const RECORD_DURATION = 10; // seconds
const SAMPLE_SCRIPTS_FEMALE = [
  'สวัสดีค่ะ วันนี้เราจะมาออกกำลังกายด้วยกันนะคะ ตั้งใจทำให้เต็มที่ สู้สู้ เราทำได้',
  'ท่าต่อไปคือ Squat นะคะ ย่อตัวลงช้าช้า เข่าไม่เลยปลายเท้า แล้วยืนขึ้นมาเลยค่ะ',
  'เก่งมากเลยค่ะ ทำได้ดีมาก วันนี้ออกกำลังกายครบแล้ว พักผ่อนให้เพียงพอด้วยนะคะ',
];
const SAMPLE_SCRIPTS_MALE = [
  'สวัสดีครับ วันนี้เราจะมาออกกำลังกายด้วยกันนะครับ ตั้งใจทำให้เต็มที่ สู้สู้ เราทำได้',
  'ท่าต่อไปคือ Squat นะครับ ย่อตัวลงช้าช้า เข่าไม่เลยปลายเท้า แล้วยืนขึ้นมาเลยครับ',
  'เก่งมากเลยครับ ทำได้ดีมาก วันนี้ออกกำลังกายครบแล้ว พักผ่อนให้เพียงพอด้วยนะครับ',
];

export function VoiceRefsManager({ userId, isDark, voiceRefs, onChange, maxRefs = 3, gender = 'female' }: VoiceRefsManagerProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null); // null = adding new

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sampleScripts = gender === 'male' ? SAMPLE_SCRIPTS_MALE : SAMPLE_SCRIPTS_FEMALE;
  const currentScript = sampleScripts[editingIndex !== null ? editingIndex : voiceRefs.length] || sampleScripts[0];

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) audioRef.current.pause();
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    };
  }, [recordingUrl]);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 24000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm',
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        try {
          const wavBlob = await convertToWav(blob);
          setRecordingBlob(wavBlob);
          setRecordingUrl(URL.createObjectURL(wavBlob));
        } catch {
          setRecordingBlob(blob);
          setRecordingUrl(URL.createObjectURL(blob));
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= RECORD_DURATION - 1) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return RECORD_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setError('ไม่สามารถเข้าถึงไมโครโฟนได้');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const convertToWav = async (webmBlob: Blob): Promise<Blob> => {
    const audioContext = new AudioContext({ sampleRate: 24000 });
    const arrayBuffer = await webmBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = 24000;

    let samples: Float32Array;
    if (audioBuffer.sampleRate !== sampleRate) {
      const ratio = audioBuffer.sampleRate / sampleRate;
      const newLength = Math.round(channelData.length / ratio);
      samples = new Float32Array(newLength);
      for (let i = 0; i < newLength; i++) {
        samples[i] = channelData[Math.min(Math.round(i * ratio), channelData.length - 1)];
      }
    } else {
      samples = channelData;
    }

    const pcmData = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    const wavBuf = new ArrayBuffer(44 + pcmData.byteLength);
    const v = new DataView(wavBuf);
    const w = (off: number, str: string) => { for (let i = 0; i < str.length; i++) v.setUint8(off + i, str.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + pcmData.byteLength, true); w(8, 'WAVE');
    w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true);
    v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    w(36, 'data'); v.setUint32(40, pcmData.byteLength, true);
    new Uint8Array(wavBuf).set(new Uint8Array(pcmData.buffer), 44);

    audioContext.close();
    return new Blob([wavBuf], { type: 'audio/wav' });
  };

  const playAudio = useCallback((url: string, id: string) => {
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingId(id);
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
    audio.play().catch(() => setPlayingId(null));
  }, []);

  const uploadAndSave = useCallback(async () => {
    if (!recordingBlob) return;
    setIsUploading(true);
    setError(null);

    try {
      const refIndex = editingIndex !== null ? editingIndex : voiceRefs.length;
      const refId = `ref-${refIndex + 1}`;
      const storagePath = `${userId}/sound-ref/${refId}.wav`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, recordingBlob, { contentType: 'audio/wav' });
      const downloadUrl = await getDownloadURL(storageRef);

      const newRef: VoiceReference = {
        id: refId,
        audioUrl: downloadUrl,
        refText: currentScript,
        createdAt: Date.now(),
      };

      let newRefs: VoiceReference[];
      if (editingIndex !== null) {
        // Replace existing
        newRefs = [...voiceRefs];
        newRefs[editingIndex] = newRef;
      } else {
        // Add new
        newRefs = [...voiceRefs, newRef];
      }

      onChange(newRefs);
      discardRecording();
      setEditingIndex(null);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError('ไม่สามารถอัปโหลดเสียงได้');
    } finally {
      setIsUploading(false);
    }
  }, [recordingBlob, userId, voiceRefs, editingIndex, currentScript, onChange]);

  const deleteRef = useCallback(async (index: number) => {
    const refToDelete = voiceRefs[index];
    try {
      const storagePath = `${userId}/sound-ref/${refToDelete.id}.wav`;
      const storageRef = ref(storage, storagePath);
      try { await deleteObject(storageRef); } catch { /* ignore */ }
    } catch { /* ignore */ }

    const newRefs = voiceRefs.filter((_, i) => i !== index);
    onChange(newRefs);
  }, [voiceRefs, userId, onChange]);

  const discardRecording = useCallback(() => {
    setRecordingBlob(null);
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    setRecordingUrl(null);
    setRecordingTime(0);
    setError(null);
  }, [recordingUrl]);

  const isAdding = editingIndex !== null || (!recordingBlob && voiceRefs.length < maxRefs);

  return (
    <div className="space-y-3">
      {/* Existing voice refs list */}
      {voiceRefs.map((vr, i) => (
        <div key={vr.id} className={cn(
          "rounded-xl p-3 border flex items-center gap-3",
          isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
        )}>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
            isDark ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"
          )}>
            {i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-medium truncate", isDark ? "text-white" : "text-gray-900")}>
              เสียงที่ {i + 1}
            </p>
            <p className={cn("text-xs truncate", isDark ? "text-gray-400" : "text-gray-500")}>
              {vr.refText.substring(0, 40)}...
            </p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0"
              onClick={() => playAudio(vr.audioUrl, vr.id)}
              disabled={playingId === vr.id}
            >
              {playingId === vr.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0"
              onClick={() => { setEditingIndex(i); discardRecording(); }}
            >
              <Mic className="w-4 h-4 text-orange-400" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400"
              onClick={() => deleteRef(i)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}

      {/* Recording area: show when adding/editing */}
      {(editingIndex !== null || voiceRefs.length < maxRefs) && (
        <div className={cn(
          "rounded-xl p-4 border",
          isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <p className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>
              {editingIndex !== null ? `แก้ไขเสียงที่ ${editingIndex + 1}` : `เพิ่มเสียงที่ ${voiceRefs.length + 1}`}
            </p>
            {editingIndex !== null && (
              <Button size="sm" variant="ghost" onClick={() => { setEditingIndex(null); discardRecording(); }}>
                ยกเลิก
              </Button>
            )}
          </div>

          {/* Script */}
          <div className={cn(
            "rounded-lg p-2.5 border mb-3",
            isDark ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-200"
          )}>
            <p className={cn("text-xs font-medium mb-1", isDark ? "text-blue-400" : "text-blue-600")}>
              📝 อ่านข้อความนี้:
            </p>
            <p className={cn("text-sm leading-relaxed", isDark ? "text-blue-200" : "text-blue-800")}>
              "{currentScript}"
            </p>
          </div>

          {!recordingBlob ? (
            /* Record button */
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center transition-all",
                  isRecording
                    ? "bg-red-500 animate-pulse shadow-lg shadow-red-500/30"
                    : isDark
                      ? "bg-primary/20 hover:bg-primary/30 border-2 border-primary/50"
                      : "bg-primary/10 hover:bg-primary/20 border-2 border-primary/30"
                )}
              >
                {isRecording ? <Square className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-primary" />}
              </button>
              {isRecording ? (
                <div className="text-center">
                  <p className="text-lg font-mono font-bold text-red-400">{recordingTime}s / {RECORD_DURATION}s</p>
                  <div className="w-36 h-1 bg-gray-700 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full transition-all duration-1000"
                      style={{ width: `${(recordingTime / RECORD_DURATION) * 100}%` }} />
                  </div>
                </div>
              ) : (
                <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                  กดเพื่ออัดเสียง ({RECORD_DURATION} วินาที)
                </p>
              )}
            </div>
          ) : (
            /* Preview & Save */
            <div className="space-y-2">
              <div className={cn(
                "rounded-lg p-2 flex items-center gap-2",
                isDark ? "bg-white/5" : "bg-white"
              )}>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0"
                  onClick={() => recordingUrl && playAudio(recordingUrl, 'preview')}
                  disabled={playingId === 'preview'}
                >
                  {playingId === 'preview' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                </Button>
                <span className={cn("text-sm flex-1", isDark ? "text-gray-300" : "text-gray-700")}>
                  {recordingTime}วินาที • WAV
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={discardRecording} disabled={isUploading} className="flex-1">
                  <Trash2 className="w-3 h-3 mr-1" /> อัดใหม่
                </Button>
                <Button size="sm" onClick={uploadAndSave} disabled={isUploading} className="flex-1">
                  {isUploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
                  {isUploading ? 'กำลังบันทึก...' : 'บันทึก'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Capacity indicator */}
      <p className={cn("text-xs text-center", isDark ? "text-gray-500" : "text-gray-400")}>
        เสียงอ้างอิง {voiceRefs.length}/{maxRefs} (ยิ่งมากยิ่งแม่นยำ)
      </p>

      {error && (
        <div className="rounded-lg p-2 flex items-center gap-2 text-sm bg-red-500/10 text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
    </div>
  );
}

export default VoiceRefsManager;
