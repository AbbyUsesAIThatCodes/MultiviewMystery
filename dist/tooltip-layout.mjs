const area=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

// Prefer a readable card near its origin, outside panels and earlier definitions.
// Small viewports may need a shorter, internally scrollable card. Action controls
// have a much higher avoidance priority than panels or other definitions.
export function placeTooltip({bounds,anchor,pointer,size,panels=[],cards=[],controls=[]}){
 const gap=10,origin=pointer||{x:(anchor.left+anchor.right)/2,y:anchor.bottom};
 const width=Math.min(size.width,bounds.right-bounds.left);
 const height=Math.min(size.height,bounds.bottom-bounds.top);
 const widths=[...new Set([width,Math.min(width,280),Math.min(width,240)])];
 const heights=[...new Set([height,Math.min(height,240),Math.min(height,180),Math.min(height,128)])];
 const obstacles=[...panels,...cards];let best=null;
 for(const w of widths)for(const h of heights){
  const xs=[bounds.left,bounds.right-w,origin.x+gap,origin.x-w-gap,anchor.right+gap,anchor.left-w-gap];
  const ys=[bounds.top,bounds.bottom-h,origin.y+gap,origin.y-h-gap,anchor.bottom+gap,anchor.top-h-gap];
  for(const r of obstacles){xs.push(r.right+gap,r.left-w-gap);ys.push(r.bottom+gap,r.top-h-gap);}
  const lefts=new Set(xs.map(x=>clamp(x,bounds.left,bounds.right-w)));
  const tops=new Set(ys.map(y=>clamp(y,bounds.top,bounds.bottom-h)));
  for(const left of lefts)for(const top of tops){
   const box={left,top,right:left+w,bottom:top+h};
   const protectedArea=[anchor,...controls].reduce((sum,r)=>sum+area(box,r),0);
   const panelArea=panels.reduce((sum,r)=>sum+area(box,r),0);
   const cardArea=cards.reduce((sum,r)=>sum+area(box,r),0);
   const distance=Math.hypot(Math.max(left-origin.x,origin.x-box.right,0),Math.max(top-origin.y,origin.y-box.bottom,0));
   const score=protectedArea*1e8+panelArea*1e4+cardArea*100+(width-w)*12+(height-h)*5+distance;
   if(!best||score<best.score)best={left,top,width:w,height:h,score};
  }
 }
 return best;
}
