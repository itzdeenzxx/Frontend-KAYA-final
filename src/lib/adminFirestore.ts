// Admin Firestore & Storage Service
import {
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref,
  listAll,
  deleteObject,
  getDownloadURL,
  getMetadata,
  StorageReference,
} from 'firebase/storage';
import { db, storage } from './firebase';

const ADMIN_AUDIT_COLLECTION = 'adminAuditLogs';
const ADMIN_ACTOR_STORAGE_KEY = 'kaya_admin_actor';

export interface AdminAuditActor {
  userId: string;
  displayName?: string;
}

export interface AdminAuditLogEntry {
  id: string;
  action: string;
  summary: string;
  actorUserId: string;
  actorName?: string;
  targetCollection?: string;
  targetId?: string;
  details?: Record<string, unknown>;
  createdAt?: unknown;
}

const getStoredAdminActor = (): AdminAuditActor | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ADMIN_ACTOR_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AdminAuditActor>;
    if (!parsed.userId) return null;
    return {
      userId: String(parsed.userId),
      displayName: parsed.displayName ? String(parsed.displayName) : undefined,
    };
  } catch {
    return null;
  }
};

export const getAdminActorContext = (): AdminAuditActor | null => getStoredAdminActor();

export const setAdminActorContext = (actor: AdminAuditActor): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ADMIN_ACTOR_STORAGE_KEY, JSON.stringify(actor));
};

export const logAdminAction = async (
  action: string,
  summary: string,
  options?: {
    targetCollection?: string;
    targetId?: string;
    details?: Record<string, unknown>;
    actor?: AdminAuditActor;
  }
): Promise<void> => {
  try {
    const actor = options?.actor || getStoredAdminActor();
    await addDoc(collection(db, ADMIN_AUDIT_COLLECTION), {
      action,
      summary,
      actorUserId: actor?.userId || 'unknown-admin',
      actorName: actor?.displayName || null,
      targetCollection: options?.targetCollection || null,
      targetId: options?.targetId || null,
      details: options?.details || null,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn('Failed to write admin audit log', error);
  }
};

export const listAdminAuditLogs = async (
  limitCount = 200
): Promise<AdminAuditLogEntry[]> => {
  try {
    const q = query(
      collection(db, ADMIN_AUDIT_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<AdminAuditLogEntry, 'id'>) }));
  } catch {
    const snap = await getDocs(query(collection(db, ADMIN_AUDIT_COLLECTION), limit(limitCount)));
    return snap.docs
      .map((item) => ({ id: item.id, ...(item.data() as Omit<AdminAuditLogEntry, 'id'>) }))
      .sort((a, b) => {
        const aTime = (a.createdAt as { toDate?: () => Date } | undefined)?.toDate?.()?.getTime?.() || 0;
        const bTime = (b.createdAt as { toDate?: () => Date } | undefined)?.toDate?.()?.getTime?.() || 0;
        return bTime - aTime;
      });
  }
};

export const subscribeAdminAuditLogs = (
  limitCount: number,
  onData: (logs: AdminAuditLogEntry[]) => void,
  onError?: (error: unknown) => void,
): (() => void) => {
  const q = query(
    collection(db, ADMIN_AUDIT_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(
    q,
    (snap) => {
      const logs = snap.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<AdminAuditLogEntry, 'id'>),
      }));
      onData(logs);
    },
    (error) => {
      console.warn('Failed to subscribe admin audit logs', error);
      onError?.(error);
    }
  );
};

// ==================== ADMIN ACCESS CONTROL ====================

const FALLBACK_ADMIN_IDS = ['U6807a78e027469dbc86b711c4175f6c6'];

export const isAdmin = async (userId: string): Promise<boolean> => {
  try {
    const adminDoc = await getDoc(doc(db, 'adminConfig', 'admins'));
    if (adminDoc.exists()) {
      const userIds: string[] = adminDoc.data().userIds || [];
      return userIds.includes(userId);
    }
  } catch (e) {
    console.warn('Failed to fetch admin config, using fallback', e);
  }
  return FALLBACK_ADMIN_IDS.includes(userId);
};

export const initializeAdminConfig = async (): Promise<void> => {
  const adminDocRef = doc(db, 'adminConfig', 'admins');
  const adminDoc = await getDoc(adminDocRef);
  if (!adminDoc.exists()) {
    await setDoc(adminDocRef, {
      userIds: FALLBACK_ADMIN_IDS,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
};

export const getAdminIds = async (): Promise<string[]> => {
  try {
    const adminDoc = await getDoc(doc(db, 'adminConfig', 'admins'));
    if (adminDoc.exists()) {
      return adminDoc.data().userIds || [];
    }
  } catch (e) {
    console.warn('Failed to fetch admin IDs', e);
  }
  return [...FALLBACK_ADMIN_IDS];
};

export const addAdminId = async (newUserId: string): Promise<void> => {
  const ids = await getAdminIds();
  if (ids.includes(newUserId)) return;
  ids.push(newUserId);
  await setDoc(doc(db, 'adminConfig', 'admins'), {
    userIds: ids,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  await logAdminAction('admin.add', 'เพิ่มผู้ดูแลระบบ', {
    targetCollection: 'adminConfig',
    targetId: 'admins',
    details: { addedUserId: newUserId },
  });
};

export const removeAdminId = async (userId: string): Promise<void> => {
  const ids = await getAdminIds();
  const filtered = ids.filter(id => id !== userId);
  if (filtered.length === 0) throw new Error('Cannot remove the last admin');
  await setDoc(doc(db, 'adminConfig', 'admins'), {
    userIds: filtered,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  await logAdminAction('admin.remove', 'ลบผู้ดูแลระบบ', {
    targetCollection: 'adminConfig',
    targetId: 'admins',
    details: { removedUserId: userId },
  });
};

// ==================== DASHBOARD STATS ====================

export const getAdminDashboardStats = async () => {
  const [usersSnap, workoutsSnap, challengesSnap, scoresSnap, scansSnap, foodSnap, fishingSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'workoutHistory')),
    getDocs(collection(db, 'challengeTemplates')),
    getDocs(collection(db, 'gameScores')),
    getDocs(collection(db, 'nutritionScans')),
    getDocs(collection(db, 'foodDatabase')),
    getDocs(collection(db, 'fishing_players')),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeToday = usersSnap.docs.filter(d => {
    const lastLogin = d.data().lastLoginAt?.toDate?.();
    return lastLogin && lastLogin >= today;
  }).length;

  return {
    totalUsers: usersSnap.size,
    activeToday,
    totalWorkouts: workoutsSnap.size,
    totalChallengeTemplates: challengesSnap.size,
    totalGameScores: scoresSnap.size,
    totalNutritionScans: scansSnap.size,
    totalFoodItems: foodSnap.size,
    totalFishingPlayers: fishingSnap.size,
  };
};

// ==================== GENERIC FIRESTORE CRUD ====================

export const listCollectionDocs = async (
  collectionName: string,
  limitCount = 50
): Promise<Array<{ id: string; data: Record<string, unknown> }>> => {
  const q = query(collection(db, collectionName), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, data: d.data() as Record<string, unknown> }));
};

export const listCollectionWhere = async (
  collectionName: string,
  field: string,
  value: string,
  limitCount = 50
): Promise<Array<{ id: string; data: Record<string, unknown> }>> => {
  const q = query(collection(db, collectionName), where(field, '==', value), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, data: d.data() as Record<string, unknown> }));
};

export const getDocument = async (
  collectionName: string,
  docId: string
): Promise<Record<string, unknown> | null> => {
  const snap = await getDoc(doc(db, collectionName, docId));
  return snap.exists() ? (snap.data() as Record<string, unknown>) : null;
};

export const updateDocument = async (
  collectionName: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> => {
  await setDoc(doc(db, collectionName, docId), {
    ...data,
    _adminModifiedAt: serverTimestamp(),
  }, { merge: true });
  await logAdminAction('document.update', `อัปเดตข้อมูล ${collectionName}/${docId}`, {
    targetCollection: collectionName,
    targetId: docId,
    details: { fields: Object.keys(data) },
  });
};

export const deleteDocument = async (
  collectionName: string,
  docId: string
): Promise<void> => {
  await deleteDoc(doc(db, collectionName, docId));
  await logAdminAction('document.delete', `ลบข้อมูล ${collectionName}/${docId}`, {
    targetCollection: collectionName,
    targetId: docId,
  });
};

export const createDocument = async (
  collectionName: string,
  data: Record<string, unknown>,
  customId?: string
): Promise<string> => {
  if (customId) {
    await setDoc(doc(db, collectionName, customId), {
      ...data,
      _adminCreatedAt: serverTimestamp(),
    });
    await logAdminAction('document.create', `สร้างข้อมูล ${collectionName}/${customId}`, {
      targetCollection: collectionName,
      targetId: customId,
      details: { fields: Object.keys(data) },
    });
    return customId;
  }
  const colRef = collection(db, collectionName);
  const docRef = doc(colRef);
  await setDoc(docRef, { ...data, _adminCreatedAt: serverTimestamp() });
  await logAdminAction('document.create', `สร้างข้อมูล ${collectionName}/${docRef.id}`, {
    targetCollection: collectionName,
    targetId: docRef.id,
    details: { fields: Object.keys(data) },
  });
  return docRef.id;
};

export const listSubcollection = async (
  parentCollection: string,
  parentDocId: string,
  subcollectionName: string
): Promise<Array<{ id: string; data: Record<string, unknown> }>> => {
  const subRef = collection(db, parentCollection, parentDocId, subcollectionName);
  const snap = await getDocs(subRef);
  return snap.docs.map(d => ({ id: d.id, data: d.data() as Record<string, unknown> }));
};

// ==================== USER MANAGEMENT ====================

export const getAllUsers = async (limitCount = 200): Promise<Array<{ id: string; data: Record<string, unknown> }>> => {
  const q = query(collection(db, 'users'), orderBy('lastLoginAt', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, data: d.data() as Record<string, unknown> }));
};

export const searchUsers = async (searchTerm: string): Promise<Array<{ id: string; data: Record<string, unknown> }>> => {
  const snap = await getDocs(collection(db, 'users'));
  const term = searchTerm.toLowerCase();
  return snap.docs
    .filter(d => {
      const data = d.data();
      return (
        (typeof data.displayName === 'string' && data.displayName.toLowerCase().includes(term)) ||
        (typeof data.nickname === 'string' && data.nickname.toLowerCase().includes(term)) ||
        d.id.toLowerCase().includes(term)
      );
    })
    .map(d => ({ id: d.id, data: d.data() as Record<string, unknown> }));
};

export const banUser = async (userId: string, reason: string): Promise<void> => {
  await updateDoc(doc(db, 'users', userId), {
    banned: true,
    banReason: reason,
    bannedAt: serverTimestamp(),
  });
  await logAdminAction('user.ban', 'แบนผู้ใช้', {
    targetCollection: 'users',
    targetId: userId,
    details: { reason: reason || null },
  });
};

export const unbanUser = async (userId: string): Promise<void> => {
  await updateDoc(doc(db, 'users', userId), {
    banned: false,
    banReason: null,
    bannedAt: null,
  });
  await logAdminAction('user.unban', 'ปลดแบนผู้ใช้', {
    targetCollection: 'users',
    targetId: userId,
  });
};

export const getUserFullData = async (userId: string) => {
  const [profile, health, settings, workouts, nutrition, scans, badges, challengeProgress, gameStats, fishingPlayer] = await Promise.all([
    getDocument('users', userId),
    getDocument('healthData', userId),
    getDocument('userSettings', userId),
    listCollectionWhere('workoutHistory', 'userId', userId),
    listCollectionWhere('nutritionLogs', 'userId', userId),
    listCollectionWhere('nutritionScans', 'userId', userId),
    listCollectionWhere('badges', 'userId', userId),
    listSubcollection('users', userId, 'challengeProgress'),
    getDocument('userGameStats', userId),
    getDocument('fishing_players', userId),
  ]);
  return { profile, health, settings, workouts, nutrition, scans, badges, challengeProgress, gameStats, fishingPlayer };
};

// ==================== STORAGE BROWSER ====================

export interface StorageItem {
  name: string;
  fullPath: string;
  isFolder: boolean;
}

export const listStorageFiles = async (path: string): Promise<StorageItem[]> => {
  const listRef = ref(storage, path || '/');
  const result = await listAll(listRef);
  const folders: StorageItem[] = result.prefixes.map(prefix => ({
    name: prefix.name,
    fullPath: prefix.fullPath,
    isFolder: true,
  }));
  const files: StorageItem[] = result.items.map(item => ({
    name: item.name,
    fullPath: item.fullPath,
    isFolder: false,
  }));
  return [...folders, ...files];
};

export const getStorageFileDetails = async (fullPath: string) => {
  const fileRef = ref(storage, fullPath);
  const [url, metadata] = await Promise.all([
    getDownloadURL(fileRef),
    getMetadata(fileRef),
  ]);
  return { url, metadata };
};

export const deleteStorageFile = async (fullPath: string): Promise<void> => {
  await deleteObject(ref(storage, fullPath));
  await logAdminAction('storage.delete', `ลบไฟล์ ${fullPath}`, {
    targetCollection: 'storage',
    targetId: fullPath,
  });
};

// ==================== ALL COLLECTIONS ====================

export const ALL_COLLECTIONS = [
  'users',
  'profiles',
  'healthData',
  'workoutHistory',
  'nutritionLogs',
  'badges',
  'challenges',
  'challengeTemplates',
  'leaderboard',
  'userSettings',
  'dailyStats',
  'nutritionScans',
  'foodDatabase',
  'savedRecipes',
  'healthyFoods',
  'savedFoods',
  'gameScores',
  'leaderboards',
  'userGameStats',
  'fishing_players',
  'adminConfig',
  'adminAuditLogs',
];
