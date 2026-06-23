/* ==========================================================================
   ApexTimeline Entry Point — boots app and wires cloud auth/sync UI
   ========================================================================== */

import {
  initCloudSync,
  isCloudAvailable,
  getCurrentUser,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOutUser
} from './cloud-sync.js';
import { init, applyRemoteState, refreshUI } from './app.js';

const SYNC_LABELS = {
  unconfigured: 'Local only',
  local: 'Sign in to sync',
  loading: 'Loading cloud…',
  pending: 'Unsaved changes',
  saving: 'Saving…',
  synced: 'Cloud synced',
  error: 'Sync error'
};

function updateSyncBadge(status) {
  const badge = document.getElementById('sync-status-badge');
  if (!badge) return;

  badge.textContent = SYNC_LABELS[status] || status;
  badge.dataset.status = status;
}

function updateAuthButton(user) {
  const btn = document.getElementById('auth-btn');
  if (!btn) return;

  if (!isCloudAvailable()) {
    btn.textContent = 'Cloud setup';
    btn.title = 'Firebase is not configured yet';
    return;
  }

  if (user) {
    const label = user.displayName || user.email || 'Account';
    btn.textContent = label.length > 18 ? `${label.slice(0, 16)}…` : label;
    btn.title = `Signed in as ${user.email || label}. Click to sign out.`;
    btn.dataset.signedIn = 'true';
  } else {
    btn.textContent = 'Sign In';
    btn.title = 'Sign in to sync your timeline across devices';
    btn.dataset.signedIn = 'false';
  }
}

function openAuthModal(mode = 'signin') {
  const modal = document.getElementById('auth-modal');
  const errorEl = document.getElementById('auth-error');
  if (!modal) return;

  errorEl.textContent = '';
  modal.classList.add('active');
  setAuthMode(mode);
}

function closeAuthModal() {
  document.getElementById('auth-modal')?.classList.remove('active');
  document.getElementById('auth-error').textContent = '';
  document.getElementById('auth-form')?.reset();
}

function setAuthMode(mode) {
  document.querySelectorAll('.auth-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.mode === mode);
  });

  const submitBtn = document.getElementById('auth-submit-btn');
  const title = document.getElementById('auth-modal-title');

  if (mode === 'signup') {
    title.textContent = 'Create Account';
    submitBtn.textContent = 'Create Account';
  } else {
    title.textContent = 'Sign In';
    submitBtn.textContent = 'Sign In';
  }

  document.getElementById('auth-form').dataset.mode = mode;
}

function setupAuthUI() {
  document.getElementById('auth-btn')?.addEventListener('click', async () => {
    if (!isCloudAvailable()) {
      document.getElementById('settings-modal')?.classList.add('active');
      return;
    }

    const user = getCurrentUser();
    if (user) {
      if (confirm('Sign out of your cloud account? Your timeline stays saved in the cloud.')) {
        await signOutUser();
      }
      return;
    }

    openAuthModal('signin');
  });

  document.getElementById('auth-modal-close')?.addEventListener('click', closeAuthModal);
  document.getElementById('auth-cancel-btn')?.addEventListener('click', closeAuthModal);

  document.querySelectorAll('.auth-tab').forEach((tab) => {
    tab.addEventListener('click', () => setAuthMode(tab.dataset.mode));
  });

  document.getElementById('auth-google-btn')?.addEventListener('click', async () => {
    const errorEl = document.getElementById('auth-error');
    try {
      errorEl.textContent = '';
      await signInWithGoogle();
      closeAuthModal();
    } catch (err) {
      errorEl.textContent = formatAuthError(err);
    }
  });

  document.getElementById('auth-form')?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const errorEl = document.getElementById('auth-error');
    const mode = ev.target.dataset.mode;
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;

    try {
      errorEl.textContent = '';
      if (mode === 'signup') {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      closeAuthModal();
    } catch (err) {
      errorEl.textContent = formatAuthError(err);
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAuthModal();
  });
}

function formatAuthError(err) {
  const code = err?.code || '';
  const messages = {
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed.',
    'auth/configuration-not-found': 'Firebase Auth is not enabled. Enable Email/Password and Google in Firebase Console.'
  };
  return messages[code] || err.message || 'Authentication failed.';
}

function bootstrap() {
  init();

  initCloudSync({
    onAuthChange(user, status) {
      updateAuthButton(user);
      updateSyncBadge(status);
    },
    onRemoteState(remoteState) {
      applyRemoteState(remoteState);
      refreshUI();
    },
    onSyncStatus(status) {
      if (getCurrentUser()) updateSyncBadge(status);
    }
  });

  if (!isCloudAvailable()) {
    updateSyncBadge('unconfigured');
    const desc = document.getElementById('cloud-sync-desc');
    if (desc) {
      desc.textContent = 'Add your Firebase config to firebase-config.js (see SETUP.md) to enable cloud sync across devices.';
    }
  }

  setupAuthUI();
}

document.addEventListener('DOMContentLoaded', bootstrap);
