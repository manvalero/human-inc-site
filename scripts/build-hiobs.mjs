// Human Inc. Observations static publication generator.
// Reads the unchanged canonical HIOBS_DATA and public HIOBS_SOURCES.
// Prototype is deliberately limited to ROLEX / immune.
// Run: node scripts/build-hiobs.mjs
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
function readDeclaration(filename, name) {
  const source = readFileSync(join(root, filename), "utf8");
  return runInNewContext(source + "\n" + name, Object.create(null), {timeout:1000});
}
const HIOBS_DATA = readDeclaration("hiobs-data.js", "HIOBS_DATA");
const HIOBS_SOURCES = readDeclaration("hiobs-sources.js", "HIOBS_SOURCES");
const template = readFileSync(join(root,"scripts/templates/observation-detail.html"), "utf8");


const SUBJECT_SLUGS = {
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
};
function escapeHtml(value){return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}
function renderDetail(template,item,sourceRows){
 if(!item||!Array.isArray(sourceRows)||!sourceRows.length)throw new Error("Missing observation or source set");
 const subjectSlug=SUBJECT_SLUGS[item.subject]; if(!subjectSlug || !/^[a-z]+$/.test(item.systemSlug))throw new Error("Unknown slug");
 const u=`https://humanincpractice.com/observations/${subjectSlug}/${item.systemSlug}/`;
 const systemLabel = item.system.replace(/ System$/, "");
 const title=`${item.subject} — ${systemLabel} | Human Inc. Observations`;
 const description=item.observation.split("\n\n")[0].split(/(?<=[.!?])\s/)[0];
 const sourceHtml=sourceRows.map(s=>`<li><a class="observation-source-link" href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.title)}</a><span class="observation-source-meta">${escapeHtml(s.publisher)}${s.date?` · ${escapeHtml(s.date)}`:""}</span></li>`).join("\n          ");
 const tokens={"TITLE":title,"DESCRIPTION":description,"URL":u,"SUBJECT":item.subject,"SYSTEM_LABEL":systemLabel,"SYSTEM_SLUG":item.systemSlug,"OBSERVATION":item.observation,"SOURCES":sourceHtml,"CORPUS_LINK":`../../../hiobs.html?subject=${encodeURIComponent(item.subject)}&amp;system=${encodeURIComponent(item.systemSlug)}`};
 let output=template;
 for(const [key,value] of Object.entries(tokens)) output=output.replaceAll(`{{${key}}}`,key==="SOURCES"||key==="CORPUS_LINK"?value:escapeHtml(value));
 if(/\{\{[A-Z_]+\}\}/.test(output))throw new Error("Unresolved placeholders in observation page");
 return output;
}

const selected = HIOBS_DATA.filter(item => item.subject === "ROLEX" && item.systemSlug === "immune");
if (selected.length !== 1) throw new Error("Expected exactly one ROLEX / immune observation");
const item = selected[0];
const sources = HIOBS_SOURCES[item.subject]?.[item.systemSlug];
if (!sources?.length) throw new Error("ROLEX / immune source set is missing");
const page = renderDetail(template, item, sources);
const outDir = join(root, "observations", "rolex", "immune");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "index.html"), page, "utf8");
console.log("Generated ROLEX / Immune observation page from canonical data");
