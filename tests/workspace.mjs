import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(process.env.GAME_DIRECTORY||'dist');
const output=path.resolve(process.env.EVIDENCE_DIRECTORY||'test-results/workspace');
await fs.mkdir(output,{recursive:true});
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const file=path.resolve(root,'.'+decodeURIComponent(url.pathname)+(url.pathname.endsWith('/')?'index.html':''));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 try{const bytes=await fs.readFile(file);res.setHeader('Content-Type',file.endsWith('.js')||file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(bytes);}catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1440,height:900},hasTouch:true});
page.setDefaultTimeout(8000);
const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));
const ok=(test,label)=>{assert(test,label);checks.push(label);};
const rect=selector=>page.locator(selector).boundingBox();
const pixels=()=>page.locator('#scene').evaluate(c=>c.toDataURL());
const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
async function show(name){if(await page.locator(`#${name}-toggle`).getAttribute('aria-expanded')==='false')await page.locator(`#${name}-toggle`).click();await settle();}
async function screen(name){await page.evaluate(()=>getSelection()?.removeAllRanges());await page.screenshot({path:path.join(output,name+'.png')});}
async function geometry(label){
 await settle();
 const dims=await page.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight}));
 const c=await rect('#scene');
 ok(c.x===0&&c.y===0&&c.width===dims.width&&c.height===dims.height,`${label}: canvas fills viewport`);
 ok(dims.scrollWidth===dims.width&&dims.scrollHeight===dims.height,`${label}: no document overflow`);
 const frame=await rect('#scene-focus-area');
 ok(frame.width>150&&frame.height>30,`${label}: exposed scene has usable space`);
 for(const selector of ['.topbar','.panel-switcher','.orientation','.zoom','footer']){
  const b=await rect(selector);ok(b.x>=0&&b.y>=0&&b.x+b.width<=dims.width+.5&&b.y+b.height<=dims.height+.5,`${label}: ${selector} within viewport`);
 }
 const orient=await rect('.orientation'),zoom=await rect('.zoom');
 ok(orient.x+orient.width<=zoom.x,`${label}: camera controls do not overlap`);
 for(const selector of ['#workshop-panel','#drawings-panel'])if(await page.locator(selector).isVisible()){
  const p=await rect(selector);ok(p.x>=0&&p.y>=0&&p.x+p.width<=dims.width+.5&&p.y+p.height<=dims.height+.5,`${label}: ${selector} contained`);
  ok(p.y>=frame.y+frame.height||p.x+p.width<=frame.x+.5||p.x>=frame.x+frame.width-.5,`${label}: panel clears model area`);
 }
}
try{
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.evaluate(()=>document.fonts.ready);
 for(const viewport of [{width:1440,height:900},{width:1280,height:720},{width:390,height:844},{width:320,height:568},{width:844,height:390}]){
  await page.setViewportSize(viewport);const size=`${viewport.width}x${viewport.height}`;
  for(const mode of ['free','learn','challenge']){
   await page.locator(`[data-workshop=${mode}]`).click();await show('workshop');
   await geometry(`${size} ${mode}`);
   const text=await page.locator('#mission').innerText();ok(text.length>25,`${size} ${mode}: instructions retained`);
   // Keyboard focus scrolls both independently overflowing panel sections.
   await page.locator('#primary-action').focus();await page.locator('#primary-action').scrollIntoViewIfNeeded();
   const button=await rect('#primary-action'),panel=await rect('#workshop-panel');
   ok(button.y>=panel.y&&button.y+button.height<=panel.y+panel.height+.5,`${size} ${mode}: primary action reachable`);
   if(mode!=='learn'){
    await page.locator('#coord-x').selectOption('0');await page.locator('#coord-y').selectOption('0');await page.locator('#coord-z').selectOption('0');
    await page.locator('#place-cube').click();ok((await page.locator('#cube-count').innerText())==='1 cube',`${size} ${mode}: coordinate controls usable`);
    await page.locator('#undo').click();ok((await page.locator('#cube-count').innerText())==='0 cubes',`${size} ${mode}: undo usable`);
   }
   await page.locator('.panel-content').evaluate(e=>e.scrollTop=0);
   if(viewport.width===1440||viewport.width===390)await screen(`${mode}-${size}-workshop`);
   await show('drawings');await geometry(`${size} ${mode} drawings`);
   for(const view of ['top','front','right']){
    await page.locator(`#view-${view}`).scrollIntoViewIfNeeded();
    const r=await rect(`#view-${view}`),p=await rect('#drawings-panel'),heading=await rect('#drawings-panel>.panel-top');
    // A sticky heading must not cover the drawing being inspected.
    if(r.y<heading.y+heading.height)await page.locator('#drawings-panel').evaluate((e,amount)=>e.scrollTop-=amount,heading.y+heading.height-r.y);
    const visible=await rect(`#view-${view}`);
    ok(visible.y>=heading.y+heading.height-.5&&visible.y+visible.height<=p.y+p.height+.5,`${size} ${mode}: ${view} drawing clears sticky controls`);
    ok(r.y>=p.y&&r.y+r.height<=p.y+p.height+.5,`${size} ${mode}: ${view} drawing reachable`);
   }
   await page.locator('#drawings-panel').evaluate(e=>e.scrollTop=0);
   if(viewport.width===844)await screen(`${mode}-${size}-landscape`);
   if(viewport.width===1440||viewport.width===390)await screen(`${mode}-${size}-drawings`);
   // Wheel and pointer gestures inside a panel must never reach the canvas.
   await page.locator('[data-view=iso]').click();
   const p=await rect('#drawings-panel');await page.mouse.move(p.x+5,p.y+Math.min(80,p.height-5));
   const before=await pixels(),count=await page.locator('#cube-count').innerText();
   await page.mouse.wheel(0,150);await page.mouse.down();await page.mouse.move(p.x+12,p.y+Math.min(100,p.height-5),{steps:5});await page.mouse.up();await settle();
   ok(await pixels()===before,`${size} ${mode}: panel scroll/drag cannot rotate or zoom scene`);
   ok(await page.locator('#cube-count').innerText()===count,`${size} ${mode}: panel gestures cannot edit cubes`);
   // Drawing-panel keyboard scrolling should not rotate a focused scene either.
   await page.locator('#drawings-toggle').focus();await page.keyboard.press('ArrowDown');
   ok(await pixels()===before,`${size} ${mode}: panel key does not rotate scene`);
   const f=await rect('#scene-focus-area');await page.mouse.move(f.x+f.width/2,f.y+f.height/2);
   await page.mouse.down();await page.mouse.move(f.x+f.width/2+45,f.y+f.height/2+12,{steps:8});await page.mouse.up();
   ok(await page.locator('[data-view][aria-pressed=true]').count()===0,`${size} ${mode}: uncovered scene rotates`);
   // Reset away from the zoom ceiling before testing another viewport.
   for(let i=0;i<2;i++)await page.locator('#zoom-out').click();
   await page.mouse.move(f.x+3,f.y+3);const rotated=await pixels();await page.mouse.wheel(0,-100);await settle();
   ok(await pixels()!==rotated,`${size} ${mode}: uncovered scene zooms`);
  }
 }
 // Touch switches panels; closing both expands the model area and preserves state.
 await page.setViewportSize({width:390,height:844});await page.locator('[data-workshop=free]').tap();await show('workshop');
 const withPanel=await rect('#scene-focus-area');await page.locator('#drawings-toggle').tap();
 ok(await page.locator('#workshop-panel').isHidden()&&await page.locator('#drawings-panel').isVisible(),'Touch switches to drawings');
 await page.locator('#drawings-toggle').tap();await settle();
 ok((await rect('#scene-focus-area')).height>withPanel.height,'Closing panels expands scene');
 // Top-view floor and cube share their screen position: a real canvas click adds,
 // then a second click with Remove removes the same visible cube.
 await page.locator('[data-view=top]').tap();await settle();
 const floor=await page.evaluate(()=>{
  const c=document.querySelector('#scene'),f=document.querySelector('#scene-focus-area').getBoundingClientRect(),ctx=c.getContext('2d'),ratio=c.width/c.clientWidth;
  for(let y=f.top+20;y<f.bottom-10;y+=4)for(let x=f.left+10;x<f.right-10;x+=4){const d=ctx.getImageData(Math.round(x*ratio),Math.round(y*ratio),1,1).data;if((d[0]===53&&d[1]===86&&d[2]===96)||(d[0]===48&&d[1]===80&&d[2]===91))return{x,y};}return null;
 });ok(Boolean(floor),'Uncovered floor visible for direct cube placement');
 await page.touchscreen.tap(floor.x,floor.y);ok(await page.locator('#cube-count').innerText()==='1 cube','Touch on scene adds cube');
 await show('workshop');await page.locator('[data-tool=remove]').tap();await page.locator('#workshop-toggle').tap();await settle();
 await page.locator('[data-view=top]').tap();await page.touchscreen.tap(floor.x,floor.y);ok(await page.locator('#cube-count').innerText()==='0 cubes','Touch on scene removes cube');
 // Learn's prediction choices remain in the scrollable workshop panel.
 await page.locator('[data-workshop=learn]').tap();await show('workshop');await page.locator('[data-mode=predict]').tap();
 await page.locator('#prediction-choices button').first().tap();ok(await page.locator('#prediction-panel').isVisible(),'Phone prediction choices usable');await screen('learn-predict-phone');
 // Same artifact must retain its identity across reloads.
 const buildId=await page.locator('#build-identity').innerText();await page.reload();
 ok(await page.locator('#build-identity').innerText()===buildId,'Reload preserves build identity');
 ok(errors.length===0,`No page errors: ${errors.join('; ')}`);
 await fs.writeFile(path.join(output,'workspace-results.json'),JSON.stringify({status:'passed',assertions:checks.length,checks,errors,buildId},null,2)+'\n');console.log(`${checks.length} workspace assertions passed. Build: ${buildId}`);
}catch(error){await screen('failure');await fs.writeFile(path.join(output,'failure.json'),JSON.stringify({message:error.message,checks,errors},null,2));throw error;}
finally{await browser.close();await new Promise(r=>server.close(r));}
