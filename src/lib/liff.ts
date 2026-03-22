// LINE LIFF Configuration
import liff from '@line/liff';
import type { Badge } from './types';

// LIFF Configuration from environment variables
export const LIFF_ID = import.meta.env.VITE_LIFF_ID;
export const CHANNEL_ID = import.meta.env.VITE_LINE_CHANNEL_ID;
const FORCE_IN_CLIENT_KEY = 'liff_force_inclient_once';

const getLiffDeepLinkUrl = (): string | null => {
  if (!LIFF_ID || typeof window === 'undefined') return null;
  const state = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  return `https://liff.line.me/${LIFF_ID}?liff.state=${encodeURIComponent(state)}`;
};

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

// Share message via LINE shareTargetPicker
export const shareMessage = async (text: string): Promise<boolean> => {
  try {
    if (liff.isApiAvailable('shareTargetPicker')) {
      const result = await liff.shareTargetPicker([
        {
          type: 'text',
          text,
        },
      ]);
      if (result !== false) {
        return true;
      }
    }

    // Fallback for browsers outside LIFF client.
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      await navigator.share({ text });
      return true;
    }

    // Final fallback: open LINE share URL for forwarding to chats.
    if (typeof window !== 'undefined') {
      const shareUrl = `https://line.me/R/share?text=${encodeURIComponent(text)}`;
      window.location.href = shareUrl;
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to share message:', error);
    return false;
  }
};

const tryShareFlex = async (message: unknown, context: string): Promise<boolean> => {
  try {
    if (liff.isApiAvailable('shareTargetPicker')) {
      const result = await liff.shareTargetPicker([message as any]);
      if (result !== false) {
        return true;
      }
    }

    if (liff.isInClient()) {
      await liff.sendMessages([message as any]);
      return true;
    }
  } catch (error) {
    console.warn(`[${context}] Flex share failed`, {
      inClient: liff.isInClient(),
      shareTargetPickerAvailable: liff.isApiAvailable('shareTargetPicker'),
      error,
    });
  }

  return false;
};

const openInLineClient = (): boolean => {
  if (typeof window === 'undefined') return false;
  const deepLink = getLiffDeepLinkUrl();
  if (!deepLink) return false;
  window.location.href = deepLink;
  return true;
};

export const ensureInLineClientContext = (): boolean => {
  if (typeof window === 'undefined') return true;
  if (!LIFF_ID) return true;

  const inClient = liff.isInClient();
  if (inClient) {
    sessionStorage.removeItem(FORCE_IN_CLIENT_KEY);
    return true;
  }

  const userAgent = window.navigator.userAgent || '';
  const openedFromLine = /Line\//i.test(userAgent);
  if (!openedFromLine) {
    return false;
  }

  const alreadyForced = sessionStorage.getItem(FORCE_IN_CLIENT_KEY) === '1';
  if (alreadyForced) {
    return false;
  }

  sessionStorage.setItem(FORCE_IN_CLIENT_KEY, '1');
  openInLineClient();
  return false;
};

export const shareBadgeAchievement = async (
  displayName: string,
  badgeNames: string[],
  totalBadgeCount: number
): Promise<boolean> => {
  const uniqueNames = Array.from(new Set(badgeNames.filter(Boolean)));
  const previewNames = uniqueNames.slice(0, 8);
  const extraCount = Math.max(uniqueNames.length - previewNames.length, 0);
  const badgeList = `${previewNames.join(', ')}${extraCount > 0 ? ` และอีก ${extraCount} เหรียญ` : ''}`;
  const message =
    `🎉 ${displayName} ปลดล็อกเหรียญใหม่ใน KAYA\n` +
    `🏅 เหรียญ: ${badgeList}\n` +
    `📊 รวมที่ปลดล็อกครั้งนี้: ${totalBadgeCount} เหรียญ\n` +
    `มาฟิตไปด้วยกันที่ KAYA!`;

  if (!liff.isInClient() && !liff.isApiAvailable('shareTargetPicker')) {
    console.warn('Aggregate badge share requires LINE in-client. Redirecting...', {
      inClient: liff.isInClient(),
      shareTargetPickerAvailable: liff.isApiAvailable('shareTargetPicker'),
    });
    const redirected = openInLineClient();
    if (redirected) return true;
    return shareBadgeAsMiniAppLink(message);
  }

  const workoutEntryUrl = getWorkoutEntryUrl();

  const richFlexMessage = {
    type: 'flex',
    altText: `${displayName} ปลดล็อก ${totalBadgeCount} เหรียญใน KAYA`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#121418',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: 'KAYA Achievement',
            color: '#F3F4F6',
            size: 'sm',
            weight: 'bold',
          },
          {
            type: 'text',
            text: '🏆 ปลดล็อกเหรียญใหม่',
            color: '#FB923C',
            size: 'xl',
            weight: 'bold',
            margin: 'md',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#1F2937',
        paddingAll: '16px',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: `ผู้ใช้: ${displayName}`,
            color: '#E5E7EB',
            size: 'sm',
          },
          {
            type: 'text',
            text: `รวมที่ปลดล็อก: ${totalBadgeCount} เหรียญ`,
            color: '#FDBA74',
            size: 'md',
            weight: 'bold',
          },
          {
            type: 'separator',
            color: '#374151',
            margin: 'sm',
          },
          {
            type: 'text',
            text: badgeList,
            color: '#D1D5DB',
            wrap: true,
            size: 'sm',
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '12px',
        backgroundColor: '#111827',
        contents: [
          {
            type: 'text',
            text: 'มาฟิตไปด้วยกันที่ KAYA',
            color: '#F59E0B',
            align: 'center',
            size: 'sm',
            weight: 'bold',
          },
          {
            type: 'button',
            style: 'primary',
            height: 'sm',
            color: '#f97316',
            action: {
              type: 'uri',
              label: 'เริ่มออกกำลังกาย',
              uri: workoutEntryUrl,
            },
          },
        ],
      },
    },
  } as const;

  const minimalFlexMessage = {
    type: 'flex',
    altText: `${displayName} ปลดล็อก ${totalBadgeCount} เหรียญใน KAYA`,
    contents: {
      type: 'bubble',
      hero: {
        type: 'image',
        url: getFallbackBadgePng(),
        size: 'full',
        aspectMode: 'cover',
        aspectRatio: '20:13',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: 'KAYA Achievement', weight: 'bold', size: 'xl' },
          { type: 'text', text: `ผู้ใช้: ${displayName}`, size: 'sm', margin: 'md', wrap: true },
          { type: 'text', text: `ปลดล็อก: ${totalBadgeCount} เหรียญ`, size: 'sm', wrap: true },
          { type: 'text', text: badgeList, size: 'sm', wrap: true, margin: 'sm' },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            action: {
              type: 'uri',
              label: 'เริ่มออกกำลังกาย',
              uri: workoutEntryUrl,
            },
          },
        ],
      },
    },
  } as const;

  if (await tryShareFlex(richFlexMessage, 'aggregate-rich')) {
    return true;
  }

  if (await tryShareFlex(minimalFlexMessage, 'aggregate-minimal')) {
    return true;
  }

  // For badge shares, return false if Flex could not be delivered.
  // UI should tell user to open in LINE app and retry.
  console.warn('Aggregate badge share fell back to non-flex path', {
    inClient: liff.isInClient(),
    shareTargetPickerAvailable: liff.isApiAvailable('shareTargetPicker'),
    messagePreview: message,
  });
  return shareBadgeAsMiniAppLink(message);
};

const getTwemojiUrl = (emoji: string): string | null => {
  const value = (emoji || '').trim();
  if (!value) return null;

  const codePoints = Array.from(value)
    .map((char) => char.codePointAt(0))
    .filter((cp): cp is number => typeof cp === 'number')
    .map((cp) => cp.toString(16));

  if (codePoints.length === 0) return null;
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${codePoints.join('-')}.png`;
};

const getFallbackBadgePng = (): string => getTwemojiUrl('🏅') as string;

const getWorkoutEntryUrl = (): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kaya-tang.vercel.app';
  return `${origin}/workout-selection`;
};

const getMiniAppUrl = (): string => {
  if (LIFF_ID) {
    return `https://miniapp.line.me/${LIFF_ID}`;
  }
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kaya-tang.vercel.app';
  return origin;
};

const shareBadgeAsMiniAppLink = async (message: string): Promise<boolean> => {
  const miniAppUrl = getMiniAppUrl();
  const text = `${message}\n\n🚀 เปิด KAYA: ${miniAppUrl}`;
  return shareMessage(text);
};

export const shareSingleBadgeAchievement = async (
  displayName: string,
  badge: Pick<Badge, 'id' | 'nameEn' | 'nameTh' | 'icon' | 'category' | 'description' | 'requirement'>
): Promise<boolean> => {
  const badgeTitle = badge.nameTh || badge.nameEn || badge.id;
  const message =
    `🏅 ${displayName} ปลดล็อกเหรียญ ${badgeTitle} ใน KAYA\n` +
    `📌 เงื่อนไข: ${badge.requirement || '-'}\n` +
    `✨ ${badge.description || 'มาออกกำลังกายไปด้วยกันกับ KAYA'}`;

  if (!liff.isInClient() && !liff.isApiAvailable('shareTargetPicker')) {
    console.warn('Single badge share requires LINE in-client. Redirecting...', {
      inClient: liff.isInClient(),
      shareTargetPickerAvailable: liff.isApiAvailable('shareTargetPicker'),
      messagePreview: message,
    });
    const redirected = openInLineClient();
    if (redirected) return true;
    return shareBadgeAsMiniAppLink(message);
  }

  // LINE Flex image requires web-safe image formats such as PNG/JPEG (SVG can fail and trigger text fallback).
  const badgeImage = getTwemojiUrl(badge.icon || '') || getFallbackBadgePng();
  const workoutEntryUrl = getWorkoutEntryUrl();
  const categoryLabel = badge.category === 'game'
    ? 'GAME BADGE'
    : badge.category === 'nutrition'
      ? 'NUTRITION BADGE'
      : 'WORKOUT BADGE';

  const richFlexMessage = {
    type: 'flex',
    altText: `${displayName} ปลดล็อกเหรียญ ${badgeTitle} ใน KAYA`,
    contents: {
      type: 'bubble',
      size: 'mega',
      hero: {
        type: 'image',
        url: badgeImage,
        size: 'full',
        aspectRatio: '20:13',
        aspectMode: 'cover',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        backgroundColor: '#0b1220',
        paddingAll: '16px',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            justifyContent: 'center',
            contents: [
              {
                type: 'image',
                url: badgeImage,
                size: 'sm',
                aspectMode: 'fit',
              },
            ],
          },
          {
            type: 'box',
            layout: 'baseline',
            contents: [
              {
                type: 'text',
                text: categoryLabel,
                size: 'xs',
                color: '#fb923c',
                weight: 'bold',
              },
            ],
          },
          {
            type: 'text',
            text: badgeTitle,
            wrap: true,
            size: 'xl',
            weight: 'bold',
            color: '#f8fafc',
          },
          {
            type: 'text',
            text: `โดย ${displayName}`,
            size: 'sm',
            color: '#cbd5e1',
          },
          {
            type: 'text',
            text: 'ปลดล็อกสำเร็จแล้ว พร้อมไปต่อได้เลย',
            size: 'xs',
            color: '#f59e0b',
            weight: 'bold',
          },
          {
            type: 'separator',
            color: '#334155',
          },
          {
            type: 'text',
            text: badge.description || 'เหรียญความสำเร็จจาก KAYA',
            wrap: true,
            size: 'sm',
            color: '#e2e8f0',
          },
          {
            type: 'text',
            text: `เงื่อนไข: ${badge.requirement || '-'}`,
            wrap: true,
            size: 'xs',
            color: '#94a3b8',
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '12px',
        backgroundColor: '#0f172a',
        contents: [
          {
            type: 'text',
            text: 'KAYA Fitness',
            align: 'center',
            color: '#f59e0b',
            size: 'sm',
            weight: 'bold',
          },
          {
            type: 'button',
            style: 'primary',
            height: 'sm',
            color: '#f97316',
            action: {
              type: 'uri',
              label: 'เริ่มออกกำลังกาย',
              uri: workoutEntryUrl,
            },
          },
        ],
      },
    },
  } as const;

  const minimalFlexMessage = {
    type: 'flex',
    altText: `${displayName} ปลดล็อกเหรียญ ${badgeTitle} ใน KAYA`,
    contents: {
      type: 'bubble',
      hero: {
        type: 'image',
        url: badgeImage,
        size: 'full',
        aspectMode: 'cover',
        aspectRatio: '20:13',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: badgeTitle, weight: 'bold', size: 'xl', wrap: true },
          { type: 'text', text: `โดย ${displayName}`, size: 'sm', margin: 'md', wrap: true },
          { type: 'text', text: `เงื่อนไข: ${badge.requirement || '-'}`, size: 'sm', wrap: true, margin: 'sm' },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            action: {
              type: 'uri',
              label: 'เริ่มออกกำลังกาย',
              uri: workoutEntryUrl,
            },
          },
        ],
      },
    },
  } as const;

  if (await tryShareFlex(richFlexMessage, 'single-rich')) {
    return true;
  }

  if (await tryShareFlex(minimalFlexMessage, 'single-minimal')) {
    return true;
  }

  console.warn('Single badge share fell back to non-flex path', {
    inClient: liff.isInClient(),
    shareTargetPickerAvailable: liff.isApiAvailable('shareTargetPicker'),
    messagePreview: message,
  });
  return shareBadgeAsMiniAppLink(message);
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
