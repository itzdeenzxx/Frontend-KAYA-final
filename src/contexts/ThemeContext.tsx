// Theme Context - Manages light/dark theme state globally with Firestore persistence
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => Promise<void>;
  isThemeLoaded: boolean;
  showThemeSelector: boolean;
  setShowThemeSelector: (show: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

const THEME_STORAGE_KEY = 'kaya_theme_preference';
const THEME_SELECTED_KEY = 'kaya_theme_selected';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const { lineProfile, isAuthenticated, isInitialized } = useAuth();

  // Load theme from Firestore or localStorage
  const loadTheme = useCallback(async () => {
    try {
      // First check localStorage for quick loading
      const localTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      const themeSelected = localStorage.getItem(THEME_SELECTED_KEY);
      
      if (localTheme) {
        setThemeState(localTheme);
        applyTheme(localTheme);
      }

      // If user is authenticated, sync with Firestore
      if (isAuthenticated && lineProfile?.userId) {
        const userSettingsRef = doc(db, 'userSettings', lineProfile.userId);
        const settingsSnap = await getDoc(userSettingsRef);
        
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          const firestoreTheme = data.theme as ThemeMode | undefined;
          
          if (firestoreTheme) {
            setThemeState(firestoreTheme);
            applyTheme(firestoreTheme);
            localStorage.setItem(THEME_STORAGE_KEY, firestoreTheme);
            localStorage.setItem(THEME_SELECTED_KEY, 'true');
          } else if (!themeSelected) {
            // User has settings but no theme, show selector
            setShowThemeSelector(true);
          }
        } else if (!themeSelected) {
          // New user, show theme selector
          setShowThemeSelector(true);
        }
      } else if (!themeSelected && isInitialized) {
        // Not authenticated but first visit
        setShowThemeSelector(true);
      }
      
      setIsThemeLoaded(true);
    } catch (error) {
      console.error('Error loading theme:', error);
      setIsThemeLoaded(true);
    }
  }, [isAuthenticated, lineProfile?.userId, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      loadTheme();
    }
  }, [loadTheme, isInitialized]);

  // Apply theme to document
  const applyTheme = (newTheme: ThemeMode) => {
    const root = document.documentElement;
    
    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.style.setProperty('--background', '0 0% 0%');
      root.style.setProperty('--foreground', '0 0% 100%');
    } else {
      root.classList.remove('dark');
      root.style.setProperty('--background', '0 0% 100%');
      root.style.setProperty('--foreground', '0 0% 3.9%');
    }
  };

  // Set theme and save to Firestore
  const setTheme = useCallback(async (newTheme: ThemeMode) => {
    try {
      setThemeState(newTheme);
      applyTheme(newTheme);
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      localStorage.setItem(THEME_SELECTED_KEY, 'true');

      // Save to Firestore if authenticated
      if (isAuthenticated && lineProfile?.userId) {
        const userSettingsRef = doc(db, 'userSettings', lineProfile.userId);
        const settingsSnap = await getDoc(userSettingsRef);
        
        if (settingsSnap.exists()) {
          await updateDoc(userSettingsRef, {
            theme: newTheme,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(userSettingsRef, {
            userId: lineProfile.userId,
            theme: newTheme,
            updatedAt: serverTimestamp(),
          }, { merge: true });
        }
      }
      
      setShowThemeSelector(false);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, [isAuthenticated, lineProfile?.userId]);

  const value: ThemeContextType = {
    theme,
    setTheme,
    isThemeLoaded,
    showThemeSelector,
    setShowThemeSelector,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeContext;
