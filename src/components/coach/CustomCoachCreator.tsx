import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Save, Trash2, Loader2, Sparkles, Palette, MessageSquare, Mic, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CustomAvatarId,
  CustomCoach,
  CUSTOM_AVATAR_OPTIONS,
  VoiceReference,
} from '@/lib/coachConfig';
import { getCustomAvatar } from './CustomAvatars';
import { VoiceRefsManager } from '@/components/settings/VoiceRefsManager';
import { saveCustomCoach, getCustomCoach, deleteCustomCoach } from '@/lib/firestore';

interface CustomCoachCreatorProps {
  userId: string;
  isDark: boolean;
  onDone: (coachId: string | null) => void; // null = cancelled/deleted
  onBack: () => void;
}

const PERSONALITY_SUGGESTIONS = [
  { label: 'ร่าเริง 😄', text: 'ร่าเริง สนุกสนาน กระตือรือร้น ชอบให้กำลังใจด้วยคำพูดบวกๆ' },
  { label: 'เข้มงวด 💪', text: 'เข้มงวด จริงจัง ไม่ยอมให้ขี้เกียจ กระตุ้นให้ทำได้ดีขึ้น' },
  { label: 'อ่อนโยน 🌸', text: 'อ่อนโยน นุ่มนวล อบอุ่น คอยเป็นกำลังใจ ไม่กดดัน' },
  { label: 'ตลก 😂', text: 'ตลก มีอารมณ์ขัน ชอบพูดมุก ทำให้การออกกำลังกายสนุก' },
  { label: 'ชิลล์ 😎', text: 'สบายๆ ชิลล์ ไม่เร่งรีบ เน้นความสุขมากกว่าผลลัพธ์' },
  { label: 'มืออาชีพ 🎯', text: 'มืออาชีพ ให้ความรู้ถูกต้อง มีข้อมูลเชิงวิทยาศาสตร์ พูดตรงประเด็น' },
];

export function CustomCoachCreator({ userId, isDark, onDone, onBack }: CustomCoachCreatorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExisting, setIsExisting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<CustomAvatarId>('avatar-sporty-f');
  const [personality, setPersonality] = useState('');
  const [voiceRefs, setVoiceRefs] = useState<VoiceReference[]>([]);

  // Derived
  const selectedAvatarOption = CUSTOM_AVATAR_OPTIONS.find(a => a.id === selectedAvatar);
  const gender = selectedAvatarOption?.gender || 'female';
  const color = selectedAvatarOption?.color || '#FF6B9D';

  // Load existing custom coach
  useEffect(() => {
    const load = async () => {
      try {
        const existing = await getCustomCoach(userId);
        if (existing) {
          setName(existing.name);
          setSelectedAvatar(existing.avatarId as CustomAvatarId);
          setPersonality(existing.personality);
          setVoiceRefs(existing.voiceRefs || []);
          setIsExisting(true);
        }
      } catch (err) {
        console.error('Error loading custom coach:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [userId]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    setIsSaving(true);

    try {
      const customCoach: CustomCoach = {
        name: name.trim(),
        avatarId: selectedAvatar,
        gender,
        personality: personality.trim(),
        color,
        voiceRefs,
        createdAt: isExisting ? Date.now() : Date.now(), // keep original if editing
        updatedAt: Date.now(),
      };

      await saveCustomCoach(userId, customCoach);
      onDone('coach-custom');
    } catch (err) {
      console.error('Error saving custom coach:', err);
    } finally {
      setIsSaving(false);
    }
  }, [name, selectedAvatar, gender, personality, color, voiceRefs, userId, isExisting, onDone]);

  const handleDelete = useCallback(async () => {
    if (!confirm('ลบโค้ชที่สร้างเองทั้งหมด?')) return;
    setIsDeleting(true);
    try {
      await deleteCustomCoach(userId);
      onDone(null);
    } catch (err) {
      console.error('Error deleting custom coach:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [userId, onDone]);

  const femaleAvatars = CUSTOM_AVATAR_OPTIONS.filter(a => a.gender === 'female');
  const maleAvatars = CUSTOM_AVATAR_OPTIONS.filter(a => a.gender === 'male');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="w-4 h-4" />
          กลับ
        </Button>
        <div className="flex-1">
          <h2 className={cn("font-bold text-lg", isDark ? "text-white" : "text-gray-900")}>
            {isExisting ? 'แก้ไขโค้ชของฉัน' : 'สร้างโค้ชของฉัน'}
          </h2>
          <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
            กำหนดชื่อ รูปร่าง บุคลิก และเสียงโค้ชของคุณ
          </p>
        </div>
      </div>

      {/* 1. Coach Name */}
      <section className={cn(
        "rounded-2xl p-4 border",
        isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
      )}>
        <div className="flex items-center gap-2 mb-3">
          <UserCircle className={cn("w-5 h-5", isDark ? "text-primary" : "text-primary")} />
          <h3 className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>
            ชื่อโค้ช
          </h3>
        </div>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="เช่น โค้ชเจ, โค้ชปอนด์"
          maxLength={20}
          className={cn(
            "text-lg",
            isDark && "bg-white/5 border-white/10 text-white placeholder:text-gray-500"
          )}
        />
        <p className={cn("text-xs mt-1 text-right", isDark ? "text-gray-500" : "text-gray-400")}>
          {name.length}/20
        </p>
      </section>

      {/* 2. Avatar Selection */}
      <section className={cn(
        "rounded-2xl p-4 border",
        isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
      )}>
        <div className="flex items-center gap-2 mb-3">
          <Palette className={cn("w-5 h-5", isDark ? "text-pink-400" : "text-pink-500")} />
          <h3 className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>
            รูปร่างโค้ช
          </h3>
        </div>

        {/* Female avatars */}
        <p className={cn("text-xs font-medium mb-2", isDark ? "text-gray-400" : "text-gray-500")}>
          👩 ผู้หญิง
        </p>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {femaleAvatars.map((opt) => {
            const Avatar = getCustomAvatar(opt.id);
            const isSelected = selectedAvatar === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelectedAvatar(opt.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all",
                  isSelected
                    ? "ring-2 ring-primary bg-primary/10 scale-105"
                    : isDark
                      ? "bg-white/5 hover:bg-white/10"
                      : "bg-gray-50 hover:bg-gray-100"
                )}
              >
                <Avatar size={56} />
                <span className={cn(
                  "text-[10px] font-medium leading-tight text-center",
                  isSelected ? "text-primary" : isDark ? "text-gray-400" : "text-gray-600"
                )}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Male avatars */}
        <p className={cn("text-xs font-medium mb-2", isDark ? "text-gray-400" : "text-gray-500")}>
          👨 ผู้ชาย
        </p>
        <div className="grid grid-cols-4 gap-2">
          {maleAvatars.map((opt) => {
            const Avatar = getCustomAvatar(opt.id);
            const isSelected = selectedAvatar === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelectedAvatar(opt.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all",
                  isSelected
                    ? "ring-2 ring-primary bg-primary/10 scale-105"
                    : isDark
                      ? "bg-white/5 hover:bg-white/10"
                      : "bg-gray-50 hover:bg-gray-100"
                )}
              >
                <Avatar size={56} />
                <span className={cn(
                  "text-[10px] font-medium leading-tight text-center",
                  isSelected ? "text-primary" : isDark ? "text-gray-400" : "text-gray-600"
                )}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Personality / Mood */}
      <section className={cn(
        "rounded-2xl p-4 border",
        isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
      )}>
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className={cn("w-5 h-5", isDark ? "text-violet-400" : "text-violet-500")} />
          <h3 className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>
            บุคลิกโค้ช
          </h3>
        </div>
        <p className={cn("text-xs mb-2", isDark ? "text-gray-400" : "text-gray-500")}>
          โค้ชจะพูดตามบุคลิกที่คุณกำหนด ทั้งข้อความและเสียง
        </p>

        {/* Quick suggestions */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {PERSONALITY_SUGGESTIONS.map((s) => (
            <Badge
              key={s.label}
              variant={personality === s.text ? 'default' : 'outline'}
              className={cn(
                "cursor-pointer transition-all text-xs",
                personality === s.text
                  ? "bg-primary text-white"
                  : isDark
                    ? "hover:bg-white/10"
                    : "hover:bg-gray-100"
              )}
              onClick={() => setPersonality(s.text)}
            >
              {s.label}
            </Badge>
          ))}
        </div>

        <Textarea
          value={personality}
          onChange={(e) => setPersonality(e.target.value)}
          placeholder="เช่น พูดเป็นกันเอง เรียกฉันว่า 'นายกล้าม' ชอบพูดสู้ๆ"
          maxLength={200}
          rows={3}
          className={cn(
            isDark && "bg-white/5 border-white/10 text-white placeholder:text-gray-500"
          )}
        />
        <p className={cn("text-xs mt-1 text-right", isDark ? "text-gray-500" : "text-gray-400")}>
          {personality.length}/200
        </p>
      </section>

      {/* 4. Voice References */}
      <section className={cn(
        "rounded-2xl p-4 border",
        isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
      )}>
        <div className="flex items-center gap-2 mb-1">
          <Mic className={cn("w-5 h-5", isDark ? "text-orange-400" : "text-orange-500")} />
          <h3 className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>
            เสียงโค้ช (ไม่บังคับ)
          </h3>
        </div>
        <p className={cn("text-xs mb-3", isDark ? "text-gray-400" : "text-gray-500")}>
          อัดเสียงเพื่อให้โค้ชพูดด้วยเสียงของคุณ (Voice Cloning)
        </p>

        <VoiceRefsManager
          userId={userId}
          isDark={isDark}
          voiceRefs={voiceRefs}
          onChange={setVoiceRefs}
          maxRefs={3}
          gender={gender}
        />
      </section>

      {/* Preview of what was configured */}
      {name.trim() && (
        <section className={cn(
          "rounded-2xl p-4 border",
          isDark ? "bg-gradient-to-r from-primary/10 to-violet-500/10 border-primary/20" : "bg-gradient-to-r from-primary/5 to-violet-50 border-primary/20"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className={cn("font-semibold text-sm", isDark ? "text-white" : "text-gray-900")}>
              ตัวอย่างโค้ชของคุณ
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full p-1" style={{ backgroundColor: color + '20' }}>
              {(() => {
                const Avatar = getCustomAvatar(selectedAvatar);
                return <Avatar size={64} />;
              })()}
            </div>
            <div>
              <p className={cn("font-bold", isDark ? "text-white" : "text-gray-900")}>
                {name}
              </p>
              <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                {personality || 'ยังไม่ได้กำหนดบุคลิก'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px]" style={{ borderColor: color, color }}>
                  {selectedAvatarOption?.label}
                </Badge>
                {voiceRefs.length > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    🎤 เสียง {voiceRefs.length}/3
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pb-4">
        {isExisting && (
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || isSaving}
            className="gap-1"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            ลบ
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={!name.trim() || isSaving || isDeleting}
          className="flex-1 gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isExisting ? 'บันทึกการแก้ไข' : 'สร้างโค้ช'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default CustomCoachCreator;
