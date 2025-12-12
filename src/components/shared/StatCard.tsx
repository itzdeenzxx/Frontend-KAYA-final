import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  unit?: string;
  color?: "coral" | "calm" | "nature" | "energy";
  className?: string;
}

const colorStyles = {
  coral: "bg-coral-light text-coral-dark",
  calm: "bg-calm/10 text-calm",
  nature: "bg-nature/10 text-nature",
  energy: "bg-energy/10 text-energy",
};

export function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  color = "coral",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "card-elevated p-4 flex flex-col gap-3 hover:shadow-lg transition-shadow duration-200",
        className
      )}
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colorStyles[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">
          {value}
          {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
        </p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}