# Karis Recipe Book PWA v4

Version 4 adds optional Firebase cloud sync while keeping the app fully usable offline/local.

## New in v4

- Cloud Sync tab
- Google sign-in button
- Email/password sign-in and account creation buttons
- Push local data to Firebase
- Pull cloud data to the browser
- Firestore recipe/app-state sync
- Firebase Storage photo sync
- Firebase rules starter file

## Files to edit for Firebase

Open:

`js/firebase-config.js`

Replace `window.KARIS_FIREBASE_CONFIG = null;` with your Firebase web app config.

## Firebase services to enable

In Firebase Console, enable:

1. Authentication
   - Google provider if using Google sign-in
   - Email/password provider if using email sign-in
2. Firestore Database
3. Storage

## Data layout

Firestore:

- `users/{uid}/recipes/{recipeId}`
- `users/{uid}/appState/planner`
- `users/{uid}/appState/grocery`

Storage:

- `users/{uid}/photos/{photoKey}.txt`

Photos are uploaded as data URLs so the app can restore them back into IndexedDB on pull.

## Important

This is a client-side GitHub Pages-friendly implementation. Do not put private service account keys in this project. Only use the Firebase web app config from the Firebase console.
