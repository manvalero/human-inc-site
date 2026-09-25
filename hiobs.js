const selector = document.getElementById("hiobs-selector");
const grid = document.getElementById("hiobs-grid");
const modeButtons = document.querySelectorAll(".observe-mode");

let currentMode = "subject";
let currentSelection = null;


/* ---------- Helpers ---------- */

function uniqueValues(key) {
  return [...new Set(HIOBS_DATA.map(item => item[key]))];
}


function getObservations(mode, selection) {
  const key = mode === "subject" ? "subject" : "system";

  return HIOBS_DATA.filter(item => item[key] === selection);
}


/* ---------- Selector ---------- */

function renderSelector() {
  selector.innerHTML = "";

  const key = currentMode === "subject" ? "subject" : "system";
  const values = uniqueValues(key);

  if (!currentSelection || !values.includes(currentSelection)) {
    currentSelection = values[0];
  }

  values.forEach(value => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "hiobs-selector-button";

    if (value === currentSelection) {
      button.classList.add("active");
    }

    button.textContent = value;

    button.addEventListener("click", () => {
      currentSelection = value;
      renderSelector();
      renderGrid();
    });

    selector.appendChild(button);
  });
}


/* ---------- Observation Grid ---------- */

function renderGrid() {
  grid.innerHTML = "";

  const observations = getObservations(
    currentMode,
    currentSelection
  );

  observations.forEach(item => {
    const card = document.createElement("article");

    card.className = `observation-card system-${item.systemSlug}`;

    card.innerHTML = `
      <button class="observation-card-trigger" type="button">

        <div class="observation-card-heading">

          <span class="observation-system">
            ${item.system}
          </span>

          <span class="observation-function">
            ${item.function}
          </span>

        </div>

        <div class="observation-subject">
          ${item.subject}
        </div>

      </button>

      <div class="observation-card-body">

        <p>
          ${item.observation}
        </p>

      </div>
    `;

    const trigger = card.querySelector(
      ".observation-card-trigger"
    );

    trigger.addEventListener("click", () => {
      card.classList.toggle("open");
    });

    grid.appendChild(card);
  });
}


/* ---------- Observe By Toggle ---------- */

modeButtons.forEach(button => {
  button.addEventListener("click", () => {
    currentMode = button.dataset.mode;
    currentSelection = null;

    modeButtons.forEach(btn => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    renderSelector();
    renderGrid();
  });
});


/* ---------- Initial State ---------- */

renderSelector();
renderGrid();
