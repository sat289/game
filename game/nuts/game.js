(()=>{
const d=Number(qs("d",getDiff())),level=Number(qs("l",1)),capacity=3;
const colors=COLORS.slice(0,[3,4,5][d]);
let stacks=[],history=[],selected=-1,hints=2,extra=0,moving=false;
const board=document.getElementById("board"),toastEl=document.getElementById("toast");
document.getElementById("gameDiff").textContent=DIFFS[d];document.getElementById("gameLevel").textContent="Level "+level;
function toast(s){toastEl.textContent=s;toastEl.classList.add("show");setTimeout(()=>toastEl.classList.remove("show"),1300)}
function makeLevel(){
 // Stable level layouts: a reproducible shuffle for every difficulty and stage.
 let seed=(d+1)*100000+level*7919;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const count=Math.min(3+d+Math.floor((level-1)/12),colors.length);
 let pool=[];for(let c=0;c<count;c++)for(let n=0;n<capacity;n++)pool.push(colors[c]);
 for(let i=pool.length-1;i>0;i--){let j=Math.floor(rand()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
 const boltCount=count+2+Math.min(1,Math.floor(level/20));stacks=Array.from({length:boltCount},()=>[]);
 pool.forEach((c,i)=>stacks[i%count===-1?0:Math.floor(i/capacity)].push(c));
 // Distribute each colour set into mixed stacks, keeping two empty helper bolts.
 stacks=Array.from({length:boltCount},()=>[]);
 pool.forEach(c=>{let choices=stacks.map((s,i)=>({i,n:s.length})).filter(x=>x.n<capacity);let pick=choices[Math.floor(rand()*choices.length)];stacks[pick.i].push(c)});
 history=[];selected=-1;extra=0;render();
}
function nutEl(color){let n=document.createElement("div");n.className="nut "+color;return n}
function render(){
 board.innerHTML="";
 const cols=window.innerWidth>=500?Math.min(5,stacks.length):Math.min(4,stacks.length);
 board.style.gridTemplateColumns=`repeat(${cols},minmax(48px,1fr))`;
 stacks.forEach((stack,i)=>{
  const slot=document.createElement("div");slot.className="bolt-slot"+(!stack.length?" empty":"")+(selected===i?" selected":"");slot.dataset.index=i;
  const base=document.createElement("div");base.className="bolt-base";const shaft=document.createElement("div");shaft.className="bolt-shaft";slot.append(shaft,base);
  stack.forEach((c,j)=>{const n=nutEl(c);n.style.bottom=(13+j*27)+"px";if(j===stack.length-1)n.classList.add("top");slot.appendChild(n)});
  slot.addEventListener("click",()=>tapBolt(i));board.appendChild(slot);
 });
 document.getElementById("undo").disabled=!history.length;
 document.getElementById("hintCount").textContent=hints;
}
function snapshot(){history.push(JSON.stringify(stacks));if(history.length>30)history.shift()}
function tapBolt(i){
 if(moving)return;
 if(selected<0){if(!stacks[i].length)return;selected=i;render();return}
 if(selected===i){selected=-1;render();return}
 const from=stacks[selected],to=stacks[i],color=from[from.length-1];
 if(to.length>=capacity||(to.length&&to[to.length-1]!==color)){selected=i;render();toast(to.length>=capacity?"Bolt is full":"Match the nut colour");return}
 moveNut(selected,i);
}
function moveNut(a,b){
 const fromSlot=board.querySelector(`[data-index="${a}"]`),toSlot=board.querySelector(`[data-index="${b}"]`);
 const source=fromSlot.querySelector(".nut.top");if(!source)return;
 snapshot();selected=-1;moving=true;
 const clone=source.cloneNode(true);clone.classList.add("moving-nut");const r=source.getBoundingClientRect(),dest=toSlot.getBoundingClientRect();
 clone.style.width=r.width+"px";clone.style.height=r.height+"px";clone.style.left=r.left+"px";clone.style.top=r.top+"px";
 document.body.appendChild(clone);
 source.style.visibility="hidden";
 const targetLeft=dest.left+dest.width/2-r.width/2,targetTop=dest.bottom-17-(to.length*27)-r.height;
 const dx=targetLeft-r.left,dy=targetTop-r.top;
 const anim=clone.animate([
  {transform:"translate(0,0) rotate(0deg)"},
  {transform:`translate(${dx*.45}px,${Math.min(-95,dy-65)}px) rotate(380deg)`,offset:.48},
  {transform:`translate(${dx}px,${dy}px) rotate(720deg)`}
 ],{duration:560,easing:"cubic-bezier(.22,.8,.25,1)"});
 anim.onfinish=()=>{clone.remove();from.pop();to.push(source.classList[1]);moving=false;render();if(isWon())showWin()};
}
function isWon(){return stacks.every(s=>!s.length||(s.length===capacity&&s.every(c=>c===s[0])))}
function showWin(){
 const p=getProgress(d);if(!p.done.includes(level))p.done.push(level);p.unlocked=Math.max(p.unlocked,Math.min(60,level+1));saveProgress(p,d);
 document.getElementById("winModal").classList.remove("hidden");
}
document.getElementById("back").onclick=()=>location.href="levels.html";
document.getElementById("reset").onclick=()=>{if(confirm("Restart this level?"))makeLevel()};
document.getElementById("undo").onclick=()=>{if(!history.length)return;stacks=JSON.parse(history.pop());selected=-1;render()};
document.getElementById("hint").onclick=()=>{
 if(!hints){toast("No hints left");return}
 let pair=null;for(let i=0;i<stacks.length;i++)for(let j=0;j<stacks.length;j++)if(i!==j&&stacks[i].length&&stacks[j].length<capacity&&(!stacks[j].length||stacks[j].at(-1)===stacks[i].at(-1))){pair=[i,j];break}
 if(pair){hints--;selected=pair[0];render();const dest=board.querySelector(`[data-index="${pair[1]}"]`);dest.animate([{filter:"brightness(1)"},{filter:"brightness(2)"},{filter:"brightness(1)"}],{duration:700});toast("Move the highlighted nut")}else toast("No move found");
};
document.getElementById("addBolt").onclick=()=>{if(extra>=1){toast("Extra bolt already used");return}snapshot();stacks.push([]);extra++;render();toast("Extra bolt added")};
document.getElementById("next").onclick=()=>{if(level<60)startLevel(level+1);else location.href="levels.html"};
document.getElementById("levels").onclick=()=>location.href="levels.html";
window.addEventListener("resize",render);
makeLevel();
})();