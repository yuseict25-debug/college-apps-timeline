/* ==========================================================================
   ApexTimeline Cloud Sync — Firebase Auth + Firestore persistence
   ========================================================================== */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

const TIMELINE_DOC_PATH = ['timeline', 'main'];
const SAVE_DEBOUNCE_MS = 1200;

let auth = null;
let db = null;
let currentUser = null;
let saveTimeout = null;
let isSaving = false;
let callbacks = {};

export function isCloudAvailable() {
  return isFirebaseConfigured();
}

export function getCurrentUser() {
  return currentUser;
}

export function initCloudSync(handlers) {
  callbacks = handlers;

  if (!isFirebaseConfigured()) {
    callbacks.onAuthChange?.(null, 'unconfigured');
    return;
  }

  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    if (!user) {
      callbacks.onAuthChange?.(null, 'local');
      return;
    }

    callbacks.onAuthChange?.(user, 'loading');

    try {
      const remoteState = await loadRemoteState(user.uid);
      const localState = readLocalSnapshot();

      if (remoteState) {
        const remoteUpdated = remoteState.updatedAt || 0;
        const localUpdated = localState?.updatedAt || 0;

        if (!localState || remoteUpdated >= localUpdated) {
          callbacks.onRemoteState?.(remoteState);
        } else {
          await writeRemoteState(user.uid, localState);
        }
      } else if (localState?.events?.length) {
        await writeRemoteState(user.uid, localState);
      }

      callbacks.onAuthChange?.(user, 'synced');
    } catch (err) {
      console.error('Cloud sync load failed:', err);
      callbacks.onAuthChange?.(user, 'error');
    }
  });
}

export function scheduleCloudSave(statePayload) {
  if (!currentUser || !db) return;

  clearTimeout(saveTimeout);
  callbacks.onSyncStatus?.('pending');

  saveTimeout = setTimeout(async () => {
    try {
      isSaving = true;
      callbacks.onSyncStatus?.('saving');
      await writeRemoteState(currentUser.uid, statePayload);
      callbacks.onSyncStatus?.('synced');
    } catch (err) {
      console.error('Cloud save failed:', err);
      callbacks.onSyncStatus?.('error');
    } finally {
      isSaving = false;
    }
  }, SAVE_DEBOUNCE_MS);
}

export async function signInWithEmail(email, password) {
  ensureAuth();
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(email, password) {
  ensureAuth();
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle() {
  ensureAuth();
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function signOutUser() {
  ensureAuth();
  clearTimeout(saveTimeout);
  return signOut(auth);
}

function ensureAuth() {
  if (!auth) {
    throw new Error('Firebase is not configured. Add your Firebase keys first.');
  }
}

function readLocalSnapshot() {
  try {
    const raw = localStorage.getItem('apex_timeline_state');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function loadRemoteState(uid) {
  const ref = doc(db, 'users', uid, ...TIMELINE_DOC_PATH);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data();
  const updatedAt = data.updatedAt?.toMillis?.() ?? data.updatedAt ?? 0;
  return { ...data, updatedAt };
}

async function writeRemoteState(uid, statePayload) {
  const ref = doc(db, 'users', uid, ...TIMELINE_DOC_PATH);
  const { updatedAt: _localUpdated, ...dataToStore } = statePayload;

  await setDoc(ref, {
    ...dataToStore,
    updatedAt: serverTimestamp()
  }, { merge: true });
}
