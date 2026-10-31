const DIFFS=["EASY","MEDIUM","HARD"];
const COLORS=["blue","red","yellow","green","pink","orange"];
function getDiff(){return Number(localStorage.getItem("nb-difficulty")||0)}
function setDiff(v){localStorage.setItem("nb-difficulty",String(v))}
function keyFor(d){return "nb-progress-"+d}
function getProgress(d=getDiff()){try{return JSON.parse(localStorage.getItem(keyFor(d)))||{unlocked:1,done:[]}}catch(e){return {unlocked:1,done:[]}}}
function saveProgress(p,d=getDiff()){localStorage.setItem(keyFor(d),JSON.stringify(p))}
function startLevel(level){location.href="game.html?d="+getDiff()+"&l="+level}
function qs(name,def){return new URLSearchParams(location.search).get(name)??def}
document.addEventListener("DOMContentLoaded",()=>{
 const range=document.getElementById("difficulty");
 if(range){range.value=getDiff();const names=["EASY","MEDIUM","HARD"],icons=["●","◉","✹"],colors=["#159b43","#ffb51b","#f04b54"];
 const update=()=>{let v=+range.value;setDiff(v);document.getElementById("diffName").textContent=names[v];document.getElementById("diffName").style.color=colors[v];document.getElementById("diffIcon").textContent=icons[v];document.getElementById("diffIcon").style.background=colors[v]};
 range.addEventListener("input",update);update();
 document.getElementById("play").onclick=()=>location.href="levels.html";
 document.getElementById("help").onclick=()=>{document.getElementById("infoTitle").textContent="HOW TO PLAY";document.getElementById("infoModal").classList.remove("hidden")};
 document.getElementById("settings").onclick=()=>{document.getElementById("infoTitle").textContent="SETTINGS";document.getElementById("infoText").textContent="Your level progress is stored only in this browser on this phone. Clearing browser data will reset it.";document.getElementById("infoModal").classList.remove("hidden")};
 document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>document.getElementById("infoModal").classList.add("hidden"));
 }
});
