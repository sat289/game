import * as THREE from "three";

/**
 * 🎨 GLSL (OpenGL Shading Language) GPU SHADERS FOR SHERU BHAI CITY (v31)
 * Runs directly on the mobile phone's GPU (1 draw call each, 0 KB external textures!)
 * Gives AAA visual quality even on 2GB-4GB RAM visitor devices!
 */

// 1. GLSL ATMOSPHERIC SKY DOME SHADER (Horizon Glow + Sun Scattering + Twilight + Starry Night)
const SKY_VERT_GLSL = /* glsl */ `
  varying vec3 vWorldDir;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldDir = normalize(position);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const SKY_FRAG_GLSL = /* glsl */ `
  precision mediump float;
  uniform vec3 uTopColor;
  uniform vec3 uMidColor;
  uniform vec3 uHorizonColor;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform float uSunGlow;
  varying vec3 vWorldDir;

  void main() {
    vec3 dir = normalize(vWorldDir);
    float h = clamp(dir.y, 0.0, 1.0);

    // Smooth atmospheric 3-band scattering gradient
    vec3 col = mix(uHorizonColor, uMidColor, smoothstep(0.0, 0.28, h));
    col = mix(col, uTopColor, smoothstep(0.22, 0.85, h));

    // Warm sun / moon atmospheric halo scatter on GPU
    float sunAmt = max(dot(dir, normalize(uSunDir)), 0.0);
    float halo = pow(sunAmt, 10.0) * 0.42 * uSunGlow;
    float disc = smoothstep(0.9965, 0.9992, sunAmt) * 0.95 * uSunGlow;
    col += uSunColor * (halo + disc);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createGLSLSkyDome() {
  const uniforms = {
    uTopColor: { value: new THREE.Color(0x1d6fd8) },
    uMidColor: { value: new THREE.Color(0x5bb8f5) },
    uHorizonColor: { value: new THREE.Color(0xdbeafe) },
    uSunDir: { value: new THREE.Vector3(0.55, 0.62, 0.45).normalize() },
    uSunColor: { value: new THREE.Color(0xfff7cc) },
    uSunGlow: { value: 1.0 }
  };

  const mat = new THREE.ShaderMaterial({
    vertexShader: SKY_VERT_GLSL,
    fragmentShader: SKY_FRAG_GLSL,
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false
  });

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1450, 20, 12), mat);
  mesh.renderOrder = -10;
  mesh.frustumCulled = false;
  return { mesh, uniforms };
}

export function getSkyPalette(mode) {
  if (mode === "night") {
    return {
      top: new THREE.Color(0x020617),
      mid: new THREE.Color(0x0b1530),
      horizon: new THREE.Color(0x172554),
      sunDir: new THREE.Vector3(-0.45, 0.42, -0.55).normalize(),
      sunCol: new THREE.Color(0x93c5fd),
      sunGlow: 0.45
    };
  }
  if (mode === "sunset") {
    return {
      top: new THREE.Color(0x312e81),
      mid: new THREE.Color(0xea580c),
      horizon: new THREE.Color(0xfde047),
      sunDir: new THREE.Vector3(-0.78, 0.16, 0.25).normalize(),
      sunCol: new THREE.Color(0xfef08a),
      sunGlow: 1.35
    };
  }
  return {
    top: new THREE.Color(0x1d6fd8),
    mid: new THREE.Color(0x5bb8f5),
    horizon: new THREE.Color(0xdbeafe),
    sunDir: new THREE.Vector3(0.55, 0.62, 0.45).normalize(),
    sunCol: new THREE.Color(0xfffbeb),
    sunGlow: 1.0
  };
}

// 2. GLSL ANIMATED OCEAN & COASTAL WATER SHADER (Zero-CPU GPU Ripples + Sun Shimmer + Turquoise Depth!)
const WATER_VERT_GLSL = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const WATER_FRAG_GLSL = /* glsl */ `
  precision mediump float;
  uniform float uTime;
  uniform vec3 uDeepColor;
  uniform vec3 uShallowColor;
  uniform vec3 uSpecColor;
  uniform float uShoreX;
  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    // Distance from Golden Beach shoreline toward Deep West Ocean
    float shoreDist = clamp((uShoreX - vWorldPos.x) / 145.0, 0.0, 1.0);

    // Dual-layer procedural GPU ocean wave ripples (zero textures!)
    float w1 = sin(vWorldPos.x * 0.26 + uTime * 2.1 + cos(vWorldPos.z * 0.12) * 1.4);
    float w2 = cos(vWorldPos.z * 0.18 - uTime * 1.5 + vWorldPos.x * 0.09);
    float ripple = (w1 * 0.55 + w2 * 0.45);

    // Rich turquoise shallow-to-deep ocean blend
    vec3 col = mix(uShallowColor, uDeepColor, smoothstep(0.0, 0.65, shoreDist));

    // Animated sparkling sunlight / moonlight shimmer crests
    float glint = smoothstep(0.68, 0.96, ripple) * 0.32;
    col += uSpecColor * glint;

    // Gentle rolling shoreline surf foam right along the Beach & VIP Island edge
    float foamBand = (1.0 - smoothstep(0.0, 0.11, shoreDist)) * smoothstep(0.15, 0.85, sin(vWorldPos.x * 0.52 - uTime * 2.8));
    col = mix(col, vec3(0.95, 0.99, 1.0), clamp(foamBand * 0.72, 0.0, 0.75));

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createGLSLOceanMaterial(shoreWorldX) {
  const uniforms = {
    uTime: { value: 0 },
    uDeepColor: { value: new THREE.Color(0x0369a1) },
    uShallowColor: { value: new THREE.Color(0x22d3ee) },
    uSpecColor: { value: new THREE.Color(0xe0f2fe) },
    uShoreX: { value: shoreWorldX }
  };
  const mat = new THREE.ShaderMaterial({
    vertexShader: WATER_VERT_GLSL,
    fragmentShader: WATER_FRAG_GLSL,
    uniforms,
    fog: false
  });
  return { mat, uniforms };
}

// 3. GLSL BAKED GROUND CONTACT-SHADOW SHADER (Soft Depth Under Buildings on 2GB RAM Phones at Zero Shadow-Map Cost!)
const AO_VERT_GLSL = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const AO_FRAG_GLSL = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  void main() {
    vec2 d = abs(vUv - 0.5) * 2.0;
    float edge = max(d.x, d.y);
    float soft = (1.0 - smoothstep(0.58, 1.0, edge)) * 0.34;
    gl_FragColor = vec4(0.03, 0.07, 0.14, soft);
  }
`;

export function createGLSLContactShadowMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: AO_VERT_GLSL,
    fragmentShader: AO_FRAG_GLSL,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1
  });
}
