// Keep the scene full-bleed while reserving a clear area between floating panels.
export function initWorkspace(){
 const workspace=document.getElementById('workspace');
 const compact=matchMedia('(max-width: 1050px)');
 const names=['workshop','drawings'];
 const open={workshop:true,drawings:!compact.matches};
 function render(){
  for(const name of names){
   document.getElementById(`${name}-panel`).hidden=!open[name];
   const button=document.getElementById(`${name}-toggle`);
   button.setAttribute('aria-expanded',String(open[name]));
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
  else if(!compact.matches){open.workshop=true;open.drawings=true;}
  render();
 });
 const measureChrome=()=>{
  workspace.style.setProperty('--header-bottom',`${document.querySelector('.topbar').getBoundingClientRect().bottom}px`);
  workspace.style.setProperty('--footer-height',`${document.querySelector('footer').getBoundingClientRect().height}px`);
 };
 const observer=new ResizeObserver(measureChrome);
 observer.observe(document.querySelector('.topbar'));observer.observe(document.querySelector('footer'));
 render();measureChrome();
}
