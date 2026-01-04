interface VolumeIconProps {
  className?: string;
  muted?: boolean;
}

export function VolumeIcon({ className = '', muted = false }: VolumeIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/>
      {muted ? (
        <>
          <line x1="23" y1="9" x2="17" y2="15" strokeLinecap="round"/>
          <line x1="17" y1="9" x2="23" y2="15" strokeLinecap="round"/>
        </>
      ) : (
        <>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" strokeLinecap="round"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" strokeLinecap="round"/>
        </>
      )}
    </svg>
  );
}
