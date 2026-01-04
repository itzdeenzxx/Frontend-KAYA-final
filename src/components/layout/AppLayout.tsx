import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

// Pages that should NOT show the sidebar (they have their own layout)
const pagesWithOwnLayout = ['/profile', '/workout-mode', '/workout-intro', '/workout-ui', '/onboarding', '/login', '/big-screen', '/workout-remote'];

export function AppLayout() {
  const { theme } = useTheme();
  const location = useLocation();
  const isDark = theme === 'dark';
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Check if current page has its own layout
  const hasOwnLayout = pagesWithOwnLayout.some(path => location.pathname.startsWith(path));

  // Desktop with sidebar layout
  if (isDesktop && !hasOwnLayout) {
    return (
      <div className={cn(
        "min-h-screen",
        isDark ? "bg-[#0a0a0f]" : "bg-slate-100"
      )}>
        <DesktopSidebar />
        <main className="ml-72 min-h-screen overflow-y-auto">
          <Outlet />
        </main>
      </div>
    );
  }

  // Mobile layout or pages with own layout
  return (
    <div className={cn(
      "min-h-screen",
      isDark ? "bg-black" : "bg-gray-50",
      isDesktop && (isDark ? "bg-[#0a0a0f]" : "bg-slate-200")
    )}>
      <main className={cn(
        !isDesktop && !hasOwnLayout && "pb-24"
      )}>
        <Outlet />
      </main>
      {/* Hide BottomNav on desktop or pages with own layout */}
      {!isDesktop && !hasOwnLayout && <BottomNav />}
    </div>
  );
}