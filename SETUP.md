# ApexTimeline — Cloud Sync & Vercel Setup

## One-command setup (recommended)

From the project folder, run:

```bash
npm run setup
```

This script will:
1. Sign you into Firebase (browser popup)
2. Create a Firebase project and Firestore database
3. Deploy `firestore.rules`
4. Generate `firebase-config.js` automatically
5. Sign you into Vercel (browser popup)
6. Set Vercel environment variables and deploy

After it finishes, enable **Email/Password** and **Google** in Firebase Authentication, and add your Vercel URL to Firebase **Authorized domains** (the script prints the exact links).

---

## Manual setup (if you prefer)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (e.g. `apex-timeline`)
3. Enable **Authentication**:
   - Sign-in method → **Email/Password** → Enable
   - Sign-in method → **Google** → Enable (add your support email)
4. Enable **Firestore Database**:
   - Create database → Start in **production mode**
   - Choose a region close to you

## 2. Deploy Firestore security rules

In Firebase Console → Firestore → Rules, paste the contents of `firestore.rules` from this repo, then publish.

Or deploy via CLI:

```bash
firebase deploy --only firestore:rules
```

## 3. Get your Firebase web config

Firebase Console → Project Settings → General → Your apps → **Web** (`</>`)

Copy the `firebaseConfig` values.

## 4. Local development

Edit `firebase-config.js` with your real values (or copy from `firebase-config.example.js`).

Serve locally:

```bash
npx serve .
```

## 5. Deploy to Vercel

1. Push this repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add these **Environment Variables**:

| Variable | Value |
|----------|-------|
| `FIREBASE_API_KEY` | Your API key |
| `FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `FIREBASE_PROJECT_ID` | Your project ID |
| `FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` |
| `FIREBASE_MESSAGING_SENDER_ID` | Your sender ID |
| `FIREBASE_APP_ID` | Your app ID |

4. Deploy. The build script auto-generates `firebase-config.js` from these env vars.

## 6. Authorize your Vercel domain in Firebase

Firebase Console → Authentication → Settings → **Authorized domains**

Add your Vercel URL (e.g. `your-app.vercel.app`).

## How sync works

- **Signed out**: data saves to browser `localStorage` only
- **Signed in**: every edit saves locally and syncs to Firestore (`users/{uid}/timeline/main`)
- **First sign-in**: local data uploads to the cloud automatically
- **New device**: sign in and your cloud timeline loads

## Migrating existing local data

1. Open the app where your timeline already exists
2. Click **Sign In** and create an account
3. Local data uploads on first login
4. Sign in on any other device with the same account
