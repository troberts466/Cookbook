const APP_VERSION = "3";
const STORAGE = {
  recipes: `karisRecipeBook.recipes.v${APP_VERSION}`,
  planner: `karisRecipeBook.planner.v${APP_VERSION}`,
  grocery: `karisRecipeBook.grocery.v${APP_VERSION}`
};
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const sampleRecipes = [
  {
    id: 1,
    name: "Creamy Garlic Chicken",
    category: "Dinner",
    url: "",
    photoKey: "",
    ingredients: ["2 chicken breasts", "1 cup heavy cream", "4 cloves garlic", "1/2 cup parmesan", "Salt and pepper"],
    instructions: ["Season chicken on both sides.", "Sear chicken until golden.", "Add garlic, cream, and parmesan.", "Simmer until sauce thickens and chicken is cooked through."],
    notes: "Good with pasta, rice, or roasted vegetables.",
    favorite: true
  },
  {
    id: 2,
    name: "Easy Cinnamon Roll Casserole",
    category: "Breakfast",
    url: "",
    photoKey: "",
    ingredients: ["2 cans cinnamon rolls", "4 eggs", "1/2 cup milk", "1 tsp vanilla", "1 tsp cinnamon"],
    instructions: ["Cut cinnamon rolls into pieces.", "Whisk eggs, milk, vanilla, and cinnamon.", "Pour over rolls in a baking dish.", "Bake until puffed and golden."],
    notes: "Save icing for the top after baking.",
    favorite: false
  }
];

let deferredPrompt = null;
let pendingPhotoData = "";

const state = {
  activeFilter: "all",
  recipes: loadJson(STORAGE.recipes, sampleRecipes),
  planner: loadJson(STORAGE.planner, Object.fromEntries(DAYS.map(day => [day, ""]))),
  groceryRecipeIds: loadJson(STORAGE.grocery, [])
};

const el = {};

function loadJson(key, fallback) {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : fallback;
}

function saveJson(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function saveRecipes() { saveJson(STORAGE.recipes, state.recipes); }
function savePlanner() { saveJson(STORAGE.planner, state.planner); }
function saveGrocerySelection() { saveJson(STORAGE.grocery, state.groceryRecipeIds); }

function cacheElements() {
  [
    "recipeForm", "editId", "formTitle", "saveBtn", "cancelEditBtn", "name", "category", "url",
    "photoInput", "photoPreview", "ingredients", "instructions", "notes", "searchInput",
    "categoryChips", "categoryOptions", "recipeList", "recipeCount", "clearSampleBtn", "plannerGrid",
    "clearPlannerBtn", "groceryRecipeSelect", "addRecipeToGroceryBtn", "groceryFromPlannerBtn",
    "copyGroceryBtn", "selectedRecipes", "groceryList", "installBtn", "exportBackupBtn", "importBackupInput"
  ].forEach(id => el[id] = document.getElementById(id));
}

function cleanLines(value) {
  return value.split("\n").map(item => item.trim()).filter(Boolean);
}

function recipeById(id) {
  return state.recipes.find(recipe => String(recipe.id) === String(id));
}

function uniqueCategories() {
  const categories = state.recipes.map(recipe => recipe.category || "Other");
  return ["All", "Favorites", ...Array.from(new Set(categories)).sort()];
}

function recipeMatchesSearch(recipe, term) {
  const searchableText = [
    recipe.name,
    recipe.category,
    recipe.notes,
    recipe.ingredients.join(" "),
    recipe.instructions.join(" ")
  ].join(" ").toLowerCase();
  return searchableText.includes(term);
}

function getVisibleRecipes() {
  const term = el.searchInput.value.trim().toLowerCase();
  return state.recipes.filter(recipe => {
    const category = (recipe.category || "Other").toLowerCase();
    const filterMatch =
      state.activeFilter === "all" ||
      (state.activeFilter === "favorites" && recipe.favorite) ||
      category === state.activeFilter;
    return filterMatch && recipeMatchesSearch(recipe, term);
  });
}

function renderCategoryChips() {
  el.categoryChips.innerHTML = "";
  el.categoryOptions.innerHTML = "";

  uniqueCategories().forEach(category => {
    const filter = category.toLowerCase();
    const button = document.createElement("button");
    button.className = `chip ${state.activeFilter === filter ? "active" : ""}`;
    button.textContent = category;
    button.addEventListener("click", () => {
      state.activeFilter = filter;
      renderAll();
    });
    el.categoryChips.appendChild(button);

    if (!["All", "Favorites"].includes(category)) {
      const option = document.createElement("option");
      option.value = category;
      el.categoryOptions.appendChild(option);
    }
  });
}

async function renderRecipes() {
  const visibleRecipes = getVisibleRecipes();
  el.recipeList.innerHTML = "";
  el.recipeCount.textContent = `${visibleRecipes.length} ${visibleRecipes.length === 1 ? "recipe" : "recipes"}`;

  if (!visibleRecipes.length) {
    el.recipeList.innerHTML = `<div class="card empty-state">No recipes found. Add one or change your search.</div>`;
    return;
  }

  const template = document.getElementById("recipeCardTemplate");

  for (const recipe of visibleRecipes) {
    const clone = template.content.cloneNode(true);
    const photo = clone.querySelector(".recipe-photo");
    const source = clone.querySelector(".source-link");

    clone.querySelector("h3").textContent = recipe.name;
    clone.querySelector(".category-pill").textContent = recipe.category || "Other";
    clone.querySelector(".favorite-button").textContent = recipe.favorite ? "★" : "☆";

    const photoData = recipe.photoKey ? await PhotoStore.get(recipe.photoKey) : "";
    photo.src = photoData || "icons/icon-192.png";
    if (!photoData) photo.classList.add("placeholder");

    if (recipe.url) source.href = recipe.url;
    else source.classList.add("hidden");

    appendListItems(clone.querySelector("ul"), recipe.ingredients, "li");
    appendListItems(clone.querySelector("ol"), recipe.instructions, "li");
    clone.querySelector(".notes").textContent = recipe.notes || "";

    clone.querySelector(".favorite-button").addEventListener("click", () => toggleFavorite(recipe.id));
    clone.querySelector(".delete-btn").addEventListener("click", () => deleteRecipe(recipe.id));
    clone.querySelector(".edit-btn").addEventListener("click", () => editRecipe(recipe.id));
    clone.querySelector(".copy-btn").addEventListener("click", () => copyRecipe(recipe));

    el.recipeList.appendChild(clone);
  }
}

function appendListItems(parent, items, tagName) {
  items.forEach(item => {
    const child = document.createElement(tagName);
    child.textContent = item;
    parent.appendChild(child);
  });
}

async function addOrUpdateRecipe(event) {
  event.preventDefault();
  const editId = el.editId.value;
  const existing = editId ? recipeById(editId) : null;
  const id = editId ? Number(editId) : Date.now();
  const photoKey = pendingPhotoData ? `recipe-photo-${id}` : existing?.photoKey || "";

  const recipe = {
    id,
    name: el.name.value.trim(),
    category: el.category.value.trim() || "Other",
    url: el.url.value.trim(),
    photoKey,
    ingredients: cleanLines(el.ingredients.value),
    instructions: cleanLines(el.instructions.value),
    notes: el.notes.value.trim(),
    favorite: existing?.favorite || false
  };

  if (pendingPhotoData) await PhotoStore.set(photoKey, pendingPhotoData);
  state.recipes = editId
    ? state.recipes.map(item => String(item.id) === String(editId) ? recipe : item)
    : [recipe, ...state.recipes];

  saveRecipes();
  resetForm();
  await renderAll();
}

async function editRecipe(id) {
  const recipe = recipeById(id);
  if (!recipe) return;

  el.editId.value = recipe.id;
  el.name.value = recipe.name;
  el.category.value = recipe.category;
  el.url.value = recipe.url || "";
  el.ingredients.value = recipe.ingredients.join("\n");
  el.instructions.value = recipe.instructions.join("\n");
  el.notes.value = recipe.notes || "";
  pendingPhotoData = "";

  const photoData = recipe.photoKey ? await PhotoStore.get(recipe.photoKey) : "";
  if (photoData) {
    el.photoPreview.src = photoData;
    el.photoPreview.classList.remove("hidden");
  }

  el.formTitle.textContent = "Edit Recipe";
  el.saveBtn.textContent = "Update Recipe";
  el.cancelEditBtn.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
  el.recipeForm.reset();
  el.editId.value = "";
  el.formTitle.textContent = "Add Recipe";
  el.saveBtn.textContent = "Save Recipe";
  el.cancelEditBtn.classList.add("hidden");
  el.photoPreview.classList.add("hidden");
  pendingPhotoData = "";
}

async function toggleFavorite(id) {
  const recipe = recipeById(id);
  if (recipe) recipe.favorite = !recipe.favorite;
  saveRecipes();
  await renderAll();
}

async function deleteRecipe(id) {
  const recipe = recipeById(id);
  if (recipe?.photoKey) await PhotoStore.delete(recipe.photoKey);
  state.recipes = state.recipes.filter(item => String(item.id) !== String(id));
  state.groceryRecipeIds = state.groceryRecipeIds.filter(item => String(item) !== String(id));
  saveRecipes();
  saveGrocerySelection();
  await renderAll();
}

function copyRecipe(recipe) {
  const text = `${recipe.name}\n\nIngredients:\n${recipe.ingredients.join("\n")}\n\nInstructions:\n${recipe.instructions.map((step, index) => `${index + 1}. ${step}`).join("\n")}\n\nNotes:\n${recipe.notes || ""}`;
  navigator.clipboard.writeText(text);
}

async function clearSample() {
  state.recipes = state.recipes.filter(recipe => ![1, 2].includes(recipe.id));
  saveRecipes();
  await renderAll();
}

function renderPlanner() {
  el.plannerGrid.innerHTML = "";

  DAYS.forEach(day => {
    const selectedId = state.planner[day] || "";
    const card = document.createElement("div");
    card.className = "day-card";
    card.innerHTML = `
      <h3>${day}</h3>
      <select data-day="${day}">
        <option value="">Rest / no meal selected</option>
        ${state.recipes.map(recipe => `<option value="${recipe.id}" ${String(recipe.id) === String(selectedId) ? "selected" : ""}>${recipe.name}</option>`).join("")}
      </select>
      <p class="planned-meal">${selectedId ? recipeById(selectedId)?.name || "" : "Rest / Open"}</p>
    `;
    card.querySelector("select").addEventListener("change", event => {
      state.planner[day] = event.target.value;
      savePlanner();
      renderPlanner();
    });
    el.plannerGrid.appendChild(card);
  });
}

function renderGroceryControls() {
  el.groceryRecipeSelect.innerHTML = state.recipes.map(recipe => `<option value="${recipe.id}">${recipe.name}</option>`).join("");
  el.selectedRecipes.innerHTML = "";

  state.groceryRecipeIds.forEach(id => {
    const recipe = recipeById(id);
    if (!recipe) return;
    const pill = document.createElement("button");
    pill.className = "selected-pill";
    pill.textContent = `${recipe.name} ×`;
    pill.addEventListener("click", () => {
      state.groceryRecipeIds = state.groceryRecipeIds.filter(item => String(item) !== String(id));
      saveGrocerySelection();
      renderGrocery();
    });
    el.selectedRecipes.appendChild(pill);
  });
}

function buildGroceryItems() {
  const items = [];
  state.groceryRecipeIds.forEach(id => {
    const recipe = recipeById(id);
    if (recipe) items.push(...recipe.ingredients.map(item => item.trim().replace(/\s+/g, " ")));
  });
  return Array.from(new Set(items.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function renderGroceryList() {
  const items = buildGroceryItems();
  el.groceryList.innerHTML = items.length ? "" : `<div class="empty-state">Add recipes or build from your meal plan.</div>`;

  items.forEach(item => {
    const row = document.createElement("label");
    row.className = "grocery-item";
    row.innerHTML = `<input type="checkbox"><span>${item}</span>`;
    row.querySelector("input").addEventListener("change", event => row.classList.toggle("checked", event.target.checked));
    el.groceryList.appendChild(row);
  });
}

function renderGrocery() {
  renderGroceryControls();
  renderGroceryList();
}

function addRecipeToGrocery() {
  const id = el.groceryRecipeSelect.value;
  if (id && !state.groceryRecipeIds.some(item => String(item) === String(id))) {
    state.groceryRecipeIds.push(id);
  }
  saveGrocerySelection();
  renderGrocery();
}

function groceryFromPlanner() {
  state.groceryRecipeIds = Array.from(new Set(Object.values(state.planner).filter(Boolean)));
  saveGrocerySelection();
  renderGrocery();
}

function copyGrocery() {
  navigator.clipboard.writeText(buildGroceryItems().join("\n"));
}

function clearPlanner() {
  state.planner = Object.fromEntries(DAYS.map(day => [day, ""]));
  savePlanner();
  renderPlanner();
}

async function exportBackup() {
  const photos = {};
  for (const recipe of state.recipes) {
    if (recipe.photoKey) photos[recipe.photoKey] = await PhotoStore.get(recipe.photoKey);
  }

  const backup = {
    app: "Karis Recipe Book",
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    recipes: state.recipes,
    planner: state.planner,
    groceryRecipeIds: state.groceryRecipeIds,
    photos
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `karis-recipe-book-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function importBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const backup = JSON.parse(await file.text());
  state.recipes = Array.isArray(backup.recipes) ? backup.recipes : [];
  state.planner = backup.planner || Object.fromEntries(DAYS.map(day => [day, ""]));
  state.groceryRecipeIds = Array.isArray(backup.groceryRecipeIds) ? backup.groceryRecipeIds : [];

  await PhotoStore.clear();
  if (backup.photos) {
    for (const [key, value] of Object.entries(backup.photos)) {
      if (value) await PhotoStore.set(key, value);
    }
  }

  saveRecipes();
  savePlanner();
  saveGrocerySelection();
  event.target.value = "";
  await renderAll();
}

async function renderAll() {
  renderCategoryChips();
  await renderRecipes();
  renderPlanner();
  renderGrocery();
}

function registerEvents() {
  el.recipeForm.addEventListener("submit", addOrUpdateRecipe);
  el.cancelEditBtn.addEventListener("click", resetForm);
  el.searchInput.addEventListener("input", renderRecipes);
  el.clearSampleBtn.addEventListener("click", clearSample);
  el.clearPlannerBtn.addEventListener("click", clearPlanner);
  el.addRecipeToGroceryBtn.addEventListener("click", addRecipeToGrocery);
  el.groceryFromPlannerBtn.addEventListener("click", groceryFromPlanner);
  el.copyGroceryBtn.addEventListener("click", copyGrocery);
  el.exportBackupBtn.addEventListener("click", exportBackup);
  el.importBackupInput.addEventListener("change", importBackup);
  el.photoInput.addEventListener("change", handlePhotoInput);

  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(item => item.classList.remove("active"));
      document.querySelectorAll(".view").forEach(view => view.classList.remove("active-view"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.view).classList.add("active-view");
    });
  });
}

function handlePhotoInput(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    pendingPhotoData = reader.result;
    el.photoPreview.src = pendingPhotoData;
    el.photoPreview.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

function registerInstallPrompt() {
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredPrompt = event;
    el.installBtn.classList.remove("hidden");
  });

  el.installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    el.installBtn.classList.add("hidden");
  });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
  }
}

async function init() {
  cacheElements();
  registerEvents();
  registerInstallPrompt();
  registerServiceWorker();
  await renderAll();
}

init();
