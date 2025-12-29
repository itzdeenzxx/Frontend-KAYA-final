import { NavLink } from "react-router-dom";
import { Home, Dumbbell, Utensils, User, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/nutrition", icon: Utensils, label: "Nutrition" },
  { to: "/workout-selection", icon: Dumbbell, label: "Workout", isCenter: true },
  { to: "/game-mode", icon: Gamepad2, label: "Game" },
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
      <div className="flex items-end justify-around h-16 max-w-md mx-auto px-2 pb-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center transition-all duration-200",
                item.isCenter ? "-mt-4" : "py-1",
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
                {item.isCenter ? (
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300",
                      isActive
                        ? "bg-gradient-to-br from-primary via-orange-500 to-red-500 shadow-primary/40"
                        : isDark
                        ? "bg-gradient-to-br from-gray-700 to-gray-800 shadow-black/30"
                        : "bg-gradient-to-br from-gray-300 to-gray-400 shadow-gray-400/30",
                      "ring-[3px]",
                      isDark ? "ring-black" : "ring-white"
                    )}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-white" : isDark ? "text-gray-300" : "text-gray-600"
                    )} />
                  </div>
                ) : (
                  <item.icon className={cn(
                    "w-5 h-5 transition-all",
                    isActive && "scale-110"
                  )} />
                )}
                <span className={cn(
                  "text-[10px] font-medium",
                  item.isCenter && "mt-1"
                )}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}