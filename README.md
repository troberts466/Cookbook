# Karis Recipe Book PWA v2

This version adds the next practical app features:

- Recipe photos
- Edit recipes
- Delete recipes
- Favorites
- Dynamic category filters
- Search by name, category, notes, ingredients, and instructions
- Weekly meal planner
- Grocery list generator from selected recipes
- Grocery list generator from meal plan
- Copy recipe and copy grocery list
- Offline support through service worker
- Installable PWA setup

## Upload to GitHub Pages

1. Unzip this package.
2. Upload the contents to the root of your GitHub repository.
3. Go to **Settings > Pages**.
4. Select **Deploy from branch**.
5. Select `main` and `/root`.
6. Save.

## Important note about storage

Recipes are stored in the browser with `localStorage`. That means the app works offline, but the data is tied to the device/browser. A later version can add Firebase or Supabase for account sync across devices.
