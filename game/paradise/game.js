import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const $ = id => document.getElementById(id);
const loading=$("loading"), app=$("app"), menu=$("menu"), pauseMenu=$("pause-menu"), helpMenu=$("help-menu");
const renderer = new THREE.WebGLRenderer({antialias:false, powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.15;
$("game-root").appendChild(renderer.domElement);

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x9bb8b0);
scene.fog=new THREE.Fog(0x9bb8b0,35,145);
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,220);
const hemi=new THREE.HemisphereLight(0xd8eee6,0x4d5540,2.0);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe2b5,2.2);sun.position.set(-25,40,18);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);

const mat=(color,rough=.9)=>new THREE.MeshStandardMaterial({color,roughness:rough});
const groundMat=mat(0x667b55), roadMat=mat(0x9a8c70), wallMat=mat(0xb9a88b), roofMat=mat(0x665044), leafMat=mat(0x315b42), trunkMat=mat(0x59432e), markerMat=new THREE.MeshStandardMaterial({color:0x7dffe0,emissive:0x24b895,emissiveIntensity:2});
const ground=new THREE.Mesh(new THREE.PlaneGeometry(220,220),groundMat);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const road=new THREE.Mesh(new THREE.PlaneGeometry(9,125),roadMat);road.rotation.x=-Math.PI/2;road.position.set(0,.02,-18);scene.add(road);

function box(w,h,d,material,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m}
function tree(x,z,s=1){const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18*s,.28*s,2.3*s,7),trunkMat);trunk.position.set(x,1.15*s,z);trunk.castShadow=true;scene.add(trunk);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.35*s,1),leafMat);crown.position.set(x,2.6*s,z);crown.castShadow=true;scene.add(crown)}
function house(x,z,scale=1){box(5*scale,3.1*scale,4*scale,wallMat,x,1.55*scale,z);const roof=new THREE.Mesh(new THREE.ConeGeometry(3.7*scale,1.8*scale,4),roofMat);roof.rotation.y=Math.PI/4;roof.position.set(x,3.9*scale,z);roof.castShadow=true;scene.add(roof);box(.9*scale,1.7*scale,.12*scale,trunkMat,x,0.85*scale,z+2.06*scale)}
for(let i=0;i<24;i++){let z=-55+i*5.1;tree(-12-(i%3)*2,z,.8+(i%3)*.15);tree(12+(i%4)*1.5,z,1)}
house(-9,-5,1);house(9,-18,.9);house(-10,-31,1.15);house(10,-43,.85);
for(let i=0;i<9;i++){const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.7+Math.random()*.7,0),mat(0x777b70));rock.position.set((Math.random()-.5)*42,.4,-12-Math.random()*65);rock.castShadow=true;scene.add(rock)}

const player=new THREE.Group();scene.add(player);
const bodyMat=mat(0x344c49), skinMat=mat(0xb77d58), pantsMat=mat(0x292f36), hairMat=mat(0x211b18), bootMat=mat(0x171b1b);
function capsule(parent,r,len,material,x,y,z){const m=new THREE.Mesh(new THREE.CapsuleGeometry(r,len,4,8),material);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m}
const torso=new THREE.Group();torso.position.y=1.25;player.add(torso);
capsule(torso,.37,.72,bodyMat,0,.18,0);
const collar=new THREE.Mesh(new THREE.TorusGeometry(.19,.055,6,12),mat(0xb5a68b));collar.position.set(0,.53,0);torso.add(collar);
const headPivot=new THREE.Group();headPivot.position.set(0,.72,0);torso.add(headPivot);
const head=new THREE.Mesh(new THREE.SphereGeometry(.255,14,12),skinMat);head.position.y=.12;head.castShadow=true;headPivot.add(head);
const hair=new THREE.Mesh(new THREE.SphereGeometry(.265,12,10),hairMat);hair.scale.set(1,.58,1);hair.position.set(0,.25,-.015);headPivot.add(hair);
const armPivots=[],legPivots=[];
for(const side of [-1,1]){
 const arm=new THREE.Group();arm.position.set(side*.46,.43,0);torso.add(arm);capsule(arm,.115,.48,bodyMat,0,-.27,0);const hand=new THREE.Mesh(new THREE.SphereGeometry(.105,8,8),skinMat);hand.position.y=-.57;arm.add(hand);armPivots.push(arm);
 const leg=new THREE.Group();leg.position.set(side*.19,-.24,0);player.add(leg);capsule(leg,.14,.55,pantsMat,0,-.34,0);const boot=new THREE.Mesh(new THREE.BoxGeometry(.25,.13,.38),bootMat);boot.position.set(0,-.66,.08);leg.add(boot);legPivots.push(leg);
}
player.position.set(0,0,5);

const defaultMissions=[
 {name:"Old village gate",desc:"Reach the old village gate and speak to the local guide.",pos:new THREE.Vector3(0,0,-12),dialogue:["The valley has changed, but the old gate is still here.","Let's follow the path and see what remains."]},
 {name:"Hilltop lookout",desc:"Follow the path to the lookout.",pos:new THREE.Vector3(8,0,-39),dialogue:["You can see the whole valley from here.","Our next clue is somewhere near the forest."]},
 {name:"Forest clearing",desc:"Find the quiet forest clearing.",pos:new THREE.Vector3(-7,0,-65),dialogue:["We made it. This is only the beginning.","The next chapter will take us beyond the hills."]}
];
const missionPoints=(()=>{try{const saved=JSON.parse(localStorage.getItem("st_paradise_missions"));if(Array.isArray(saved)&&saved.length)return saved.map((m,i)=>({...defaultMissions[i%3],...m,pos:new THREE.Vector3(Number(m.x)||0,0,Number(m.z)||-12)}))}catch(e){}return defaultMissions})();
let marker,objective=0,mode="story",playing=false,paused=false,clock=new THREE.Clock(),yaw=0,move={x:0,y:0},drag=null,velocityY=0,onGround=true;
function setMarker(){if(marker)scene.remove(marker);const p=missionPoints[Math.min(objective,missionPoints.length-1)].pos;marker=new THREE.Group();const ring=new THREE.Mesh(new THREE.TorusGeometry(1.05,.09,8,28),markerMat);ring.rotation.x=Math.PI/2;ring.position.y=.15;marker.add(ring);const beam=new THREE.Mesh(new THREE.CylinderGeometry(.05,.35,3.2,12,1,true),new THREE.MeshBasicMaterial({color:0x7dffe0,transparent:true,opacity:.18,side:THREE.DoubleSide}));beam.position.y=1.7;marker.add(beam);marker.position.copy(p);scene.add(marker)}
setMarker();
function toast(t){const el=$("toast");el.textContent=t;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2400)}
function updateMission(){const p=missionPoints[Math.min(objective,missionPoints.length-1)];$("mission-title").textContent=mode==="free"?"Free roam":p.name;$("progress").textContent=mode==="free"?"Explore freely":`${objective} / ${missionPoints.length} objectives`;if(objective>=missionPoints.length){$("mission-title").textContent="Story chapter complete";$("progress").textContent="3 / 3 objectives";toast("Chapter complete! Explore freely or return to the menu.");if(marker){scene.remove(marker);marker=null}}else setMarker()}
function start(m){mode=m;objective=0;playing=true;paused=false;menu.classList.add("hidden");pauseMenu.classList.add("hidden");helpMenu.classList.add("hidden");$("mode-label").textContent=mode==="story"?"STORY MODE":"FREE ROAM";updateMission();toast(mode==="story"?"Reach the glowing marker to begin.":"Free roam enabled. Explore the valley.");}
function interact(){if(!playing||paused)return;if(mode==="free"){toast("You discovered a location. Story missions are available from the menu.");return}if(objective>=missionPoints.length){toast("Chapter complete.");return}const target=missionPoints[objective].pos;const dist=player.position.distanceTo(target);if(dist<3.8){showDialogue(objective);objective++;updateMission();toast(objective>=missionPoints.length?"Chapter complete!":"Objective complete. Next location marked.");}else toast("Move closer to the glowing marker.");}

// Dialogue foundation: short, skippable story beats after each objective.
const dialogueMenu=$("dialogue-menu");let dialogueQueue=[],dialogueIndex=0;
function showDialogue(missionIndex){const m=missionPoints[missionIndex];if(!m||!m.dialogue)return;dialogueQueue=m.dialogue;dialogueIndex=0;paused=true;$("dialogue-speaker").textContent="TRAVELLER";$("dialogue-line").textContent=dialogueQueue[0];dialogueMenu.classList.remove("hidden")}
$("dialogue-next").onclick=()=>{dialogueIndex++;if(dialogueIndex<dialogueQueue.length){$("dialogue-line").textContent=dialogueQueue[dialogueIndex]}else{dialogueMenu.classList.add("hidden");paused=false}};
const editor=$("editor-menu"),editIndex=$("edit-index");
function fillEditor(){editIndex.innerHTML="";missionPoints.forEach((m,i)=>{const o=document.createElement("option");o.value=i;o.textContent=`${i+1}. ${m.name}`;editIndex.appendChild(o)});loadEditorFields()}
function loadEditorFields(){const m=missionPoints[Number(editIndex.value)||0];if(!m)return;$("edit-title").value=m.name;$("edit-desc").value=m.desc;$("edit-x").value=m.pos.x;$("edit-z").value=m.pos.z}
editIndex.addEventListener("change",loadEditorFields);
$("open-editor").onclick=()=>{menu.classList.add("hidden");editor.classList.remove("hidden");fillEditor()};
$("editor-close").onclick=()=>{editor.classList.add("hidden");menu.classList.remove("hidden")};
$("save-mission").onclick=()=>{const i=Number(editIndex.value),m=missionPoints[i];m.name=$("edit-title").value.trim()||`Mission ${i+1}`;m.desc=$("edit-desc").value.trim();m.pos.set(Number($("edit-x").value)||0,0,Number($("edit-z").value)||0);localStorage.setItem("st_paradise_missions",JSON.stringify(missionPoints.map(x=>({name:x.name,desc:x.desc,x:x.pos.x,z:x.pos.z,dialogue:x.dialogue||[]}))));updateMission();fillEditor();toast("Mission saved on this device.")};
$("export-missions").onclick=()=>{const data=missionPoints.map(x=>({name:x.name,desc:x.desc,x:x.pos.x,z:x.pos.z,dialogue:x.dialogue||[]}));const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="paradise-missions.json";a.click();URL.revokeObjectURL(url)};

function setQuality(q){const ratio=q==="low"?.85:q==="high"?1.7:1.25;renderer.setPixelRatio(Math.min(devicePixelRatio,ratio));sun.castShadow=q!=="low"}
$("quality").addEventListener("change",e=>setQuality(e.target.value));
$("start-story").onclick=()=>start("story");$("free-roam").onclick=()=>start("free");
$("how-to").onclick=()=>helpMenu.classList.remove("hidden");$("help-close").onclick=()=>helpMenu.classList.add("hidden");
$("pause-btn").onclick=()=>{if(!playing)return;paused=true;pauseMenu.classList.remove("hidden")};
$("resume-btn").onclick=()=>{paused=false;pauseMenu.classList.add("hidden")};
$("restart-btn").onclick=()=>start(mode);
$("home-btn").onclick=()=>{playing=false;paused=false;pauseMenu.classList.add("hidden");menu.classList.remove("hidden")};
$("action-btn").addEventListener("pointerdown",e=>{e.preventDefault();interact()});
$("jump-btn").addEventListener("pointerdown",e=>{e.preventDefault();if(onGround&&playing&&!paused){velocityY=7.2;onGround=false}});
const joy=$("joystick"),stick=$("stick");let joyId=null;
function joyMove(e){const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const max=35,len=Math.hypot(dx,dy);if(len>max){dx=dx/len*max;dy=dy/len*max}stick.style.transform=`translate(${dx}px,${dy}px)`;move.x=dx/max;move.y=dy/max}
joy.addEventListener("pointerdown",e=>{joyId=e.pointerId;joy.setPointerCapture(joyId);joyMove(e)});
joy.addEventListener("pointermove",e=>{if(e.pointerId===joyId)joyMove(e)});
function joyEnd(e){if(e.pointerId===joyId){joyId=null;move={x:0,y:0};stick.style.transform="translate(0,0)"}}
joy.addEventListener("pointerup",joyEnd);joy.addEventListener("pointercancel",joyEnd);
renderer.domElement.addEventListener("pointerdown",e=>{if(e.clientX>innerWidth*.42)drag={id:e.pointerId,x:e.clientX,y:e.clientY};});
renderer.domElement.addEventListener("pointermove",e=>{if(drag&&drag.id===e.pointerId){yaw-=(e.clientX-drag.x)*.006;drag.x=e.clientX;drag.y=e.clientY}});
renderer.domElement.addEventListener("pointerup",e=>{if(drag&&drag.id===e.pointerId)drag=null});
renderer.domElement.addEventListener("pointercancel",()=>drag=null);

const clockLabel=()=>{};
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04),t=clock.elapsedTime;
 if(marker){marker.children[0].rotation.z=t*.8;marker.children[1].material.opacity=.12+Math.sin(t*2)*.06}
 if(playing&&!paused){const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));const dir=forward.multiplyScalar(-move.y).add(right.multiplyScalar(move.x));if(dir.lengthSq()>1)dir.normalize();const speed=move.y<-.1?5.8:3.7;player.position.addScaledVector(dir,speed*dt);if(dir.lengthSq()>.01){player.rotation.y=Math.atan2(dir.x,dir.z);const gait=Math.sin(t*(move.y<-.1?13:9));legPivots[0].rotation.x=gait*.58;legPivots[1].rotation.x=-gait*.58;armPivots[0].rotation.x=-gait*.42;armPivots[1].rotation.x=gait*.42;torso.rotation.z=Math.sin(t*10)*.025}else{legPivots.forEach(l=>l.rotation.x=0);armPivots.forEach(a=>a.rotation.x=0);torso.rotation.z=0}
 velocityY-=18*dt;player.position.y+=velocityY*dt;if(player.position.y<=0){player.position.y=0;velocityY=0;onGround=true}
 }
 const target=new THREE.Vector3(player.position.x,player.position.y+2.4,player.position.z);const behind=new THREE.Vector3(Math.sin(yaw)*7,4.2,Math.cos(yaw)*7);camera.position.lerp(target.clone().add(behind),.09);camera.lookAt(target);
 renderer.render(scene,camera);
}
animate();
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
setTimeout(()=>{loading.classList.add("hidden");app.classList.remove("hidden")},650);
