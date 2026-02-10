import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CoachSelector } from './CoachSelector';
import { CustomCoachCreator } from './CustomCoachCreator';
import { updateSelectedCoach } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Sparkles, ArrowRight } from 'lucide-react';

interface CoachSelectionPopupProps {
  open: boolean;
  onClose: () => void;
  onCoachSelected?: (coachId: string) => void;
  canSkip?: boolean;
}

export const CoachSelectionPopup = ({
  open,
  onClose,
  onCoachSelected,
  canSkip = false,
}: CoachSelectionPopupProps) => {
  const { userProfile } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedCoachId, setSelectedCoachId] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [view, setView] = useState<'select' | 'create-custom'>('select');

  // Reset view when popup opens
  useEffect(() => {
    if (open) setView('select');
  }, [open]);

  const handleSelect = (coachId: string) => {
    setSelectedCoachId(coachId);
  };

  const handleConfirm = async () => {
    if (!selectedCoachId || !userProfile?.lineUserId) return;

    setIsSaving(true);
    try {
      await updateSelectedCoach(userProfile.lineUserId, selectedCoachId);
      onCoachSelected?.(selectedCoachId);
      onClose();
    } catch (error) {
      console.error('Error saving coach selection:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    if (userProfile?.lineUserId) {
      updateSelectedCoach(userProfile.lineUserId, 'coach-nana');
    }
    onClose();
  };

  const handleCustomCoachDone = async (coachId: string | null) => {
    if (coachId && userProfile?.lineUserId) {
      // Auto-select the custom coach after creation
      setSelectedCoachId(coachId);
      await updateSelectedCoach(userProfile.lineUserId, coachId);
      onCoachSelected?.(coachId);
    }
    setView('select');
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {view === 'select' ? (
          <>
            <DialogHeader className="text-center space-y-4 pb-4">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-8 h-8 text-primary" />
                <DialogTitle className="text-2xl font-bold">
                  เลือกโค้ชของคุณ
                </DialogTitle>
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <DialogDescription className="text-base max-w-md mx-auto">
                เลือกโค้ชที่จะคอยให้กำลังใจและแนะนำคุณตลอดการออกกำลังกาย
                แต่ละคนมีสไตล์และบุคลิกที่แตกต่างกัน
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <CoachSelector
                userId={userProfile?.lineUserId}
                selectedCoachId={selectedCoachId}
                onSelect={handleSelect}
                onCreateCustom={() => setView('create-custom')}
                onEditCustom={() => setView('create-custom')}
                showPreview={true}
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              {canSkip ? (
                <Button variant="ghost" onClick={handleSkip}>
                  ข้ามไปก่อน
                </Button>
              ) : (
                <div />
              )}
              
              <Button
                onClick={handleConfirm}
                disabled={!selectedCoachId || isSaving}
                size="lg"
                className="gap-2"
              >
                {isSaving ? (
                  'กำลังบันทึก...'
                ) : (
                  <>
                    ยืนยันการเลือก
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          /* Custom Coach Creator View */
          userProfile?.lineUserId && (
            <CustomCoachCreator
              userId={userProfile.lineUserId}
              isDark={isDark}
              onDone={handleCustomCoachDone}
              onBack={() => setView('select')}
            />
          )
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CoachSelectionPopup;
