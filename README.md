# Karis Recipe Book PWA v6.5 Smart Import

This version removes the Cloudflare Worker and replaces website scraping with a reliable smart manual import workflow.

## Included Features

- Mobile-first home dashboard
- Warm cookbook theme
- Bottom navigation bar
- Floating add recipe button
- Slide-up recipe editor
- Smart manual import: paste source URL, open source page, paste copied recipe text, parse into recipe form
- Collection/category cards
- Add, edit, delete, favorite, and copy recipes
- Search recipes
- Weekly meal planner
- Grocery list generator
- Grocery list from meal plan
- Export/import JSON backup
- Installable PWA
- Offline support

## Removed

- Cloudflare Worker dependency
- Automatic website scraping
- Firebase
- Recipe photos

## GitHub Pages Upload

1. Unzip this package.
2. Upload all files to the root of your GitHub repository.
3. Commit the changes.
4. GitHub Pages will serve the updated app.

## Cloudflare

You can delete the Cloudflare Worker if you do not plan to use automatic URL scraping again. This version does not call it.
