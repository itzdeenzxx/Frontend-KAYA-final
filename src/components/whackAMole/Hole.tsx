import { cn } from '@/lib/utils';

interface HoleProps {
  children: React.ReactNode;
  index: number;
}

export function Hole({ children, index }: HoleProps) {
  return (
    <div className="relative flex flex-col items-center">
      {/* Mole container - responsive sizes */}
      <div 
        className="relative w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 z-10"
        style={{ marginBottom: '-20%' }}
      >
        {children}
      </div>
      
      {/* Hole (ground) - responsive sizes */}
      <div className="relative w-16 xs:w-20 sm:w-24 md:w-32 lg:w-36">
        {/* Hole shadow/depth */}
        <div 
          className={cn(
            "absolute inset-x-0 top-0 h-5 sm:h-6 md:h-8 rounded-[50%]",
            "bg-gradient-to-b from-amber-900 to-amber-950",
            "shadow-inner"
          )}
        />
        {/* Hole front rim */}
        <div 
          className={cn(
            "relative h-4 sm:h-5 md:h-6 rounded-[50%]",
            "bg-gradient-to-b from-green-700 via-green-800 to-green-900",
            "border-2 border-green-950",
            "shadow-lg"
          )}
        />
        {/* Grass tufts - hidden on small screens */}
        <div className="absolute -top-2 left-1 sm:left-2 text-green-600 text-xs sm:text-sm md:text-lg hidden sm:block">🌿</div>
        <div className="absolute -top-2 right-1 sm:right-2 text-green-600 text-xs sm:text-sm md:text-lg hidden sm:block">🌿</div>
      </div>
      
      {/* Hole number - hidden on very small screens */}
      <div className="absolute -bottom-4 sm:-bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-[10px] sm:text-sm font-bold hidden sm:block">
        {index + 1}
      </div>
    </div>
  );
}
