// HIOBS Distribution Layer — generates the 143 additional public static pages.
// The first ROLEX Immune page remains byte-identical to its published reference.
// Canonical observation and source files are read, never edited.
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const BASE = "https://humanincpractice.com";
const SLUGS = Object.freeze({
  "NASA": "nasa",
  "Oxford University": "oxford-university",
  "LEGO": "lego",
  "2026 FIFA World Cup": "2026-fifa-world-cup",
  "SONY": "sony",
  "IKEA": "ikea",
  "Red Cross": "red-cross",
  "Grupo Bimbo": "grupo-bimbo",
  "Citigroup": "citigroup",
  "Wikipedia": "wikipedia",
  "Siemens AG": "siemens-ag",
  "ROLEX": "rolex"
});
const SYSTEMS = Object.freeze([
  "nervous", "circulatory", "digestive", "muscular",
  "respiratory", "sensory", "integumentary", "immune",
  "skeletal", "lymphatic", "endocrine", "reproductive"
]);
function readConstant(file, name) {
  const raw = readFileSync(join(root, file), "utf8");
  return runInNewContext(raw + "\n" + name, Object.create(null), { timeout:1000 });
}
function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
const data = readConstant("hiobs-data.js", "HIOBS_DATA");
const sources = readConstant("hiobs-sources.js", "HIOBS_SOURCES");
const template = readFileSync(join(root, "scripts/templates/observation-detail.html"), "utf8");
assert(data.length === 144, "Exactly 144 observations required");
assert(Object.keys(SLUGS).length === 12 && SYSTEMS.length === 12, "Canonical cardinality failed");
const keys = new Set();
const listing = [];
for (const item of data) {
  const subjectSlug = SLUGS[item.subject];
  const systemSlug = item.systemSlug;
  const key = item.subject + "|" + systemSlug;
  assert(subjectSlug && SYSTEMS.includes(systemSlug), "Unknown slug: " + key);
  assert(!keys.has(key), "Duplicate observation: " + key);
  keys.add(key);
  assert(item.system === systemSlug[0].toUpperCase() + systemSlug.slice(1) + " System",
    "System label mismatch: " + key);
  assert(typeof item.observation === "string" && item.observation.trim().length > 0,
    "Missing canonical text: " + key);
  const citations = sources[item.subject]?.[systemSlug];
  assert(Array.isArray(citations) && citations.length > 0,
    "Missing public citations: " + key);
  for (const source of citations) {
    assert(source.title && source.publisher && /^https?:\/\/\S+$/.test(source.url),
      "Incomplete public citation: " + key);
  }
  const url = BASE + "/observations/" + subjectSlug + "/" + systemSlug + "/";
  const imageUrl = BASE + "/observations/assets/" + subjectSlug + "-" + systemSlug + "-og.png";
  const label = item.system.replace(/ System$/, "");
  const title = item.subject + " — " + label + " | Human Inc. Observations";
  const description = item.observation.split("\n\n")[0].split(/(?<=[.!?])\s/)[0];
  const sourceHTML = citations.map(source => {
    const label = escapeHtml(source.title);
    const publisher = escapeHtml(source.publisher);
    const date = source.date ? " · " + escapeHtml(source.date) : "";
    return '<li><a class="observation-source-link" href="' + escapeHtml(source.url) +
      '" target="_blank" rel="noopener noreferrer">' + label +
      '</a><span class="observation-source-meta">' + publisher + date + '</span></li>';
  }).join("\n              ");
  const tokens = {
    TITLE: title, DESCRIPTION: description, URL: url, IMAGE: imageUrl,
    IMAGE_ALT: "Human Inc. Observations — " + item.subject + " — " + label + " — HumanIncPractice.com",
    SUBJECT: item.subject, SYSTEM_LABEL: label, SYSTEM_SLUG: systemSlug,
    OBSERVATION: item.observation, SOURCES: sourceHTML,
    CORPUS_LINK: "../../../hiobs.html?subject=" + encodeURIComponent(item.subject) +
      "&amp;system=" + encodeURIComponent(systemSlug)
  };
  let page = template;
  for (const [token, value] of Object.entries(tokens)) {
    page = page.replaceAll("{{" + token + "}}",
      token === "SOURCES" || token === "CORPUS_LINK" ? value : escapeHtml(value));
  }
  assert(!/\{\{[A-Z_]+\}\}/.test(page), "Unresolved template tokens: " + key);
  assert(page.includes(escapeHtml(item.observation)), "Observation altered: " + key);
  assert(citations.every(s => page.includes(escapeHtml(s.url))), "Citation missing: " + key);
  assert(page.includes('property="og:image" content="' + imageUrl + '"'),
    "Social image metadata wrong: " + key);
  const relative = "observations/" + subjectSlug + "/" + systemSlug + "/index.html";
  const fullPath = join(root, relative);
  if (item.subject === "ROLEX" && systemSlug === "immune") {
    // The published prototype must not change while scaling.
    assert(existsSync(fullPath), "ROLEX Immune published page missing");
    assert(readFileSync(fullPath, "utf8") === page,
      "ROLEX Immune page differs from existing published reference");
  } else {
    mkdirSync(join(root, "observations", subjectSlug, systemSlug), { recursive: true });
    writeFileSync(fullPath, page, "utf8");
  }
  listing.push({
    subject: item.subject, subjectSlug, system: systemSlug, url,
    path: relative, imagePath: "observations/assets/" + subjectSlug + "-" + systemSlug + "-og.png",
    observationHash: sha256(item.observation),
    citationHash: sha256(JSON.stringify(citations)),
    citationCount: citations.length
  });
}
assert(keys.size === 144, "Pair cardinality failed");
assert(new Set(listing.map(x => x.url)).size === 144, "URL collision");
for (const subject of Object.keys(SLUGS)) {
  assert(listing.filter(item => item.subject === subject).length === 12,
    "Subject missing system: " + subject);
}
for (const system of SYSTEMS) {
  assert(listing.filter(item => item.system === system).length === 12,
    "System missing subject: " + system);
}
const auditFile = join(root, "scripts", "hiobs-distribution-manifest.json");
writeFileSync(auditFile, JSON.stringify({
  schema: 1,
  observationCount: listing.length,
  sourceReferenceCount: listing.reduce((n, x) => n + x.citationCount, 0),
  entries: listing
}, null, 2) + "\n", "utf8");
console.log("HIOBS distribution: 144 URL records; 143 generated; ROLEX reference untouched");
console.log("Canonical source references:", listing.reduce((n,x) => n + x.citationCount,0));
