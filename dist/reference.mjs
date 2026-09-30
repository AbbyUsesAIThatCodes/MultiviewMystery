import {placeTooltip} from './tooltip-layout.mjs';
// Original classroom definitions; this is a local reference, not an official PLTW glossary.
export const terms = [
 {id:'multiview',title:'Multiview Drawing',aliases:['multiview drawing','multiview','three views'],category:'Drawing',definition:'A set of flat drawings showing the same model from different directions. The top view, front view, and right view work together to describe its shape.',example:'Use all three drawings before deciding where to add a cube.'},
 {id:'model',title:'3D Model',aliases:['3d model','models','model'],category:'Modeling',definition:'A representation of an object with width, height, and depth. In this workshop, cubes form the model.',example:'Turning the view changes how you see the model; it does not move cubes to new grid positions.'},
 {id:'top',title:'Top View',aliases:['top view','top'],category:'Drawing',definition:'An orthographic view looking straight down. It shows width and depth.',example:'The top drawing sits above the front drawing.'},
 {id:'front',title:'Front View',aliases:['front view','front'],category:'Drawing',definition:'An orthographic view looking straight at the chosen front of the model. It shows width and height.',example:'The amber edge and Front label mark this direction on the base.'},
 {id:'right',title:'Right View',aliases:['right view','right'],category:'Drawing',definition:'An orthographic view looking straight at the right side. It shows depth and height.',example:'This drawing sits to the right of the front drawing.'},
 {id:'orthographic',title:'Orthographic View',aliases:['orthographic view','orthographic'],category:'Drawing',definition:'A straight-on drawing made with parallel projection lines. A surface facing the viewer is shown without perspective shrinking.',example:'Top, front, and right are the three orthographic views used here.'},
 {id:'isometric',title:'Isometric View',aliases:['isometric view','isometric'],category:'Drawing',definition:'A 3D drawing direction in which the three main axes are equally foreshortened. It lets you see three sides at once.',example:'Choose 3D to return to the isometric camera position.'},
 {id:'width',title:'Width',aliases:['width'],category:'Dimensions',definition:'The left-to-right dimension in the front view. Width is shared by the top and front drawings.',example:'Compare the horizontal extent of those two drawings.'},
 {id:'height',title:'Height',aliases:['heights','height'],category:'Dimensions',definition:'The bottom-to-top dimension. Height is shared by the front and right drawings.',example:'Height 1 places a cube on the base.'},
 {id:'depth',title:'Depth',aliases:['depths','depth'],category:'Dimensions',definition:'The back-to-front dimension. Depth is shared by the top and right drawings.',example:'In this workshop, Depth 1 is the back row.'},
 {id:'outline',title:'Outline',aliases:['outside outline','outline'],category:'Drawing',definition:'The outside boundary of the object in a particular view. Visible edges inside that boundary may also be needed to describe its shape.',example:'Two models can share an outline but have different visible inside edges.'},
 {id:'edge',title:'Visible Edge',aliases:['visible inside edges','visible edges','visible edge','inside edges','edges','edge'],category:'Drawing',definition:'A line you can see where a surface ends or its depth changes in a view. This workshop hides seams between cubes whose faces lie in the same plane.',example:'A taller column beside a shorter one can create an inside edge in the top view.'},
 {id:'hidden',title:'Hidden Edge',aliases:['hidden edges','hidden edge'],category:'Drawing',definition:'An edge blocked from view by part of an object. Technical drawings often use dashed lines for hidden edges; these puzzles do not require them.',example:'The faint dashed lines on the orientation icon explain its shape, not a puzzle requirement.'},
 {id:'cube',title:'Cube',aliases:['cubes','cube'],category:'Modeling',definition:'A solid with six equal square faces. Cubes are the building blocks in this workshop.',example:'Choose + Add Cube, then click the base or a visible cube face.'},
 {id:'face',title:'Face',aliases:['faces','face'],category:'Modeling',definition:'A flat surface of a solid. Each cube has six square faces.',example:'Clicking an exposed face adds a neighboring cube on that side.'},
 {id:'column',title:'Column',aliases:['columns','column'],category:'Modeling',definition:'A vertical stack of cubes at one width and depth position. Every cube above the base needs support directly below it.',example:'Column 1 is the leftmost grid position in the front view.'},
 {id:'footprint',title:'Footprint',aliases:['footprint'],category:'Modeling',definition:'The area a model covers on the base when viewed from above.',example:'Use the top view to plan the footprint before adding height.'},
 {id:'projection',title:'Projection',aliases:['projections','projection'],category:'Drawing',definition:'A way to represent a 3D model on a flat drawing surface from a chosen direction.',example:'Changing the camera does not change the fixed top, front, and right projections.'},
 {id:'rotate',title:'Rotate',aliases:['rotating','rotate','rotation'],category:'Digital Tools',definition:'Turn the viewing direction around the model. Cube positions and the fixed drawing directions stay the same.',example:'Drag, use arrow keys, or choose a named camera view. Rotate View prevents click edits.'},
 {id:'zoom',title:'Zoom',aliases:['zoom'],category:'Digital Tools',definition:'Make the model look larger or smaller on screen without changing its actual dimensions.',example:'Use + and − beside the model or scroll over it.'},
 {id:'undo',title:'Undo',aliases:['undo'],category:'Digital Tools',definition:'Reverse the most recent cube edit in the current activity.',example:'Reset can also be reversed with Undo.'},
 {id:'target',title:'Target',aliases:['target'],category:'Digital Tools',definition:'The drawings you are trying to match in a build challenge. A successful construction matches all three drawings and follows the build rules.',example:'Show My Target controls whether the green target drawings are visible.'},
 {id:'prediction',title:'Prediction',aliases:['prediction','predict'],category:'Learning',definition:'A reasoned choice about what you expect before checking. Use what you know about the model and its views.',example:'Choose the drawing you expect to see from the named direction.'}
];
const byId=new Map(terms.map(t=>[t.id,t]));
const aliases=terms.flatMap(t=>t.aliases.map(a=>[a,t.id])).sort((a,b)=>b[0].length-a[0].length);
const lookup=new Map(aliases);
const pattern=new RegExp(`(?<![\w-])(${aliases.map(([a])=>a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')})(?![\w-])`,'gi');
let stack=[],serial=0,hoverTimer,leaveTimer,leaveIndex=null;
let modality='mouse',pointer=null,suppressedTrigger=null;
const HOVER_DELAY=220,LEAVE_DELAY=300,FADE_DURATION=120;
const ACTION_SELECTOR='button:not(.term),a[href],input,select,textarea,summary,[role="button"]:not(.term)';
const reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const termAt=target=>{const term=target?.closest?.('.term[data-term]');return term&&!term.closest(ACTION_SELECTOR)?term:null;};
export function decorateVocabulary(root,excludeId=null){
 if(!root)return;
 // A reused action button may still have a vocabulary tag from an earlier label.
 // Strip that old annotation; action controls never become definition triggers.
 const controls=[...root.querySelectorAll(ACTION_SELECTOR)];
 if(root.matches?.(ACTION_SELECTOR))controls.push(root);
 for(const control of controls){
  if(control.dataset.term||control.classList.contains('vocab-control')){
   delete control.dataset.term;control.classList.remove('vocab-control');control.removeAttribute('aria-description');
   if(control.getAttribute('aria-controls')?.startsWith('term-card-')){control.removeAttribute('aria-controls');control.removeAttribute('aria-expanded');control.removeAttribute('aria-haspopup');}
  }
 }
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement?.closest('button,input,select,textarea,a[href],summary,[role=button],script,style,svg,canvas,.term-card h3,.reference-entry h3,#build-identity')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 for(const node of nodes){const text=node.nodeValue;pattern.lastIndex=0;const parts=[...text.matchAll(pattern)].filter(m=>lookup.get(m[0].toLowerCase())!==excludeId);if(!parts.length)continue;const fragment=document.createDocumentFragment();let end=0;for(const m of parts){fragment.append(text.slice(end,m.index));const b=document.createElement('button');b.type='button';b.className='term';b.dataset.term=lookup.get(m[0].toLowerCase());b.textContent=m[0];b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-label',`${m[0]}: definition`);fragment.append(b);end=m.index+m[0].length;}fragment.append(text.slice(end));node.replaceWith(fragment);}
}
function cancelHover(){clearTimeout(hoverTimer);hoverTimer=null;}
function cancelLeave(){clearTimeout(leaveTimer);leaveTimer=null;leaveIndex=null;}
function closeFrom(index,restore=false){
 cancelHover();cancelLeave();
 const removed=stack.splice(index);
 for(const {trigger,card} of removed){
  trigger.setAttribute('aria-expanded','false');trigger.removeAttribute('aria-controls');
  card.classList.remove('is-visible');card.classList.add('is-closing');card.inert=true;card.setAttribute('aria-hidden','true');
  if(reducedMotion())card.remove();else setTimeout(()=>card.remove(),FADE_DURATION);
 }
 if(restore&&removed[0]?.trigger.isConnected){suppressedTrigger=removed[0].trigger;removed[0].trigger.focus({preventScroll:true});}
}
function familyIndex(target){
 for(let i=stack.length-1;i>=0;i--)if(stack[i].card.contains(target)||stack[i].trigger.contains(target))return i;
 return -1;
}
function retainFamily(target){
 const index=familyIndex(target)+1;
 if(index>=stack.length){cancelLeave();return;}
 if(leaveIndex===index)return;
 cancelLeave();leaveIndex=index;
 leaveTimer=setTimeout(()=>{
  leaveTimer=null;leaveIndex=null;
  const current=modality==='keyboard'?document.activeElement:pointer?document.elementFromPoint(pointer.x,pointer.y):null;
  const keep=familyIndex(current)+1;
  if(keep<stack.length)closeFrom(keep);
 },LEAVE_DELAY);
}
function visibleRect(element){
 const r=element.getBoundingClientRect();
 if(!r.width||!r.height||r.bottom<=0||r.top>=innerHeight||r.right<=0||r.left>=innerWidth)return null;
 if(getComputedStyle(element).visibility==='hidden'||element.closest('[hidden]'))return null;
 const clipped={left:Math.max(0,r.left),top:Math.max(0,r.top),right:Math.min(innerWidth,r.right),bottom:Math.min(innerHeight,r.bottom)};
 for(let parent=element.parentElement;parent;parent=parent.parentElement){
  const style=getComputedStyle(parent),box=parent.getBoundingClientRect();
  if(/auto|scroll|hidden|clip/.test(style.overflowX)){clipped.left=Math.max(clipped.left,box.left);clipped.right=Math.min(clipped.right,box.right);}
  if(/auto|scroll|hidden|clip/.test(style.overflowY)){clipped.top=Math.max(clipped.top,box.top);clipped.bottom=Math.min(clipped.bottom,box.bottom);}
 }
 return clipped.right>clipped.left&&clipped.bottom>clipped.top?clipped:null;
}
function place(item,index){
 const {card,trigger}=item,anchor=visibleRect(trigger);
 if(!anchor){closeFrom(index);return;}
 const modal=trigger.closest('dialog[open]');
 const r=modal?.getBoundingClientRect();
 const bounds={left:Math.max(12,r?r.left+8:12),top:Math.max(12,r?r.top+8:12),right:Math.min(innerWidth-12,r?r.right-8:innerWidth-12),bottom:Math.min(innerHeight-12,r?r.bottom-8:innerHeight-12)};
 const scope=modal||document;
 const panels=modal?[]:[...document.querySelectorAll('.floating-panel,.topbar,footer,.orientation,.zoom,.panel-switcher button')].map(visibleRect).filter(Boolean);
 const controls=[...scope.querySelectorAll(ACTION_SELECTOR)].filter(e=>!e.closest('.term-card')).map(visibleRect).filter(Boolean);
 const cards=stack.slice(0,index).map(s=>visibleRect(s.card)).filter(Boolean);
 card.style.width=`${Math.min(330,bounds.right-bounds.left)}px`;
 card.style.maxHeight=`${Math.min(400,bounds.bottom-bounds.top)}px`;
 const box=placeTooltip({bounds,anchor,pointer:item.origin,size:{width:card.offsetWidth,height:Math.min(card.scrollHeight+4,400,bounds.bottom-bounds.top)},panels,cards,controls});
 card.style.left=`${box.left}px`;card.style.top=`${box.top}px`;card.style.width=`${box.width}px`;card.style.maxHeight=`${box.height}px`;
}
function openTerm(trigger,{keyboard=false,touch=false,origin=null}={}){
 const term=byId.get(trigger.dataset.term);
 if(!term||!termAt(trigger))return;
 cancelHover();cancelLeave();
 const parent=trigger.closest('.term-card:not(.is-closing)');
 const index=stack.findIndex(s=>s.card===parent)+1;
 if(stack[index]?.trigger===trigger){if(keyboard)stack[index].card.querySelector('.close-card').focus();return;}
 closeFrom(index);
 const card=document.createElement('section');card.className='term-card';card.id=`term-card-${++serial}`;
 card.setAttribute('role','dialog');card.setAttribute('aria-label',`${term.title} definition`);
 const title=document.createElement('h3');title.textContent=term.title;
 const p=document.createElement('p');p.textContent=term.definition;
 const close=document.createElement('button');close.className='close-card';close.textContent='×';close.setAttribute('aria-label',`Close ${term.title} definition`);close.onclick=()=>closeFrom(index,true);
 const ref=document.createElement('button');ref.className='reference-link';ref.textContent='Open In Reference →';ref.onclick=()=>openReference(term.id);
 const hint=document.createElement('p');hint.className='term-hint';hint.textContent=touch?'Tap a related term to explore. Tap outside or × to close.':'Move between the term and its definitions to keep them open. Esc closes one card.';
 card.append(close,title,p,ref,hint);decorateVocabulary(p,term.id);
 (trigger.closest('dialog[open]')||document.body).append(card);
 trigger.setAttribute('aria-expanded','true');trigger.setAttribute('aria-controls',card.id);
 const item={card,trigger,origin};stack.push(item);place(item,index);
 // Force the initial opacity to be painted before applying the short fade.
 void card.offsetWidth;requestAnimationFrame(()=>{if(stack.includes(item))card.classList.add('is-visible');});
 if(keyboard)close.focus({preventScroll:true});
}
function reflow(start=0){
 for(let i=start;i<stack.length;i++){
  const item=stack[i];
  if(!item.trigger.isConnected||!visibleRect(item.trigger)){closeFrom(i);break;}
  const scroller=item.trigger.closest('.panel-content,.views-panel');
  if(scroller){const a=item.trigger.getBoundingClientRect(),b=scroller.getBoundingClientRect();if(a.bottom<=b.top||a.top>=b.bottom){closeFrom(i);break;}}
  place(item,i);
 }
}
function renderReference(query=''){const root=document.getElementById('reference-entries');root.replaceChildren();for(const term of terms.filter(t=>`${t.title} ${t.category} ${t.definition} ${t.aliases.join(' ')}`.toLowerCase().includes(query.toLowerCase()))){const entry=document.createElement('article');entry.id=`reference-${term.id}`;entry.className='reference-entry';entry.tabIndex=-1;const h=document.createElement('h3');h.textContent=term.title;const p=document.createElement('p');p.textContent=term.definition;const e=document.createElement('p');e.textContent=`In This Workshop: ${term.example}`;entry.append(h,p,e);decorateVocabulary(entry,term.id);root.append(entry);}if(!root.children.length)root.textContent='No matching terms. Try another word.';}
function openReference(id){closeFrom(0);const dialog=document.getElementById('reference');document.getElementById('reference-search').value='';renderReference();if(!dialog.open)dialog.showModal();if(id){const entry=document.getElementById(`reference-${id}`);entry.focus();entry.scrollIntoView({block:'center'});}else document.getElementById('reference-search').focus();}
export function initReference(){
 document.getElementById('reference-open').onclick=()=>openReference();
 document.getElementById('reference-close').onclick=()=>{closeFrom(0);document.getElementById('reference').close();};
 document.getElementById('reference-search').addEventListener('input',e=>{closeFrom(0);renderReference(e.target.value);});
 const enterMouseTarget=e=>{
  modality='mouse';pointer={x:e.clientX,y:e.clientY};
  const term=termAt(e.target);
  if(suppressedTrigger&&!suppressedTrigger.contains(e.target))suppressedTrigger=null;
  if(e.target.closest?.(ACTION_SELECTOR)&&!e.target.closest('.term-card')){closeFrom(0);return;}
  retainFamily(e.target);
  if(term&&term!==suppressedTrigger&&!term.contains(e.relatedTarget)){
   cancelHover();hoverTimer=setTimeout(()=>{
    if(term.isConnected&&term.contains(document.elementFromPoint(pointer.x,pointer.y)))openTerm(term,{origin:{...pointer}});
   },HOVER_DELAY);
  }
 };
 document.addEventListener('pointerover',e=>{
  if(e.pointerType!=='touch'&&modality!=='keyboard')enterMouseTarget(e);
 });
 document.addEventListener('pointermove',e=>{
  if(e.pointerType==='touch')return;
  // Layout and focus changes can emit boundary events beneath a stationary mouse.
  // They must not dismiss a definition the student just opened with the keyboard.
  if(modality==='keyboard'){
   if(pointer&&pointer.x===e.clientX&&pointer.y===e.clientY)return;
   enterMouseTarget(e);
  }
  modality='mouse';pointer={x:e.clientX,y:e.clientY};retainFamily(e.target);
 });
 document.addEventListener('pointerout',e=>{
  if(e.pointerType==='touch'||modality==='keyboard')return;
  const term=termAt(e.target);if(term&&!term.contains(e.relatedTarget))cancelHover();
  if(!e.relatedTarget)pointer=null;
  retainFamily(e.relatedTarget);
 });
 document.addEventListener('pointerdown',e=>{
  modality=e.pointerType==='touch'?'touch':'mouse';cancelHover();if(modality==='touch')cancelLeave();
  if(familyIndex(e.target)<0&&!termAt(e.target))closeFrom(0);
 },true);
 document.addEventListener('click',e=>{
  const term=termAt(e.target);
  if(term){openTerm(term,{keyboard:e.detail===0,touch:modality==='touch',origin:modality==='mouse'?{x:e.clientX,y:e.clientY}:null});return;}
  if(!e.target.closest?.('.term-card'))closeFrom(0);
 });
 document.addEventListener('keydown',e=>{
  modality='keyboard';cancelHover();cancelLeave();
  if(e.key==='Escape'&&stack.length){e.preventDefault();e.stopImmediatePropagation();closeFrom(stack.length-1,true);}
 },true);
 document.addEventListener('focusin',e=>{if(modality==='keyboard')retainFamily(e.target);});
 for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('close',()=>closeFrom(0));
 window.addEventListener('resize',()=>reflow());
 window.addEventListener('scroll',e=>{
  // Reading a short card must not resize it and reset its own scroll position.
  // Only its descendants need to follow a trigger moving inside that card.
  const index=stack.findIndex(s=>s.card===e.target);
  reflow(index+1);
 },true);
 new MutationObserver(()=>{const index=stack.findIndex(s=>!s.trigger.isConnected);if(index>=0)closeFrom(index);}).observe(document.body,{childList:true,subtree:true});
}
