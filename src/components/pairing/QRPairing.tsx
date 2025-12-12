import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Loader2, Check } from 'lucide-react';
import { PairingStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface QRPairingProps {
  sessionCode: string;
  status: PairingStatus;
  onStatusChange?: (status: PairingStatus) => void;
}

export function QRPairing({ sessionCode, status, onStatusChange }: QRPairingProps) {
  const { t } = useTranslation();
  const [animateQR, setAnimateQR] = useState(true);

  useEffect(() => {
    // Simulate connection after showing QR
    if (status === 'connecting') {
      const timer = setTimeout(() => {
        onStatusChange?.('connected');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, onStatusChange]);

  const qrValue = JSON.stringify({
    type: 'kaya_pair',
    code: sessionCode,
    timestamp: Date.now(),
  });

  const statusConfig = {
    disconnected: {
      icon: WifiOff,
      color: 'text-muted-foreground',
      bg: 'bg-muted',
      label: t('workout.notPaired'),
    },
    connecting: {
      icon: Loader2,
      color: 'text-primary',
      bg: 'bg-primary/10',
      label: t('workout.connecting'),
    },
    connected: {
      icon: Check,
      color: 'text-success',
      bg: 'bg-success/10',
      label: t('workout.paired'),
    },
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;

  return (
    <div className="text-center space-y-6">
      {/* QR Code */}
      <motion.div
        className={cn(
          'relative inline-block p-4 bg-white rounded-2xl shadow-lg',
          status === 'connected' && 'ring-2 ring-success'
        )}
        animate={animateQR && status === 'disconnected' ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <QRCodeSVG
          value={qrValue}
          size={180}
          level="H"
          fgColor={status === 'connected' ? '#22c55e' : '#dd6e53'}
          bgColor="transparent"
        />
        
        {status === 'connected' && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center">
              <Check className="w-8 h-8 text-success-foreground" />
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Status Indicator */}
      <div className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-full', currentStatus.bg)}>
        <StatusIcon className={cn('w-4 h-4', currentStatus.color, status === 'connecting' && 'animate-spin')} />
        <span className={cn('text-sm font-medium', currentStatus.color)}>
          {currentStatus.label}
        </span>
      </div>

      {/* Session Code */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">{t('workout.pairQR')}</p>
        <p className="text-2xl font-mono font-bold tracking-widest text-foreground">
          {sessionCode}
        </p>
      </div>
    </div>
  );
}
