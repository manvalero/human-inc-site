// HIOBS discovery files only. Source: existing 144-observation manifest.
// Does not change any page, interface, observation text, source, or share control.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const manifest = JSON.parse(readFileSync(join(root,"scripts/hiobs-distribution-manifest.json"),"utf8"));
if(manifest.observationCount!==144 || manifest.entries.length!==144){
  throw new Error("Expected the complete 144-observation canonical distribution manifest");
}
const subjectCount=new Map(),systemCount=new Map(),unique=new Set();
for(const entry of manifest.entries){
  const {subject,system,url,path}=entry;
  if(!/^https:\/\/humanincpractice\.com\/observations\/[a-z0-9-]+\/[a-z-]+\/$/.test(url)
      ||!existsSync(join(root,path)) || unique.has(url)){
    throw new Error("Missing, repeated or invalid observation page: "+url);
  }
  unique.add(url);
  subjectCount.set(subject,(subjectCount.get(subject)||0)+1);
  systemCount.set(system,(systemCount.get(system)||0)+1);
}
if(subjectCount.size!==12 || systemCount.size!==12
    || [...subjectCount.values()].some(n=>n!==12)
    || [...systemCount.values()].some(n=>n!==12)){
  throw new Error("Expected 12 subjects with 12 systems each");
}
// Existing public pages plus 144 existing standalone observations.
// Keep navigation and HIOBS interactions exactly as they are.
const base="https://humanincpractice.com";
const core=["/","/hisc.html","/hiobs.html","/hiff.html",
            "/about.html","/contact.html","/legal.html"];
const urls=[...core.map(path=>base+path),...manifest.entries.map(e=>e.url)];
if(urls.length!==151 || new Set(urls).size!==151){
  throw new Error("Sitemap URL count or uniqueness failed");
}
const xml=[
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map(url=>'  <url><loc>'+url+'</loc></url>'),
  '</urlset>',
  ''
].join('\n');
writeFileSync(join(root,"sitemap.xml"),xml,"utf8");
// No User-agent, Allow or Disallow directives. Existing access policy unchanged.
writeFileSync(join(root,"robots.txt"),
  "Sitemap: https://humanincpractice.com/sitemap.xml\n","utf8");
console.log("PASS: 144 canonical observations, 151 sitemap URLs, robots sitemap pointer");
