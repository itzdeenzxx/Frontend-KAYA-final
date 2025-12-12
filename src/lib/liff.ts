// LINE LIFF Configuration
import liff from '@line/liff';

// LIFF Configuration from environment variables
export const LIFF_ID = import.meta.env.VITE_LIFF_ID;
export const CHANNEL_ID = import.meta.env.VITE_LINE_CHANNEL_ID;

export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

// Initialize LIFF
export const initializeLiff = async (): Promise<void> => {
  try {
    await liff.init({ liffId: LIFF_ID });
    console.log('LIFF initialized successfully');
  } catch (error) {
    console.error('LIFF initialization failed:', error);
    throw error;
  }
};

// Check if user is logged in
export const isLoggedIn = (): boolean => {
  return liff.isLoggedIn();
};

// Login with LINE - redirect กลับมาที่ root
export const loginWithLine = (): void => {
  if (!liff.isLoggedIn()) {
    liff.login({ redirectUri: window.location.origin });
  }
};

// Logout from LINE
export const logoutFromLine = (): void => {
  if (liff.isLoggedIn()) {
    liff.logout();
    window.location.reload();
  }
};

// Get LINE Profile
export const getLineProfile = async (): Promise<LiffProfile | null> => {
  try {
    if (!liff.isLoggedIn()) {
      return null;
    }
    const profile = await liff.getProfile();
    return {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
      statusMessage: profile.statusMessage,
    };
  } catch (error) {
    console.error('Failed to get LINE profile:', error);
    return null;
  }
};

// Get Access Token
export const getAccessToken = (): string | null => {
  return liff.getAccessToken();
};

// Get ID Token
export const getIdToken = (): string | null => {
  return liff.getIDToken();
};

// Check if running in LINE app
export const isInLineApp = (): boolean => {
  return liff.isInClient();
};

// Close LIFF window (only works in LINE app)
export const closeLiff = (): void => {
  if (liff.isInClient()) {
    liff.closeWindow();
  }
};

// Share message via LINE
export const shareMessage = async (text: string): Promise<void> => {
  if (liff.isApiAvailable('shareTargetPicker')) {
    try {
      await liff.shareTargetPicker([
        {
          type: 'text',
          text: text,
        },
      ]);
    } catch (error) {
      console.error('Failed to share message:', error);
    }
  }
};

// Send message to LINE chat
export const sendMessage = async (text: string): Promise<void> => {
  if (liff.isInClient()) {
    try {
      await liff.sendMessages([
        {
          type: 'text',
          text: text,
        },
      ]);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }
};

// Get OS type
export const getOS = (): string => {
  return liff.getOS() || 'unknown';
};

// Get Language
export const getLanguage = (): string => {
  return liff.getLanguage() || 'th';
};

// Check if LIFF is initialized
export const isLiffInitialized = (): boolean => {
  try {
    return liff.ready !== undefined;
  } catch {
    return false;
  }
};

// QR Code Scanner using LIFF scanCodeV2
export interface ScanResult {
  value: string;
}

export const scanQRCode = async (): Promise<ScanResult | null> => {
  try {
    // Check if scanCodeV2 is available
    if (!liff.isApiAvailable('scanCodeV2')) {
      console.error('QR Scanner is not available');
      return null;
    }
    
    const result = await liff.scanCodeV2();
    return result;
  } catch (error) {
    console.error('Failed to scan QR code:', error);
    return null;
  }
};

// Check if QR Scanner is available
export const isQRScannerAvailable = (): boolean => {
  return liff.isApiAvailable('scanCodeV2');
};

export { liff };
