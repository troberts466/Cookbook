const STORAGE_KEY = "karisRecipeBook.recipes.v1";
let activeFilter = "all";
let deferredPrompt = null;

const sampleRecipes = [
  {
    id: 1,
    name: "Creamy Garlic Chicken",
    category: "Dinner",
    url: "",
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
    ingredients: ["2 cans cinnamon rolls", "4 eggs", "1/2 cup milk", "1 tsp vanilla", "1 tsp cinnamon"],
    instructions: ["Cut cinnamon rolls into pieces.", "Whisk eggs, milk, vanilla, and cinnamon.", "Pour over rolls in a baking dish.", "Bake until puffed and golden."],
    notes: "Save icing for the top after baking.",
    favorite: false
  }
];

let recipes = loadRecipes();

function loadRecipes() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleRecipes));
  return sampleRecipes;
}

function saveAll() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

function cleanLines(value) {
  return value.split("\n").map(x => x.trim()).filter(Boolean);
}

function recipeMatchesSearch(recipe, term) {
  const haystack = [
    recipe.name,
    recipe.category,
    recipe.notes,
    recipe.ingredients.join(" "),
    recipe.instructions.join(" ")
  ].join(" ").toLowerCase();
  return haystack.includes(term);
}

function getVisibleRecipes() {
  const term = document.getElementById("searchInput").value.trim().toLowerCase();
  return recipes.filter(recipe => {
    const filterMatch =
      activeFilter === "all" ||
      (activeFilter === "favorites" && recipe.favorite) ||
      recipe.category.toLowerCase() === activeFilter;
    return filterMatch && recipeMatchesSearch(recipe, term);
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
    const card = clone.querySelector(".recipe-card");
    const title = clone.querySelector("h3");
    const category = clone.querySelector(".category-pill");
    const source = clone.querySelector(".source-link");
    const ingredients = clone.querySelector("ul");
    const instructions = clone.querySelector("ol");
    const notes = clone.querySelector(".notes");
    const favorite = clone.querySelector(".favorite-button");
    const copy = clone.querySelector(".copy-btn");
    const del = clone.querySelector(".delete-btn");

    title.textContent = recipe.name;
    category.textContent = recipe.category;
    favorite.textContent = recipe.favorite ? "★" : "☆";

    if (recipe.url) {
      source.href = recipe.url;
      source.textContent = "Open source";
    } else {
      source.classList.add("hidden");
    }

    recipe.ingredients.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      ingredients.appendChild(li);
    });

    recipe.instructions.forEach(step => {
      const li = document.createElement("li");
      li.textContent = step;
      instructions.appendChild(li);
    });

    notes.textContent = recipe.notes || "";

    favorite.addEventListener("click", () => toggleFavorite(recipe.id));
    del.addEventListener("click", () => deleteRecipe(recipe.id));
    copy.addEventListener("click", () => copyRecipe(recipe));

    list.appendChild(card);
  });
}

function addRecipe(event) {
  event.preventDefault();

  const recipe = {
    id: Date.now(),
    name: document.getElementById("name").value.trim(),
    category: document.getElementById("category").value,
    url: document.getElementById("url").value.trim(),
    ingredients: cleanLines(document.getElementById("ingredients").value),
    instructions: cleanLines(document.getElementById("instructions").value),
    notes: document.getElementById("notes").value.trim(),
    favorite: false
  };

  recipes.unshift(recipe);
  saveAll();
  event.target.reset();
  renderRecipes();
}

function toggleFavorite(id) {
  recipes = recipes.map(recipe => recipe.id === id ? { ...recipe, favorite: !recipe.favorite } : recipe);
  saveAll();
  renderRecipes();
}

function deleteRecipe(id) {
  recipes = recipes.filter(recipe => recipe.id !== id);
  saveAll();
  renderRecipes();
}

function copyRecipe(recipe) {
  const text = `${recipe.name}\n\nIngredients:\n${recipe.ingredients.join("\n")}\n\nInstructions:\n${recipe.instructions.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nNotes:\n${recipe.notes || ""}`;
  navigator.clipboard.writeText(text);
}

function clearSample() {
  recipes = recipes.filter(recipe => ![1, 2].includes(recipe.id));
  saveAll();
  renderRecipes();
}

document.getElementById("recipeForm").addEventListener("submit", addRecipe);
document.getElementById("searchInput").addEventListener("input", renderRecipes);
document.getElementById("clearSampleBtn").addEventListener("click", clearSample);

document.querySelectorAll(".chip").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach(x => x.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    renderRecipes();
  });
});

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredPrompt = event;
  document.getElementById("installBtn").classList.remove("hidden");
});

document.getElementById("installBtn").addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  document.getElementById("installBtn").classList.add("hidden");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
}

renderRecipes();
