# ST VIRTUAL WORLD — upload-ready project

A fresh Andhra Pradesh virtual-world frontend using the supplied Mana AP Reborn map/model assets as visual foundations. All original player usernames and house records have been removed. `data/andhra.json` contains only town/district names and approximate public town-centre coordinates.

## Included
- ST GAMES branding (logo loads from `https://stgames.online/logo/logo.jpg`)
- Four selectable themes: Classic Blue, Royal Gold, Deep Black, Neon Cyber
- Andhra Pradesh map, town search, tilted 3D map navigation
- Firebase Email/Password accounts
- Player house requests, one approved house per Firebase account
- Username registry unique within ST Virtual World
- Duplicate-house attempts sent to the admin request queue
- Admin approval/rejection and manual house creation with username, district, town, landmark and house style
- Firestore security rules, PWA manifest and basic service worker

## 1. Connect your existing Firebase project
This package is prefilled with the Firebase Web App configuration you supplied for `friendsgame-872f5`. You do not need to create another Firebase project or replace those values.
1. Open https://console.firebase.google.com/project/friendsgame-872f5.
2. In Authentication → Sign-in method, enable **Email/Password**.
3. In Firestore Database, create a database if this project does not already have one.
4. Publish the contents of `firestore.rules` in Firestore → Rules after replacing the admin UID as described below.
5. The app uses Firebase Authentication and Cloud Firestore. The Realtime Database URL is included in the config for reference, but this version does not use Realtime Database.

## 2. Set up the admin account securely
1. In Firebase Authentication, create your own admin account using an email you control.
2. Open that account's details and copy its **User UID**.
3. Paste the UID into `ADMIN_UID` in `firebase-config.js`.
4. Paste the same UID in `firestore.rules`, replacing `PASTE_ADMIN_AUTH_UID` in `isAdmin()`.
5. Publish the rules again.
6. Open `https://YOUR-DOMAIN/admin/` and sign in with that account.

**Important:** The admin page checks the configured UID for its interface, and Firestore rules enforce admin permissions on the server. Never publish Firestore rules with the placeholder UID still present. Never share the admin password or UID publicly.

## 3. Upload to GitHub Pages / ST GAMES
Upload the **contents** of this folder into the repository location where you want the app hosted. For a project page, upload to a folder such as `virtual-world/` and open `/virtual-world/`. Keep the folders exactly as supplied. The Firebase config file must be in the same folder as `index.html`.

Suggested URLs:
- Player app: `https://stgames.online/virtual-world/`
- Admin page: `https://stgames.online/virtual-world/admin/`

If uploading to the repository root, player app is `/` and admin is `/admin/`.

## 4. How the app works
1. Visitor signs up with email/password. Firebase creates a unique Auth UID.
2. Player selects district and town, enters an Instagram-style username, landmark name and house style.
3. The username format is checked and the app checks whether it is already registered in this virtual world. The Instagram profile link can be opened separately.
4. A request is saved as `pending`. It does not appear on the public map until approved.
5. Admin reviews the queue. Approval uses a Firestore transaction to create the player's house document (`houses/{uid}`) and reserve the username (`usernames/{username}`).
6. Because a player's approved house is stored at their Auth UID, the same account cannot receive a second approved house. If they try again, an extra-house request is sent to the admin queue.
7. Admin can reject requests or add manual community houses.

## Instagram username availability limitation
Instagram does not offer an unauthenticated public API for checking arbitrary account availability. This project therefore does **not** pretend to verify Instagram availability. It validates username syntax, checks for duplicates inside ST Virtual World, and offers an "Open Instagram profile" action so the player/admin can inspect it manually. A profile that does not load is not proof that the username is available.

## Privacy and location
- The original uploaded dataset contained hundreds of existing usernames and house coordinates. Those records were deliberately excluded; the new world starts at zero players and zero houses.
- New house locations use the selected town centre with a small visual offset. The app does not request GPS or private home addresses.
- Ask players to use a public landmark or fictional house name, not their street address, phone number or other private information.

## Current limitations / next production steps
- The supplied map uses OpenFreeMap public tiles and requires an internet connection for live map tiles. Firestore/Auth also require internet.
- The house marker is a stylized 3D-looking marker on a tilted 3D map. The supplied original GLB/Three.js files are retained in `houses.glb` and `lib/three-bundle.js` for a later full 3D model-rendering pass; this version does not claim that every map marker is a fully rendered GLB building.
- The app is a community map/virtual-house world, not a multiplayer walking/physics game.
- Test signup, approval, duplicate request and manual house creation with two test accounts before sharing the public URL.

### District coverage
The district dropdown has been updated to Andhra Pradesh's 28-district administrative setup, including Markapuram and Polavaram. The original supplied project data was older and had 24 district entries; the current district list was updated from the Government of India's Integrated Government Online Directory and Andhra Pradesh district portal. District-centre pins are approximate visual navigation points, not cadastral boundaries.
