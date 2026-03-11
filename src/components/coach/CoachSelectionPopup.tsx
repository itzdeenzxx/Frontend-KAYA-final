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
  /** Pre-select this coach when the popup opens (e.g. user's current coach in Settings) */
  currentCoachId?: string;
}

export const CoachSelectionPopup = ({
  open,
  onClose,
  onCoachSelected,
  canSkip = false,
  currentCoachId,
}: CoachSelectionPopupProps) => {
  const { userProfile } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedCoachId, setSelectedCoachId] = useState<string | undefined>(currentCoachId);
  const [isSaving, setIsSaving] = useState(false);
  const [view, setView] = useState<'select' | 'create-custom'>('select');

  // Reset view and pre-select current coach each time the popup opens
  useEffect(() => {
    if (open) {
      setView('select');
      setSelectedCoachId(currentCoachId);
    }
  }, [open, currentCoachId]);

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
      updateSelectedCoach(userProfile.lineUserId, 'coach-aiko');
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
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      {/* h-[90vh] + flex-col: header and footer stay fixed, only the coach list scrolls */}
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
        {view === 'select' ? (
          <>
            {/* Fixed header — always visible */}
            <DialogHeader className="flex-none text-center space-y-4 px-6 pt-8 pb-4">
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

            {/* Scrollable coach list — takes remaining space */}
            <div className="flex-1 overflow-y-auto px-6 py-2">
              <CoachSelector
                userId={userProfile?.lineUserId}
                selectedCoachId={selectedCoachId}
                onSelect={handleSelect}
                onCreateCustom={() => setView('create-custom')}
                onEditCustom={() => setView('create-custom')}
                showPreview={true}
              />
            </div>

            {/* Fixed footer — always visible */}
            <div className="flex-none flex justify-between items-center px-6 py-4 border-t">
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
            <div className="flex-1 overflow-y-auto p-6">
              <CustomCoachCreator
                userId={userProfile.lineUserId}
                isDark={isDark}
                onDone={handleCustomCoachDone}
                onBack={() => setView('select')}
              />
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CoachSelectionPopup;
