/*
 * HIOBS Distribution Layer
 * Separate behavior enhancement: original hiobs.js, page markup and
 * stylesheet are not altered. New controls appear only in expanded cards.
 */
(() => {
  const grid = document.getElementById("hiobs-grid");
  if (!grid || !window.HIOBSShare || typeof HIOBS_DATA === "undefined") return;

  const SLUGS = Object.freeze({
    "NASA":"nasa", "Oxford University":"oxford-university",
    "LEGO":"lego", "2026 FIFA World Cup":"2026-fifa-world-cup",
    "SONY":"sony", "IKEA":"ikea", "Red Cross":"red-cross",
    "Grupo Bimbo":"grupo-bimbo", "Citigroup":"citigroup",
    "Wikipedia":"wikipedia", "Siemens AG":"siemens-ag", "ROLEX":"rolex"
  });
  const canonicalByKey = new Map(HIOBS_DATA.map(item => [
    item.subject + "|" + item.systemSlug, item
  ]));

  function lookupCard(card) {
    const subject = card.querySelector(".observation-subject")?.textContent.trim();
    const system = [...card.classList]
      .find(name => name.startsWith("system-"))?.slice("system-".length);
    if (!subject || !SLUGS[subject] || !system) return null;
    return canonicalByKey.get(subject + "|" + system) || null;
  }
  function attachControls() {
    for (const card of grid.querySelectorAll(".observation-card")) {
      const item = lookupCard(card);
      const body = card.querySelector(".observation-card-body");
      if (!item || !body || body.querySelector(".observation-share-region")) continue;
      const url = "https://humanincpractice.com/observations/" +
        SLUGS[item.subject] + "/" + item.systemSlug + "/";
      const title = item.subject + " — " + item.system.replace(/ System$/, "") +
        " | Human Inc. Observations";
      const region = document.createElement("div");
      region.className = "observation-share-region";
      const control = document.createElement("button");
      control.type = "button";
      control.className = "observation-share-button";
      control.textContent = navigator.share ? "Share" : "Copy link";
      control.setAttribute("aria-label",
        "Share " + item.subject + " " + item.system.replace(/ System$/, "") + " observation");
      const status = document.createElement("span");
      status.className = "observation-share-status";
      status.setAttribute("aria-live", "polite");
      control.addEventListener("click", () =>
        window.HIOBSShare.share(url, title, status));
      region.append(control, status);
      body.appendChild(region);
    }
  }

  attachControls();
  new MutationObserver(attachControls).observe(grid, { childList:true, subtree:true });

  // A standalone observation links back to the original HIOBS grid.
  const params = new URLSearchParams(location.search);
  const subject = params.get("subject");
  const system = params.get("system");
  if (!subject || !system || !canonicalByKey.has(subject + "|" + system)) return;

  const selector = document.getElementById("hiobs-selector");
  const subjectControl = [...(selector?.querySelectorAll(".hiobs-selector-button") || [])]
    .find(btn => btn.textContent.trim() === subject);
  if (!subjectControl) return;
  subjectControl.click();

  const target = [...grid.querySelectorAll(".observation-card")].find(card => {
    const item = lookupCard(card);
    return item && item.subject === subject && item.systemSlug === system;
  });
  if (!target) return;
  const trigger = target.querySelector(".observation-card-trigger");
  if (trigger && !target.classList.contains("open")) trigger.click();
  requestAnimationFrame(() => target.scrollIntoView({ block:"start", behavior:"instant" }));
})();
