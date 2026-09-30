// Keep the scene full-bleed while reserving a clear area between floating panels.
export function initWorkspace(){
 const workspace=document.getElementById('workspace');
 const compact=matchMedia('(max-width: 1050px)');
 const names=['workshop','drawings'];
 const open={workshop:true,drawings:!compact.matches};
 function render(){
  for(const name of names){
   const body=document.getElementById(`${name}-body`);
   const button=document.getElementById(`${name}-toggle`);
   if(!open[name]&&body.contains(document.activeElement))button.focus({preventScroll:true});
   body.hidden=!open[name];
   document.getElementById(`${name}-panel`).dataset.expanded=String(open[name]);
   button.setAttribute('aria-expanded',String(open[name]));
   button.title=`${open[name]?'Collapse':'Expand'} ${name==='workshop'?'Workshop':'Drawing Board'}`;
   workspace.dataset[`${name}Open`]=String(open[name]);
  }
  workspace.dataset.panelOpen=String(names.some(name=>open[name]));
 }
 for(const name of names){
  document.getElementById(`${name}-toggle`).addEventListener('click',()=>{
   const next=!open[name];
   if(compact.matches)for(const key of names)open[key]=false;
   open[name]=next;render();
  });
 }
 compact.addEventListener('change',()=>{
  // Keep a focused panel available when rotating a tablet or resizing a window.
  const focused=names.find(name=>document.getElementById(`${name}-panel`).contains(document.activeElement));
  if(compact.matches&&open.workshop&&open.drawings)open[focused==='drawings'?'workshop':'drawings']=false;
  render();
 });
 const measureChrome=()=>{
  workspace.style.setProperty('--header-bottom',`${document.querySelector('.topbar').getBoundingClientRect().bottom}px`);
  workspace.style.setProperty('--footer-height',`${document.querySelector('footer').getBoundingClientRect().height}px`);
 };
 const observer=new ResizeObserver(measureChrome);
 observer.observe(document.querySelector('.topbar'));observer.observe(document.querySelector('footer'));
 render();measureChrome();
 initFullscreen();
}

function initFullscreen(){
 const button=document.getElementById('fullscreen-toggle');
 const status=document.getElementById('fullscreen-status');
 const supported=Boolean(document.fullscreenEnabled&&document.documentElement.requestFullscreen);
 button.hidden=!supported;
 let timer;
 const render=()=>{
  const active=Boolean(document.fullscreenElement);
  button.setAttribute('aria-pressed',String(active));
  button.setAttribute('aria-label',active?'Exit Full Screen':'Enter Full Screen');
  button.title=active?'Exit Full Screen':'Enter Full Screen';
  button.querySelector('.fullscreen-label').textContent=active?'Exit Full Screen':'Full Screen';
 };
 button.addEventListener('click',async()=>{
  clearTimeout(timer);status.hidden=true;
  try{
   if(document.fullscreenElement)await document.exitFullscreen();
   else await document.documentElement.requestFullscreen();
  }catch{
   status.textContent='Full screen is unavailable here. Try opening the game in its own browser tab.';
   status.hidden=false;timer=setTimeout(()=>status.hidden=true,6000);
  }
  render();
 });
 document.addEventListener('fullscreenchange',render);
 render();
}
