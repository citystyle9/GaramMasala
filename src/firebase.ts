/**
 * @file firebase.ts
 * @description فائر بیس اور کلاؤڈ فائر اسٹور سیٹ اپ مع آف لائن سپورٹ اور ایرر ہینڈلنگ
 * Firebase Firestore and Auth initialization with offline multi-tab persistence
 * and standardized error handling.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  enableMultiTabIndexedDbPersistence, 
  doc, 
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with the specific databaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Attempt enabling offline persistence across browser tabs
if (typeof window !== 'undefined') {
  try {
    enableMultiTabIndexedDbPersistence(db).catch((err) => {
      // In private browsing or unsupported environments, Firestore falls back gracefully
      console.warn('Firestore offline persistence notice:', err?.message || err);
    });
  } catch (err) {
    console.warn('Firestore persistence init:', err);
  }
}

// Test connection on boot as specified in the Firebase integration guidelines
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is currently offline. Operating in offline cache mode.');
    }
  }
}
testConnection();

// Standardized Operation Types
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// Standardized Firestore Error Info interface
export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Catches and logs contextual Firestore error information
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Helper to ensure an authenticated user session.
 * Tries anonymous sign-in silently without requiring any password or email.
 */
export async function ensureAnonymousAuth(): Promise<User | null> {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (error) {
    console.warn('Anonymous sign-in not enabled in console or failed, fallback to local session:', error);
    return null;
  }
}

/**
 * Optional Google Sign-In helper if user wants cross-device sync
 */
export async function loginWithGoogle(): Promise<User | null> {
  const provider = new GoogleAuthProvider();
  try {
    const res = await signInWithPopup(auth, provider);
    return res.user;
  } catch (error) {
    console.error('Google Sign-in failed:', error);
    throw error;
  }
}

/**
 * Sign out helper
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
