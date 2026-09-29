import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {levels} from '../dist/logic.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(process.env.GAME_DIRECTORY||'dist');
const output=path.resolve(process.env.EVIDENCE_DIRECTORY||'test-results');await fs.mkdir(output,{recursive:true});
const server=http.createServer(async(req,res)=>{const relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+relative+(relative.endsWith('/')?'index.html':''));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}try{const data=await fs.readFile(file);res.setHeader('Content-Type',file.endsWith('.js')||file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.json')?'application/json':'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
const errors=[];let assertions=0;const ok=(test,label)=>{assert(test,label);assertions++;};
const page=await browser.newPage({viewport:{width:1440,height:1050}});page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.workshopTools={};Object.defineProperty(navigator,'modelContext',{value:undefined,configurable:true});Object.defineProperty(document,'modelContext',{value:{registerTool(t){window.workshopTools[t.name]=t;}},configurable:true});});
const call=(name,input={})=>page.evaluate(async({name,input})=>window.workshopTools[name].execute(input),{name,input});
async function add(cell){for(const [i,a] of ['x','y','z'].entries())await page.locator(`#coord-${a}`).selectOption({value:String(cell[i])});await page.locator('#place-cube').click();}
try{
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.evaluate(()=>document.fonts.ready);
 ok((await page.locator('#mission').innerText()).includes('You can rotate the 3d model on the left!'),'Requested Explore copy');
 ok((await page.locator('body').evaluate(e=>getComputedStyle(e).fontFamily)).includes('Comic Sans'),'Comic Sans first in font stack');
 await page.screenshot({path:path.join(output,'learn-desktop.png'),fullPage:true});
 await page.locator('[data-mode=build]').click();ok((await page.locator('#mission').innerText()).includes('green + Add Cube'),'Guided build-specific instruction');
 await add([1,0,1]);const count=await page.locator('#cube-count').innerText();await page.locator('[data-tool=rotate]').click();
 const canvas=page.locator('#scene'),box=await canvas.boundingBox();await canvas.click({position:{x:box.width/2,y:box.height/2}});ok(await page.locator('#cube-count').innerText()===count,'Rotate click cannot edit');
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+90,box.y+box.height/2+35,{steps:8});await page.mouse.up();ok(await page.locator('[data-view][aria-pressed=true]').count()===0,'Rotate drag changes camera');
 for(const target of [true,false])for(const outline of [true,false]){
  for(const [id,want] of [['target-toggle',target],['overlay',outline]])if((await page.locator('#'+id).getAttribute('aria-pressed'))!==String(want))await page.locator('#'+id).click();
  ok((await page.locator('#view-front rect[fill="#bbdfd5"]').count()>0)===target,'Target visibility independent');
  ok((await page.locator('#view-front path[stroke="#bc6710"]').count()>0)===outline,'Outline visibility independent');
 }
 // A child definition stays open beside its parent, with keyboard escape returning focus.
 await page.locator('#mission [data-term=model]').first().click();ok(await page.locator('.term-card').count()===1,'Term opens definition');
 await page.locator('.term-card [data-term=width]').first().click();ok(await page.locator('.term-card').count()===2,'Nested definition preserves parent');
 await page.screenshot({path:path.join(output,'nested-reference.png'),fullPage:true});
 await page.keyboard.press('Escape');ok(await page.locator('.term-card').count()===1,'Escape closes one level');
 await page.locator('.term-card .reference-link').click();ok(await page.locator('#reference').evaluate(e=>e.open),'Reference opens from tooltip');
 await page.locator('#reference-search').fill('zoom');ok(await page.locator('#reference-zoom').count()===1,'Reference searches digital terms');await page.locator('#reference-close').click();
 await page.locator('[data-workshop=free]').click();ok(await page.locator('#cube-count').innerText()==='0 cubes','Free construction separate');await add([0,0,0]);await add([0,1,0]);ok(await page.locator('#view-front rect[fill="#bbdfd5"]').count()===2,'Free drawings update live');
 await page.locator('#primary-action').click();ok(await page.locator('#completion').isHidden(),'Free mode does not award a challenge win');
 await page.locator('[data-workshop=learn]').click();await page.locator('[data-mode=build]').click();ok(await page.locator('#cube-count').innerText()===count,'Lesson construction preserved');
 await page.locator('[data-workshop=free]').click();ok(await page.locator('#cube-count').innerText()==='2 cubes','Free construction preserved');
 await page.locator('[data-workshop=challenge]').click();ok(await page.locator('.mode-tabs').isHidden(),'Challenge hides target-revealing lesson tabs');
 const blocked=await call('start_multiview_challenge',{challenge:1,mode:'explore'}).then(()=>false,()=>true);ok(blocked,'Unsolved challenge cannot reveal model through shared action');
 // Skip to the final puzzle: this must not claim every activity was completed.
 await page.locator('#levels button').last().click();for(const cell of levels[5].cubes)await add(cell);await page.locator('#primary-action').click();
 ok((await page.locator('#completion-title').innerText())==='Final Puzzle Solved!','Final puzzle celebrates without false whole-game completion');
 await page.locator('#primary-action').click();ok((await page.locator('#completion-detail').innerText()).includes('1 of 6'),'Final exploration retains accurate progress');
 await page.screenshot({path:path.join(output,'final-model.png'),fullPage:true});
 await page.locator('#primary-action').click();await page.locator('[data-mode=predict]').click();
 const correct=await page.evaluate(async()=>{const {predictionOptions,levels}=await import('./logic.mjs');return predictionOptions(levels[0].cubes,'front',0).findIndex(c=>c.correct);});await page.locator('#prediction-choices button').nth(correct).click();await page.locator('#primary-action').click();
 await page.locator('#reset').click();for(const cell of levels[0].cubes)await add(cell);await page.locator('#primary-action').click();ok(await page.locator('#completion').isVisible(),'Guided lesson can finish');
 for(let n=1;n<5;n++){await page.locator('#primary-action').click();for(const cell of levels[n].cubes)await add(cell);await page.locator('#primary-action').click();ok(await page.locator('#completion').isVisible(),`Puzzle ${n} solved via coordinate controls`);}
 await page.locator('#primary-action').click();await page.locator('#primary-action').click();ok(await page.locator('#completion-title').innerText()==='Every Mystery Solved!','All activities earn whole-game completion');
 await page.setViewportSize({width:390,height:844});await page.locator('[data-workshop=learn]').click();await page.locator('[data-mode=build]').click();await page.screenshot({path:path.join(output,'build-phone.png'),fullPage:true});
 ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Phone has no horizontal overflow');
 await page.locator('#mission [data-term=model]').first().tap({force:true}).catch(()=>page.locator('#mission [data-term=model]').first().click());
 const rect=await page.locator('.term-card').first().boundingBox();ok(rect.x>=0&&rect.x+rect.width<=390,'Phone definition fits viewport');
 await page.keyboard.press('Escape');await page.emulateMedia({reducedMotion:'reduce'});ok(await page.locator('#completion').evaluate(e=>getComputedStyle(e).animationName)==='none','Reduced-motion celebration disabled');
 // Exercise real touch events in a touch-enabled phone context.
 const touch=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 touch.on('pageerror',e=>errors.push(e.message));await touch.goto(`http://127.0.0.1:${server.address().port}`);
 await touch.locator('#mission [data-term=model]').first().tap();ok(await touch.locator('.term-card').count()===1,'Touch opens a definition');
 await touch.locator('.term-card [data-term=width]').first().tap();ok(await touch.locator('.term-card').count()===2,'Touch opens nested definition');
 await touch.locator('.term-card').last().locator('.reference-link').tap();ok(await touch.locator('#reference').evaluate(e=>e.open),'Touch opens reference');
 await touch.close();
 await page.locator('[data-tool=rotate]').focus();await page.keyboard.press('Alt+ArrowDown');ok(await page.locator('.term-card').count()===1,'Action control supports keyboard definition');await page.keyboard.press('Escape');
 ok(errors.length===0,`No page errors: ${errors.join('; ')}`);
 const buildId=await page.locator('#build-identity').innerText();await fs.writeFile(path.join(output,'browser-results.json'),JSON.stringify({assertions,errors,buildId,viewports:['1440x1050','390x844'],status:'passed'},null,2)+'\n');console.log(`${assertions} browser assertions passed. Build: ${buildId}`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
