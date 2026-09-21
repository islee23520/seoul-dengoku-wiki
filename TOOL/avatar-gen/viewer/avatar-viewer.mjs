import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { fitDistance } from './framing.mjs';

export async function mountAvatarViewer({ container, contractUrl }) {
  const contract = await fetchJson(contractUrl);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  container.replaceChildren(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100);
  camera.position.set(0, 1.1, 4.6);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.95, 0);
  controls.enableDamping = false;
  controls.addEventListener('change', render);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x263544, 1.25));
  const key = new THREE.DirectionalLight(0xfff5e8, 3.4);
  key.position.set(2.2, 3.5, 3.2);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9ddcff, 2.1);
  rim.position.set(-3.5, 2.4, -2.8);
  scene.add(rim);

  const contractHref = new URL(contractUrl, globalThis.location.href);
  const modelUrl = new URL(contract.web.path.split('/').at(-1), contractHref).href;
  const gltf = await new GLTFLoader().loadAsync(modelUrl);
  prepareInspectionMaterials(gltf.scene);
  scene.add(gltf.scene);
  const byName = new Map();
  gltf.scene.traverse(object => {
    if (!object.isMesh) return;
    const sourceName = object.userData?.name ?? object.parent?.name ?? object.name;
    const normalizedName = sourceName.replace(/_\d+$/, '');
    const contractName = contract.elements
      .filter(element => normalizedName === element.objectName || normalizedName.startsWith(`${element.objectName}_`))
      .sort((left, right) => right.objectName.length - left.objectName.length)[0]?.objectName ?? object.name;
    const existing = byName.get(contractName) ?? [];
    existing.push(object);
    byName.set(contractName, existing);
  });
  const missing = contract.elements.filter(element => !byName.has(element.objectName));
  if (missing.length) throw new Error(`GLB is missing contract elements: ${missing.map(element => element.objectName).join(', ')}`);
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  fit();

  function resize() {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (!controls.userData?.adjusted) fit();
    render();
  }
  function render() { renderer.render(scene, camera); }
  function setVisible(objectName, visible) {
    const objects = byName.get(objectName);
    if (!objects) return false;
    for (const object of objects) object.visible = visible;
    render();
    return true;
  }
  function fit() {
    frameObject(gltf.scene, camera, controls);
    render();
  }
  function orbit(delta) {
    const offset = camera.position.clone().sub(controls.target).applyAxisAngle(new THREE.Vector3(0, 1, 0), delta);
    camera.position.copy(controls.target).add(offset);
    camera.lookAt(controls.target);
    controls.update();
    controls.userData = { adjusted: true };
    render();
  }
  function orbitVertical(delta) {
    const offset = camera.position.clone().sub(controls.target);
    const right = new THREE.Vector3().crossVectors(offset, camera.up).normalize();
    offset.applyAxisAngle(right, delta);
    camera.position.copy(controls.target).add(offset);
    camera.lookAt(controls.target);
    controls.update();
    controls.userData = { adjusted: true };
    render();
  }
  function pan(horizontal, vertical) {
    const distance = camera.position.distanceTo(controls.target);
    const scale = distance * 0.035;
    const forward = controls.target.clone().sub(camera.position).normalize();
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
    const up = new THREE.Vector3().crossVectors(right, forward).normalize();
    const delta = right.multiplyScalar(horizontal * scale).add(up.multiplyScalar(vertical * scale));
    camera.position.add(delta);
    controls.target.add(delta);
    controls.update();
    controls.userData = { adjusted: true };
    render();
  }
  function zoom(factor) {
    camera.position.lerp(controls.target, 1 - factor);
    controls.update();
    controls.userData = { adjusted: true };
    render();
  }
  controls.addEventListener('start', () => { controls.userData = { adjusted: true }; });
  function dispose() {
    observer.disconnect();
    controls.dispose();
    gltf.scene.traverse(object => {
      if (!object.isMesh) return;
      object.geometry?.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        for (const value of Object.values(material)) if (value?.isTexture) value.dispose();
        material.dispose();
      }
    });
    renderer.dispose();
    renderer.domElement.remove();
  }
  return { contract, setVisible, fit, orbit, orbitVertical, pan, zoom, dispose, visibleNames: () => [...byName].filter(([, objects]) => objects.every(object => object.visible)).map(([name]) => name) };
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
  return response.json();
}

function frameObject(root, camera, controls) {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const distance = fitDistance({ width: size.x, height: size.y, depth: size.z, verticalFovRadians: THREE.MathUtils.degToRad(camera.fov), aspect: camera.aspect });
  camera.position.set(center.x, center.y, center.z + distance);
  camera.near = Math.max(0.01, distance / 100);
  camera.far = distance * 100;
  camera.updateProjectionMatrix();
  controls.target.copy(center);
  controls.update();
}

function prepareInspectionMaterials(root) {
  const cache = new Map();
  root.traverse(object => {
    if (!object.isMesh) return;
    const role = inspectionRole(object.parent?.name ?? object.name);
    const originals = Array.isArray(object.material) ? object.material : [object.material];
    const converted = originals.map(original => {
      const key = `${original.uuid}:${role}`;
      if (cache.has(key)) return cache.get(key);
      const preset = inspectionPreset(role);
      const material = new THREE.MeshStandardMaterial({
        name: `${original.name}-inspection`,
        color: new THREE.Color(preset.color),
        map: role === 'body' ? original.map ?? null : null,
        transparent: preset.opacity < 1,
        opacity: preset.opacity,
        alphaTest: 0,
        side: original.side,
        roughness: preset.roughness,
        metalness: 0,
      });
      cache.set(key, material);
      return material;
    });
    object.material = Array.isArray(object.material) ? converted : converted[0];
  });
}

function inspectionRole(name) {
  const value = name.toLowerCase();
  if (value.includes('cornea')) return 'cornea';
  if (value.includes('iris')) return 'iris';
  if (value.includes('pupil')) return 'pupil';
  if (value.includes('eye_core')) return 'eye';
  if (value.includes('tooth')) return 'tooth';
  if (value.includes('gum') || value.includes('tongue') || value.includes('mouth')) return 'oral';
  if (value.includes('bandeau') || value.includes('brief') || value.includes('garment')) return 'clothing';
  return 'body';
}

function inspectionPreset(role) {
  return ({
    body: { color: '#b98973', opacity: 1, roughness: 0.68 },
    clothing: { color: '#d7dce2', opacity: 1, roughness: 0.8 },
    eye: { color: '#f4f7fa', opacity: 1, roughness: 0.32 },
    cornea: { color: '#b9e6ff', opacity: 0.28, roughness: 0.08 },
    iris: { color: '#4f9ab8', opacity: 1, roughness: 0.38 },
    pupil: { color: '#111827', opacity: 1, roughness: 0.45 },
    tooth: { color: '#f4efe6', opacity: 1, roughness: 0.55 },
    oral: { color: '#b85f68', opacity: 1, roughness: 0.72 },
  })[role];
}
