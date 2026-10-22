// Fail release if any output doesn't exactly correspond to canonical entries.
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
const root=process.cwd();
const read=(p)=>readFileSync(join(root,p),"utf8");
const variable=(p,n)=>runInNewContext(read(p)+"\n"+n,Object.create(null),{timeout:1000});
const data=variable("hiobs-data.js","HIOBS_DATA");
const sources=variable("hiobs-sources.js","HIOBS_SOURCES");
const manifest=JSON.parse(read("scripts/hiobs-distribution-manifest.json"));
assert.equal(data.length,144);
assert.equal(manifest.observationCount,144);
assert.equal(manifest.sourceReferenceCount,345);
assert.equal(manifest.entries.length,144);
const paths=new Set(), imagePaths=new Set();
for(const row of manifest.entries){
 const item=data.find(x=>x.subject===row.subject&&x.systemSlug===row.system);
 assert.ok(item,"Unknown observation "+row.path);
 const refs=sources[row.subject]?.[row.system];
 assert.equal(refs?.length,row.citationCount);
 const page=read(row.path);
 assert.ok(page.includes(item.observation.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")), "Canonical observation altered "+row.path);
 for(const ref of refs) assert.ok(page.includes(ref.url.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")),"Citation missing "+ref.url);
 assert.ok(page.includes(row.url),"Missing exact canonical URL");
 assert.ok(page.includes("https://humanincpractice.com/"+row.imagePath),"Missing precise preview URL");
 assert.ok(page.includes("../../../hiobs.html?subject="),"Missing original HIOBS return link");
 assert.ok(!paths.has(row.path),"Duplicate page");
 assert.ok(!imagePaths.has(row.imagePath),"Duplicate preview");
 paths.add(row.path);
 imagePaths.add(row.imagePath);
 const png=readFileSync(join(root,row.imagePath));
 assert.ok(png.length>1000,"Image too small");
 assert.equal(png.subarray(0,8).toString("hex"),"89504e470d0a1a0a","Invalid PNG signature");
 assert.equal(png.readUInt32BE(16),1200);
 assert.equal(png.readUInt32BE(20),630);
}
assert.equal(paths.size,144);assert.equal(imagePaths.size,144);
console.log("VALIDATION PASSED: 144 observations + images, exact sources, unique URLs, all files present");
