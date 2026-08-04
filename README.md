# Karis Recipe Book PWA v3

This version implements the recommended cleanup and storage improvements.

## Added in v3

- Refactored JavaScript with centralized app state
- Cached DOM references
- Shared JSON save/load helpers
- IndexedDB photo storage through `js/idb.js`
- Export backup to JSON
- Import backup from JSON
- Backup includes recipes, planner, grocery selections, and photos
- Firebase-ready config placeholder in `js/firebase-config.js`
- Cleaner service worker cache list

## GitHub Pages Upload

1. Unzip this package.
2. Upload the contents to the root of your GitHub repository.
3. Commit the changes.
4. GitHub Pages will serve the updated app from the selected branch/root.

## Storage Notes

Recipe text, meal planner choices, and grocery selections are stored in `localStorage`.
Recipe photos are stored in IndexedDB, which is better suited for larger browser data than localStorage.

## Cloud Sync Notes

Firebase is not enabled by default because it requires your Firebase project values. The placeholder file is:

`js/firebase-config.js`

When you are ready to add real cloud sync, replace the placeholder object in that file with your Firebase web app config, then add Firebase Auth, Firestore, and Storage logic.
