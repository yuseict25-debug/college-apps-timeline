#!/usr/bin/env node
/** Push Firebase env vars from local firebase-config.js to Vercel, then redeploy. */
const fs = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'firebase-config.js'), 'utf8');
const m = src.match(/export const firebaseConfig = (\{[\s\S]*?\});/);
if (!m) {
  console.error('Could not read firebase-config.js');
  process.exit(1);
}

const c = JSON.parse(m[1]);
const vars = {
  FIREBASE_API_KEY: c.apiKey,
  FIREBASE_AUTH_DOMAIN: c.authDomain,
  FIREBASE_PROJECT_ID: c.projectId,
  FIREBASE_STORAGE_BUCKET: c.storageBucket,
  FIREBASE_MESSAGING_SENDER_ID: c.messagingSenderId,
  FIREBASE_APP_ID: c.appId
};

function run(cmd, args, input) {
  const result = spawnSync(cmd, args, {
    cwd: root,
    input,
    stdio: ['pipe', 'inherit', 'inherit'],
    encoding: 'utf8'
  });
  if (result.status !== 0) process.exit(result.status || 1);
}

const ENVS = ['production', 'preview', 'development'];

for (const [key, value] of Object.entries(vars)) {
  for (const env of ENVS) {
    console.log(`\n==> Setting ${key} (${env})`);
    run('npx', ['vercel', 'env', 'add', key, env, '--value', value, '--force', '--yes'], null);
  }
}

console.log('\n==> Redeploying to production...');
run('npx', ['vercel', 'deploy', '--prod', '--yes'], null);
console.log('\nDone! https://college-apps-timeline.vercel.app');
