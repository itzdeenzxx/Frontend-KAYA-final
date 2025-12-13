import { NavLink } from "react-router-dom";
import { Home, Dumbbell, Utensils, User, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/workout-selection", icon: Dumbbell, label: "Workout" },
  { to: "/nutrition", icon: Utensils, label: "Nutrition" },
  { to: "/ai-coach", icon: MessageCircle, label: "Coach" },
  { to: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t safe-area-inset-bottom",
      isDark 
        ? "bg-black/95 border-white/10" 
        : "bg-white/95 border-gray-200"
    )}>
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-200",
                isActive
                  ? "text-primary"
                  : isDark 
                    ? "text-gray-500 hover:text-gray-300"
                    : "text-gray-400 hover:text-gray-600"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    "p-2 rounded-xl transition-all duration-200",
                    isActive && (isDark ? "bg-primary/20" : "bg-coral-light")
                  )}
                >
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}