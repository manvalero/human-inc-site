const selectors = [
  document.getElementById("hiobs-selector"),
  document.getElementById("hiobs-selector-bottom")
].filter(Boolean);

const grid = document.getElementById("hiobs-grid");
const modeButtons = document.querySelectorAll(".observe-mode");


/* =========================================================
   CANONICAL ORDERS
   ========================================================= */

const SUBJECT_ORDER = [
  "NASA",
  "Oxford University",
  "LEGO",
  "2026 FIFA World Cup",
  "SONY",
  "IKEA",
  "Red Cross",
  "Grupo Bimbo",
  "Citigroup",
  "Wikipedia",
  "Siemens AG",
  "ROLEX"
];

const SYSTEM_ORDER = [
  "Nervous System",
  "Circulatory System",
  "Digestive System",
  "Muscular System",
  "Respiratory System",
  "Sensory System",
  "Integumentary System",
  "Immune System",
  "Skeletal System",
  "Lymphatic System",
  "Endocrine System",
  "Reproductive System"
];


let currentMode = "subject";
let currentSelection = null;


/* =========================================================
   ORDER HELPERS
   ========================================================= */

function selectorValues() {
  return currentMode === "subject"
    ? SUBJECT_ORDER.filter(subject =>
        HIOBS_DATA.some(item => item.subject === subject)
      )
    : SYSTEM_ORDER.filter(system =>
        HIOBS_DATA.some(item => item.system === system)
      );
}


function getObservations(mode, selection) {

  const key = mode === "subject"
    ? "subject"
    : "system";

  const observations = HIOBS_DATA.filter(
    item => item[key] === selection
  );

  const order = mode === "subject"
    ? SYSTEM_ORDER
    : SUBJECT_ORDER;

  const sortKey = mode === "subject"
    ? "system"
    : "subject";

  return observations.sort(
    (a, b) =>
      order.indexOf(a[sortKey]) -
      order.indexOf(b[sortKey])
  );
}


/* =========================================================
   SELECTOR
   ========================================================= */

function renderSelectors() {

  const values = selectorValues();

  if (
    !currentSelection ||
    !values.includes(currentSelection)
  ) {
    currentSelection = values[0];
  }

  selectors.forEach(selector => {

    selector.innerHTML = "";

    values.forEach(value => {

      const button = document.createElement("button");
      button.type = "button";
      button.className = "hiobs-selector-button";
      button.textContent = value.replace(" System", "");

      if (value === currentSelection) {
        button.classList.add("active");
      }

      button.addEventListener("click", () => {

        currentSelection = value;

        renderSelectors();
        renderGrid();

        /*
          If the visitor selects from the bottom controls,
          bring the new observation set into view.
        */
        if (selector.id === "hiobs-selector-bottom") {
          grid.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }

      });

      selector.appendChild(button);

    });

  });

}

/* =========================================================
   OBSERVATION FIELD
   ========================================================= */

function renderGrid() {

  grid.innerHTML = "";

  const observations = getObservations(
    currentMode,
    currentSelection
  );

  observations.forEach(item => {

    const card = document.createElement("article");

    card.className =
      `observation-card system-${item.systemSlug}`;

    card.innerHTML = `
      <button
        class="observation-card-trigger"
        type="button"
      >

        <div class="observation-card-heading">

  <span class="observation-system">
    ${item.system.replace(" System", "")}
  </span>

</div>

        <div class="observation-subject">
          ${item.subject}
        </div>

      </button>

      <div class="observation-card-body">
        <p>${item.observation}</p>
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


/* =========================================================
   OBSERVE BY
   ========================================================= */

modeButtons.forEach(button => {

  button.addEventListener("click", () => {

    currentMode = button.dataset.mode;
    currentSelection = null;

    modeButtons.forEach(btn => {
      btn.classList.toggle(
        "active",
        btn.dataset.mode === currentMode
      );
    });

    renderSelectors();
    renderGrid();

  });

});


/* =========================================================
   INITIAL STATE
   ========================================================= */

renderSelectors();
renderGrid();
