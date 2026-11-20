import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export function createWorld(canvas){
  const renderer = new THREE.WebGLRenderer({canvas,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
  renderer.setSize(innerWidth,innerHeight,false);
  renderer.shadowMap.enabled = true;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8bc8ef);
  scene.fog = new THREE.Fog(0x9bc9e8,90,360);
  const camera = new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,700);
  camera.position.set(0,6,13);
  scene.add(new THREE.HemisphereLight(0xffffff,0x536b45,2));
  const sun = new THREE.DirectionalLight(0xffffff,2.2); sun.position.set(-30,60,20); sun.castShadow=true; scene.add(sun);

  const mat=(color,roughness=.8)=>new THREE.MeshStandardMaterial({color,roughness});
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(700,700),mat(0x4d8950)); ground.rotation.x=-Math.PI/2; ground.position.y=-.12; ground.receiveShadow=true; scene.add(ground);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(18,700),mat(0x30343b)); road.rotation.x=-Math.PI/2; road.position.y=0; scene.add(road);
  for(let z=-340;z<350;z+=16){const dash=new THREE.Mesh(new THREE.BoxGeometry(.22,.035,7),mat(0xf6f0cf));dash.position.set(0,.03,z);scene.add(dash);}
  // Sea and sandy coast on the left; city skyline on the right; village trees/houses ahead.
  const sea=new THREE.Mesh(new THREE.PlaneGeometry(230,700),mat(0x087fb5,.35));sea.rotation.x=-Math.PI/2;sea.position.set(-130,-.08,0);scene.add(sea);
  const sand=new THREE.Mesh(new THREE.PlaneGeometry(30,700),mat(0xe4d19a));sand.rotation.x=-Math.PI/2;sand.position.set(-15,-.06,0);scene.add(sand);
  for(let i=0;i<24;i++){
    const h=12+Math.random()*34;
    const b=new THREE.Mesh(new THREE.BoxGeometry(8,h,8),mat([0x8799aa,0x9bb3c4,0x596b80][i%3]));
    b.position.set(22+Math.random()*75,h/2,-330+i*28);b.castShadow=true;scene.add(b);
    for(let j=0;j<3;j++){const w=new THREE.Mesh(new THREE.BoxGeometry(5,4,5),mat(0xd8b88b));w.position.set(-32-Math.random()*35,2,-280+i*24+j*7);scene.add(w);}
  }
  // A simple procedural starter car body (replace with licensed detailed GLB model for production realism).
  const car=new THREE.Group();
  const red=mat(0xc81020,.28), glass=mat(0x122c42,.18), black=mat(0x111318);
  const body=new THREE.Mesh(new THREE.BoxGeometry(2.2,.65,4.2),red);body.position.y=.85;body.castShadow=true;car.add(body);
  const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.65,.7,1.9),glass);cabin.position.set(0,1.48,-.15);car.add(cabin);
  const wheels=[];
  for(const x of [-1.08,1.08])for(const z of [-1.35,1.35]){
    const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.43,.43,.25,20),black);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.48,z);wheel.castShadow=true;car.add(wheel);wheels.push(wheel);
  }
  car.position.set(0,0,0);scene.add(car);

  const pickups=[];
  for(let i=0;i<45;i++){
    const gem=i%6===0;
    const obj=new THREE.Mesh(gem?new THREE.OctahedronGeometry(.65):new THREE.TorusGeometry(.55,.18,8,18),mat(gem?0x28e6ff:0xffc928,.25));
    obj.position.set((Math.random()-.5)*7,gem?1.5:1.1,-25-i*12);obj.rotation.x=Math.PI/2;scene.add(obj);pickups.push({mesh:obj,gem,collected:false});
  }
  const clock=new THREE.Clock();
  let speed=0,steer=0,damage=0;
  function update(input,onPickup){
    const dt=Math.min(clock.getDelta(),.04);
    speed += (input.gas?14:input.brake?-20:-3)*dt;
    speed=THREE.MathUtils.clamp(speed,-5,28);
    steer=THREE.MathUtils.damp(steer,input.left?-1:input.right?1:0,5,dt);
    car.rotation.y=-steer*.42;
    car.position.x=THREE.MathUtils.clamp(car.position.x+steer*speed*.045, -7,7);
    car.position.z-=speed*dt;
    wheels.forEach(w=>w.rotation.x-=speed*dt*1.8);
    camera.position.lerp(new THREE.Vector3(car.position.x*.45,5.5,car.position.z+10),.08);
    camera.lookAt(car.position.x,1,car.position.z-5);
    pickups.forEach(p=>{
      if(!p.collected){p.mesh.rotation.y+=dt*1.7;p.mesh.position.z+=speed*dt;
        if(p.mesh.position.distanceTo(car.position)<2.1){p.collected=true;p.mesh.visible=false;onPickup(p.gem);}}
    });
    renderer.render(scene,camera);
  }
  function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false);}
  addEventListener("resize",resize);
  return {update,car,renderer,scene};
}
