// HIOBS static discovery layer. Preserve HIOBS itself and its canonical sources.
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {resolve,join} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(fileURLToPath(new URL("..",import.meta.url)));
const manifest=JSON.parse(readFileSync(join(root,"scripts/hiobs-distribution-manifest.json"),"utf8"));
const items=manifest.entries;
const base="https://humanincpractice.com";
function check(x,m){if(!x)throw Error(m)}
function escape(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
check(items.length===144 && manifest.observationCount===144,"Expected 144 canonical observations");
const urls=new Set(),subjects=new Map();
for(const item of items){
  check(/^https:\/\/humanincpractice\.com\/observations\/[a-z0-9-]+\/[a-z-]+\/$/.test(item.url),"Bad canonical URL");
  check(!urls.has(item.url),"Duplicate canonical URL");
  urls.add(item.url);
  if(!subjects.has(item.subject))subjects.set(item.subject,[]);
  subjects.get(item.subject).push(item);
}
check(subjects.size===12 && [...subjects.values()].every(xs=>xs.length===12),"Expected 12 by 12");
const rowGroups=[...subjects].map(pair=>{
  const subject=pair[0], observations=pair[1];
  const links=observations.map(i=>{
    const label=i.system.slice(0,1).toUpperCase()+i.system.slice(1);
    return '          <li><a href="./'+escape(i.subjectSlug)+'/'+escape(i.system)+'/">'+escape(label)+'</a></li>';
  }).join("\n");
  return '      <section aria-label="'+escape(subject)+'">\n'+
         '        <h2>'+escape(subject)+'</h2>\n'+
         '        <ul>\n'+links+'\n        </ul>\n      </section>';
}).join("\n");
const html=[
'<!DOCTYPE html>','<html lang="en">','<head>',
'  <meta charset="UTF-8">',
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
'  <title>Observation Index | Human Inc. Observations</title>',
'  <meta name="description" content="Browse 144 public Human Inc. Observations across twelve subjects and twelve systems, each with its source citations.">',
'  <link rel="canonical" href="'+base+'/observations/">',
'  <link rel="stylesheet" href="../styles.css">',
'</head>','<body>','  <main class="hiobs-page">',
'    <header class="hiobs-header">',
'      <div class="territory-topbar">',
'        <nav class="territory-nav" aria-label="Human Inc.">',
'          <a href="../index.html">HUMAN INC.</a>',
'          <a href="../hisc.html">HISC</a>',
'          <a href="../hiobs.html" class="active">HIOBS</a>',
'          <a href="../hiff.html">HIFF</a>',
'        </nav>',
'        <a class="territory-action" href="../contact.html?interest=conversation">CONTACT</a>',
'      </div>',
'      <div class="hiobs-heading">',
'        <h1>Human Inc.<br>Observations</h1>',
'        <p class="hiobs-intro">A direct index of the 144 public observations. Each link opens the complete observation and its sources.</p>',
'      </div>',
'    </header>',
'    <section class="observation-field" aria-label="All observations">',
rowGroups,
'      <p><a href="../hiobs.html">Explore the interactive HIOBS grid</a></p>',
'    </section>','  </main>','</body>','</html>',''
].join("\n");
mkdirSync(join(root,"observations"),{recursive:true});
writeFileSync(join(root,"observations/index.html"),html,"utf8");
const core=[base+"/",base+"/hisc.html",base+"/hiobs.html",base+"/hiff.html",base+"/about.html",base+"/contact.html",base+"/observations/"];
const all=[...core,...items.map(item=>item.url)];
check(new Set(all).size===151,"Expected 151 unique sitemap URLs");
const xml='<?xml version="1.0" encoding="UTF-8"?>\n'+
'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
all.map(u=>'  <url><loc>'+escape(u)+'</loc></url>').join("\n")+
'\n</urlset>\n';
writeFileSync(join(root,"sitemap.xml"),xml,"utf8");
writeFileSync(join(root,"robots.txt"),'User-agent: *\nAllow: /\n\nSitemap: '+base+'/sitemap.xml\n',"utf8");
check((html.match(/<li><a href=/g)||[]).length===144,"Index link count");
check((xml.match(/<url><loc>/g)||[]).length===151,"Sitemap count");
console.log("Generated 144 plain HTML links, 151 sitemap entries, and robots.txt");
