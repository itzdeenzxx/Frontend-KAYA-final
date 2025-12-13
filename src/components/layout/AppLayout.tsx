import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={cn(
      "min-h-screen",
      isDark ? "bg-black" : "bg-gray-50"
    )}>
      <main className="pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}