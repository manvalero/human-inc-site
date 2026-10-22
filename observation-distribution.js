/*
 * HIOBS Distribution Layer — one-observation prototype.
 *
 * Leave hiobs.js, the original selectors, and the card controls untouched.
 * This file runs AFTER the existing grid code. It only adds one share button
 * inside the ROLEX / Immune observation and handles targeted return links.
 */
(() => {
  const grid = document.getElementById("hiobs-grid");
  if (!grid || !window.HIOBSShare || typeof HIOBS_DATA === "undefined") return;

  const prototype = HIOBS_DATA.find(
    item => item.subject === "ROLEX" && item.systemSlug === "immune"
  );
  if (!prototype) return;

  const url = "https://humanincpractice.com/observations/rolex/immune/";
  const title = "ROLEX — Immune | Human Inc. Observations";

  function locatePrototypeCard() {
    return [...grid.querySelectorAll(".observation-card.system-immune")].find(
      card => card.querySelector(".observation-subject")?.textContent.trim() === "ROLEX"
    );
  }

  function integrateShareControl() {
    const card = locatePrototypeCard();
    const body = card?.querySelector(".observation-card-body");
    if (!body || body.querySelector(".observation-share-region")) return;

    const region = document.createElement("div");
    region.className = "observation-share-region";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "observation-share-button";
    button.textContent = navigator.share ? "Share" : "Copy link";
    button.setAttribute("aria-label", "Share ROLEX Immune observation");

    const status = document.createElement("span");
    status.className = "observation-share-status";
    status.setAttribute("aria-live", "polite");
    button.addEventListener("click", () => window.HIOBSShare.share(url, title, status));

    region.append(button, status);
    body.appendChild(region);
  }

  integrateShareControl();

  // Existing selector interactions rebuild the card grid. When they do,
  // re-add the one prototype share control without changing grid behavior.
  new MutationObserver(integrateShareControl).observe(grid, {
    childList: true,
    subtree: true
  });

  const params = new URLSearchParams(window.location.search);
  const subject = params.get("subject");
  const system = params.get("system");

  // This first prototype only recognizes its own return link.
  // Other requests preserve the unmodified default HIOBS behavior.
  if (subject !== "ROLEX" || system !== "immune") {
    return;
  }

  // The native HIOBS page starts in subject mode. Reuse its actual button
  // rather than modifying any of the site's internal state or rendering code.
  const selector = document.getElementById("hiobs-selector");
  const button = [...(selector?.querySelectorAll(".hiobs-selector-button") || [])].find(
    element => element.textContent.trim() === subject
  );
  if (!button) return;

  button.click();

  const target = [...grid.querySelectorAll(".observation-card")].find(card =>
    card.classList.contains("system-" + system) &&
    card.querySelector(".observation-subject")?.textContent.trim() === subject
  );
  if (!target) return;

  const trigger = target.querySelector(".observation-card-trigger");
  if (trigger && !target.classList.contains("open")) trigger.click();

  requestAnimationFrame(() => {
    target.scrollIntoView({ block: "start", behavior: "instant" });
  });
})();
