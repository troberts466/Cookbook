# Karis Recipe Book PWA v6 Import

This version includes the mobile-first UI plus website recipe importing through your Cloudflare Worker.

## Import Worker

The app is already configured to use:

https://recipe-importer.troberts466.workers.dev/

## Included Features

- Mobile-first home dashboard
- Warm cookbook theme
- Bottom navigation bar
- Floating add recipe button
- Slide-up recipe editor
- Import recipe from website URL
- Collection/category cards
- Recipe cards with category icons
- Add, edit, delete, favorite, and copy recipes
- Search recipes
- Weekly meal planner
- Grocery list generator
- Grocery list from meal plan
- Export/import JSON backup
- Installable PWA
- Offline support

## Not included

- Firebase
- Cloud sync
- Recipe photos

## GitHub Pages Upload

1. Unzip this package.
2. Upload all files to the root of your GitHub repository.
3. Commit the changes.
4. GitHub Pages will serve the updated app.

## Notes

Website import depends on the Cloudflare Worker. If a recipe site does not expose structured recipe data or blocks access, the import may fail. Manual entry still works.
