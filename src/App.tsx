import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import Dashboard from "./pages/Dashboard";
import WorkoutSelection from "./pages/WorkoutSelection";
import WorkoutMode from "./pages/WorkoutMode";
import WorkoutUI from "./pages/WorkoutUI";
import WorkoutRemote from "./pages/WorkoutRemote";
import WorkoutBigScreen from "./pages/WorkoutBigScreen";
import BigScreenSetup from "./pages/BigScreenSetup";
import Nutrition from "./pages/Nutrition";
import AICoach from "./pages/AICoach";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { ThemeSelectorModal } from "./components/shared/ThemeSelectorModal";

const queryClient = new QueryClient();

// Protected routes wrapper with onboarding check
const AppRoutes = () => {
  const { isInitialized, isLoading, isAuthenticated, isNewUser, lineProfile, completeOnboarding } = useAuth();
  const { showThemeSelector, setShowThemeSelector, isThemeLoaded, theme } = useTheme();

  // Show loading while initializing
  if (!isInitialized || isLoading || !isThemeLoaded) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="text-center">
          <Loader2 className={`w-8 h-8 animate-spin mx-auto mb-4 ${theme === 'dark' ? 'text-orange-500' : 'text-primary'}`} />
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-muted-foreground'}>กำลังเชื่อมต่อ...</p>
        </div>
      </div>
    );
  }

  // Show onboarding for new users
  if (isAuthenticated && isNewUser) {
    return (
      <Onboarding
        lineDisplayName={lineProfile?.displayName}
        onComplete={completeOnboarding}
      />
    );
  }

  // Not authenticated - handled by AuthContext (auto login)
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="text-center">
          <Loader2 className={`w-8 h-8 animate-spin mx-auto mb-4 ${theme === 'dark' ? 'text-orange-500' : 'text-primary'}`} />
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-muted-foreground'}>กำลังเข้าสู่ระบบ LINE...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Theme Selector Modal for first-time users */}
      <ThemeSelectorModal 
        isOpen={showThemeSelector} 
        onClose={() => setShowThemeSelector(false)}
      />
      
      <BrowserRouter>
      <Routes>
        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* App Routes with Bottom Nav */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/workout-selection" element={<WorkoutSelection />} />
          <Route path="/workout-mode" element={<WorkoutMode />} />
          <Route path="/nutrition" element={<Nutrition />} />
          <Route path="/ai-coach" element={<AICoach />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        
        {/* Full Screen Routes */}
        <Route path="/workout" element={<WorkoutUI />} />
        <Route path="/workout-remote" element={<WorkoutRemote />} />
        <Route path="/workout-bigscreen" element={<WorkoutBigScreen />} />
        <Route path="/bigscreen-setup" element={<BigScreenSetup />} />
        
        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;