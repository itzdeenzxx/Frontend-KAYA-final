// Auth Context - Manages authentication state with LINE and Firebase
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  initializeLiff, 
  isLoggedIn as liffIsLoggedIn, 
  getLineProfile, 
  loginWithLine, 
  logoutFromLine,
  isInLineApp,
  getOS,
  getLanguage,
  type LiffProfile 
} from '@/lib/liff';
import {
  createOrUpdateUserFromLine,
  getUserProfile,
  getHealthData,
  getUserSettings,
  initializeUserSettings,
  saveHealthData,
  updateUserProfile,
  updateSelectedCoach,
  type FirestoreUserProfile,
  type FirestoreHealthData,
  type FirestoreUserSettings,
} from '@/lib/firestore';
import { initAnalytics } from '@/lib/firebase';

interface AuthState {
  isInitialized: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  isNewUser: boolean;
  lineProfile: LiffProfile | null;
  userProfile: FirestoreUserProfile | null;
  healthData: FirestoreHealthData | null;
  userSettings: FirestoreUserSettings | null;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshHealthData: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  isInLine: boolean;
  os: string;
  language: string;
}

interface OnboardingData {
  nickname: string;
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  bmi: number;
  selectedCoachId?: string;
}

const initialState: AuthState = {
  isInitialized: false,
  isLoading: true,
  isAuthenticated: false,
  isNewUser: false,
  lineProfile: null,
  userProfile: null,
  healthData: null,
  userSettings: null,
  error: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialState);
  const [isInLine, setIsInLine] = useState(false);
  const [os, setOs] = useState('unknown');
  const [language, setLanguage] = useState('th');

  // Initialize LIFF and check authentication
  const initialize = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Initialize LIFF
      await initializeLiff();
      
      // Initialize Firebase Analytics (ignore errors)
      try {
        await initAnalytics();
      } catch (e) {
        console.warn('Analytics init failed:', e);
      }
      
      // Get environment info
      setIsInLine(isInLineApp());
      setOs(getOS());
      setLanguage(getLanguage());
      
      // Check if user is logged in
      if (liffIsLoggedIn()) {
        // ลบ flag เมื่อ login สำเร็จ
        sessionStorage.removeItem('liff_login_redirecting');
        
        // Get LINE profile
        const lineProfile = await getLineProfile();
        
        if (lineProfile) {
          // Create or update user in Firestore (with error handling)
          let userProfile = null;
          let healthData = null;
          let userSettings = null;
          
          try {
            userProfile = await createOrUpdateUserFromLine(
              lineProfile.userId,
              lineProfile.displayName,
              lineProfile.pictureUrl
            );
            
            // Initialize default settings if needed
            await initializeUserSettings(lineProfile.userId);
            
            // Get additional data
            [healthData, userSettings] = await Promise.all([
              getHealthData(lineProfile.userId),
              getUserSettings(lineProfile.userId),
            ]);
          } catch (firestoreError) {
            console.warn('Firestore error (offline mode):', firestoreError);
          }
          
          // Check if user is new (no health data means onboarding needed)
          const isNewUser = !healthData || !healthData.weight || !healthData.height;
          
          setState(prev => ({
            ...prev,
            isInitialized: true,
            isLoading: false,
            isAuthenticated: true,
            isNewUser,
            lineProfile,
            userProfile,
            healthData,
            userSettings,
          }));
        } else {
          setState(prev => ({
            ...prev,
            isInitialized: true,
            isLoading: false,
            isAuthenticated: false,
          }));
        }
      } else {
        // ถ้ายังไม่ได้ login ให้บังคับ login ด้วย LINE ทันที
        // แต่ต้องเช็คว่าไม่ได้อยู่ในขั้นตอน redirect กลับมา
        const isRedirecting = sessionStorage.getItem('liff_login_redirecting');
        
        setState(prev => ({
          ...prev,
          isInitialized: true,
          isLoading: false,
          isAuthenticated: false,
        }));
        
        // ถ้ายังไม่เคย redirect ไป login
        if (!isRedirecting) {
          sessionStorage.setItem('liff_login_redirecting', 'true');
          loginWithLine();
        } else {
          // ถ้า redirect กลับมาแล้วแต่ยังไม่ login สำเร็จ ให้ลบ flag แล้วลองใหม่
          sessionStorage.removeItem('liff_login_redirecting');
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize',
      }));
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Login with LINE
  const login = useCallback(() => {
    loginWithLine();
  }, []);

  // Logout
  const logout = useCallback(() => {
    logoutFromLine();
    setState(prev => ({
      ...prev,
      isAuthenticated: false,
      lineProfile: null,
      userProfile: null,
      healthData: null,
      userSettings: null,
    }));
  }, []);

  // Refresh user profile
  const refreshUser = useCallback(async () => {
    if (!state.lineProfile?.userId) return;
    
    const userProfile = await getUserProfile(state.lineProfile.userId);
    if (userProfile) {
      setState(prev => ({ ...prev, userProfile }));
    }
  }, [state.lineProfile?.userId]);

  // Refresh health data
  const refreshHealthData = useCallback(async () => {
    if (!state.lineProfile?.userId) return;
    
    const healthData = await getHealthData(state.lineProfile.userId);
    setState(prev => ({ ...prev, healthData }));
  }, [state.lineProfile?.userId]);

  // Refresh settings
  const refreshSettings = useCallback(async () => {
    if (!state.lineProfile?.userId) return;
    
    const userSettings = await getUserSettings(state.lineProfile.userId);
    setState(prev => ({ ...prev, userSettings }));
  }, [state.lineProfile?.userId]);

  // Complete onboarding for new users
  const completeOnboarding = useCallback(async (data: OnboardingData) => {
    if (!state.lineProfile?.userId) return;
    
    try {
      // Save health data
      await saveHealthData(state.lineProfile.userId, {
        weight: data.weight,
        height: data.height,
        age: data.age,
        gender: data.gender,
        activityLevel: 'moderate',
        healthGoals: ['general_fitness'],
      });
      
      // Update user profile with nickname
      await updateUserProfile(state.lineProfile.userId, {
        nickname: data.nickname,
      });
      
      // Save selected coach if provided
      if (data.selectedCoachId) {
        await updateSelectedCoach(state.lineProfile.userId, data.selectedCoachId);
      }
      
      // Refresh data
      const [healthData, userProfile, userSettings] = await Promise.all([
        getHealthData(state.lineProfile.userId),
        getUserProfile(state.lineProfile.userId),
        getUserSettings(state.lineProfile.userId),
      ]);
      
      setState(prev => ({
        ...prev,
        isNewUser: false,
        healthData,
        userProfile,
        userSettings,
      }));
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      throw error;
    }
  }, [state.lineProfile?.userId]);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshUser,
    refreshHealthData,
    refreshSettings,
    completeOnboarding,
    isInLine,
    os,
    language,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
