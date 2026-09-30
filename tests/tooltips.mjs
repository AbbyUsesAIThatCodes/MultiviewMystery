import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(process.env.GAME_DIRECTORY||'dist');
const output=path.resolve(process.env.EVIDENCE_DIRECTORY||'test-results/tooltips');
await fs.mkdir(output,{recursive:true});
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const file=path.resolve(root,'.'+decodeURIComponent(url.pathname)+(url.pathname.endsWith('/')?'index.html':''));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 try{const bytes=await fs.readFile(file);res.setHeader('Content-Type',file.endsWith('.js')||file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(bytes);}catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
page.setDefaultTimeout(8000);
const cards='.term-card:not(.is-closing)',checks=[],errors=[];let activePage=page;
page.on('pageerror',e=>errors.push(e.message));
const ok=(value,label)=>{assert(value,label);checks.push(label);};
const count=n=>page.waitForFunction(({cards,n})=>document.querySelectorAll(cards).length===n,{cards,n});
const hover=async locator=>{await locator.hover();await page.waitForTimeout(350);};
const rect=selector=>page.locator(selector).boundingBox();
const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
async function screen(name){await page.mouse.move(1100,950);await page.screenshot({path:path.join(output,name+'.png')});}
try{
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.evaluate(()=>document.fonts.ready);
 await page.locator('[data-workshop=free]').click();await page.locator('#place-cube').click();
 const primary=page.locator('#primary-action');await hover(primary);ok(await page.locator(cards).count()===0,'Check Construction hover opens no definition');
 await primary.click();ok((await page.locator('#feedback-title').innerText()).includes('Connected And Supported'),'Check Construction activates on first click');
 await hover(primary);ok(await page.locator(cards).count()===0,'Reused main button remains free of stale Model annotation');await screen('check-construction-safe');
 await primary.focus();await page.keyboard.press('Enter');ok((await page.locator('#feedback-title').innerText()).includes('Connected And Supported'),'Primary keyboard activation works');
 await page.evaluate(async()=>{
  const button=document.querySelector('#primary-action');button.innerHTML='Check My <strong><span>Model</span></strong>';button.dataset.term='model';button.classList.add('vocab-control');
  const {decorateVocabulary}=await import('./reference.mjs');decorateVocabulary(document.querySelector('main'));
 });
 ok(await primary.getAttribute('data-term')===null,'Old vocabulary tag removed from a reused action button');
 ok(await primary.locator('.term').count()===0,'Nested action label markup is not decorated');
 await hover(primary.locator('span'));ok(await page.locator(cards).count()===0,'Hovering nested action markup opens no definition');await primary.click();
 await page.locator('[data-workshop=learn]').click();await page.locator('[data-mode=build]').click();
 for(const selector of ['[data-workshop=free]','[data-workshop=challenge]','[data-mode=predict]','[data-tool=add]','[data-tool=remove]','[data-tool=rotate]','#place-cube','#remove-cube','#overlay','#target-toggle','[data-view=top]','#reference-open','#help-open']){
  await hover(page.locator(selector));ok(await page.locator(cards).count()===0,`${selector}: action hover opens no vocabulary card`);
  await page.locator(selector).focus();await page.keyboard.press('Alt+ArrowDown');ok(await page.locator(cards).count()===0,`${selector}: focus and Alt+Down open no vocabulary card`);
 }
 // Real terms retain nested definitions, with room to travel between cards.
 await page.locator('[data-mode=explore]').click();
 const term=page.locator('#mission .term[data-term=model]').first();
 await hover(term);await count(1);
 const rootCard=page.locator(cards).first();
 ok(await rootCard.evaluate(e=>getComputedStyle(e).transitionDuration)==='0.12s','Definition has a short fade');
 const rootBox=await rootCard.boundingBox();
 for(const selector of ['#workshop-panel','#drawings-panel','.topbar','footer','.orientation','.zoom','#primary-action'])ok(overlap(rootBox,await rect(selector))<1,`Desktop tooltip avoids ${selector}`);
 await page.mouse.move(rootBox.x+20,rootBox.y+30,{steps:8});await page.waitForTimeout(500);ok(await page.locator(cards).count()===1,'Travel to the card and reading inside keep it open');
 const settled=await rootCard.boundingBox();ok(settled.x===rootBox.x&&settled.y===rootBox.y,'Open tooltip does not chase the pointer');
 await hover(rootCard.locator('[data-term=width]').first());await count(2);
 const child=page.locator(cards).nth(1);await hover(child.locator('[data-term=front]').first());await count(3);
 const grandchild=page.locator(cards).last(),g=await grandchild.boundingBox();
 await page.mouse.move(g.x+20,g.y+30);await page.waitForTimeout(550);ok(await page.locator(cards).count()===3,'Hovering a descendant retains every ancestor');
 await page.screenshot({path:path.join(output,'nested-family-desktop.png')});
 await rootCard.locator('h3').hover();await page.waitForTimeout(500);ok(await page.locator(cards).count()===1,'Returning to parent dismisses abandoned descendants');
 await hover(rootCard.locator('[data-term=width]').first());await count(2);
 await page.mouse.move(1100,940);await page.waitForTimeout(100);ok(await page.locator(cards).count()===2,'Brief travel grace prevents flicker');
 await page.waitForFunction(()=>document.querySelector('.term-card.is-closing'));
 ok(await page.locator('.term-card.is-closing').first().evaluate(e=>getComputedStyle(e).pointerEvents)==='none','Fading cards cannot intercept clicks');
 await page.waitForTimeout(180);ok(await page.locator('.term-card').count()===0,'Leaving the whole family removes parent and children');
 // Hover a vocabulary term then move directly to the main action.
 await hover(term);await count(1);await primary.hover();await primary.click();
 ok(await page.locator('#prediction-panel').isVisible(),'An already-open definition cannot block the next action');ok(await page.locator(cards).count()===0,'Action clears old definition family');
 await page.locator('[data-mode=explore]').click();
 await term.focus();await page.keyboard.press('Enter');await count(1);await page.waitForTimeout(600);
 ok(await page.locator(cards).count()===1,'Keyboard-open definition persists while focused');
 await page.locator(cards).first().locator('[data-term=width]').first().focus();await page.keyboard.press('Enter');await count(2);
 await page.keyboard.press('Escape');await count(1);ok(await page.locator(cards).first().locator('[data-term=width]').first().evaluate(e=>e===document.activeElement),'Escape restores nested trigger focus');
 await page.keyboard.press('Escape');await count(0);ok(await term.evaluate(e=>e===document.activeElement),'Escape restores root trigger focus');
 await page.waitForTimeout(450);ok(await page.locator(cards).count()===0,'Escape does not immediately reopen the hovered term');
 await page.emulateMedia({reducedMotion:'reduce'});await term.focus();await page.keyboard.press('Enter');await count(1);
 ok(await page.locator(cards).first().evaluate(e=>getComputedStyle(e).transitionDuration)==='0s','Reduced motion disables fades');await page.keyboard.press('Escape');ok(await page.locator('.term-card').count()===0,'Reduced-motion dismissal is immediate');
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.locator('#reference-open').click();await page.locator('#reference-search').fill('model');
 const refTerm=page.locator('#reference .reference-entry .term').first();await refTerm.focus();await page.keyboard.press('Enter');await count(1);
 const modalCard=page.locator('#reference '+cards);ok(await modalCard.count()===1,'Reference text still opens a definition in the modal');
 await page.keyboard.press('Escape');await page.locator('#reference-close').click();
 // Touch has no unhover, so cards persist until an outside tap or explicit close.
 for(const viewport of [{width:390,height:844},{width:320,height:568}]){
  const phone=await browser.newPage({viewport,isMobile:true,hasTouch:true});activePage=phone;phone.setDefaultTimeout(8000);phone.on('pageerror',e=>errors.push(e.message));
  await phone.goto(`http://127.0.0.1:${server.address().port}`);
  await phone.evaluate(()=>document.fonts.ready);
  // The tiny phone's action area scrolls separately from its instructions.
  // Protect the visible button, not the bounds of a button clipped by that area.
  await phone.locator('#primary-action').scrollIntoViewIfNeeded();
  await phone.locator('#mission .term[data-term=model]').first().tap();await phone.waitForTimeout(500);
  await phone.screenshot({path:path.join(output,`root-phone-${viewport.width}.png`)});
  ok(await phone.locator(cards).count()===1,`${viewport.width}: touch card persists`);
  const card=await phone.locator(cards).boundingBox(),button=await phone.locator('#primary-action').boundingBox();
  ok(card.x>=0&&card.y>=0&&card.x+card.width<=viewport.width&&card.y+card.height<=viewport.height,`${viewport.width}: touch definition fits screen`);
  ok(overlap(card,button)<1,`${viewport.width}: touch definition leaves primary action clear`);
  await phone.locator(cards).first().locator('[data-term=width]').first().tap();ok(await phone.locator(cards).count()===2,`${viewport.width}: nested touch terms preserved`);
  await phone.waitForTimeout(180);await phone.screenshot({path:path.join(output,`nested-phone-${viewport.width}.png`)});
  const touchChild=phone.locator(cards).last(),childBox=await touchChild.boundingBox();
  await touchChild.locator('.reference-link').scrollIntoViewIfNeeded();await phone.waitForTimeout(150);
  const afterScroll=await touchChild.boundingBox();
  ok(afterScroll.x===childBox.x&&afterScroll.y===childBox.y&&afterScroll.height===childBox.height,`${viewport.width}: scrolling a tooltip keeps its position and size`);
  await touchChild.locator('.reference-link').tap();ok(await phone.locator('#reference').evaluate(e=>e.open),`${viewport.width}: touch reference link works`);
  await phone.locator('#reference-close').tap();
  await phone.locator('[data-workshop=free]').tap();await phone.locator('#place-cube').tap();await phone.locator('#primary-action').tap();
  ok((await phone.locator('#feedback-title').innerText()).includes('Connected And Supported'),`${viewport.width}: Check Construction activates on first tap`);
  ok(await phone.locator(cards).count()===0,`${viewport.width}: action tap opens no definition`);activePage=page;await phone.close();
 }
 ok(errors.length===0,`No page errors: ${errors.join('; ')}`);
 const buildId=await page.locator('#build-identity').innerText();await fs.writeFile(path.join(output,'tooltip-results.json'),JSON.stringify({status:'passed',assertions:checks.length,checks,errors,buildId},null,2)+'\n');console.log(`${checks.length} tooltip assertions passed. Build: ${buildId}`);
}catch(error){await activePage.screenshot({path:path.join(output,'failure.png')});await fs.writeFile(path.join(output,'failure.json'),JSON.stringify({message:error.message,checks,errors},null,2));throw error;}
finally{await browser.close();await new Promise(r=>server.close(r));}
