import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const NotFound = () => {
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);

    // Normalize admin aliases that may slip to NotFound in stale deployments.
    if (location.pathname === '/admin' || location.pathname.startsWith('/admin/')) {
      window.location.replace('/admin/badges');
      return;
    }

    if (location.pathname.startsWith('/admin-kaya')) {
      window.location.replace('/admin-kaya');
    }
  }, [location.pathname]);

  return (
    <div className={cn(
      "flex min-h-screen items-center justify-center",
      isDark ? "bg-black text-white" : "bg-gray-50 text-gray-900"
    )}>
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-black bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">404</h1>
        <p className={cn(
          "mb-4 text-xl",
          isDark ? "text-gray-400" : "text-gray-500"
        )}>Oops! Page not found</p>
        <Link to="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
