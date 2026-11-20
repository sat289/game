import {loadSave,saveGame,clearSave} from "./storage.js";
import {createWorld} from "./world.js";

let save=loadSave();
const $=id=>document.getElementById(id);
const show=id=>$(id).classList.remove("hidden");
const hide=id=>$(id).classList.add("hidden");
function refresh(){
  ["coinsText","hudCoins"].forEach(id=>$(id).textContent=save.coins);
  ["gemsText","hudGems"].forEach(id=>$(id).textContent=save.gems);
  $("levelText").textContent=`LEVEL ${save.level} / 100`;
  $("hudLevel").textContent=save.level;
  $("healthText").textContent=save.health;
  $("garageHealth").textContent=save.health+"%";
  saveGame(save);
}
refresh();
let p=0;
const loader=setInterval(()=>{p=Math.min(100,p+2);$("progressBar").style.width=p+"%";$("progressText").textContent=p+"%";
 if(p===100){clearInterval(loader);hide("splash");show("menu");}},100);

$("resetBtn").onclick=()=>{clearSave();save=loadSave();refresh();};
$("garageBtn").onclick=()=>{hide("menu");show("garage");refresh();};
$("backToMenu").onclick=()=>{hide("garage");show("menu");};
$("repairBtn").onclick=()=>{if(save.coins>=100){save.coins-=100;save.health=100;refresh();$("garageHealth").textContent="100%";}else alert("Not enough coins yet.");};

let world=null, input={gas:false,brake:false,left:false,right:false},running=false;
function hold(id,key){const el=$(id);const on=e=>{e.preventDefault();input[key]=true;};const off=()=>input[key]=false;el.addEventListener("pointerdown",on);["pointerup","pointerleave","pointercancel"].forEach(ev=>el.addEventListener(ev,off));}
hold("gasBtn","gas");hold("brakeBtn","brake");hold("leftBtn","left");hold("rightBtn","right");
$("playBtn").onclick=()=>{
  hide("menu");hide("garage");show("game");
  if(!world)world=createWorld($("world"));
  running=true;animate();
};
$("homeBtn").onclick=()=>{running=false;hide("game");show("menu");};
$("garageReturnBtn").onclick=()=>{running=false;hide("game");show("garage");refresh();};
$("mapBtn").onclick=()=>show("mapPanel");
$("closeMap").onclick=()=>hide("mapPanel");
let lastPickup=0;
function animate(){
  if(!running)return;
  world.update(input,gem=>{
    if(gem)save.gems+=1;else save.coins+=5;
    refresh();
  });
  requestAnimationFrame(animate);
}
