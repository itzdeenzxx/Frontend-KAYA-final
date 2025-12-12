// Session Management for Device Pairing
import { db } from './firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

export interface WorkoutSession {
  id: string;
  pairingCode: string;
  hostDeviceId: string;
  hostType: 'computer' | 'bigscreen';
  connectedDeviceId?: string;
  status: 'waiting' | 'connected' | 'active' | 'ended';
  currentExercise: number;
  isPaused: boolean;
  showSkeleton?: boolean;
  remoteAction?: RemoteAction;
  createdAt: Timestamp;
  lastActivity: Timestamp;
}

export interface RemoteAction {
  type: 'play' | 'pause' | 'next' | 'previous' | 'volume' | 'end' | 'toggleSkeleton';
  timestamp: number;
  data?: Record<string, unknown>;
}

// Generate a unique 5-character pairing code
export function generatePairingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing characters
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Generate a unique device ID
export function getDeviceId(): string {
  const key = 'kaya_device_id';
  let deviceId = localStorage.getItem(key);
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(key, deviceId);
  }
  return deviceId;
}

// Get current IP address (for display purposes)
export async function getLocalIP(): Promise<string> {
  try {
    // Use a public API to get external IP
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    // Fallback to local network detection
    return 'localhost';
  }
}

// Create a new workout session (Big Screen mode)
export async function createWorkoutSession(hostType: 'computer' | 'bigscreen'): Promise<WorkoutSession> {
  const deviceId = getDeviceId();
  const pairingCode = generatePairingCode();
  const sessionId = `session_${pairingCode}_${Date.now()}`;
  
  const session: Omit<WorkoutSession, 'createdAt' | 'lastActivity'> & { createdAt: ReturnType<typeof serverTimestamp>; lastActivity: ReturnType<typeof serverTimestamp> } = {
    id: sessionId,
    pairingCode,
    hostDeviceId: deviceId,
    hostType,
    status: 'waiting',
    currentExercise: 0,
    isPaused: false,
    createdAt: serverTimestamp(),
    lastActivity: serverTimestamp(),
  };
  
  // Store by pairing code for easy lookup
  await setDoc(doc(db, 'workout_sessions', pairingCode), session);
  
  return {
    ...session,
    createdAt: Timestamp.now(),
    lastActivity: Timestamp.now(),
  } as WorkoutSession;
}

// Find session by pairing code
export async function findSessionByCode(code: string): Promise<WorkoutSession | null> {
  const upperCode = code.toUpperCase();
  const docRef = doc(db, 'workout_sessions', upperCode);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as WorkoutSession;
  }
  return null;
}

// Connect to a session (Mobile Remote)
export async function connectToSession(pairingCode: string): Promise<boolean> {
  const upperCode = pairingCode.toUpperCase();
  const session = await findSessionByCode(upperCode);
  
  if (!session || session.status !== 'waiting') {
    return false;
  }
  
  const deviceId = getDeviceId();
  
  await updateDoc(doc(db, 'workout_sessions', upperCode), {
    connectedDeviceId: deviceId,
    status: 'connected',
    lastActivity: serverTimestamp(),
  });
  
  return true;
}

// Subscribe to session updates
export function subscribeToSession(
  pairingCode: string, 
  callback: (session: WorkoutSession | null) => void
): () => void {
  const upperCode = pairingCode.toUpperCase();
  const docRef = doc(db, 'workout_sessions', upperCode);
  
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as WorkoutSession);
    } else {
      callback(null);
    }
  });
}

// Send remote action from mobile
export async function sendRemoteAction(pairingCode: string, action: RemoteAction): Promise<void> {
  const upperCode = pairingCode.toUpperCase();
  await updateDoc(doc(db, 'workout_sessions', upperCode), {
    remoteAction: action,
    lastActivity: serverTimestamp(),
  });
}

// Update session state (from Big Screen)
export async function updateSessionState(
  pairingCode: string, 
  updates: Partial<Pick<WorkoutSession, 'currentExercise' | 'isPaused' | 'status'>>
): Promise<void> {
  const upperCode = pairingCode.toUpperCase();
  await updateDoc(doc(db, 'workout_sessions', upperCode), {
    ...updates,
    lastActivity: serverTimestamp(),
  });
}

// Clear remote action after processing
export async function clearRemoteAction(pairingCode: string): Promise<void> {
  const upperCode = pairingCode.toUpperCase();
  await updateDoc(doc(db, 'workout_sessions', upperCode), {
    remoteAction: null,
    lastActivity: serverTimestamp(),
  });
}

// End session
export async function endSession(pairingCode: string): Promise<void> {
  const upperCode = pairingCode.toUpperCase();
  await updateDoc(doc(db, 'workout_sessions', upperCode), {
    status: 'ended',
    lastActivity: serverTimestamp(),
  });
}

// Delete session (cleanup)
export async function deleteSession(pairingCode: string): Promise<void> {
  const upperCode = pairingCode.toUpperCase();
  await deleteDoc(doc(db, 'workout_sessions', upperCode));
}

// Check if device is mobile
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Check if running in LINE app
export function isInLineApp(): boolean {
  return /Line/i.test(navigator.userAgent);
}
