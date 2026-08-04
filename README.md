# Karis Recipe Book PWA

A simple mobile-friendly recipe book Progressive Web App.

## Files

- `index.html` - app markup
- `style.css` - app styling
- `app.js` - recipe saving, search, filters, favorites, copy, delete
- `manifest.json` - PWA install settings
- `sw.js` - offline cache service worker
- `icons/` - app icons

## GitHub Pages Upload

1. Create a GitHub repository named `karis-recipe-book`.
2. Upload everything from this folder to the root of the repository.
3. Go to **Settings > Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select the `main` branch and `/root`, then save.

Your app will publish at your GitHub Pages site for that repository.

## Notes

This version stores recipes in the browser with `localStorage`. Data stays on the device/browser being used. A future version can add Firebase or another backend to sync between devices.
