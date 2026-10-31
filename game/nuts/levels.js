document.addEventListener("DOMContentLoaded",()=>{
 const d=getDiff(),p=getProgress(d),grid=document.getElementById("levelGrid");
 document.getElementById("levelDiff").textContent=DIFFS[d];document.getElementById("progress").textContent=p.done.length+" / 60";
 let tab=0;
 function render(){grid.innerHTML="";for(let i=tab*20+1;i<=tab*20+20;i++){
  const b=document.createElement("button"),done=p.done.includes(i),unlocked=i<=p.unlocked;
  b.className="level-tile "+(done?"done":unlocked?"unlocked":"locked");b.innerHTML=(done?"✓":unlocked?i:"🔒")+(done?"<small>DONE</small>":"");
  b.disabled=!unlocked;b.onclick=()=>startLevel(i);grid.appendChild(b);
 }}
 document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=+b.dataset.tab;document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("active",x===b));render()});
 render();
});