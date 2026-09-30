import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(process.env.GAME_DIRECTORY||'dist');
const output=path.resolve(process.env.EVIDENCE_DIRECTORY||'test-results/controls');
await fs.mkdir(output,{recursive:true});
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const file=path.resolve(root,'.'+decodeURIComponent(url.pathname)+(url.pathname.endsWith('/')?'index.html':''));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 try{const bytes=await fs.readFile(file);res.setHeader('Content-Type',file.endsWith('.js')||file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(bytes);}catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
page.setDefaultTimeout(8000);
const checks=[],errors=[];let activePage=page;
page.on('pageerror',e=>errors.push(e.message));
const ok=(value,label)=>{assert(value,label);checks.push(label);};
const settle=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const open=async(p,name)=>{if(await p.locator(`#${name}-toggle`).getAttribute('aria-expanded')==='false')await p.locator(`#${name}-toggle`).click();await settle(p);};
const collapse=async p=>{for(const name of ['workshop','drawings'])if(await p.locator(`#${name}-toggle`).getAttribute('aria-expanded')==='true')await p.locator(`#${name}-toggle`).click();await settle(p);};
const color=p=>p.locator('[data-tool]').evaluateAll(bs=>bs.map(b=>getComputedStyle(b).backgroundColor));
async function selected(p,tool,label){
 ok(await p.locator('[data-tool][aria-pressed=true]').count()===1,`${label}: exactly one editing tool selected`);
 ok(await p.locator(`[data-tool=${tool}]`).getAttribute('aria-pressed')==='true',`${label}: ${tool} remains selected`);
 ok(await p.locator(`[data-tool=${tool}] .tool-check`).evaluate(e=>getComputedStyle(e).visibility)==='visible',`${label}: selection includes a visible checkmark`);
}
async function cubePoint(p){
 await p.locator('[data-view=top]').click();await settle(p);
 return p.evaluate(()=>{
  const c=document.querySelector('#scene'),f=document.querySelector('#scene-focus-area').getBoundingClientRect(),ctx=c.getContext('2d'),ratio=c.width/c.clientWidth;
  // The top of the cube at 0,0,0 has this color; choose an interior pixel.
  for(let y=f.top+10;y<f.bottom-10;y++)for(let x=f.left+10;x<f.right-10;x++){
   const d=ctx.getImageData(Math.round(x*ratio),Math.round(y*ratio),1,1).data;
   if(d[0]===142&&d[1]===248&&d[2]===217)return{x:x+3,y:y+3};
  }return null;
 });
}
try{
 const url=`http://127.0.0.1:${server.address().port}`;
 await page.goto(url);await page.evaluate(()=>document.fonts.ready);
 ok(await page.locator('.panel-switcher').count()===0,'Separate panel toolbar removed');
 for(const name of ['workshop','drawings'])ok(await page.locator(`#${name}-panel > .panel-heading #${name}-toggle`).count()===1,`${name}: collapse control belongs to panel header`);
 const before=await page.locator('#scene-focus-area').boundingBox();
 await page.locator('#workshop-toggle').focus();await page.keyboard.press('Enter');
 ok(await page.locator('#workshop-body').isHidden(),'Keyboard collapses Workshop content');
 ok(await page.locator('#workshop-toggle').evaluate(e=>e===document.activeElement),'Collapse keeps focus on available header');
 await page.keyboard.press('Space');ok(await page.locator('#workshop-body').isVisible(),'Keyboard expands Workshop content');
 await collapse(page);const after=await page.locator('#scene-focus-area').boundingBox();
 ok(after.width>before.width,'Collapsing both desktop panels expands model framing');
 await page.screenshot({path:path.join(output,'collapsed-desktop.png')});
 await open(page,'workshop');await open(page,'drawings');
 await page.locator('[data-workshop=free]').click();
 await selected(page,'add','Initial state');await settle(page);await page.waitForTimeout(180);const addColors=await color(page);
 await page.locator('[data-tool=remove]').click();await page.waitForTimeout(180);await selected(page,'remove','Remove chosen');const removeColors=await color(page);
 ok(addColors[0]===removeColors[1]&&addColors[1]===removeColors[0]&&addColors[0]!==addColors[1],'Add and Remove share matching active and inactive colors');
 await page.locator('#place-cube').click();await page.locator('#reset').click();await selected(page,'remove','Reset');await page.locator('#undo').click();await selected(page,'remove','Undo');
 await page.locator('#reset').click();
 const fullscreen=page.locator('#fullscreen-toggle');
 ok(await fullscreen.isVisible(),'Supported browser exposes Full Screen');
 const buildId=await page.locator('#build-identity').innerText();
 await fullscreen.click();await page.waitForFunction(()=>Boolean(document.fullscreenElement));
 ok(await fullscreen.getAttribute('aria-label')==='Exit Full Screen','Entering fullscreen updates control');
 await page.locator('#reference-open').click();ok(await page.locator('#reference').evaluate(e=>e.open),'Reference remains usable in fullscreen');await page.locator('#reference-close').click();
 await page.screenshot({path:path.join(output,'fullscreen-desktop.png')});
 await fullscreen.click();await page.waitForFunction(()=>!document.fullscreenElement);
 await fullscreen.focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>Boolean(document.fullscreenElement));
 await page.evaluate(()=>document.exitFullscreen());await page.waitForFunction(()=>document.querySelector('#fullscreen-toggle').getAttribute('aria-pressed')==='false');
 ok(await fullscreen.getAttribute('aria-label')==='Enter Full Screen','Browser-driven fullscreen exit restores control state');
 ok(await page.locator('#build-identity').innerText()===buildId,'Fullscreen preserves build identity');
 for(const touch of [false,true]){
  const p=touch?await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}):page;activePage=p;
  if(touch){p.setDefaultTimeout(8000);p.on('pageerror',e=>errors.push(e.message));await p.goto(url);await p.evaluate(()=>document.fonts.ready);}
  const session=touch?await p.context().newCDPSession(p):null;
  for(const mode of ['free','learn','challenge']){
   await p.locator(`[data-workshop=${mode}]`).click();await open(p,'workshop');if(mode==='learn')await p.locator('[data-mode=build]').click();
   await selected(p,'add',`${touch?'Touch':'Mouse'} ${mode} start`);
   await p.locator('#place-cube').click();
   for(const tool of ['add','remove']){
    await open(p,'workshop');await p.locator(`[data-tool=${tool}]`).click();await collapse(p);
    const point=await cubePoint(p);ok(Boolean(point),`${mode} ${tool}: visible cube face found`);
    if(touch){
     await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
     for(let i=1;i<=8;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x+i*8,y:point.y+i*3}]});
     await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    }else{await p.mouse.move(point.x,point.y);await p.mouse.down();await p.mouse.move(point.x+64,point.y+24,{steps:8});await p.mouse.up();}
    ok(await p.locator('#cube-count').innerText()==='1 cube',`${touch?'Touch':'Mouse'} ${mode} ${tool}: drag releases without editing`);
    ok(await p.locator('[data-view][aria-pressed=true]').count()===0,`${mode} ${tool}: drag rotates camera`);
    await selected(p,tool,`${mode} after rotation`);
    const click=await cubePoint(p);if(touch)await p.touchscreen.tap(click.x,click.y);else await p.mouse.click(click.x,click.y);
    ok(await p.locator('#cube-count').innerText()===(tool==='add'?'2 cubes':'0 cubes'),`${touch?'Touch':'Mouse'} ${mode}: deliberate ${tool} edits exactly once`);
    await open(p,'workshop');await p.locator('#undo').click();
   }
   if(touch){
    await p.screenshot({path:path.join(output,`${mode}-phone.png`)});
    await p.locator('#drawings-toggle').tap();ok(await p.locator('#workshop-body').isHidden()&&await p.locator('#drawings-body').isVisible(),`${mode}: phone headers switch panels`);
    await p.locator('#drawings-toggle').tap();ok(await p.locator('#drawings-body').isHidden()&&await p.locator('#workshop-toggle').isVisible(),`${mode}: collapsed phone panels stay reachable`);
   }
  }
  if(touch){await session.detach();activePage=page;await p.close();}
 }
 // A rejected request leaves gameplay and the fullscreen state intact.
 const denied=await browser.newPage();activePage=denied;await denied.addInitScript(()=>document.documentElement.requestFullscreen=()=>Promise.reject(new Error('Unavailable')));await denied.goto(url);
 await denied.locator('#fullscreen-toggle').click();ok(await denied.locator('#fullscreen-status').isVisible(),'Denied fullscreen request has readable feedback');ok(await denied.locator('#fullscreen-toggle').getAttribute('aria-pressed')==='false','Denied request never claims fullscreen is active');
 await denied.locator('[data-workshop=free]').click();await denied.locator('#place-cube').click();ok(await denied.locator('#cube-count').innerText()==='1 cube','Gameplay remains usable after fullscreen denial');activePage=page;await denied.close();
 const unsupported=await browser.newPage();activePage=unsupported;await unsupported.addInitScript(()=>Object.defineProperty(document,'fullscreenEnabled',{get:()=>false}));await unsupported.goto(url);ok(await unsupported.locator('#fullscreen-toggle').isHidden(),'Unsupported browser does not offer a broken fullscreen control');activePage=page;await unsupported.close();
 ok(errors.length===0,`No page errors: ${errors.join('; ')}`);
 await fs.writeFile(path.join(output,'controls-results.json'),JSON.stringify({status:'passed',assertions:checks.length,checks,errors,buildId},null,2)+'\n');console.log(`${checks.length} controls assertions passed. Build: ${buildId}`);
}catch(error){await activePage.screenshot({path:path.join(output,'failure.png')});await fs.writeFile(path.join(output,'failure.json'),JSON.stringify({message:error.message,checks,errors},null,2));throw error;}
finally{await browser.close();await new Promise(r=>server.close(r));}
