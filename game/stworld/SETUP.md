# ST Virtual World — Setup, Deployment & Testing Guide

## 1. Firebase Console Setup (`friendsgame-872f5`)
Your existing Firebase Web App configuration is preconfigured in `firebase-config.js`, and your Admin UID (`8lcgTTcPxrOSAdyv2NTe2FwCUC93`) is preconfigured in both `firebase-config.js` and `firestore.rules`. Existing Realtime Database data is untouched.

1. Open [Firebase Console](https://console.firebase.google.com/project/friendsgame-872f5).
2. **Authentication → Sign-in method:**
   - Enable **Anonymous** (for frictionless player entry).
   - Keep **Email/Password** enabled (for Admin Dashboard sign-in only).
3. **Firestore Database → Rules:** Copy the full contents of `firestore.rules` and click **Publish**.
4. **Firestore Database → Indexes:** Create the composite indexes listed in `firestore.indexes.json` (or deploy with `firebase deploy --only firestore`).

## 2. GitHub Pages Deployment (`game/stworld/`)
1. Extract this ZIP into the root of your `sat289/game` repository so the files land in `game/stworld/`.
2. Commit and push to GitHub Pages.
3. Verify URLs:
   - Player App: `https://stgames.online/game/stworld/`
   - Admin Dashboard: `https://stgames.online/game/stworld/admin/`

## 3. Important Architectural Notes
- **Anonymous Auth Scope:** Anonymous Firebase UIDs are browser/device scoped; clearing browser storage or switching devices creates a new UID.
- **Instagram Username Check:** Instagram does not offer a public username availability API. Availability is checked against ST Virtual World's Firestore `usernames` collection using atomic transactions.
- **Privacy:** Public `houses/{uid}` documents never store emails or private PII. Players are warned to pick a general or fictional map spot.

## 4. Testing Checklist
- [ ] Fresh visitor opens `/game/stworld/` without any login/signup screen; anonymous UID is created automatically.
- [ ] New username shows `Username available`; duplicate username shows `Username already taken`.
- [ ] Two simultaneous browsers attempting the same username result in one success and one rejection.
- [ ] Player places a house via draggable marker or map tap, saves, refreshes, and reopens it at exact saved coordinates.
- [ ] Player edits their own house position/design; cannot edit another player's house; second-house attempt creates a `houseRequests` item.
- [ ] District, town/city, and village search + hierarchical filtering work without leaking unrelated villages.
- [ ] All 4 themes work across player and admin pages and persist across reloads.
- [ ] Admin UID `8lcgTTcPxrOSAdyv2NTe2FwCUC93` can manage houses, release usernames on delete, resolve second-house requests, add manual houses, and export CSV; other accounts are denied.
