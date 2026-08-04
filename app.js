const STORAGE_KEY = "karisRecipeBook.recipes.v2";
const PLANNER_KEY = "karisRecipeBook.planner.v2";
const GROCERY_KEY = "karisRecipeBook.grocery.v2";
let activeFilter = "all";
let deferredPrompt = null;
let pendingPhotoData = "";
let groceryRecipeIds = JSON.parse(localStorage.getItem(GROCERY_KEY)) || [];

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const sampleRecipes = [
  {
    id: 1,
    name: "Creamy Garlic Chicken",
    category: "Dinner",
    url: "",
    photo: "",
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
    photo: "",
    ingredients: ["2 cans cinnamon rolls", "4 eggs", "1/2 cup milk", "1 tsp vanilla", "1 tsp cinnamon"],
    instructions: ["Cut cinnamon rolls into pieces.", "Whisk eggs, milk, vanilla, and cinnamon.", "Pour over rolls in a baking dish.", "Bake until puffed and golden."],
    notes: "Save icing for the top after baking.",
    favorite: false
  }
];

let recipes = loadRecipes();
let planner = JSON.parse(localStorage.getItem(PLANNER_KEY)) || Object.fromEntries(days.map(day => [day, ""]));

function loadRecipes() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleRecipes));
  return sampleRecipes;
}
function saveRecipes() { localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes)); }
function savePlanner() { localStorage.setItem(PLANNER_KEY, JSON.stringify(planner)); }
function saveGrocerySelection() { localStorage.setItem(GROCERY_KEY, JSON.stringify(groceryRecipeIds)); }
function cleanLines(value) { return value.split("\n").map(x => x.trim()).filter(Boolean); }
function uniqueCategories() { return ["All", "Favorites", ...Array.from(new Set(recipes.map(r => r.category || "Other"))).sort()]; }
function recipeById(id) { return recipes.find(r => String(r.id) === String(id)); }

function recipeMatchesSearch(recipe, term) {
  const haystack = [recipe.name, recipe.category, recipe.notes, recipe.ingredients.join(" "), recipe.instructions.join(" ")].join(" ").toLowerCase();
  return haystack.includes(term);
}

function getVisibleRecipes() {
  const term = document.getElementById("searchInput").value.trim().toLowerCase();
  return recipes.filter(recipe => {
    const filterMatch = activeFilter === "all" || (activeFilter === "favorites" && recipe.favorite) || (recipe.category || "Other").toLowerCase() === activeFilter;
    return filterMatch && recipeMatchesSearch(recipe, term);
  });
}

function renderCategoryChips() {
  const wrap = document.getElementById("categoryChips");
  const datalist = document.getElementById("categoryOptions");
  wrap.innerHTML = "";
  datalist.innerHTML = "";
  uniqueCategories().forEach(cat => {
    const filter = cat.toLowerCase();
    const btn = document.createElement("button");
    btn.className = `chip ${activeFilter === filter ? "active" : ""}`;
    btn.textContent = cat;
    btn.dataset.filter = filter;
    btn.addEventListener("click", () => { activeFilter = filter; renderAll(); });
    wrap.appendChild(btn);
    if (!["All", "Favorites"].includes(cat)) {
      const opt = document.createElement("option");
      opt.value = cat;
      datalist.appendChild(opt);
    }
  });
}

function renderRecipes() {
  const list = document.getElementById("recipeList");
  const count = document.getElementById("recipeCount");
  const visible = getVisibleRecipes();
  list.innerHTML = "";
  count.textContent = `${visible.length} ${visible.length === 1 ? "recipe" : "recipes"}`;
  if (!visible.length) {
    list.innerHTML = `<div class="card empty-state">No recipes found. Add one or change your search.</div>`;
    return;
  }
  const template = document.getElementById("recipeCardTemplate");
  visible.forEach(recipe => {
    const clone = template.content.cloneNode(true);
    clone.querySelector("h3").textContent = recipe.name;
    clone.querySelector(".category-pill").textContent = recipe.category || "Other";
    clone.querySelector(".favorite-button").textContent = recipe.favorite ? "★" : "☆";
    const photo = clone.querySelector(".recipe-photo");
    if (recipe.photo) photo.src = recipe.photo;
    else {
      photo.src = "icons/icon-192.png";
      photo.classList.add("placeholder");
    }
    const source = clone.querySelector(".source-link");
    if (recipe.url) source.href = recipe.url;
    else source.classList.add("hidden");
    const ingredients = clone.querySelector("ul");
    recipe.ingredients.forEach(item => { const li = document.createElement("li"); li.textContent = item; ingredients.appendChild(li); });
    const instructions = clone.querySelector("ol");
    recipe.instructions.forEach(step => { const li = document.createElement("li"); li.textContent = step; instructions.appendChild(li); });
    clone.querySelector(".notes").textContent = recipe.notes || "";
    clone.querySelector(".favorite-button").addEventListener("click", () => toggleFavorite(recipe.id));
    clone.querySelector(".delete-btn").addEventListener("click", () => deleteRecipe(recipe.id));
    clone.querySelector(".edit-btn").addEventListener("click", () => editRecipe(recipe.id));
    clone.querySelector(".copy-btn").addEventListener("click", () => copyRecipe(recipe));
    list.appendChild(clone);
  });
}

function addOrUpdateRecipe(event) {
  event.preventDefault();
  const editId = document.getElementById("editId").value;
  const recipe = {
    id: editId ? Number(editId) : Date.now(),
    name: document.getElementById("name").value.trim(),
    category: document.getElementById("category").value.trim() || "Other",
    url: document.getElementById("url").value.trim(),
    photo: pendingPhotoData,
    ingredients: cleanLines(document.getElementById("ingredients").value),
    instructions: cleanLines(document.getElementById("instructions").value),
    notes: document.getElementById("notes").value.trim(),
    favorite: editId ? recipeById(editId)?.favorite || false : false
  };
  if (editId) recipes = recipes.map(r => String(r.id) === String(editId) ? recipe : r);
  else recipes.unshift(recipe);
  saveRecipes();
  resetForm();
  renderAll();
}

function editRecipe(id) {
  const recipe = recipeById(id);
  if (!recipe) return;
  document.getElementById("editId").value = recipe.id;
  document.getElementById("name").value = recipe.name;
  document.getElementById("category").value = recipe.category;
  document.getElementById("url").value = recipe.url || "";
  document.getElementById("ingredients").value = recipe.ingredients.join("\n");
  document.getElementById("instructions").value = recipe.instructions.join("\n");
  document.getElementById("notes").value = recipe.notes || "";
  pendingPhotoData = recipe.photo || "";
  const preview = document.getElementById("photoPreview");
  if (pendingPhotoData) { preview.src = pendingPhotoData; preview.classList.remove("hidden"); }
  document.getElementById("formTitle").textContent = "Edit Recipe";
  document.getElementById("saveBtn").textContent = "Update Recipe";
  document.getElementById("cancelEditBtn").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
  document.getElementById("recipeForm").reset();
  document.getElementById("editId").value = "";
  document.getElementById("formTitle").textContent = "Add Recipe";
  document.getElementById("saveBtn").textContent = "Save Recipe";
  document.getElementById("cancelEditBtn").classList.add("hidden");
  pendingPhotoData = "";
  document.getElementById("photoPreview").classList.add("hidden");
}

function toggleFavorite(id) { recipes = recipes.map(recipe => recipe.id === id ? { ...recipe, favorite: !recipe.favorite } : recipe); saveRecipes(); renderAll(); }
function deleteRecipe(id) { recipes = recipes.filter(recipe => recipe.id !== id); groceryRecipeIds = groceryRecipeIds.filter(x => String(x) !== String(id)); saveRecipes(); saveGrocerySelection(); renderAll(); }
function copyRecipe(recipe) {
  const text = `${recipe.name}\n\nIngredients:\n${recipe.ingredients.join("\n")}\n\nInstructions:\n${recipe.instructions.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nNotes:\n${recipe.notes || ""}`;
  navigator.clipboard.writeText(text);
}
function clearSample() { recipes = recipes.filter(recipe => ![1, 2].includes(recipe.id)); saveRecipes(); renderAll(); }

function renderPlanner() {
  const grid = document.getElementById("plannerGrid");
  grid.innerHTML = "";
  days.forEach(day => {
    const card = document.createElement("div");
    card.className = "day-card";
    const selectedId = planner[day] || "";
    card.innerHTML = `<h3>${day}</h3><select data-day="${day}"><option value="">Rest / no meal selected</option>${recipes.map(r => `<option value="${r.id}" ${String(r.id) === String(selectedId) ? "selected" : ""}>${r.name}</option>`).join("")}</select><p class="planned-meal">${selectedId ? recipeById(selectedId)?.name || "" : "Rest / Open"}</p>`;
    card.querySelector("select").addEventListener("change", e => { planner[day] = e.target.value; savePlanner(); renderPlanner(); });
    grid.appendChild(card);
  });
}

function renderGroceryControls() {
  const select = document.getElementById("groceryRecipeSelect");
  select.innerHTML = recipes.map(r => `<option value="${r.id}">${r.name}</option>`).join("");
  const selected = document.getElementById("selectedRecipes");
  selected.innerHTML = "";
  groceryRecipeIds.forEach(id => {
    const recipe = recipeById(id);
    if (!recipe) return;
    const pill = document.createElement("button");
    pill.className = "selected-pill";
    pill.textContent = `${recipe.name} ×`;
    pill.addEventListener("click", () => { groceryRecipeIds = groceryRecipeIds.filter(x => String(x) !== String(id)); saveGrocerySelection(); renderGroceryControls(); renderGroceryList(); });
    selected.appendChild(pill);
  });
}

function normalizeIngredient(item) { return item.trim().replace(/\s+/g, " "); }
function buildGroceryItems() {
  const items = [];
  groceryRecipeIds.forEach(id => {
    const recipe = recipeById(id);
    if (recipe) recipe.ingredients.forEach(i => items.push(normalizeIngredient(i)));
  });
  return Array.from(new Set(items.filter(Boolean))).sort((a,b) => a.localeCompare(b));
}
function renderGroceryList() {
  const list = document.getElementById("groceryList");
  const items = buildGroceryItems();
  list.innerHTML = items.length ? "" : `<div class="empty-state">Add recipes or build from your meal plan.</div>`;
  items.forEach(item => {
    const row = document.createElement("label");
    row.className = "grocery-item";
    row.innerHTML = `<input type="checkbox"><span>${item}</span>`;
    row.querySelector("input").addEventListener("change", e => row.classList.toggle("checked", e.target.checked));
    list.appendChild(row);
  });
}
function addRecipeToGrocery() {
  const id = document.getElementById("groceryRecipeSelect").value;
  if (id && !groceryRecipeIds.some(x => String(x) === String(id))) groceryRecipeIds.push(id);
  saveGrocerySelection(); renderGroceryControls(); renderGroceryList();
}
function groceryFromPlanner() {
  groceryRecipeIds = Object.values(planner).filter(Boolean);
  groceryRecipeIds = Array.from(new Set(groceryRecipeIds));
  saveGrocerySelection(); renderGroceryControls(); renderGroceryList();
}
function copyGrocery() { navigator.clipboard.writeText(buildGroceryItems().join("\n")); }
function clearPlanner() { planner = Object.fromEntries(days.map(day => [day, ""])); savePlanner(); renderPlanner(); }

function renderAll() { renderCategoryChips(); renderRecipes(); renderPlanner(); renderGroceryControls(); renderGroceryList(); }

document.getElementById("recipeForm").addEventListener("submit", addOrUpdateRecipe);
document.getElementById("cancelEditBtn").addEventListener("click", resetForm);
document.getElementById("searchInput").addEventListener("input", renderRecipes);
document.getElementById("clearSampleBtn").addEventListener("click", clearSample);
document.getElementById("clearPlannerBtn").addEventListener("click", clearPlanner);
document.getElementById("addRecipeToGroceryBtn").addEventListener("click", addRecipeToGrocery);
document.getElementById("groceryFromPlannerBtn").addEventListener("click", groceryFromPlanner);
document.getElementById("copyGroceryBtn").addEventListener("click", copyGrocery);

document.getElementById("photoInput").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    pendingPhotoData = e.target.result;
    const preview = document.getElementById("photoPreview");
    preview.src = pendingPhotoData;
    preview.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
});

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    document.querySelectorAll(".view").forEach(x => x.classList.remove("active-view"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.view).classList.add("active-view");
  });
});

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault(); deferredPrompt = event; document.getElementById("installBtn").classList.remove("hidden");
});
document.getElementById("installBtn").addEventListener("click", async () => {
  if (!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; document.getElementById("installBtn").classList.add("hidden");
});
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
renderAll();
