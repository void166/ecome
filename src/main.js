import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './style.css';

const defaultProducts = [
  {
    id: 'V/001',
    name: 'Night Shift Jacket',
    category: 'outerwear',
    price: '₮289,000',
    colorName: 'Obsidian',
    accent: '#171b19',
    style: 'puffer-jacket',
    image: '/products/black-jacket.jpg',
    description: 'Structured outer layer with an oversized profile and technical finish.',
  },
  {
    id: 'V/002',
    name: 'Signal Hoodie',
    category: 'tops',
    price: '₮189,000',
    colorName: 'Sage / Sand',
    accent: '#899d32',
    style: 'heavy-hoodie',
    image: '/products/hoodies.jpg',
    description: 'Heavy cotton hoodie cut loose, finished with a sharp double-layer hood.',
  },
  {
    id: 'V/003',
    name: 'Concrete Tee',
    category: 'tops',
    price: '₮89,000',
    colorName: 'Black',
    accent: '#d8d0c2',
    style: 'oversized-tee',
    image: '/products/black-tees.jpg',
    description: 'Dense jersey tee with dropped shoulders and a clean architectural drape.',
  },
  {
    id: 'V/004',
    name: 'Static Sweatpant',
    category: 'bottoms',
    price: '₮219,000',
    colorName: 'Graphite',
    accent: '#2b302e',
    style: 'wide-sweatpant',
    image: '/products/sweatpants.jpg',
    description: 'Heavyweight brushed cotton sweatpant with a relaxed leg and minimal finish.',
  },
  {
    id: 'V/005',
    name: 'Afterdark High',
    category: 'accessories',
    price: '₮249,000',
    colorName: 'Black / White',
    accent: '#191c1b',
    style: 'high-top',
    image: '/products/sneakers.jpg',
    description: 'Monochrome high-top profile selected for the VOID/01 afterdark uniform.',
  },
  {
    id: 'V/006',
    name: 'Null Zip Layer',
    category: 'outerwear',
    price: '₮269,000',
    colorName: 'Carbon',
    accent: '#26332f',
    style: 'cropped-shell',
    image: '/products/black-jacket.jpg',
    description: 'A cropped technical shell cut for sharp layering after midnight.',
  },
  {
    id: 'V/007',
    name: 'Ghostline Hoodie',
    category: 'tops',
    price: '₮199,000',
    colorName: 'Dust / Acid',
    accent: '#73862d',
    style: 'heavy-hoodie',
    image: '/products/hoodies.jpg',
    description: 'Dense loopback cotton with a floating hood and restrained signal detail.',
  },
  {
    id: 'V/008',
    name: 'Division Tee',
    category: 'tops',
    price: '₮99,000',
    colorName: 'Void Black',
    accent: '#1e211f',
    style: 'oversized-tee',
    image: '/products/black-tees.jpg',
    description: 'Boxy uniform tee with a reinforced neck and long architectural sleeve.',
  },
  {
    id: 'V/009',
    name: 'Transit Cargo',
    category: 'bottoms',
    price: '₮239,000',
    colorName: 'Ash',
    accent: '#3b413d',
    style: 'cargo-pant',
    image: '/products/sweatpants.jpg',
    description: 'Wide utility trouser with articulated knees and concealed cargo storage.',
  },
  {
    id: 'V/010',
    name: 'Mono Runner',
    category: 'accessories',
    price: '₮229,000',
    colorName: 'Bone / Black',
    accent: '#d9d2c3',
    style: 'low-runner',
    image: '/products/sneakers.jpg',
    description: 'Low monochrome runner built to finish the daily VOID uniform.',
  },
  {
    id: 'V/011',
    name: 'Signal Vest',
    category: 'outerwear',
    price: '₮179,000',
    colorName: 'Night Olive',
    accent: '#66752b',
    style: 'utility-vest',
    image: '/products/black-jacket.jpg',
    description: 'Modular sleeveless layer with an engineered shoulder and utility pockets.',
  },
  {
    id: 'V/012',
    name: 'System Pant',
    category: 'bottoms',
    price: '₮209,000',
    colorName: 'Graphite',
    accent: '#262c29',
    style: 'straight-pant',
    image: '/products/sweatpants.jpg',
    description: 'Straight technical pant designed to move between studio and street.',
  },
];

const PRODUCT_STORAGE_KEY = 'void-showroom-products-v1';

function loadLocalProducts() {
  try {
    const saved = JSON.parse(localStorage.getItem(PRODUCT_STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

let customProducts = loadLocalProducts();
let products = [...defaultProducts, ...customProducts];

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.22;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d0f0e);
scene.fog = new THREE.FogExp2(0x0d0f0e, 0.017);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 80);
camera.position.set(0, 3.4, 19.2);

const cameraTarget = new THREE.Vector3(0, 2.55, -3.2);
let targetYaw = 0;
let targetPitch = 0;
let currentYaw = 0;
let currentPitch = 0;
let targetZoom = 19.8;
let currentZoom = 19.8;
let currentOrbitZ = -0.6;
let roomEntered = false;
let entranceProgress = 0;
let targetEntranceProgress = 0;
let entranceGroup;
const corridorLights = [];

const materials = {
  concrete: new THREE.MeshStandardMaterial({ color: 0x202322, roughness: 0.92, metalness: 0.03 }),
  concreteLight: new THREE.MeshStandardMaterial({ color: 0x343836, roughness: 0.86 }),
  blackMetal: new THREE.MeshStandardMaterial({ color: 0x090a0a, roughness: 0.36, metalness: 0.88 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x5c625f, roughness: 0.23, metalness: 0.9 }),
  smokedGlass: new THREE.MeshPhysicalMaterial({
    color: 0x161a19,
    roughness: 0.16,
    metalness: 0.05,
    transparent: true,
    opacity: 0.45,
    transmission: 0.25,
    thickness: 0.8,
  }),
  acid: new THREE.MeshStandardMaterial({
    color: 0xd7ff3f,
    emissive: 0x91b000,
    emissiveIntensity: 2,
    roughness: 0.4,
  }),
};

function mesh(geometry, material, position, rotation = [0, 0, 0], shadows = true) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(...position);
  object.rotation.set(...rotation);
  object.castShadow = shadows;
  object.receiveShadow = shadows;
  scene.add(object);
  return object;
}

function box(size, material, position, rotation, radius = 0) {
  const geometry = radius
    ? new RoundedBoxGeometry(size[0], size[1], size[2], 4, radius)
    : new THREE.BoxGeometry(...size);
  return mesh(geometry, material, position, rotation);
}

function cylinder(radius, length, material, position, rotation = [0, 0, Math.PI / 2]) {
  return mesh(new THREE.CylinderGeometry(radius, radius, length, 24), material, position, rotation);
}

function buildRoom() {
  // Architectural shell
  box([17, 0.24, 16], materials.concrete, [0, -0.12, -0.5]);
  box([17, 7.4, 0.26], materials.concreteLight, [0, 3.6, -7]);
  box([0.24, 7.4, 16], materials.concrete, [-8.35, 3.6, -0.5]);
  box([0.24, 7.4, 16], materials.concrete, [8.35, 3.6, -0.5]);
  box([17, 0.18, 16], materials.concrete, [0, 7.22, -0.5]);

  // Floor strips guide the eye into the collection.
  for (let i = -7; i <= 7; i += 2) {
    box([0.018, 0.008, 13.8], new THREE.MeshBasicMaterial({ color: 0x2a2c2b }), [i, 0.012, -0.2], undefined, 0);
  }

  // Back display frame
  box([14.3, 0.14, 0.24], materials.acid, [0, 6.45, -6.64]);
  box([14.5, 6.1, 0.3], materials.blackMetal, [0, 3.25, -6.64]);

  const bays = [-5.55, -2.78, 0, 2.78, 5.55];
  bays.forEach((x) => {
    box([2.48, 5.45, 0.32], materials.concreteLight, [x, 3.23, -6.42]);
    box(
      [2.28, 5.22, 0.18],
      new THREE.MeshBasicMaterial({ color: 0x282d2a }),
      [x, 3.23, -6.2],
    );
    cylinder(0.035, 1.95, materials.steel, [x, 4.72, -5.96]);
    box([1.95, 0.035, 0.035], materials.acid, [x, 5.83, -5.82]);
    box([1.95, 0.018, 0.025], new THREE.MeshBasicMaterial({ color: 0x859a35 }), [x, 1.18, -5.53]);
    box([2.2, 0.08, 0.65], materials.blackMetal, [x, 1.05, -5.9]);

    const led = new THREE.RectAreaLight(0xd7ff8a, 8, 1.8, 0.05);
    led.position.set(x, 5.86, -5.89);
    led.rotation.x = Math.PI / 2;
    scene.add(led);
  });

  // Dividers and lower drawers.
  for (let x = -6.9; x <= 6.9; x += 2.77) {
    box([0.07, 5.55, 0.62], materials.blackMetal, [x, 3.28, -5.98]);
  }
  for (const x of [-5.55, -2.78, 0, 2.78, 5.55]) {
    for (let y = 0; y < 3; y += 1) {
      box([2.08, 0.46, 0.56], materials.concreteLight, [x, 0.32 + y * 0.48, -5.88], undefined, 0.025);
      box([0.42, 0.025, 0.03], materials.steel, [x, 0.38 + y * 0.48, -5.57]);
    }
  }

  // Ceiling lighting rails.
  for (const x of [-5.2, 0, 5.2]) {
    box([0.055, 0.04, 10], materials.blackMetal, [x, 7.08, -0.65]);
    for (let z = -5.2; z <= 3.2; z += 2.1) {
      const spot = new THREE.SpotLight(0xe6f0d0, 190, 11, Math.PI * 0.17, 0.75, 1.5);
      spot.position.set(x, 6.94, z);
      spot.target.position.set(x * 0.7, 0, z - 2);
      // Keep the directional light as the single shadow caster so the scene
      // stays within mobile and embedded-browser texture-unit limits.
      spot.castShadow = false;
      scene.add(spot, spot.target);
      cylinder(0.09, 0.22, materials.blackMetal, [x, 6.9, z], [0, 0, 0]);
    }
  }

  // Central bench and side displays.
  box([4.2, 0.58, 1.35], new THREE.MeshStandardMaterial({ color: 0x1f2220, roughness: 0.93 }), [0, 0.64, 1.25], undefined, 0.18);
  box([2.8, 0.3, 0.95], new THREE.MeshStandardMaterial({ color: 0x2d302e, roughness: 0.88 }), [0, 1.08, 1.25], undefined, 0.14);
  for (const x of [-1.68, 1.68]) box([0.18, 0.48, 1], materials.blackMetal, [x, 0.28, 1.25]);

  box([2.1, 3.8, 0.22], materials.smokedGlass, [-7.55, 2.55, -3.35]);
  box([2.1, 3.8, 0.22], materials.smokedGlass, [7.55, 2.55, -3.35]);
  box([0.08, 3.9, 0.28], materials.acid, [-6.45, 2.55, -3.34]);
  box([0.08, 3.9, 0.28], materials.acid, [6.45, 2.55, -3.34]);

  // Low plinths for future shoe/accessory GLBs.
  for (const x of [-6.2, 6.2]) {
    box([1.6, 0.95, 1.6], materials.concreteLight, [x, 0.48, 1.55], undefined, 0.03);
    box([1.28, 0.06, 1.28], materials.acid, [x, 0.99, 1.55]);
  }
}

function buildEntrance() {
  entranceGroup = new THREE.Group();
  entranceGroup.name = 'cinematic-entrance';

  const doorMaterial = new THREE.MeshStandardMaterial({
    color: 0x080a09,
    roughness: 0.28,
    metalness: 0.76,
  });
  const wingMaterial = new THREE.MeshStandardMaterial({
    color: 0x101312,
    roughness: 0.88,
    metalness: 0.08,
  });
  const glowMaterial = new THREE.MeshBasicMaterial({ color: 0xd7ff3f, toneMapped: false });

  const makeEntranceBox = (size, material, position) => {
    const object = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    object.position.set(...position);
    entranceGroup.add(object);
    return object;
  };

  for (const x of [-6.45, 6.45]) makeEntranceBox([4.7, 7.25, 0.72], wingMaterial, [x, 3.45, 5.82]);
  makeEntranceBox([17.2, 0.62, 0.78], wingMaterial, [0, 7.04, 5.82]);

  const makeDoor = (x, side) => {
    const door = new THREE.Group();
    door.position.set(x, 3.45, 5.78);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(4.12, 6.65, 0.48), doorMaterial);
    door.add(slab);
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.035, 5.9, 0.03), glowMaterial);
    seam.position.set(side * -2.02, 0, 0.265);
    door.add(seam);
    const code = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.035, 0.03), glowMaterial);
    code.position.set(side * -1.32, -2.62, 0.265);
    door.add(code);
    entranceGroup.add(door);
    return door;
  };

  entranceGroup.userData.leftDoor = makeDoor(-2.06, -1);
  entranceGroup.userData.rightDoor = makeDoor(2.06, 1);
  entranceGroup.userData.leftClosed = -2.06;
  entranceGroup.userData.rightClosed = 2.06;

  const entranceLight = new THREE.PointLight(0xd7ff3f, 26, 8, 2);
  entranceLight.position.set(0, 3.5, 6.5);
  entranceGroup.add(entranceLight);
  scene.add(entranceGroup);
}

function buildCorridor() {
  const corridor = new THREE.Group();
  corridor.name = 'arrival-corridor';
  const shell = new THREE.MeshStandardMaterial({ color: 0x111412, roughness: 0.9, metalness: 0.08 });
  const rib = new THREE.MeshStandardMaterial({ color: 0x050606, roughness: 0.35, metalness: 0.86 });
  const line = new THREE.MeshBasicMaterial({ color: 0xd7ff3f, toneMapped: false });
  const addPart = (size, material, position) => {
    const part = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    part.position.set(...position);
    part.receiveShadow = true;
    corridor.add(part);
    return part;
  };

  addPart([8.5, 0.22, 14], shell, [0, -0.1, 12.5]);
  addPart([0.28, 7.2, 14], shell, [-4.15, 3.5, 12.5]);
  addPart([0.28, 7.2, 14], shell, [4.15, 3.5, 12.5]);
  addPart([8.5, 0.22, 14], shell, [0, 7.12, 12.5]);

  for (const z of [6.7, 9.2, 11.7, 14.2, 16.7, 19.2]) {
    addPart([0.16, 7.05, 0.32], rib, [-3.94, 3.5, z]);
    addPart([0.16, 7.05, 0.32], rib, [3.94, 3.5, z]);
    addPart([7.9, 0.14, 0.32], rib, [0, 6.96, z]);
    addPart([5.6, 0.025, 0.08], line, [0, 6.82, z - 0.08]);
    const light = new THREE.PointLight(0xd7ff8a, 0, 5.5, 2);
    light.position.set(0, 6.35, z - 0.25);
    light.userData.index = corridorLights.length;
    corridorLights.push(light);
    corridor.add(light);
  }

  for (const x of [-2.7, 0, 2.7]) addPart([0.025, 0.012, 13.4], line, [x, 0.025, 12.6]);

  const signCanvas = document.createElement('canvas');
  signCanvas.width = 1200;
  signCanvas.height = 420;
  const signContext = signCanvas.getContext('2d');
  signContext.clearRect(0, 0, signCanvas.width, signCanvas.height);
  signContext.textAlign = 'center';
  signContext.fillStyle = '#d7ff3f';
  signContext.font = '900 190px Arial Black, Arial';
  signContext.fillText('VOID / 01', 600, 220);
  signContext.fillStyle = '#f2f0e9';
  signContext.font = '34px monospace';
  signContext.fillText('ACCESS THE AFTERDARK', 600, 305);
  const signTexture = new THREE.CanvasTexture(signCanvas);
  signTexture.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(5.8, 2.03),
    new THREE.MeshBasicMaterial({ map: signTexture, transparent: true, toneMapped: false }),
  );
  sign.position.set(0, 5.45, 6.22);
  corridor.add(sign);
  scene.add(corridor);
}

let avatarGroup;
let avatarMorph;
let avatarBackdrop;
let realisticHuman;
let avatarMixer;
let avatarYaw = 0;
let targetAvatarYaw = 0;
let avatarMode = false;
const avatarGarments = {};
const avatarBodyParts = [];

// --- Body-conforming garments -------------------------------------------------
// Garments are cut from the human mesh itself: pick the triangles of a body
// region, push them out along the (welded) normals by the garment's ease and
// bind them to the same skeleton. They follow the body exactly instead of the
// procedural cylinders, which were sized for the old mannequin.

const GARMENT_EASE = [0.72, 1, 1.45];

function createGarmentMaterial(color) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.9,
    metalness: 0.02,
    side: THREE.DoubleSide,
    emissive: new THREE.Color(color).multiplyScalar(0.025),
  });
}

function weldedNormals(geometry) {
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  const sums = new Map();
  const keys = new Array(position.count);
  for (let i = 0; i < position.count; i += 1) {
    const key = `${position.getX(i).toFixed(5)},${position.getY(i).toFixed(5)},${position.getZ(i).toFixed(5)}`;
    keys[i] = key;
    const sum = sums.get(key) || new THREE.Vector3();
    sum.x += normal.getX(i);
    sum.y += normal.getY(i);
    sum.z += normal.getZ(i);
    sums.set(key, sum);
  }
  return keys.map((key) => sums.get(key).clone().normalize());
}

// Loose fabric does not follow every curve of the body. Around the torso the
// cloth radius comes from a blurred hull of the garment (polar bins around the
// torso axis, bind space, metres) that bridges hollows and hangs down from the
// bust and shoulder blades. Cloth may sink towards that hull, but only by
// `inwardLimit` so it always keeps some clearance from the body.
function drapeTorso(position, mask, inwardLimit) {
  const BAND = 0.025;
  const SECTORS = 48;
  const vertices = [];
  let axisZ = 0;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < position.count; i += 1) {
    if (!mask[i]) continue;
    vertices.push(i);
    axisZ += position.getZ(i);
    minY = Math.min(minY, position.getY(i));
    maxY = Math.max(maxY, position.getY(i));
  }
  if (!vertices.length) return 0;
  axisZ /= vertices.length;
  const bands = Math.ceil((maxY - minY) / BAND) + 1;
  const cell = (band, sector) => THREE.MathUtils.clamp(band, 0, bands - 1) * SECTORS + ((sector % SECTORS) + SECTORS) % SECTORS;
  const polar = (i) => {
    const x = position.getX(i);
    const z = position.getZ(i) - axisZ;
    return { r: Math.hypot(x, z), angle: Math.atan2(z, x) };
  };
  const sectorOf = (angle) => ((angle + Math.PI) / (Math.PI * 2)) * SECTORS;
  const radius = new Float32Array(bands * SECTORS);
  vertices.forEach((i) => {
    const { r, angle } = polar(i);
    const index = cell(Math.floor((position.getY(i) - minY) / BAND), Math.floor(sectorOf(angle)));
    radius[index] = Math.max(radius[index], r);
  });
  // Bridge hollows (cleavage, small of the back) across neighbouring sectors.
  const bridged = new Float32Array(radius.length);
  for (let band = 0; band < bands; band += 1) {
    for (let sector = 0; sector < SECTORS; sector += 1) {
      let best = 0;
      for (let k = -4; k <= 4; k += 1) {
        best = Math.max(best, radius[cell(band, sector + k)] * Math.cos((k * Math.PI * 2) / SECTORS));
      }
      bridged[cell(band, sector)] = best;
    }
  }
  // Soften the hull (normalised blur, ignoring empty cells at the edges).
  const blurred = new Float32Array(radius.length);
  for (let band = 0; band < bands; band += 1) {
    for (let sector = 0; sector < SECTORS; sector += 1) {
      let sum = 0;
      let weight = 0;
      for (let db = -2; db <= 2; db += 1) {
        if (band + db < 0 || band + db >= bands) continue;
        for (let ds = -3; ds <= 3; ds += 1) {
          const value = bridged[cell(band + db, sector + ds)];
          if (!value) continue;
          const w = Math.exp(-(db * db) / 2 - (ds * ds) / 4.5);
          sum += value * w;
          weight += w;
        }
      }
      blurred[cell(band, sector)] = weight ? sum / weight : 0;
    }
  }
  // Hang down: front/back fall almost straight, the sides follow the body.
  const target = new Float32Array(radius.length);
  for (let sector = 0; sector < SECTORS; sector += 1) {
    const angle = ((sector + 0.5) / SECTORS) * Math.PI * 2 - Math.PI;
    const slope = 0.12 + 0.5 * Math.abs(Math.cos(angle));
    let running = 0;
    for (let band = bands - 1; band >= 0; band -= 1) {
      running = Math.max(blurred[cell(band, sector)], running - slope * BAND);
      target[cell(band, sector)] = running;
    }
  }
  vertices.forEach((i) => {
    const { r, angle } = polar(i);
    if (r < 1e-5) return;
    const fb = (position.getY(i) - minY) / BAND - 0.5;
    const fs = sectorOf(angle) - 0.5;
    const b0 = Math.floor(fb);
    const s0 = Math.floor(fs);
    const tb = fb - b0;
    const ts = fs - s0;
    const goal = (target[cell(b0, s0)] * (1 - ts) + target[cell(b0, s0 + 1)] * ts) * (1 - tb)
      + (target[cell(b0 + 1, s0)] * (1 - ts) + target[cell(b0 + 1, s0 + 1)] * ts) * tb;
    const settled = Math.max(goal, r - inwardLimit[i]);
    const grow = 1 + (settled / r - 1) * mask[i];
    position.setX(i, position.getX(i) * grow);
    position.setZ(i, axisZ + (position.getZ(i) - axisZ) * grow);
  });
  return axisZ;
}

// Shading normals for the reshaped garment, averaged across UV-seam duplicates
// so the cloth reads smooth instead of showing the body's curves underneath.
function updateGarmentNormals(garment) {
  const { geometry } = garment;
  const { weld, used } = garment.userData.fit;
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  const index = geometry.index;
  const sums = new Float32Array((Math.max(...weld) + 1) * 3);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let i = 0; i < index.count; i += 3) {
    const ia = index.getX(i);
    const ib = index.getX(i + 1);
    const ic = index.getX(i + 2);
    a.fromBufferAttribute(position, ia);
    b.fromBufferAttribute(position, ib);
    c.fromBufferAttribute(position, ic);
    const face = c.sub(b).cross(a.sub(b));
    for (const vertex of [ia, ib, ic]) {
      const group = weld[vertex] * 3;
      sums[group] += face.x;
      sums[group + 1] += face.y;
      sums[group + 2] += face.z;
    }
  }
  used.forEach((vertex) => {
    const group = weld[vertex] * 3;
    a.set(sums[group], sums[group + 1], sums[group + 2]).normalize();
    normal.setXYZ(vertex, a.x, a.y, a.z);
  });
  normal.needsUpdate = true;
}

// Relax the drape displacement across neighbouring vertices so the cloth
// tents smoothly instead of creasing where it leaves the body. The result is
// clamped to the same clearance the drape itself respects.
function smoothDrape(garment, before, axisZ, inwardLimit, iterations = 6) {
  const fit = garment.userData.fit;
  const { weld, used, drapeMask } = fit;
  const position = garment.geometry.attributes.position;
  if (!fit.neighbors) {
    const neighbors = new Map();
    const index = garment.geometry.index;
    const link = (a, b) => {
      if (!neighbors.has(a)) neighbors.set(a, new Set());
      neighbors.get(a).add(b);
    };
    for (let i = 0; i < index.count; i += 3) {
      const corners = [weld[index.getX(i)], weld[index.getX(i + 1)], weld[index.getX(i + 2)]];
      for (let k = 0; k < 3; k += 1) {
        link(corners[k], corners[(k + 1) % 3]);
        link(corners[k], corners[(k + 2) % 3]);
      }
    }
    fit.neighbors = neighbors;
  }
  const delta = new Map();
  const movable = new Set();
  used.forEach((vertex) => {
    const group = weld[vertex];
    delta.set(group, [position.getX(vertex) - before[vertex * 3], position.getZ(vertex) - before[vertex * 3 + 2]]);
    if (drapeMask[vertex] > 0) movable.add(group);
  });
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const next = new Map(delta);
    movable.forEach((group) => {
      const own = delta.get(group);
      let sx = 0;
      let sz = 0;
      let count = 0;
      fit.neighbors.get(group)?.forEach((other) => {
        const value = delta.get(other);
        if (!value) return;
        sx += value[0];
        sz += value[1];
        count += 1;
      });
      if (count) next.set(group, [own[0] * 0.5 + (sx / count) * 0.5, own[1] * 0.5 + (sz / count) * 0.5]);
    });
    next.forEach((value, group) => delta.set(group, value));
  }
  used.forEach((vertex) => {
    let [dx, dz] = delta.get(weld[vertex]);
    // Smoothing must not pull cloth closer to the body than the drape allowed.
    const x = before[vertex * 3];
    const z = before[vertex * 3 + 2] - axisZ;
    const length = Math.hypot(x, z);
    if (length > 1e-5 && drapeMask[vertex] > 0) {
      const radial = (dx * x + dz * z) / length;
      const floor = -inwardLimit[vertex] * drapeMask[vertex];
      if (radial < floor) {
        dx += ((floor - radial) * x) / length;
        dz += ((floor - radial) * z) / length;
      }
    }
    position.setX(vertex, x + dx);
    position.setZ(vertex, before[vertex * 3 + 2] + dz);
  });
}

function applyGarmentEase(garment, ease) {
  const { base, normals, offsets, drapeMask } = garment.userData.fit;
  const position = garment.geometry.attributes.position;
  const direction = new THREE.Vector3();
  for (let i = 0; i < position.count; i += 1) {
    const push = offsets[i] * ease;
    // On the draped torso push sideways only: large ease along the normals of
    // the fold under the bust would make the offset surface cross itself.
    direction.copy(normals[i]);
    if (drapeMask?.[i]) {
      direction.y *= 1 - drapeMask[i];
      if (direction.lengthSq() > 1e-8) direction.normalize();
    }
    position.setXYZ(
      i,
      base[i * 3] + direction.x * push,
      base[i * 3 + 1] + direction.y * push,
      base[i * 3 + 2] + direction.z * push,
    );
  }
  if (drapeMask) {
    const before = position.array.slice();
    // Keep at least 30% of the ease between cloth and skin.
    const inwardLimit = Float32Array.from(offsets, (offset) => offset * ease * 0.7);
    const axisZ = drapeTorso(position, drapeMask, inwardLimit);
    smoothDrape(garment, before, axisZ, inwardLimit);
  }
  position.needsUpdate = true;
  updateGarmentNormals(garment);
  garment.geometry.computeBoundingSphere();
}

// Read the posed body once: per-vertex bone name and skinned position in
// avatarMorph space, plus joint landmarks.
function readPosedBody(body) {
  avatarMorph.updateMatrixWorld(true);
  const toMorph = avatarMorph.matrixWorld.clone().invert().multiply(body.matrixWorld);
  const geometry = body.geometry;
  const skinIndex = geometry.attributes.skinIndex;
  const skinWeight = geometry.attributes.skinWeight;
  const bones = body.skeleton.bones;
  const count = geometry.attributes.position.count;
  const points = new Array(count);
  const boneNames = new Array(count);
  for (let i = 0; i < count; i += 1) {
    points[i] = body.getVertexPosition(i, new THREE.Vector3()).applyMatrix4(toMorph);
    let best = 0;
    for (let k = 1; k < 4; k += 1) {
      if (skinWeight.getComponent(i, k) > skinWeight.getComponent(i, best)) best = k;
    }
    boneNames[i] = bones[skinIndex.getComponent(i, best)]?.name || '';
  }
  const morphInverse = avatarMorph.matrixWorld.clone().invert();
  const joint = (name) => {
    const bone = bones.find((item) => item.name === name);
    return bone ? bone.getWorldPosition(new THREE.Vector3()).applyMatrix4(morphInverse) : new THREE.Vector3();
  };
  const average = (a, b) => joint(a).add(joint(b)).multiplyScalar(0.5);
  const landmarks = {
    neck: joint('neck_01'),
    head: joint('head'),
    shoulder: average('upperarm_l', 'upperarm_r'),
    elbow: average('lowerarm_l', 'lowerarm_r'),
    wrist: average('hand_l', 'hand_r'),
    hip: average('thigh_l', 'thigh_r'),
    knee: average('calf_l', 'calf_r'),
    ankle: average('foot_l', 'foot_r'),
    scale: new THREE.Vector3().setFromMatrixScale(toMorph).x,
  };
  return { points, boneNames, landmarks };
}

// Cloth bridges small anatomy (nipples, navel, rib edges): relax the bind-space
// shape of the draped torso before it is offset. Only a few iterations, so the
// overall volume barely shrinks and stays inside the garment's clearance.
function relaxDrapedBase(geometry, weld, used, mask, iterations = 14) {
  const position = geometry.attributes.position;
  const index = geometry.index;
  const neighbors = new Map();
  for (let i = 0; i < index.count; i += 3) {
    const corners = [weld[index.getX(i)], weld[index.getX(i + 1)], weld[index.getX(i + 2)]];
    for (let k = 0; k < 3; k += 1) {
      if (!neighbors.has(corners[k])) neighbors.set(corners[k], new Set());
      neighbors.get(corners[k]).add(corners[(k + 1) % 3]).add(corners[(k + 2) % 3]);
    }
  }
  const points = new Map();
  const weights = new Map();
  used.forEach((vertex) => {
    points.set(weld[vertex], new THREE.Vector3().fromBufferAttribute(position, vertex));
    weights.set(weld[vertex], mask[vertex]);
  });
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const next = new Map();
    points.forEach((point, group) => {
      const weight = weights.get(group);
      const around = neighbors.get(group);
      if (!weight || !around?.size) return;
      const average = new THREE.Vector3();
      around.forEach((other) => average.add(points.get(other)));
      average.multiplyScalar(1 / around.size);
      next.set(group, point.clone().lerp(average, 0.5 * weight));
    });
    next.forEach((point, group) => points.set(group, point));
  }
  used.forEach((vertex) => {
    const point = points.get(weld[vertex]);
    position.setXYZ(vertex, point.x, point.y, point.z);
  });
}

// `include` picks the body region; `rangeFor` (optional) gives the posed height
// window [low, high] a vertex may occupy. Triangles straddling a window edge are
// kept and their outside vertices snapped onto it, so hems come out straight.
// Only use `rangeFor` on upright parts (torso, legs): the snap moves bind-space y.
function buildSkinnedGarment(body, posed, include, offsetFor, material, { drapeFor = null, rangeFor = null } = {}) {
  const source = body.geometry;
  const index = source.index;
  const heights = posed.points.map((point) => point.y);
  const inRange = (i) => {
    const range = rangeFor?.(i);
    return !range || (heights[i] >= range[0] && heights[i] <= range[1]);
  };
  const triangles = [];
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i);
    const b = index.getX(i + 1);
    const c = index.getX(i + 2);
    if (include(a) && include(b) && include(c) && (inRange(a) || inRange(b) || inRange(c))) triangles.push(a, b, c);
  }
  const geometry = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'skinIndex', 'skinWeight']) {
    geometry.setAttribute(name, source.attributes[name].clone());
  }
  geometry.setIndex(triangles);
  const used = [...new Set(triangles)];
  if (rangeFor) {
    const position = geometry.attributes.position;
    used.forEach((i) => {
      const range = rangeFor(i);
      if (!range) return;
      const snapped = THREE.MathUtils.clamp(heights[i], range[0], range[1]);
      if (snapped !== heights[i]) position.setY(i, position.getY(i) + (snapped - heights[i]) / posed.landmarks.scale);
    });
  }
  const offsets = new Float32Array(geometry.attributes.position.count);
  for (let i = 0; i < offsets.length; i += 1) offsets[i] = offsetFor(i);
  const weldIds = new Map();
  const weld = new Int32Array(offsets.length);
  const sourcePosition = source.attributes.position;
  for (let i = 0; i < weld.length; i += 1) {
    const key = `${sourcePosition.getX(i).toFixed(5)},${sourcePosition.getY(i).toFixed(5)},${sourcePosition.getZ(i).toFixed(5)}`;
    if (!weldIds.has(key)) weldIds.set(key, weldIds.size);
    weld[i] = weldIds.get(key);
  }
  const drapeMask = drapeFor ? Float32Array.from(offsets, (_, i) => Number(drapeFor(i))) : null;
  if (drapeMask) relaxDrapedBase(geometry, weld, used, drapeMask);
  const garment = new THREE.SkinnedMesh(geometry, material);
  garment.bind(body.skeleton, body.bindMatrix);
  // Thin double-sided shells self-shadow into acne; the body still casts.
  garment.castShadow = false;
  garment.receiveShadow = true;
  garment.frustumCulled = false;
  garment.userData.fit = {
    base: geometry.attributes.position.array.slice(),
    normals: posed.normals,
    offsets,
    used,
    weld,
    drapeMask,
  };
  applyGarmentEase(garment, 1);
  return garment;
}

// Skinned vertex positions of a garment in avatarMorph space (for trims).
function garmentPoints(garment) {
  const { skeleton, bindMatrix, geometry } = garment;
  const position = geometry.attributes.position;
  const skinIndex = geometry.attributes.skinIndex;
  const skinWeight = geometry.attributes.skinWeight;
  const morphInverse = avatarMorph.matrixWorld.clone().invert();
  const boneMatrices = skeleton.bones.map((bone, i) => new THREE.Matrix4().multiplyMatrices(bone.matrixWorld, skeleton.boneInverses[i]));
  const base = new THREE.Vector3();
  const part = new THREE.Vector3();
  return garment.userData.fit.used.map((i) => {
    base.fromBufferAttribute(position, i).applyMatrix4(bindMatrix);
    const point = new THREE.Vector3();
    for (let k = 0; k < 4; k += 1) {
      const weight = skinWeight.getComponent(i, k);
      if (weight) point.addScaledVector(part.copy(base).applyMatrix4(boneMatrices[skinIndex.getComponent(i, k)]), weight);
    }
    return point.applyMatrix4(morphInverse);
  });
}

function buildConformingGarments(body) {
  const posed = readPosedBody(body);
  posed.normals = weldedNormals(body.geometry);
  const { points, boneNames, landmarks: L } = posed;
  const trim = new THREE.MeshStandardMaterial({ color: 0x171a19, roughness: 0.74, metalness: 0.12 });
  const is = (pattern) => (i) => pattern.test(boneNames[i]);
  const isTorso = is(/^(spine|pelvis|clavicle)/);
  const isArm = is(/^(upperarm|lowerarm)/);
  const isThigh = is(/^thigh/);
  const isCalf = is(/^calf/);
  const isFoot = is(/^(foot|ball)/);
  const isNeck = is(/^neck/);
  const y = (i) => points[i].y;
  const shoulderSpan = L.shoulder.y - L.elbow.y;

  // Neck axis from the lower neck vertices (the neck joint sits near the back).
  const neckCenter = new THREE.Vector3();
  let neckSamples = 0;
  points.forEach((point, i) => {
    if (isNeck(i) && point.y < L.neck.y) {
      neckCenter.add(point);
      neckSamples += 1;
    }
  });
  if (neckSamples) neckCenter.multiplyScalar(1 / neckSamples);
  else neckCenter.copy(L.neck);
  const neckRadius = (i) => Math.hypot(points[i].x - neckCenter.x, points[i].z - neckCenter.z);
  // Neckline drops at the front and rises at the back (collarbone notch vs. C7).
  const necklineY = (i, collar) => L.shoulder.y + 0.1 - 0.12 * THREE.MathUtils.clamp((points[i].z - neckCenter.z) / collar, -1, 1);
  const inNeckHole = (i, collar) => neckRadius(i) < collar && y(i) > necklineY(i, collar);

  const torsoRegion = (i) => isTorso(i) || (isThigh(i) && y(i) > L.hip.y - 0.35);
  const top = (collar, sleeveEndY) => (i) => (torsoRegion(i) && !inNeckHole(i, collar)) || (isArm(i) && y(i) > sleeveEndY);
  // A hem below the crotch would close between the legs like a leotard.
  let crotchY = -Infinity;
  points.forEach((point, i) => {
    if (/^pelvis/.test(boneNames[i]) && Math.abs(point.x) < 0.06) crotchY = Math.max(crotchY, -point.y);
  });
  crotchY = Number.isFinite(crotchY) ? -crotchY : L.hip.y - 0.2;
  const hem = (hemY) => {
    const safeHem = Math.max(hemY, crotchY + 0.12);
    return (i) => (torsoRegion(i) ? [safeHem, Infinity] : null);
  };

  const keep = (object) => {
    object.userData.keepColor = true;
    return object;
  };
  const place = (object, parent, position) => {
    object.position.copy(position);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  };
  // Outermost garment surface near (x, y) towards +z (front) or -z (back).
  const surfaceAt = (garmentPointsList, x, atY, { band = 0.06, width = 0.06, back = false } = {}) => {
    let best = back ? Infinity : -Infinity;
    garmentPointsList.forEach((p) => {
      if (Math.abs(p.y - atY) > band || Math.abs(p.x - x) > width) return;
      best = back ? Math.min(best, p.z) : Math.max(best, p.z);
    });
    return Number.isFinite(best) ? best : neckCenter.z;
  };
  // Collar ring sitting on the neckline edge of a garment.
  const collarRing = (garmentPointsList, collar, radius, tube, material, parent) => {
    const edge = garmentPointsList.filter((p) => {
      const r = Math.hypot(p.x - neckCenter.x, p.z - neckCenter.z);
      return r >= collar - 0.02 && r < collar + 0.06 && p.y > L.shoulder.y - 0.15;
    });
    const front = edge.filter((p) => p.z > neckCenter.z);
    const back = edge.filter((p) => p.z <= neckCenter.z);
    // The neckline edge is the highest garment point at the collar radius.
    const edgeY = (list, fallback) => (list.length ? Math.max(...list.map((p) => p.y)) : fallback);
    const frontY = edgeY(front, L.shoulder.y);
    const backY = edgeY(back, L.shoulder.y + 0.2);
    const ring = place(new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 12, 48), material), parent, new THREE.Vector3(neckCenter.x, (frontY + backY) / 2, neckCenter.z));
    ring.rotation.x = Math.PI / 2 - Math.atan2(backY - frontY, radius * 2);
    return { ring, frontY, backY };
  };
  const frontCurve = (garmentPointsList, fromY, toY, lift) => {
    const samples = [];
    for (let step = 0; step <= 40; step += 1) {
      const atY = THREE.MathUtils.lerp(fromY, toY, step / 40);
      samples.push(new THREE.Vector3(0, atY, surfaceAt(garmentPointsList, 0, atY, { band: 0.04, width: 0.05 }) + lift));
    }
    return new THREE.CatmullRomCurve3(samples);
  };
  const updateMorph = () => avatarMorph.updateMatrixWorld(true);
  updateMorph();

  // Tops ---------------------------------------------------------------------
  const tops = new THREE.Group();
  const topMaterial = createGarmentMaterial(0x303632);
  // Drape fades out towards the shoulders so the armholes stay attached to the sleeves.
  const drapes = (i) => (torsoRegion(i) ? THREE.MathUtils.clamp((L.shoulder.y - 0.18 - y(i)) / 0.3, 0, 1) : 0);

  const tee = new THREE.Group();
  const teeCollar = 0.25;
  const teeHem = L.hip.y + 0.02;
  const teeBody = buildSkinnedGarment(body, posed, top(teeCollar, L.shoulder.y - shoulderSpan * 0.5), (i) => (drapes(i) ? 0.014 : 0.02), topMaterial, { drapeFor: drapes, rangeFor: hem(teeHem) });
  tee.add(teeBody);
  const teePoints = garmentPoints(teeBody);
  collarRing(teePoints, teeCollar, teeCollar + 0.015, 0.024, topMaterial, tee);
  const chestY = L.shoulder.y - 0.3;
  keep(place(new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.09, 0.02, 3, 0.01), materials.acid), tee, new THREE.Vector3(0, chestY, surfaceAt(teePoints, 0, chestY, { width: 0.18 }) + 0.008)));

  const hoodie = new THREE.Group();
  const hoodieCollar = 0.25;
  const hoodieBody = buildSkinnedGarment(body, posed, top(hoodieCollar, L.wrist.y + 0.12), () => 0.024, topMaterial, { drapeFor: drapes, rangeFor: hem(L.hip.y - 0.08) });
  hoodie.add(hoodieBody);
  const hoodiePoints = garmentPoints(hoodieBody);
  // Hood worn down: a thick roll around the neckline, fuller at the back.
  const { ring: hood, frontY: hoodFrontY } = collarRing(hoodiePoints, hoodieCollar, hoodieCollar + 0.1, 0.11, topMaterial, hoodie);
  hood.scale.set(1.05, 1.25, 1);
  const pocketY = L.hip.y + 0.14;
  const pocket = place(new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.32, 0.04, 4, 0.03), topMaterial), hoodie, new THREE.Vector3(0, pocketY, surfaceAt(hoodiePoints, 0, pocketY, { band: 0.1, width: 0.3 }) + 0.01));
  pocket.rotation.x = -0.04;
  for (const side of [-1, 1]) {
    const startY = hoodFrontY - 0.06;
    const lacePoints = [];
    for (let step = 0; step <= 6; step += 1) {
      const atY = startY - (0.42 * step) / 6;
      const x = side * (0.09 + 0.01 * (step / 6));
      lacePoints.push(new THREE.Vector3(x, atY, surfaceAt(hoodiePoints, x, atY, { band: 0.04, width: 0.04 }) + 0.018));
    }
    const lace = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lacePoints), 16, 0.012, 6);
    keep(place(new THREE.Mesh(lace, materials.acid), hoodie, new THREE.Vector3()));
  }
  tops.add(tee, hoodie);
  tops.userData.variants = { tee, hoodie };
  tops.userData.pickVariant = (style) => (style.includes('hoodie') ? 'hoodie' : 'tee');

  // Outerwear ----------------------------------------------------------------
  const outerwear = new THREE.Group();
  const jacketMaterial = createGarmentMaterial(0x111412);
  const jacketCollar = 0.28;
  const jacketOffset = 0.038;
  const outerVariant = (hemY, withSleeves, offsetFor, collarTube) => {
    const group = new THREE.Group();
    const shellBody = buildSkinnedGarment(body, posed, top(jacketCollar, withSleeves ? L.wrist.y + 0.06 : Infinity), offsetFor, jacketMaterial, { drapeFor: drapes, rangeFor: hem(hemY) });
    group.add(shellBody);
    const shellPoints = garmentPoints(shellBody);
    const { ring, frontY } = collarRing(shellPoints, jacketCollar, jacketCollar + 0.04, collarTube, trim, group);
    keep(ring);
    const zipLine = frontCurve(shellPoints, hemY + 0.03, frontY - 0.05, 0.012);
    keep(place(new THREE.Mesh(new THREE.TubeGeometry(zipLine, 80, 0.016, 6), materials.acid), group, new THREE.Vector3()));
    group.userData.points = shellPoints;
    return group;
  };
  const quilted = (i) => 0.05 + 0.014 * Math.abs(Math.sin((y(i) / 0.36) * Math.PI));
  const jacket = outerVariant(L.hip.y - 0.12, true, () => jacketOffset, 0.08);
  const shell = outerVariant(L.hip.y + 0.14, true, () => jacketOffset, 0.08);
  const puffer = outerVariant(L.hip.y - 0.06, true, quilted, 0.11);
  const vest = outerVariant(L.hip.y - 0.06, false, () => jacketOffset, 0.07);
  for (const side of [-1, 1]) {
    const vestPocketY = L.shoulder.y - 0.62;
    keep(place(new THREE.Mesh(new RoundedBoxGeometry(0.28, 0.24, 0.04, 3, 0.03), trim), vest, new THREE.Vector3(side * 0.24, vestPocketY, surfaceAt(vest.userData.points, side * 0.24, vestPocketY, { width: 0.1 }) + 0.012)));
    const jacketPocketY = L.hip.y + 0.06;
    keep(place(new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.26, 0.04, 3, 0.03), trim), jacket, new THREE.Vector3(side * 0.28, jacketPocketY, surfaceAt(jacket.userData.points, side * 0.28, jacketPocketY, { width: 0.1 }) + 0.012)));
  }
  outerwear.add(jacket, shell, puffer, vest);
  outerwear.userData.variants = { jacket, shell, puffer, vest };
  outerwear.userData.pickVariant = (style) => (
    style.includes('puffer') ? 'puffer' : style.includes('vest') ? 'vest' : style.includes('cropped') || style.includes('shell') ? 'shell' : 'jacket'
  );

  // Bottoms ------------------------------------------------------------------
  const bottoms = new THREE.Group();
  const pantsMaterial = createGarmentMaterial(0x202523);
  const waistY = L.hip.y + 0.32;
  const hemY = L.ankle.y + 0.05;
  const legs = (i) => isTorso(i) || isThigh(i) || isCalf(i);
  const legRange = () => [hemY, waistY];
  const flare = (max) => (i) => 0.008 + (THREE.MathUtils.clamp((waistY - y(i)) / (waistY - hemY), 0, 1) ** 1.3) * (max - 0.008);
  const pants = (max) => {
    const group = new THREE.Group();
    group.add(buildSkinnedGarment(body, posed, legs, flare(max), pantsMaterial, { rangeFor: legRange }));
    return group;
  };
  const straight = pants(0.02);
  const wide = pants(0.05);
  const cargo = pants(0.032);
  const cargoPoints = garmentPoints(cargo.children[0]);
  for (const side of [-1, 1]) {
    const pocketAt = L.knee.y + (L.hip.y - L.knee.y) * 0.45;
    let outerX = 0;
    let outerZ = 0;
    cargoPoints.forEach((p) => {
      if (Math.abs(p.y - pocketAt) < 0.1 && side * p.x > side * outerX) {
        outerX = p.x;
        outerZ = p.z;
      }
    });
    const cargoPocket = keep(place(new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.38, 0.28, 3, 0.02), trim), cargo, new THREE.Vector3(outerX + side * 0.02, pocketAt, outerZ)));
    cargoPocket.rotation.z = side * 0.04;
  }
  bottoms.add(straight, wide, cargo);
  bottoms.userData.variants = { straight, wide, cargo };
  bottoms.userData.pickVariant = (style) => (style.includes('wide') || style.includes('sweat') ? 'wide' : style.includes('cargo') ? 'cargo' : 'straight');

  // Footwear -----------------------------------------------------------------
  const accessories = new THREE.Group();
  const shoeMaterial = createGarmentMaterial(0x151817);
  const shoe = (collarHeight) => {
    const group = new THREE.Group();
    group.add(buildSkinnedGarment(body, posed, (i) => isFoot(i) || isCalf(i), () => 0.016, shoeMaterial, {
      rangeFor: (i) => (isCalf(i) ? [-Infinity, L.ankle.y + collarHeight] : null),
    }));
    for (const side of [-1, 1]) {
      const box = new THREE.Box3();
      points.forEach((point, i) => {
        if (isFoot(i) && Math.sign(point.x) === side) box.expandByPoint(point);
      });
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      place(new THREE.Mesh(new RoundedBoxGeometry(size.x + 0.1, 0.12, size.z + 0.12, 3, 0.04), shoeMaterial), group, new THREE.Vector3(center.x, box.min.y + 0.02, center.z + 0.02));
      keep(place(new THREE.Mesh(new RoundedBoxGeometry(size.x + 0.13, 0.05, size.z + 0.15, 3, 0.02), materials.acid), group, new THREE.Vector3(center.x, box.min.y - 0.035, center.z + 0.02)));
    }
    return group;
  };
  const highTop = shoe(0.38);
  const runner = shoe(0.06);
  accessories.add(highTop, runner);
  accessories.userData.variants = { highTop, runner };
  accessories.userData.pickVariant = (style) => (style.includes('runner') || style.includes('low') ? 'runner' : 'highTop');

  return { tops, outerwear, bottoms, accessories };
}

// The MakeHuman export still carries its fitting helpers (skirt/tights proxies,
// hair ribbons, joint cubes) plus teeth, tongue and lash cards that need their
// own alpha textures. Keep the body and the eyeballs; the eyeballs are returned
// so the texture pass can paint them (their UVs land on empty texture space).
function stripMakeHumanHelpers(mesh) {
  const geometry = mesh.geometry;
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  const index = geometry.index;
  if (!index || !uv) return [];

  const parent = new Int32Array(position.count).map((_, i) => i);
  const find = (i) => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const union = (a, b) => { parent[find(a)] = find(b); };
  const welded = new Map();
  for (let i = 0; i < position.count; i += 1) {
    const key = `${position.getX(i).toFixed(5)},${position.getY(i).toFixed(5)},${position.getZ(i).toFixed(5)}`;
    if (welded.has(key)) union(i, welded.get(key));
    else welded.set(key, i);
  }
  for (let i = 0; i < index.count; i += 3) {
    union(index.getX(i), index.getX(i + 1));
    union(index.getX(i), index.getX(i + 2));
  }

  const islands = new Map();
  for (let i = 0; i < position.count; i += 1) {
    const root = find(i);
    let island = islands.get(root);
    if (!island) {
      island = {
        count: 0,
        box: new THREE.Box3(),
        uvBox: new THREE.Box2(),
        frontUv: new THREE.Vector2(),
        frontZ: -Infinity,
        backUv: new THREE.Vector2(),
        backZ: Infinity,
      };
      islands.set(root, island);
    }
    island.count += 1;
    island.box.expandByPoint(new THREE.Vector3().fromBufferAttribute(position, i));
    island.uvBox.expandByPoint(new THREE.Vector2().fromBufferAttribute(uv, i));
    if (position.getZ(i) > island.frontZ) {
      island.frontZ = position.getZ(i);
      island.frontUv.fromBufferAttribute(uv, i);
    }
    if (position.getZ(i) < island.backZ) {
      island.backZ = position.getZ(i);
      island.backUv.fromBufferAttribute(uv, i);
    }
  }

  const bodyHeight = new THREE.Box3().setFromBufferAttribute(position).getSize(new THREE.Vector3()).y;
  const keep = new Set();
  const faceParts = [];
  islands.forEach((island, root) => {
    const size = island.box.getSize(new THREE.Vector3());
    const uvSize = island.uvBox.getSize(new THREE.Vector2());
    const isBody = island.count > position.count * 0.5;
    const isEye = island.box.min.y > bodyHeight * 0.9
      && Math.max(size.x, size.y, size.z) < bodyHeight * 0.025
      && Math.min(size.x, size.y, size.z) > bodyHeight * 0.012
      && Math.abs(island.box.getCenter(new THREE.Vector3()).x) > bodyHeight * 0.005
      && uvSize.x + uvSize.y > 0.005;
    if (isBody || isEye) keep.add(root);
    if (isEye) faceParts.push(island);
  });

  const kept = [];
  for (let i = 0; i < index.count; i += 3) {
    if (keep.has(find(index.getX(i)))) kept.push(index.getX(i), index.getX(i + 1), index.getX(i + 2));
  }
  geometry.setIndex(kept);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return faceParts;
}

// The bundled texture is MakeHuman's sci-fi "special suit" (charcoal panels,
// orange seams). Repaint the suit area: limbs become skin, torso and upper
// thighs become a plain base layer so the avatar reads as a person in
// underlayers. Face, scalp, hands and feet keep their photographic texture.
function humanizeSuitTexture(mesh, faceParts = []) {
  const texture = mesh.material.map;
  const image = texture?.image;
  if (!image?.width) return;
  const { width, height } = image;
  const geometry = mesh.geometry;
  const uv = geometry.attributes.uv;
  const position = geometry.attributes.position;
  const skinIndex = geometry.attributes.skinIndex;
  const skinWeight = geometry.attributes.skinWeight;
  const bones = mesh.skeleton.bones;
  const index = geometry.index;
  if (!uv || !skinIndex || !skinWeight || !index) return;

  const bodyBox = new THREE.Box3().setFromBufferAttribute(position);
  const bodyHeight = bodyBox.max.y - bodyBox.min.y;
  const shortsLine = bodyBox.min.y + bodyHeight * 0.41;
  const neckLine = bodyBox.min.y + bodyHeight * 0.795;
  const dominantBone = (vertex) => {
    let best = 0;
    for (let i = 1; i < 4; i += 1) {
      if (skinWeight.getComponent(vertex, i) > skinWeight.getComponent(vertex, best)) best = i;
    }
    return bones[skinIndex.getComponent(vertex, best)]?.name || '';
  };
  const kindFor = (vertex) => {
    const name = dominantBone(vertex);
    if (/^(spine|pelvis)/.test(name)) return 'torso';
    if (/^thigh/.test(name)) return 'thigh';
    if (/^(clavicle|upperarm|lowerarm|calf)/.test(name)) return 'limb';
    if (/^neck/.test(name)) return 'neck';
    return null;
  };

  // Rasterise the suit triangles in UV space; the vertex height is
  // interpolated per pixel so the neckline and shorts hem come out smooth.
  const SKIN = 1;
  const BASE = 2;
  const PATCH = 3;
  const regionMap = new Uint8Array(width * height);
  const coverage = new Uint8Array(width * height);
  const px = [0, 0, 0];
  const py = [0, 0, 0];
  const vy = [0, 0, 0];
  for (let i = 0; i < index.count; i += 3) {
    const kind = kindFor(index.getX(i));
    if (!kind) continue;
    for (let corner = 0; corner < 3; corner += 1) {
      const vertex = index.getX(i + corner);
      px[corner] = uv.getX(vertex) * width;
      py[corner] = (texture.flipY ? 1 - uv.getY(vertex) : uv.getY(vertex)) * height;
      vy[corner] = position.getY(vertex);
    }
    const area = (px[1] - px[0]) * (py[2] - py[0]) - (px[2] - px[0]) * (py[1] - py[0]);
    if (Math.abs(area) < 1e-6) continue;
    const edgeLength = [0, 1, 2].map((e) => Math.hypot(px[(e + 2) % 3] - px[(e + 1) % 3], py[(e + 2) % 3] - py[(e + 1) % 3]) || 1);
    const minX = Math.max(0, Math.floor(Math.min(...px)) - 1);
    const maxX = Math.min(width - 1, Math.ceil(Math.max(...px)) + 1);
    const minY = Math.max(0, Math.floor(Math.min(...py)) - 1);
    const maxY = Math.min(height - 1, Math.ceil(Math.max(...py)) + 1);
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const sx = x + 0.5;
        const sy = y + 0.5;
        const weights = [0, 1, 2].map((e) => {
          const a = (e + 1) % 3;
          const b = (e + 2) % 3;
          return ((px[b] - px[a]) * (sy - py[a]) - (sx - px[a]) * (py[b] - py[a])) / area;
        });
        // Signed distance (in pixels) to each edge; allow a 1.5px bleed for seams.
        let inside = 2;
        let outside = false;
        for (let e = 0; e < 3; e += 1) {
          const distance = (weights[e] * Math.abs(area)) / edgeLength[e];
          if (distance < -1.5) outside = true;
          else if (distance < 0) inside = 1;
        }
        if (outside) continue;
        const pixel = y * width + x;
        if (coverage[pixel] > inside) continue;
        const height3d = weights[0] * vy[0] + weights[1] * vy[1] + weights[2] * vy[2];
        coverage[pixel] = inside;
        if (kind === 'limb') regionMap[pixel] = SKIN;
        else if (kind === 'torso') regionMap[pixel] = height3d < neckLine ? BASE : SKIN;
        else if (kind === 'thigh') regionMap[pixel] = height3d > shortsLine ? BASE : SKIN;
        else regionMap[pixel] = PATCH;
      }
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, width, height);
  const data = pixels.data;

  // Average the texture's own skin tone (face, hands and padding are all skin).
  let skinR = 0;
  let skinG = 0;
  let skinB = 0;
  let skinSamples = 0;
  for (let p = 0; p < data.length; p += 16) {
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    const max = Math.max(r, g, b);
    const saturation = max ? (max - Math.min(r, g, b)) / max : 0;
    if (saturation > 0.3 && saturation < 0.55 && max > 150 && r > g && g > b) {
      skinR += r;
      skinG += g;
      skinB += b;
      skinSamples += 1;
    }
  }
  const skin = skinSamples > 200
    ? [skinR / skinSamples, skinG / skinSamples, skinB / skinSamples]
    : [206, 158, 126];
  const base = [38, 41, 39];

  for (let pixel = 0; pixel < regionMap.length; pixel += 1) {
    const region = regionMap[pixel];
    if (!region) continue;
    const p = pixel * 4;
    if (region === PATCH) {
      // Neck: only replace the suit collar (grey panels / orange seams).
      const r = data[p];
      const g = data[p + 1];
      const b = data[p + 2];
      const max = Math.max(r, g, b);
      const saturation = max ? (max - Math.min(r, g, b)) / max : 0;
      const isSeam = saturation > 0.6 && max > 140 && r > g && g > b;
      if (saturation > 0.28 && !isSeam) continue;
    }
    const tone = region === BASE ? base : skin;
    const grain = 1 + (Math.random() - 0.5) * 0.025;
    data[p] = tone[0] * grain;
    data[p + 1] = tone[1] * grain;
    data[p + 2] = tone[2] * grain;
  }
  context.putImageData(pixels, 0, 0);

  // Eyeballs map onto empty texture space; paint sclera and iris directly.
  const toPixel = (u, v) => [u * width, (texture.flipY ? 1 - v : v) * height];
  faceParts.forEach((part) => {
    const [x0, y0] = toPixel(part.uvBox.min.x, part.uvBox.min.y);
    const [x1, y1] = toPixel(part.uvBox.max.x, part.uvBox.max.y);
    const left = Math.min(x0, x1) - 1;
    const top = Math.min(y0, y1) - 1;
    const boxWidth = Math.abs(x1 - x0) + 2;
    const boxHeight = Math.abs(y1 - y0) + 2;
    context.fillStyle = '#e9e3dc';
    context.fillRect(left, top, boxWidth, boxHeight);
    const [cx, cy] = toPixel(part.frontUv.x, part.frontUv.y);
    const [bx, by] = toPixel(part.backUv.x, part.backUv.y);
    // Front-to-back pole distance spans 180 degrees; an iris is ~30 degrees.
    const radius = Math.max(1.5, Math.hypot(bx - cx, by - cy) * 0.17);
    const iris = context.createRadialGradient(cx, cy, 0, cx, cy, radius);
    iris.addColorStop(0, '#0b0806');
    iris.addColorStop(0.4, '#0f0a08');
    iris.addColorStop(0.48, '#6b4a30');
    iris.addColorStop(0.85, '#4a3122');
    iris.addColorStop(1, 'rgba(60, 40, 28, 0)');
    context.fillStyle = iris;
    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2);
    context.fill();
  });

  const repainted = new THREE.CanvasTexture(canvas);
  repainted.flipY = texture.flipY;
  repainted.colorSpace = THREE.SRGBColorSpace;
  repainted.wrapS = texture.wrapS;
  repainted.wrapT = texture.wrapT;
  repainted.anisotropy = texture.anisotropy;
  mesh.material.map = repainted;
  mesh.material.needsUpdate = true;
  texture.dispose();
}

// Swing a bone so the direction to its child points at `direction` (in the
// human's own space). Used to drop the MakeHuman A-pose into a relaxed stance.
function aimBone(bone, child, direction) {
  const from = child.getWorldPosition(new THREE.Vector3()).sub(bone.getWorldPosition(new THREE.Vector3())).normalize();
  const swing = new THREE.Quaternion().setFromUnitVectors(from, direction.clone().normalize());
  const parentWorld = bone.parent.getWorldQuaternion(new THREE.Quaternion());
  const boneWorld = bone.getWorldQuaternion(new THREE.Quaternion());
  bone.quaternion.copy(parentWorld.invert().multiply(swing).multiply(boneWorld));
  bone.updateMatrixWorld(true);
}

function poseRealisticHuman(human) {
  const bones = {};
  human.traverse((object) => {
    if (object.isBone || object.type === 'Bone') bones[object.name] = object;
  });
  human.updateMatrixWorld(true);
  for (const [suffix, side] of [['l', 1], ['r', -1]]) {
    const bone = (name) => bones[`${name}_${suffix}`];
    if (!bone('upperarm') || !bone('lowerarm') || !bone('hand') || !bone('thigh') || !bone('calf') || !bone('foot')) continue;
    aimBone(bone('upperarm'), bone('lowerarm'), new THREE.Vector3(side * 0.2, -1, 0.02));
    aimBone(bone('lowerarm'), bone('hand'), new THREE.Vector3(side * 0.07, -1, 0.16));
    if (bone('middle_01')) aimBone(bone('hand'), bone('middle_01'), new THREE.Vector3(side * 0.04, -1, 0.1));
    aimBone(bone('thigh'), bone('calf'), new THREE.Vector3(side * 0.035, -1, 0.01));
    aimBone(bone('calf'), bone('foot'), new THREE.Vector3(side * 0.01, -1, -0.04));
  }
}

function loadRealisticHuman() {
  const status = document.querySelector('#human-base-status');
  const loader = new GLTFLoader();

  loader.load(
    '/models/human.glb',
    (gltf) => {
      realisticHuman = gltf.scene;
      realisticHuman.name = 'makehuman-realistic-base';

      realisticHuman.traverse((object) => {
        if (!object.isMesh) return;
        if (object.isSkinnedMesh) {
          humanizeSuitTexture(object, stripMakeHumanHelpers(object));
        }
        object.castShadow = true;
        object.receiveShadow = true;
        object.frustumCulled = false;
        if (object.material) {
          object.material = object.material.clone();
          // Exported as alpha BLEND; render opaque so depth sorting works.
          object.material.transparent = false;
          object.material.depthWrite = true;
          object.material.color.setRGB(0.86, 0.79, 0.76);
          object.material.roughness = 0.82;
          object.material.metalness = 0;
          if (object.material.map) {
            object.material.map.colorSpace = THREE.SRGBColorSpace;
            object.material.map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
          }
        }
      });

      // Normalize the MakeHuman metres-based asset to the existing 6-unit fitting stage.
      let bounds = new THREE.Box3().setFromObject(realisticHuman);
      const size = bounds.getSize(new THREE.Vector3());
      realisticHuman.scale.setScalar(5.88 / size.y);
      realisticHuman.updateMatrixWorld(true);
      bounds = new THREE.Box3().setFromObject(realisticHuman);
      const center = bounds.getCenter(new THREE.Vector3());
      realisticHuman.position.set(-center.x, -bounds.min.y + 0.03, -center.z + 0.02);
      realisticHuman.updateMatrixWorld(true);

      if (gltf.animations.length) {
        const idle = gltf.animations.find((clip) => clip.name.toLowerCase().includes('idle')) || gltf.animations[0];
        avatarMixer = new THREE.AnimationMixer(realisticHuman);
        const action = avatarMixer.clipAction(idle);
        action.play();
        avatarMixer.setTime(Math.min(0.32, idle.duration * 0.12));
        action.paused = true;
      }
      poseRealisticHuman(realisticHuman);

      avatarMorph.add(realisticHuman);
      [...new Set(avatarBodyParts)].forEach((part) => { part.visible = false; });

      let body;
      realisticHuman.traverse((object) => { if (object.isSkinnedMesh) body = object; });
      if (body) {
        // Re-ground after posing (straightened legs reach lower) and centre the feet on the platform.
        const { points } = readPosedBody(body);
        const feet = new THREE.Box3();
        const lowest = Math.min(...points.map((point) => point.y));
        points.forEach((point) => { if (point.y < lowest + 0.25) feet.expandByPoint(point); });
        const feetCenter = feet.getCenter(new THREE.Vector3());
        realisticHuman.position.x -= feetCenter.x;
        realisticHuman.position.y += 0.1 - lowest;
        realisticHuman.position.z -= feetCenter.z;
        Object.entries(buildConformingGarments(body)).forEach(([category, group]) => {
          avatarMorph.remove(avatarGarments[category]);
          group.visible = false;
          group.userData.conforming = true;
          avatarMorph.add(group);
          avatarGarments[category] = group;
        });
      }
      if (status) {
        status.textContent = 'REAL HUMAN BASE / ONLINE';
        status.classList.add('is-ready');
      }
      updateAvatarBody();
      updateAvatarOutfit();
    },
    (event) => {
      if (!status || !event.total) return;
      status.textContent = `LOADING HUMAN / ${Math.round((event.loaded / event.total) * 100)}%`;
    },
    () => {
      if (status) status.textContent = 'HUMAN BASE / FALLBACK MODE';
    },
  );
}

function buildAvatar() {
  avatarBackdrop = new THREE.Group();
  avatarBackdrop.name = 'tryon-backdrop';
  avatarBackdrop.visible = false;
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 28),
    new THREE.MeshBasicMaterial({ color: 0x070908, toneMapped: false }),
  );
  backdrop.position.set(0, 5, 7.08);
  avatarBackdrop.add(backdrop);
  for (const x of [-2.2, 0, 2.2]) {
    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(x === 0 ? 0.018 : 0.035, 15),
      new THREE.MeshBasicMaterial({ color: x === 0 ? 0x55661d : 0x171c19, toneMapped: false }),
    );
    line.position.set(x, 4.5, 7.14);
    avatarBackdrop.add(line);
  }
  scene.add(avatarBackdrop);

  avatarGroup = new THREE.Group();
  avatarGroup.name = 'void-avatar';
  avatarGroup.position.set(0, 0.08, 8);
  avatarGroup.visible = false;

  avatarMorph = new THREE.Group();
  avatarMorph.name = 'body-morph';
  avatarGroup.add(avatarMorph);

  const skin = new THREE.MeshStandardMaterial({ color: 0x9b8778, roughness: 0.86, metalness: 0 });
  const skinShadow = new THREE.MeshStandardMaterial({ color: 0x6c5e55, roughness: 0.9, metalness: 0 });
  const hair = new THREE.MeshStandardMaterial({ color: 0x111412, roughness: 0.88, metalness: 0.02 });
  const joint = new THREE.MeshStandardMaterial({ color: 0x171a19, roughness: 0.74, metalness: 0.12 });
  const garmentMaterial = (color) => new THREE.MeshStandardMaterial({
    color,
    roughness: 0.88,
    metalness: 0.025,
    emissive: new THREE.Color(color).multiplyScalar(0.025),
  });
  const add = (geometry, material, position, parent = avatarMorph) => {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(...position);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  };

  const addSegment = (start, end, radiusTop, radiusBottom, material, parent = avatarMorph, radialSegments = 20) => {
    const from = new THREE.Vector3(...start);
    const to = new THREE.Vector3(...end);
    const direction = to.clone().sub(from);
    const object = add(
      new THREE.CylinderGeometry(radiusTop, radiusBottom, direction.length(), radialSegments),
      material,
      from.clone().add(to).multiplyScalar(0.5).toArray(),
      parent,
    );
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return object;
  };
  const keepColor = (object) => {
    object.userData.keepColor = true;
    return object;
  };

  // Human base: a calm, editorial pose rather than a rigid mannequin.
  const head = add(new THREE.SphereGeometry(0.49, 32, 24), skin, [0, 5.72, 0.03]);
  head.scale.set(0.9, 1.12, 0.92);
  const hairCap = add(new THREE.SphereGeometry(0.505, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.58), hair, [0, 5.81, 0.01]);
  hairCap.scale.set(0.91, 1.08, 0.94);
  add(new THREE.SphereGeometry(0.055, 16, 12), skinShadow, [0, 5.67, 0.475]);
  for (const side of [-1, 1]) {
    add(new THREE.SphereGeometry(0.038, 14, 10), hair, [side * 0.155, 5.79, 0.47]);
    add(new THREE.SphereGeometry(0.075, 14, 10), skin, [side * 0.45, 5.72, 0.02]);
  }
  const mouth = add(new RoundedBoxGeometry(0.14, 0.018, 0.018, 2, 0.006), skinShadow, [0, 5.49, 0.462]);
  mouth.castShadow = false;
  add(new THREE.CylinderGeometry(0.205, 0.24, 0.46, 20), skin, [0, 5.16, 0]);

  const shoulderLine = addSegment([-0.56, 4.7, 0], [0.56, 4.7, 0], 0.27, 0.27, joint);
  const torso = add(new THREE.CylinderGeometry(0.62, 0.46, 1.55, 24), joint, [0, 4.05, 0]);
  const hips = add(new THREE.CylinderGeometry(0.48, 0.53, 0.62, 24), joint, [0, 2.88, 0]);
  avatarBodyParts.push(shoulderLine);
  avatarBodyParts.push(torso, hips);

  for (const side of [-1, 1]) {
    const upperArm = addSegment([side * 0.61, 4.62, 0], [side * 0.78, 3.82, 0.03], 0.2, 0.17, skin);
    const forearm = addSegment([side * 0.78, 3.82, 0.03], [side * 0.72, 3.12, 0.12], 0.17, 0.13, skin);
    const hand = add(new THREE.CapsuleGeometry(0.13, 0.24, 6, 14), skin, [side * 0.71, 2.88, 0.15]);
    hand.rotation.z = side * -0.06;
    const thigh = addSegment([side * 0.28, 2.72, 0], [side * 0.31, 1.62, 0.02], 0.29, 0.24, joint);
    const shin = addSegment([side * 0.31, 1.62, 0.02], [side * 0.32, 0.55, 0.08], 0.23, 0.18, joint);
    avatarBodyParts.push(upperArm, forearm, hand, thigh, shin);
    const baseFoot = add(new RoundedBoxGeometry(0.53, 0.25, 0.9, 5, 0.1), joint, [side * 0.32, 0.26, 0.24]);
    baseFoot.rotation.x = -0.025;
  }

  // Everything currently in avatarMorph is the procedural fallback body. Keep it
  // until the textured GLB is ready, then swap without interrupting the UI.
  avatarBodyParts.length = 0;
  avatarBodyParts.push(...avatarMorph.children);

  // Tee / hoodie layer.
  const top = new THREE.Group();
  const topMaterial = garmentMaterial(0x303632);
  add(new THREE.CylinderGeometry(0.8, 0.68, 1.55, 28), topMaterial, [0, 4.16, 0], top);
  const teeSleeves = new THREE.Group();
  const hoodieParts = new THREE.Group();
  top.add(teeSleeves, hoodieParts);
  for (const side of [-1, 1]) {
    addSegment([side * 0.64, 4.57, 0], [side * 0.83, 3.95, 0.02], 0.32, 0.25, topMaterial, teeSleeves);
    addSegment([side * 0.68, 4.56, 0], [side * 0.86, 3.82, 0.02], 0.34, 0.28, topMaterial, hoodieParts);
    addSegment([side * 0.86, 3.82, 0.02], [side * 0.75, 3.15, 0.11], 0.28, 0.21, topMaterial, hoodieParts);
  }
  const hood = add(new THREE.TorusGeometry(0.49, 0.18, 14, 40, Math.PI * 1.75), topMaterial, [0, 5.02, -0.08], hoodieParts);
  hood.rotation.z = Math.PI * 0.13;
  const hoodiePocket = add(new RoundedBoxGeometry(0.72, 0.36, 0.08, 4, 0.06), topMaterial, [0, 3.75, 0.69], hoodieParts);
  hoodiePocket.rotation.x = -0.02;
  for (const side of [-1, 1]) {
    const drawstring = keepColor(add(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 8), materials.acid, [side * 0.18, 4.74, 0.58], hoodieParts));
    drawstring.rotation.z = side * 0.04;
  }
  hoodieParts.visible = false;
  top.userData.teeSleeves = teeSleeves;
  top.userData.hoodieParts = hoodieParts;
  const topCollar = keepColor(add(new THREE.TorusGeometry(0.235, 0.035, 10, 32), joint, [0, 4.92, 0.29], top));
  topCollar.rotation.x = Math.PI * 0.12;
  const chestMark = keepColor(add(new RoundedBoxGeometry(0.48, 0.15, 0.025, 3, 0.025), materials.acid, [0, 4.24, 0.69], top));
  chestMark.castShadow = false;
  const topHem = keepColor(add(new THREE.TorusGeometry(0.66, 0.024, 8, 40), joint, [0, 3.39, 0], top));
  topHem.rotation.x = Math.PI / 2;
  top.visible = false;
  avatarMorph.add(top);
  avatarGarments.tops = top;

  // Structured outer layer with split front, collar, zipper and pockets.
  const outerwear = new THREE.Group();
  const jacketMaterial = garmentMaterial(0x111412);
  add(new THREE.CylinderGeometry(0.92, 0.75, 2.02, 28), jacketMaterial, [0, 4.03, 0], outerwear);
  const outerSleeves = new THREE.Group();
  const pufferDetails = new THREE.Group();
  outerwear.add(outerSleeves, pufferDetails);
  for (const side of [-1, 1]) {
    addSegment([side * 0.76, 4.58, 0], [side * 0.93, 3.82, 0.02], 0.35, 0.29, jacketMaterial, outerSleeves);
    addSegment([side * 0.93, 3.82, 0.02], [side * 0.78, 3.12, 0.12], 0.29, 0.22, jacketMaterial, outerSleeves);
    const pocket = keepColor(add(new RoundedBoxGeometry(0.42, 0.3, 0.055, 3, 0.035), joint, [side * 0.43, 3.62, 0.72], outerwear));
    pocket.rotation.z = side * -0.09;
  }
  for (const y of [3.48, 3.86, 4.24, 4.62]) {
    keepColor(add(new RoundedBoxGeometry(1.48, 0.035, 0.028, 2, 0.01), joint, [0, y, 0.755], pufferDetails));
  }
  pufferDetails.visible = false;
  outerwear.userData.outerSleeves = outerSleeves;
  outerwear.userData.pufferDetails = pufferDetails;
  const leftPanel = add(new RoundedBoxGeometry(0.69, 1.78, 0.12, 4, 0.05), jacketMaterial, [-0.35, 4.04, 0.66], outerwear);
  const rightPanel = add(new RoundedBoxGeometry(0.69, 1.78, 0.12, 4, 0.05), jacketMaterial, [0.35, 4.04, 0.66], outerwear);
  leftPanel.rotation.z = -0.018;
  rightPanel.rotation.z = 0.018;
  const collar = keepColor(add(new THREE.TorusGeometry(0.47, 0.115, 12, 40, Math.PI * 1.72), joint, [0, 4.97, 0.05], outerwear));
  collar.rotation.z = Math.PI * 0.14;
  const zip = keepColor(add(new THREE.BoxGeometry(0.026, 1.68, 0.035), materials.acid, [0, 4.03, 0.74], outerwear));
  zip.castShadow = false;
  outerwear.visible = false;
  avatarMorph.add(outerwear);
  avatarGarments.outerwear = outerwear;

  // Wide technical trouser layer.
  const bottoms = new THREE.Group();
  const pantsMaterial = garmentMaterial(0x202523);
  add(new THREE.CylinderGeometry(0.62, 0.64, 0.55, 24), pantsMaterial, [0, 2.78, 0], bottoms);
  const cargoDetails = new THREE.Group();
  bottoms.add(cargoDetails);
  for (const side of [-1, 1]) {
    add(new THREE.CylinderGeometry(0.39, 0.29, 2.18, 24), pantsMaterial, [side * 0.31, 1.55, 0.03], bottoms);
    keepColor(add(new RoundedBoxGeometry(0.25, 0.44, 0.08, 3, 0.03), joint, [side * 0.33, 1.88, 0.39], cargoDetails));
    keepColor(add(new THREE.TorusGeometry(0.285, 0.026, 8, 30), joint, [side * 0.31, 0.48, 0.04], bottoms)).rotation.x = Math.PI / 2;
  }
  cargoDetails.visible = false;
  bottoms.userData.cargoDetails = cargoDetails;
  bottoms.visible = false;
  avatarMorph.add(bottoms);
  avatarGarments.bottoms = bottoms;

  // High-top footwear with a visible sole and heel block.
  const accessories = new THREE.Group();
  const shoeMaterial = garmentMaterial(0x151817);
  const ankleParts = new THREE.Group();
  accessories.add(ankleParts);
  for (const side of [-1, 1]) {
    add(new RoundedBoxGeometry(0.58, 0.32, 1.04, 5, 0.1), shoeMaterial, [side * 0.32, 0.27, 0.28], accessories);
    const ankle = add(new RoundedBoxGeometry(0.47, 0.6, 0.58, 5, 0.12), shoeMaterial, [side * 0.32, 0.55, 0.05], ankleParts);
    ankle.rotation.x = -0.05;
    keepColor(add(new RoundedBoxGeometry(0.62, 0.1, 1.08, 3, 0.035), materials.acid, [side * 0.32, 0.105, 0.29], accessories));
  }
  accessories.userData.ankleParts = ankleParts;
  accessories.visible = false;
  avatarMorph.add(accessories);
  avatarGarments.accessories = accessories;

  const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x111412, roughness: 0.32, metalness: 0.74 });
  add(new THREE.CylinderGeometry(1.55, 1.7, 0.18, 64), platformMaterial, [0, -0.04, 0], avatarGroup);
  const ring = keepColor(add(new THREE.TorusGeometry(1.58, 0.025, 10, 80), materials.acid, [0, 0.06, 0], avatarGroup));
  ring.rotation.x = Math.PI / 2;
  ring.castShadow = false;

  const key = new THREE.PointLight(0xe9ffd0, 58, 10, 2);
  key.position.set(2.8, 5.8, 3.2);
  avatarGroup.add(key);
  const rim = new THREE.PointLight(0xd7ff3f, 36, 9, 2);
  rim.position.set(-2.4, 3.8, -1.9);
  avatarGroup.add(rim);
  scene.add(avatarGroup);
  loadRealisticHuman();
}

const garmentMeshes = [];
const textureLoader = new THREE.TextureLoader();
const SHOWROOM_PAGE_SIZE = 5;
let showroomPage = 0;
let currentFilter = 'all';

function fitTextureCover(texture, targetAspect) {
  const imageAspect = texture.image.width / texture.image.height;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  if (imageAspect > targetAspect) {
    texture.repeat.set(targetAspect / imageAspect, 1);
    texture.offset.set((1 - texture.repeat.x) / 2, 0);
  } else {
    texture.repeat.set(1, imageAspect / targetAspect);
    texture.offset.set(0, (1 - texture.repeat.y) / 2);
  }

  texture.needsUpdate = true;
}

function makeProductLabel(product) {
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 768;
  labelCanvas.height = 150;
  const context = labelCanvas.getContext('2d');
  context.fillStyle = '#090a09';
  context.fillRect(0, 0, labelCanvas.width, labelCanvas.height);
  context.fillStyle = '#d7ff3f';
  context.fillRect(0, 0, 12, labelCanvas.height);
  context.fillStyle = '#f1f0ea';
  context.font = '700 42px Arial';
  context.fillText(product.name.toUpperCase(), 42, 62);
  context.fillStyle = '#9ea59d';
  context.font = '26px monospace';
  context.fillText(`${product.id}   ${product.price}`, 42, 111);

  const texture = new THREE.CanvasTexture(labelCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(1.72, 0.34),
    new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }),
  );
  label.position.set(0, -1.45, 0.1);
  label.userData.isProductLabel = true;
  return label;
}

function buildProducts() {
  garmentMeshes.forEach((group) => {
    scene.remove(group);
    group.traverse((child) => {
      child.geometry?.dispose?.();
      if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose?.());
      else child.material?.dispose?.();
    });
  });
  garmentMeshes.length = 0;

  const filteredProducts = currentFilter === 'all'
    ? products
    : products.filter((product) => product.category === currentFilter);
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / SHOWROOM_PAGE_SIZE));
  showroomPage = THREE.MathUtils.clamp(showroomPage, 0, totalPages - 1);
  const pageProducts = filteredProducts.slice(
    showroomPage * SHOWROOM_PAGE_SIZE,
    showroomPage * SHOWROOM_PAGE_SIZE + SHOWROOM_PAGE_SIZE,
  );
  const positionSets = {
    1: [0],
    2: [-2.78, 2.78],
    3: [-2.78, 0, 2.78],
    4: [-4.16, -1.38, 1.38, 4.16],
    5: [-5.55, -2.78, 0, 2.78, 5.55],
  };
  const positions = positionSets[pageProducts.length] || positionSets[5];
  const cardWidth = 1.72;
  const cardHeight = 2.68;
  const cardAspect = cardWidth / cardHeight;

  pageProducts.forEach((product, index) => {
    const group = new THREE.Group();
    group.position.set(positions[index], 3.46, -5.58);
    group.userData.product = product;
    group.userData.baseY = 3.46;
    group.userData.baseZ = -5.58;

    const backplate = new THREE.Mesh(
      new RoundedBoxGeometry(cardWidth + 0.14, cardHeight + 0.5, 0.1, 3, 0.045),
      new THREE.MeshBasicMaterial({ color: 0x070908 }),
    );
    backplate.position.y = -0.1;
    group.add(backplate);

    const texture = textureLoader.load(product.image, (loadedTexture) => {
      loadedTexture.colorSpace = THREE.SRGBColorSpace;
      loadedTexture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
      fitTextureCover(loadedTexture, cardAspect);
    });
    texture.colorSpace = THREE.SRGBColorSpace;

    const photo = new THREE.Mesh(
      new THREE.PlaneGeometry(cardWidth, cardHeight),
      new THREE.MeshBasicMaterial({
        map: texture,
        color: 0xbcc8b3,
        toneMapped: false,
      }),
    );
    photo.position.set(0, 0.12, 0.065);
    photo.userData.isProductPhoto = true;
    group.add(photo);

    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(cardWidth + 0.04, cardHeight + 0.04),
      new THREE.MeshBasicMaterial({
        color: 0xd7ff3f,
        transparent: true,
        opacity: 0.055,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    glass.position.set(0, 0.12, 0.085);
    group.add(glass);

    const edgeMaterial = new THREE.MeshBasicMaterial({ color: 0xa7bd49 });
    const verticalEdgeGeometry = new THREE.BoxGeometry(0.025, cardHeight + 0.08, 0.025);
    const horizontalEdgeGeometry = new THREE.BoxGeometry(cardWidth + 0.08, 0.025, 0.025);
    for (const x of [-cardWidth / 2 - 0.02, cardWidth / 2 + 0.02]) {
      const edge = new THREE.Mesh(verticalEdgeGeometry, edgeMaterial);
      edge.position.set(x, 0.12, 0.1);
      group.add(edge);
    }
    for (const y of [-cardHeight / 2 + 0.12, cardHeight / 2 + 0.12]) {
      const edge = new THREE.Mesh(horizontalEdgeGeometry, edgeMaterial);
      edge.position.set(0, y, 0.1);
      group.add(edge);
    }

    group.add(makeProductLabel(product));

    group.rotation.y = (index - 2) * -0.028;
    scene.add(group);
    garmentMeshes.push(group);
  });

  const pageLabel = document.querySelector('#showroom-page');
  const previousButton = document.querySelector('#showroom-prev');
  const nextButton = document.querySelector('#showroom-next');
  if (pageLabel) pageLabel.textContent = `Display ${String(showroomPage + 1).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}`;
  if (previousButton) previousButton.disabled = showroomPage === 0;
  if (nextButton) nextButton.disabled = showroomPage >= totalPages - 1;
}

function addBrandMark() {
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 1024;
  labelCanvas.height = 230;
  const ctx = labelCanvas.getContext('2d');
  ctx.clearRect(0, 0, labelCanvas.width, labelCanvas.height);
  ctx.fillStyle = '#eef1ea';
  ctx.font = '900 126px Arial Black, Arial';
  ctx.textAlign = 'center';
  ctx.fillText('VOID / 01', 512, 138);
  ctx.fillStyle = '#d7ff3f';
  ctx.font = '26px monospace';
  ctx.fillText('YOUTH DIVISION  —  ULAANBAATAR', 512, 195);
  const texture = new THREE.CanvasTexture(labelCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 1.26),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.92 }),
  );
  sign.position.set(0, 6.45, -6.47);
  scene.add(sign);
}

function addAtmosphere() {
  const count = 420;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 16;
    positions[i * 3 + 1] = Math.random() * 7;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 13;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0xd9d8cf, size: 0.012, transparent: true, opacity: 0.32 }),
  );
  points.userData.atmosphere = true;
  scene.add(points);

  const ambient = new THREE.AmbientLight(0xd5ddd2, 2.15);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0xd8ded0, 0x101312, 2.6);
  scene.add(hemi);

  const frontLight = new THREE.DirectionalLight(0xf2eee3, 3.4);
  frontLight.position.set(-3, 6, 6);
  frontLight.castShadow = true;
  frontLight.shadow.mapSize.set(1024, 1024);
  scene.add(frontLight);

  const acidGlow = new THREE.PointLight(0xb9ff38, 95, 12, 2);
  acidGlow.position.set(0, 4.8, -5.4);
  scene.add(acidGlow);
}

buildRoom();
buildCorridor();
buildEntrance();
buildAvatar();
buildProducts();
addBrandMark();
addAtmosphere();

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(3, 3);
const clock = new THREE.Clock();
let hovered = null;
let selected = null;
let dragging = false;
let previousPointer = { x: 0, y: 0 };

const drawer = document.querySelector('#product-drawer');
const label = document.querySelector('#piece-label');
const intro = document.querySelector('.intro');
const fitPanel = document.querySelector('#fit-panel');
const fitItemsElement = document.querySelector('#fit-items');
const fitTotalElement = document.querySelector('#fit-total');
const bagButton = document.querySelector('.bag-button');
const addToBagButton = document.querySelector('#add-to-bag');
const tryonStudio = document.querySelector('#tryon-studio');
const avatarOutfitElement = document.querySelector('#avatar-outfit');
const openTryonButton = document.querySelector('#open-tryon');
const adminPanel = document.querySelector('#admin-panel');
const adminForm = document.querySelector('#admin-form');
const adminProductList = document.querySelector('#admin-product-list');
const fit = [];
let pendingImageData = '';
let pendingBackImageData = '';
let pendingSideImageData = '';
let pendingGlbName = '';
let pendingGeneratedGlb = null;
let pendingGlbUrl = '';
let pendingGlbSource = '';
let pendingAccent = '#74862d';

function productFromObject(object) {
  let current = object;
  while (current) {
    if (current.userData?.product) return current.userData.product;
    current = current.parent;
  }
  return null;
}

function groupFromProduct(product) {
  return garmentMeshes.find((group) => group.userData.product.id === product.id);
}

function enterRoom() {
  roomEntered = true;
  targetEntranceProgress = 1;
  intro.classList.add('is-hidden');
  document.body.classList.add('room-entered');
  targetZoom = 7.8;
}

function avatarZoomForViewport() {
  const aspect = window.innerWidth / window.innerHeight;
  return THREE.MathUtils.clamp(10.8 * Math.max(1, 0.58 / aspect), 10.8, 22);
}

function openTryon() {
  if (!fit.length) return;
  closeProduct();
  closeFit();
  avatarMode = true;
  avatarBackdrop.visible = true;
  avatarGroup.visible = true;
  cameraTarget.set(0, 3.05, 8);
  targetZoom = avatarZoomForViewport();
  currentZoom = targetZoom;
  currentOrbitZ = cameraTarget.z;
  targetYaw = 0;
  currentYaw = 0;
  targetPitch = 0;
  currentPitch = 0;
  label.classList.remove('is-visible');
  tryonStudio.classList.add('is-open');
  tryonStudio.setAttribute('aria-hidden', 'false');
  document.body.classList.add('tryon-is-open');
  updateAvatarOutfit();
  updateAvatarBody();
}

function closeTryon() {
  avatarMode = false;
  avatarBackdrop.visible = false;
  avatarGroup.visible = false;
  tryonStudio.classList.remove('is-open');
  tryonStudio.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('tryon-is-open');
  cameraTarget.set(0, 2.55, -3.2);
  targetZoom = 7.8;
}

function closeAdmin() {
  adminPanel.classList.remove('is-open');
  adminPanel.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('admin-is-open');
}

function openAdmin() {
  closeProduct();
  closeFit();
  closeTryon();
  label.classList.remove('is-visible');
  renderAdminProducts();
  updateAdminSku();
  adminPanel.classList.add('is-open');
  adminPanel.setAttribute('aria-hidden', 'false');
  document.body.classList.add('admin-is-open');
}

function closeProduct() {
  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('is-inspecting');
  selected = null;
}

function openFit() {
  closeProduct();
  fitPanel.classList.add('is-open');
  fitPanel.setAttribute('aria-hidden', 'false');
  document.body.classList.add('fit-is-open');
}

function closeFit() {
  fitPanel.classList.remove('is-open');
  fitPanel.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('fit-is-open');
}

function priceValue(price) {
  return Number(price.replace(/[^0-9]/g, ''));
}

function updateFit() {
  document.querySelector('#bag-count').textContent = String(fit.length).padStart(2, '0');
  fitTotalElement.textContent = `₮${fit
    .reduce((total, product) => total + priceValue(product.price), 0)
    .toLocaleString('en-US')}`;
  openTryonButton.disabled = fit.length === 0;
  document.querySelector('#outfit-count').textContent = `${String(fit.length).padStart(2, '0')} pieces`;

  if (!fit.length) {
    fitItemsElement.innerHTML = `
      <div class="fit-empty">
        <span>00</span>
        <strong>No pieces selected</strong>
        <small>Open a cabinet piece and add it to your fit.</small>
      </div>`;
    updateAvatarOutfit();
    return;
  }

  fitItemsElement.innerHTML = fit.map((product, index) => `
    <article class="fit-item" style="--item-accent:${product.accent}">
      <span class="fit-item-index">0${index + 1}</span>
      <img src="${product.image}" alt="" />
      <div>
        <small>${product.id} / ${product.colorName}</small>
        <strong>${product.name}</strong>
        <span>${product.price}</span>
      </div>
      <button type="button" data-remove="${product.id}" aria-label="Remove ${product.name}">×</button>
    </article>`).join('');
  updateAvatarOutfit();
}

function setGarmentColor(group, color) {
  group.traverse((child) => {
    if (!child.isMesh || child.userData.keepColor || child.material === materials.acid || !child.material?.color) return;
    child.material.color.set(color);
    if (child.material.emissive) child.material.emissive.set(color).multiplyScalar(0.025);
  });
}

function applyGarmentVariant(category, product) {
  const style = product?.style || '';
  const garment = avatarGarments[category];
  if (garment.userData.pickVariant) {
    const active = garment.userData.pickVariant(style);
    Object.entries(garment.userData.variants).forEach(([name, variant]) => { variant.visible = name === active; });
    return;
  }
  if (category === 'tops') {
    const isHoodie = style.includes('hoodie');
    avatarGarments.tops.userData.hoodieParts.visible = isHoodie;
    avatarGarments.tops.userData.teeSleeves.visible = !isHoodie;
  }
  if (category === 'outerwear') {
    avatarGarments.outerwear.userData.outerSleeves.visible = !style.includes('vest');
    avatarGarments.outerwear.userData.pufferDetails.visible = style.includes('puffer');
  }
  if (category === 'bottoms') {
    avatarGarments.bottoms.userData.cargoDetails.visible = style.includes('cargo');
  }
  if (category === 'accessories') {
    avatarGarments.accessories.userData.ankleParts.visible = !style.includes('runner');
  }
}

function updateAvatarOutfit() {
  if (!avatarGroup) return;
  const categories = ['tops', 'outerwear', 'bottoms', 'accessories'];
  categories.forEach((category) => {
    const selectedItem = [...fit].reverse().find((product) => product.category === category);
    avatarGarments[category].visible = Boolean(selectedItem);
    if (selectedItem) {
      setGarmentColor(avatarGarments[category], selectedItem.accent);
      applyGarmentVariant(category, selectedItem);
    }
  });

  if (!avatarOutfitElement) return;
  avatarOutfitElement.innerHTML = fit.length
    ? fit.map((product) => `
      <article style="--outfit-accent:${product.accent}">
        <img src="${product.image}" alt="" />
        <div><span>${product.category}</span><strong>${product.name}</strong></div>
        <button type="button" data-avatar-remove="${product.id}" aria-label="Remove ${product.name}">×</button>
      </article>`).join('')
    : '<p class="avatar-empty">Add showroom pieces to build an outfit.</p>';
}

function updateAvatarBody() {
  if (!avatarGroup) return;
  const height = Number(document.querySelector('#avatar-height').value);
  const weight = Number(document.querySelector('#avatar-weight').value);
  const fitPreference = Number(document.querySelector('#avatar-fit').value);
  const heightScale = height / 175;
  const widthScale = THREE.MathUtils.clamp(0.82 + (weight - 45) / 220, 0.82, 1.22);
  avatarGroup.scale.set(1, heightScale, 1);
  avatarMorph.scale.set(widthScale, 1, widthScale);
  const garmentEase = [0.97, 1.045, 1.13][fitPreference];
  Object.values(avatarGarments).forEach((garment) => {
    if (!garment.userData.conforming) {
      garment.scale.set(garmentEase, 1, garmentEase);
      return;
    }
    garment.traverse((child) => {
      if (child.userData.fit) applyGarmentEase(child, GARMENT_EASE[fitPreference]);
    });
  });
  document.querySelector('#height-value').textContent = `${height} cm`;
  document.querySelector('#weight-value').textContent = `${weight} kg`;
  document.querySelector('#fit-value').textContent = ['Slim', 'Regular', 'Oversized'][fitPreference];
  document.querySelector('#avatar-body-code').textContent = `${height} / ${weight}`;

  const bmi = weight / ((height / 100) ** 2);
  let sizeIndex = bmi < 20 ? 0 : bmi < 25.5 ? 1 : bmi < 30 ? 2 : 3;
  sizeIndex = THREE.MathUtils.clamp(sizeIndex + fitPreference - 1, 0, 3);
  document.querySelector('#suggested-size').textContent = ['S', 'M', 'L', 'XL'][sizeIndex];
}

function nextProductId() {
  const highest = products.reduce((max, product) => {
    const value = Number(product.id.replace(/\D/g, ''));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `V/${String(highest + 1).padStart(3, '0')}`;
}

function updateAdminSku() {
  const sku = document.querySelector('#admin-sku-preview');
  if (sku) sku.textContent = nextProductId();
}

function renderAdminProducts() {
  document.querySelector('#admin-product-count').textContent = `${String(products.length).padStart(2, '0')} pieces`;
  const readyCount = products.filter((product) => product.tryOn?.ready).length;
  document.querySelector('#admin-ready-count').textContent = `${String(readyCount).padStart(2, '0')} try-on ready`;
  adminProductList.innerHTML = products.map((product) => `
    <article class="admin-product-item">
      <img src="${product.image}" alt="" />
      <div><small>${product.id} / ${product.category}</small><strong>${product.name}</strong><span>${product.price}</span></div>
      <b class="${product.tryOn?.ready ? 'is-ready' : ''}">${product.tryOn?.ready ? '3D' : 'IMG'}</b>
      ${product.isCustom ? `<button type="button" data-delete-product="${product.id}" aria-label="Delete ${product.name}">×</button>` : ''}
    </article>`).join('');
}

function showProduct(product) {
  closeFit();
  selected = product;
  drawer.classList.add('is-open');
  drawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-inspecting');
  document.querySelector('#product-code').textContent = product.id;
  document.querySelector('#product-name').textContent = product.name;
  document.querySelector('#product-description').textContent = product.description;
  document.querySelector('#product-color').textContent = product.colorName;
  document.querySelector('#product-price').textContent = product.price;
  document.querySelector('#product-visual').style.setProperty('--product-color', product.accent);
  const productImage = document.querySelector('#product-image');
  productImage.src = product.image;
  productImage.alt = product.name;
  intro.classList.add('is-hidden');
  const isAdded = fit.some((item) => item.id === product.id);
  addToBagButton.innerHTML = isAdded ? 'In your fit <span>✓</span>' : 'Add to fit <span>＋</span>';
}

function setFilter(filter) {
  currentFilter = filter;
  showroomPage = 0;
  buildProducts();
}

document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach((item) => item.classList.remove('is-active'));
    button.classList.add('is-active');
    setFilter(button.dataset.filter);
    enterRoom();
    targetZoom = 8.2;
  });
});

document.querySelector('#enter-room').addEventListener('click', enterRoom);

document.querySelector('.drawer-close').addEventListener('click', closeProduct);
document.querySelector('.fit-close').addEventListener('click', closeFit);
bagButton.addEventListener('click', openFit);
document.querySelector('.admin-button').addEventListener('click', openAdmin);
document.querySelector('.admin-close').addEventListener('click', closeAdmin);
document.querySelector('.tryon-close').addEventListener('click', closeTryon);
openTryonButton.addEventListener('click', openTryon);

document.querySelector('#showroom-prev').addEventListener('click', () => {
  showroomPage = Math.max(0, showroomPage - 1);
  buildProducts();
});

document.querySelector('#showroom-next').addEventListener('click', () => {
  showroomPage += 1;
  buildProducts();
});

for (const id of ['#avatar-height', '#avatar-weight', '#avatar-fit']) {
  document.querySelector(id).addEventListener('input', updateAvatarBody);
}
document.querySelector('#avatar-left').addEventListener('click', () => { targetAvatarYaw -= Math.PI / 4; });
document.querySelector('#avatar-right').addEventListener('click', () => { targetAvatarYaw += Math.PI / 4; });

avatarOutfitElement.addEventListener('click', (event) => {
  const removeButton = event.target.closest('[data-avatar-remove]');
  if (!removeButton) return;
  const index = fit.findIndex((product) => product.id === removeButton.dataset.avatarRemove);
  if (index !== -1) fit.splice(index, 1);
  updateFit();
  if (!fit.length) closeTryon();
});

function readImageFile(file, limitMb = 1.5) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    if (file.size > limitMb * 1024 * 1024) return reject(new Error(`Use an optimized image under ${limitMb} MB.`));
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result)));
    reader.addEventListener('error', () => reject(new Error('Could not read this image.')));
    reader.readAsDataURL(file);
  });
}

function analyzeGarmentColor(dataUrl) {
  return new Promise((resolve) => {
    const image = new Image();
    image.addEventListener('load', () => {
      const sample = document.createElement('canvas');
      sample.width = 48;
      sample.height = 48;
      const context = sample.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0, 48, 48);
      const pixels = context.getImageData(0, 0, 48, 48).data;
      let red = 0;
      let green = 0;
      let blue = 0;
      let weight = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];
        const alpha = pixels[index + 3];
        const brightest = Math.max(r, g, b);
        const darkest = Math.min(r, g, b);
        if (alpha < 100 || brightest > 242 || (brightest - darkest < 8 && brightest > 210)) continue;
        const pixelWeight = 0.35 + (255 - brightest) / 255;
        red += r * pixelWeight;
        green += g * pixelWeight;
        blue += b * pixelWeight;
        weight += pixelWeight;
      }
      if (!weight) return resolve('#2b302e');
      const toHex = (value) => Math.round(value / weight).toString(16).padStart(2, '0');
      resolve(`#${toHex(red)}${toHex(green)}${toHex(blue)}`);
    });
    image.addEventListener('error', () => resolve('#2b302e'));
    image.src = dataUrl;
  });
}

function setPipelineProgress(doneCount, currentIndex = -1) {
  document.querySelectorAll('#admin-pipeline span').forEach((step, index) => {
    step.classList.toggle('is-done', index < doneCount);
    step.classList.toggle('is-current', index === currentIndex);
  });
}

async function createStreetwearDraftGlb() {
  const style = document.querySelector('#admin-silhouette').value;
  const category = document.querySelector('#admin-category').value;
  const group = new THREE.Group();
  group.name = `VOID_${style.replace(/-/g, '_').toUpperCase()}`;
  const material = new THREE.MeshStandardMaterial({ color: pendingAccent, roughness: 0.86, metalness: 0.03 });
  const detail = new THREE.MeshStandardMaterial({ color: 0x151918, roughness: 0.68, metalness: 0.18 });
  const acid = new THREE.MeshStandardMaterial({ color: 0xd7ff3f, roughness: 0.5, metalness: 0.05 });
  const addDraft = (geometry, mat, position, rotation = [0, 0, 0]) => {
    const object = new THREE.Mesh(geometry, mat);
    object.position.set(...position);
    object.rotation.set(...rotation);
    object.castShadow = true;
    group.add(object);
    return object;
  };

  if (category === 'tops' || category === 'outerwear') {
    const outer = category === 'outerwear';
    addDraft(new THREE.CylinderGeometry(outer ? 0.93 : 0.82, outer ? 0.75 : 0.69, outer ? 2.05 : 1.62, 28), material, [0, 1.32, 0]);
    const longSleeve = outer || style.includes('hoodie');
    for (const side of [-1, 1]) {
      addDraft(
        new THREE.CylinderGeometry(longSleeve ? 0.23 : 0.27, longSleeve ? 0.34 : 0.31, longSleeve ? 1.75 : 0.72, 20),
        material,
        [side * (outer ? 0.91 : 0.8), longSleeve ? 1.28 : 1.58, 0],
        [0, 0, side * -0.1],
      );
    }
    if (style.includes('hoodie')) {
      const hood = addDraft(new THREE.TorusGeometry(0.5, 0.18, 14, 40, Math.PI * 1.75), material, [0, 2.33, -0.06]);
      hood.rotation.z = Math.PI * 0.13;
      addDraft(new RoundedBoxGeometry(0.72, 0.36, 0.08, 4, 0.06), material, [0, 0.9, 0.7]);
    }
    if (style.includes('puffer')) {
      for (const y of [0.68, 1.05, 1.42, 1.79]) addDraft(new RoundedBoxGeometry(1.48, 0.035, 0.025, 2, 0.01), detail, [0, y, 0.76]);
    }
    addDraft(new THREE.BoxGeometry(0.025, outer ? 1.7 : 0.54, 0.03), acid, [0, 1.34, outer ? 0.76 : 0.69]);
  } else if (category === 'bottoms') {
    addDraft(new THREE.CylinderGeometry(0.62, 0.65, 0.55, 24), material, [0, 2.25, 0]);
    for (const side of [-1, 1]) {
      addDraft(new THREE.CylinderGeometry(0.31, 0.41, 2.2, 24), material, [side * 0.32, 1.03, 0]);
      if (style.includes('cargo')) addDraft(new RoundedBoxGeometry(0.31, 0.48, 0.11, 3, 0.04), detail, [side * 0.34, 1.28, 0.36]);
    }
  } else {
    for (const side of [-1, 1]) {
      addDraft(new RoundedBoxGeometry(0.62, 0.34, 1.1, 5, 0.11), material, [side * 0.36, 0.24, 0.22]);
      if (style.includes('high')) addDraft(new RoundedBoxGeometry(0.49, 0.66, 0.62, 5, 0.12), material, [side * 0.36, 0.62, 0]);
      addDraft(new RoundedBoxGeometry(0.66, 0.1, 1.14, 3, 0.035), acid, [side * 0.36, 0.06, 0.23]);
    }
  }

  group.traverse((object) => {
    if (object.isMesh) object.geometry.computeVertexNormals();
  });
  const exporter = new GLTFExporter();
  const result = await exporter.parseAsync(group, { binary: true, onlyVisible: true });
  return new Blob([result], { type: 'model/gltf-binary' });
}

const adminImageInput = document.querySelector('#admin-image');
adminImageInput.addEventListener('change', async () => {
  const file = adminImageInput.files?.[0];
  const message = document.querySelector('#admin-message');
  if (!file) return;
  try {
    pendingImageData = await readImageFile(file);
    pendingAccent = await analyzeGarmentColor(pendingImageData);
    const preview = document.querySelector('#admin-image-preview');
    preview.src = pendingImageData;
    preview.classList.add('is-visible');
    setPipelineProgress(1, 1);
    message.textContent = `${file.name} analyzed · palette ${pendingAccent} · choose silhouette and build.`;
    message.classList.remove('is-error');
  } catch (error) {
    adminImageInput.value = '';
    pendingImageData = '';
    message.textContent = error.message;
    message.classList.add('is-error');
  }
});

for (const [inputId, labelId, target] of [
  ['#admin-image-back', '#admin-back-label', 'back'],
  ['#admin-image-side', '#admin-side-label', 'side'],
]) {
  document.querySelector(inputId).addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const message = document.querySelector('#admin-message');
    try {
      const data = await readImageFile(file);
      if (target === 'back') pendingBackImageData = data;
      else pendingSideImageData = data;
      document.querySelector(labelId).textContent = 'Ready';
      message.textContent = `${target} view added. Multi-view geometry will preserve the silhouette better.`;
      message.classList.remove('is-error');
    } catch (error) {
      event.target.value = '';
      document.querySelector(labelId).textContent = 'Add';
      message.textContent = error.message;
      message.classList.add('is-error');
    }
  });
}

document.querySelector('#admin-category').addEventListener('change', (event) => {
  const defaults = { tops: 'oversized-tee', outerwear: 'puffer-jacket', bottoms: 'cargo-pant', accessories: 'high-top' };
  document.querySelector('#admin-silhouette').value = defaults[event.target.value];
});

document.querySelector('#admin-build-draft').addEventListener('click', async (event) => {
  const message = document.querySelector('#admin-message');
  if (!pendingImageData) {
    message.textContent = 'Add a clean front image before building the 3D draft.';
    message.classList.add('is-error');
    return;
  }
  const button = event.currentTarget;
  button.disabled = true;
  button.querySelector('span').textContent = 'Building geometry…';
  setPipelineProgress(1, 1);
  try {
    pendingGeneratedGlb = await createStreetwearDraftGlb();
    pendingGlbSource = 'instant-draft';
    setPipelineProgress(3, 3);
    if (pendingGlbUrl) URL.revokeObjectURL(pendingGlbUrl);
    pendingGlbUrl = URL.createObjectURL(pendingGeneratedGlb);
    const nameSeed = (document.querySelector('#admin-name').value || 'void-garment').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    pendingGlbName = `${nameSeed || 'void-garment'}-draft.glb`;
    const download = document.querySelector('#admin-glb-download');
    download.href = pendingGlbUrl;
    download.download = pendingGlbName;
    download.hidden = false;
    document.querySelector('#admin-glb-label').textContent = pendingGlbName;
    message.textContent = 'Draft GLB ready. Procedural body mapping is active; production rigging needs the AI worker.';
    message.classList.remove('is-error');
  } catch (error) {
    setPipelineProgress(1, 1);
    message.textContent = `3D build failed: ${error.message}`;
    message.classList.add('is-error');
  } finally {
    button.disabled = false;
    button.querySelector('span').textContent = 'Rebuild instant 3D draft';
  }
});

document.querySelector('#admin-glb').addEventListener('change', (event) => {
  pendingGlbName = event.target.files?.[0]?.name || '';
  if (pendingGlbName) {
    pendingGeneratedGlb = event.target.files[0];
    pendingGlbSource = 'production-glb';
    setPipelineProgress(4, -1);
  }
  document.querySelector('#admin-glb-label').textContent = pendingGlbName || 'Or attach production GLB';
});

adminForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const message = document.querySelector('#admin-message');
  if (!pendingImageData) {
    message.textContent = 'Choose a product image before publishing.';
    message.classList.add('is-error');
    return;
  }
  const clean = (value) => value.trim().replace(/[<>&"'`]/g, '');
  const category = document.querySelector('#admin-category').value;
  const product = {
    id: nextProductId(),
    name: clean(document.querySelector('#admin-name').value),
    category,
    price: `₮${Number(document.querySelector('#admin-price').value).toLocaleString('en-US')}`,
    colorName: clean(document.querySelector('#admin-color').value),
    accent: pendingAccent,
    style: document.querySelector('#admin-silhouette').value,
    image: pendingImageData,
    description: clean(document.querySelector('#admin-description').value),
    showroom: {
      display: document.querySelector('#admin-display').value,
      collection: clean(document.querySelector('#admin-collection').value),
      featured: document.querySelector('#admin-featured').checked,
    },
    tryOn: {
      ready: Boolean(pendingGlbName),
      fileName: pendingGlbName,
      rig: pendingGlbSource === 'production-glb' ? 'VOID_BASE_V1' : 'PROCEDURAL_MAP_V1',
      source: pendingGlbSource || 'image-only',
      views: 1 + Number(Boolean(pendingBackImageData)) + Number(Boolean(pendingSideImageData)),
    },
    isCustom: true,
  };

  customProducts.push(product);
  try {
    localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(customProducts));
  } catch {
    customProducts.pop();
    message.textContent = 'Browser storage is full. Use a smaller image and try again.';
    message.classList.add('is-error');
    return;
  }

  products = [...defaultProducts, ...customProducts];
  currentFilter = 'all';
  showroomPage = Math.max(0, Math.ceil(products.length / SHOWROOM_PAGE_SIZE) - 1);
  document.querySelectorAll('[data-filter]').forEach((item) => item.classList.toggle('is-active', item.dataset.filter === 'all'));
  buildProducts();
  renderAdminProducts();
  adminForm.reset();
  document.querySelector('#admin-collection').value = 'DROP 001';
  document.querySelector('#admin-image-preview').classList.remove('is-visible');
  document.querySelector('#admin-glb-label').textContent = 'Or attach production GLB';
  document.querySelector('#admin-back-label').textContent = 'Add';
  document.querySelector('#admin-side-label').textContent = 'Add';
  document.querySelector('#admin-glb-download').hidden = true;
  document.querySelector('#admin-silhouette').value = 'oversized-tee';
  pendingImageData = '';
  pendingBackImageData = '';
  pendingSideImageData = '';
  pendingGlbName = '';
  pendingGeneratedGlb = null;
  pendingGlbSource = '';
  pendingAccent = '#74862d';
  setPipelineProgress(0, 0);
  updateAdminSku();
  message.textContent = `${product.id} published. It is live on the latest showroom display.`;
  message.classList.remove('is-error');
});

adminProductList.addEventListener('click', (event) => {
  const deleteButton = event.target.closest('[data-delete-product]');
  if (!deleteButton) return;
  const product = customProducts.find((item) => item.id === deleteButton.dataset.deleteProduct);
  if (!product || !window.confirm(`Remove ${product.name} from this local showroom?`)) return;
  customProducts = customProducts.filter((item) => item.id !== product.id);
  localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(customProducts));
  products = [...defaultProducts, ...customProducts];
  buildProducts();
  renderAdminProducts();
  updateAdminSku();
});

addToBagButton.addEventListener('click', (event) => {
  if (selected && !fit.some((item) => item.id === selected.id)) fit.push(selected);
  updateFit();
  event.currentTarget.innerHTML = 'Added to fit <span>✓</span>';
  window.setTimeout(openFit, 520);
});

fitItemsElement.addEventListener('click', (event) => {
  const removeButton = event.target.closest('[data-remove]');
  if (!removeButton) return;
  const index = fit.findIndex((product) => product.id === removeButton.dataset.remove);
  if (index !== -1) fit.splice(index, 1);
  updateFit();
});

document.querySelector('#fit-checkout').addEventListener('click', (event) => {
  if (!fit.length) return;
  event.currentTarget.innerHTML = 'Fit reserved / demo <span>✓</span>';
  window.setTimeout(() => {
    event.currentTarget.innerHTML = 'Reserve this fit <span>↗</span>';
  }, 1800);
});

window.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  closeProduct();
  closeFit();
  closeTryon();
  closeAdmin();
});

window.addEventListener('pointerdown', (event) => {
  if (event.target !== canvas) return;
  dragging = true;
  previousPointer = { x: event.clientX, y: event.clientY };
});

window.addEventListener('pointerup', (event) => {
  if (!dragging) return;
  const movement = Math.hypot(event.clientX - previousPointer.x, event.clientY - previousPointer.y);
  dragging = false;
  if (!avatarMode && movement < 6 && hovered) showProduct(hovered.userData.product);
});

window.addEventListener('pointermove', (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  label.style.left = `${event.clientX}px`;
  label.style.top = `${event.clientY}px`;

  if (dragging) {
    const dx = event.clientX - previousPointer.x;
    const dy = event.clientY - previousPointer.y;
    if (avatarMode) {
      targetAvatarYaw += dx * 0.008;
    } else if (roomEntered) {
      targetYaw = THREE.MathUtils.clamp(targetYaw - dx * 0.0025, -0.62, 0.62);
      targetPitch = THREE.MathUtils.clamp(targetPitch + dy * 0.0018, -0.16, 0.18);
    }
    previousPointer = { x: event.clientX, y: event.clientY };
  }
});

window.addEventListener('wheel', (event) => {
  if (avatarMode || adminPanel.classList.contains('is-open')) return;
  if (!roomEntered) {
    targetEntranceProgress = THREE.MathUtils.clamp(targetEntranceProgress + event.deltaY * 0.00082, 0, 1);
    targetZoom = THREE.MathUtils.lerp(19.8, 7.8, targetEntranceProgress);
    if (targetEntranceProgress > 0.965) enterRoom();
    return;
  }
  targetZoom = THREE.MathUtils.clamp(targetZoom + event.deltaY * 0.006, 5.5, 13.5);
}, { passive: true });

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  if (avatarMode) {
    targetZoom = avatarZoomForViewport();
    currentZoom = targetZoom;
  }
});

function updateInteraction() {
  raycaster.setFromCamera(pointer, camera);
  const intersections = raycaster.intersectObjects(garmentMeshes, true);
  const product = intersections.length ? productFromObject(intersections[0].object) : null;
  const nextHovered = product ? groupFromProduct(product) : null;

  if (hovered !== nextHovered) {
    if (hovered) hovered.userData.hovered = false;
    hovered = nextHovered;
    if (hovered && !hovered.userData.filtered) {
      hovered.userData.hovered = true;
      const data = hovered.userData.product;
      document.querySelector('#label-code').textContent = data.id;
      document.querySelector('#label-name').textContent = data.name;
      label.classList.add('is-visible');
      canvas.style.cursor = 'pointer';
    } else {
      hovered = null;
      label.classList.remove('is-visible');
      canvas.style.cursor = dragging ? 'grabbing' : 'grab';
    }
  }
}

function animate() {
  const elapsed = clock.getElapsedTime();
  entranceProgress = THREE.MathUtils.lerp(entranceProgress, targetEntranceProgress, 0.035);
  const entranceEase = entranceProgress * entranceProgress * (3 - 2 * entranceProgress);
  const doorRaw = THREE.MathUtils.clamp((entranceProgress - 0.56) / 0.44, 0, 1);
  const doorEase = doorRaw * doorRaw * (3 - 2 * doorRaw);

  if (entranceGroup) {
    const { leftDoor, rightDoor, leftClosed, rightClosed } = entranceGroup.userData;
    leftDoor.position.x = leftClosed - doorEase * 4.8;
    rightDoor.position.x = rightClosed + doorEase * 4.8;
    entranceGroup.visible = doorEase < 0.997;
  }

  corridorLights.forEach((light, index) => {
    const lightStart = index / (corridorLights.length + 1) * 0.62;
    const activation = THREE.MathUtils.clamp((entranceProgress - lightStart) * 7, 0, 1);
    const flicker = Math.sin(elapsed * 31 + index * 8.7) > 0.86 ? 0.35 : 1;
    light.intensity = (roomEntered ? 6 : 32) * activation * flicker;
  });
  const entryProgress = document.querySelector('#entry-progress');
  if (entryProgress) entryProgress.style.width = `${Math.round(entranceProgress * 100)}%`;

  renderer.toneMappingExposure = THREE.MathUtils.lerp(0.94, 1.22, entranceEase);
  currentYaw = THREE.MathUtils.lerp(currentYaw, targetYaw, 0.045);
  currentPitch = THREE.MathUtils.lerp(currentPitch, targetPitch, 0.045);
  currentZoom = THREE.MathUtils.lerp(currentZoom, targetZoom, 0.035);

  // The fitting room orbits the avatar platform; the showroom orbits the room centre.
  currentOrbitZ = THREE.MathUtils.lerp(currentOrbitZ, avatarMode ? cameraTarget.z : -0.6, 0.045);
  camera.position.x = Math.sin(currentYaw) * currentZoom;
  camera.position.z = Math.cos(currentYaw) * currentZoom + currentOrbitZ;
  camera.position.y = 3.3 + currentPitch * 9 + Math.sin(elapsed * 0.36) * 0.025;
  camera.lookAt(cameraTarget);

  if (avatarGroup?.visible) {
    avatarYaw = THREE.MathUtils.lerp(avatarYaw, targetAvatarYaw, 0.08);
    avatarGroup.rotation.y = avatarYaw + Math.sin(elapsed * 0.42) * 0.025;
  }

  garmentMeshes.forEach((group, index) => {
    const isFiltered = group.userData.filtered;
    const isHovered = group.userData.hovered;
    const isSelected = selected?.id === group.userData.product.id;
    const goalScale = isFiltered ? 0.001 : isSelected ? 1.16 : isHovered ? 1.09 : 1;
    group.scale.lerp(new THREE.Vector3(goalScale, goalScale, goalScale), isFiltered ? 0.1 : 0.08);
    group.position.y = group.userData.baseY + Math.sin(elapsed * 0.85 + index) * 0.018;
    group.position.z = THREE.MathUtils.lerp(
      group.position.z,
      isSelected ? group.userData.baseZ + 0.72 : isHovered ? group.userData.baseZ + 0.46 : group.userData.baseZ,
      0.08,
    );
    group.children.forEach((child) => {
      if (child.material?.emissive) {
        child.material.emissiveIntensity = THREE.MathUtils.lerp(
          child.material.emissiveIntensity,
          isSelected ? 1.55 : isHovered ? 1.3 : 0.78,
          0.08,
        );
      }
    });
  });

  scene.children.forEach((object) => {
    if (object.userData.atmosphere) object.rotation.y = elapsed * 0.003;
  });

  if (
    roomEntered
    && !avatarMode
    && !selected
    && !fitPanel.classList.contains('is-open')
    && !adminPanel.classList.contains('is-open')
  ) updateInteraction();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

updateFit();
renderAdminProducts();
updateAdminSku();
updateAvatarBody();
animate();

// Dev-only hook for visual fit checks: __voidDebug.tryOn(['heavy-hoodie', 'wide-sweatpant']).
if (import.meta.env.DEV) {
  window.__voidDebug = {
    THREE,
    camera,
    get human() { return realisticHuman; },
    get avatar() { return avatarGroup; },
    garments: avatarGarments,
    tryOn(styles) {
      fit.length = 0;
      styles.forEach((style) => {
        const product = products.find((item) => item.style === style);
        if (product) fit.push(product);
      });
      updateFit();
      openTryon();
    },
    rotate(yaw) { targetAvatarYaw = yaw; },
    frame(zoom, y = 3.05) {
      targetZoom = currentZoom = zoom;
      cameraTarget.y = y;
      targetPitch = currentPitch = (y - 3.05) / 9;
    },
  };
}

window.addEventListener('load', () => {
  window.setTimeout(() => document.querySelector('#loader').classList.add('is-done'), 700);
});
