import assert from "node:assert/strict";
import { chromium, devices } from "playwright";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
const base="http://127.0.0.1:8765";
const manifest=JSON.parse((await import("node:fs")).readFileSync("scripts/hiobs-distribution-manifest.json","utf8"));
await mkdir("tests/artifacts",{recursive:true});
const server=spawn("python3",["-m","http.server","8765","--bind","127.0.0.1"],{stdio:"ignore"});
let browser;
try{
 let ready=false;
 for(let i=0;i<60;i++){try{ready=(await fetch(base+"/hiobs.html")).ok;if(ready)break;}catch{}await new Promise(r=>setTimeout(r,250));}
 assert.ok(ready);
 browser=await chromium.launch({headless:true});
 const view=await browser.newContext({viewport:{width:1440,height:900},permissions:["clipboard-read","clipboard-write"]});
 const page=await view.newPage();
 const errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 await page.goto(base+"/hiobs.html",{waitUntil:"networkidle"});
 assert.equal(await page.locator(".observation-card").count(),12);
 const subjects=[...new Set(manifest.entries.map(e=>e.subject))];
 // Verify every subject card has twelve share controls, while original layout remains intact.
 for(const subject of subjects){
   await page.locator("#hiobs-selector .hiobs-selector-button").filter({hasText:subject,exact:true}).click();
   assert.equal(await page.locator(".observation-card").count(),12,"Card count "+subject);
   assert.equal(await page.locator(".observation-share-button").count(),12,"Share count "+subject);
 }
 const examples=[
  ["ROLEX","immune"],["NASA","nervous"],["Wikipedia","endocrine"],
  ["2026 FIFA World Cup","respiratory"],["Oxford University","sensory"]
 ];
 for(const [subject,system] of examples){
  const row=manifest.entries.find(r=>r.subject===subject&&r.system===system);
  await page.goto(base+"/"+row.path,{waitUntil:"networkidle"});
  assert.equal((await page.locator(".observation-system").textContent()).trim(),system[0].toUpperCase()+system.slice(1));
  assert.equal(await page.locator(".observation-source-link").count(),row.citationCount);
  assert.equal(await page.locator('meta[property="og:image"]').getAttribute("content"),
   "https://humanincpractice.com/"+row.imagePath);
  await page.getByRole("link",{name:/View within HIOBS/}).click();
  assert.equal(await page.locator(".observation-card.open.system-"+system).count(),1);
 }
 await page.goto(base+"/hiobs.html",{waitUntil:"networkidle"});
 await page.locator(".observe-mode[data-mode=system]").first().click();
 assert.equal(await page.locator(".observation-card").count(),12);
 assert.equal(await page.locator(".observation-share-button").count(),12);
 await page.screenshot({path:"tests/artifacts/desktop-all.png",fullPage:true});
 assert.deepEqual(errors,[]);
 await view.close();
 const {browserName,...mobileProfile}=devices["iPhone 13"];
 const mobile=await browser.newContext(mobileProfile);
 await mobile.addInitScript(()=>{
  Object.defineProperty(navigator,"share",{configurable:true,value:async data=>{window.__lastShared=data;}});
 });
 const phone=await mobile.newPage();
 await phone.goto(base+"/hiobs.html",{waitUntil:"networkidle"});
 await phone.locator("#hiobs-selector .hiobs-selector-button").filter({hasText:"Wikipedia",exact:true}).click();
 const card=phone.locator(".observation-card.system-endocrine");
 await card.locator(".observation-card-trigger").click();
 await card.locator(".observation-share-button").click();
 assert.equal((await phone.evaluate(()=>window.__lastShared)).url,
 "https://humanincpractice.com/observations/wikipedia/endocrine/");
 await phone.goto(base+"/observations/wikipedia/endocrine/",{waitUntil:"networkidle"});
 await phone.screenshot({path:"tests/artifacts/mobile-wikipedia.png",fullPage:true});
 await phone.getByRole("link",{name:/View within HIOBS/}).click();
 assert.equal(await phone.locator(".observation-card.open.system-endocrine").count(),1);
 await mobile.close();
 console.log("PASS: 144 share controls by subject; desktop and mobile return; original selectors and source pages");
}finally{await browser?.close();server.kill("SIGTERM");}
