import Search from "./models/Search";
import Recipe from "./models/Recipe";
import List from "./models/List";
import Likes from "./models/Likes";
import * as searchView from "./views/searchView";
import * as recipeView from "./views/recipeView";
import * as listView from "./views/listView";
import { elements, renderLoader, clearLoader } from "./views/base";
import Like from "./models/Likes";

/** Global state of the app
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes
 */
const state = {};

/* *
 * SEARCH CONTROLLER *
 * */
const controlSearch = async () => {
  // 1. Get query from view
  const query = searchView.getInput();

  if (query) {
    // 2. New search object and add to state
    state.search = new Search(query);
    // 3. Prepare UI for result
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);

    try {
      // 4. Search for recipes
      await state.search.getResult();
      // 5. Render result on UI
      clearLoader();
      searchView.renderResults(state.search.result);
    } catch (error) {
      alert("Something wrong with the search...");
      clearLoader();
    }
  }
};

elements.searchForm.addEventListener("submit", e => {
  e.preventDefault();
  controlSearch();
});

elements.searchResPages.addEventListener("click", e => {
  const btn = e.target.closest(".btn-inline");

  if (btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
  }
});

/* *
 * RECIPE CONTROLLER *
 * */

const controlRecipe = async () => {
  // get ID from url
  const id = window.location.hash.replace("#", "");

  if (id) {
    // prepare UI for changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);

    // highlight selected search item
    if (state.search) searchView.highlightSelected(id);

    // create new recipe object
    state.recipe = new Recipe(id);

    try {
      // get recipe data and parse ingredients
      await state.recipe.getRecipe();
      state.recipe.parseIngredients();

      // calculate servings and time
      state.recipe.calcTime();
      state.recipe.calcServings();

      // render recipe
      clearLoader();
      recipeView.renderRecipe(state.recipe);
    } catch (error) {
      alert("Error processing recipe!");
    }
  }
};

["hashchange", "load"].forEach(event =>
  window.addEventListener(event, controlRecipe)
);

/* *
 * LIST CONTROLLER *
 * */
const controlList = () => {
  // Create a new list if there's none yet
  if (!state.list) state.list = new List();
  // Add ingredient to the list and the UI
  state.recipe.ingredients.forEach(el => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
};

/* *
 * LIKES CONTROLLER *
 * */

const controlLike = () => {
  if (!state.likes) state.likes = new Likes();
  const currentID = state.recipe.id;

  // user has NOT liked current recipe
  if (!state.likes.isLiked(currentID)) {
    //  Add like to the state
    state.likes.addLike(
      currentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );
    //  Toggle the like btn
    //  Add like to the UI list
    console.log(state.likes);

    // user HAS liked current recipe
  } else {
    //  Remove like from the state
    state.likes.deleteLike(currentID);
    //  Toggle the like btn
    //  Remove like from the UI list
    console.log(state.likes);
  }
};

// Handle delete and update list item events
elements.shoppingList.addEventListener("click", e => {
  const id = e.target.closest(".shopping__item").dataset.itemid;

  if (e.target.matches(".shopping__delete, .shopping__delete *")) {
    // delete item from state
    state.list.deleteItem(id);
    // delete item from UI
    listView.deleteItem(id);
  } else if (e.target.matches(".shopping__count-value")) {
    // update
    const val = parseFloat(e.target.value, 10);
    state.list.updateCount(id, val);
  }
});

// Handling recipe button clicks
elements.recipe.addEventListener("click", e => {
  if (e.target.matches(".btn-decrease, .btn-decrease *")) {
    // decrease button is clicked
    if (state.recipe.servings > 1) {
      state.recipe.updateServings("dec");
      recipeView.updateServingsIngredients(state.recipe);
    }
  } else if (e.target.matches(".btn-increase, .btn-increase *")) {
    // increase button is clicked
    state.recipe.updateServings("inc");
    recipeView.updateServingsIngredients(state.recipe);
  } else if (e.target.matches(".recipe__btn-add, .recipe__btn-add *")) {
    controlList();
  } else if (e.target.matches(".recipe__love, .recipe__love *")) {
    controlLike();
  }
});
