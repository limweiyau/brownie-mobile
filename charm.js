import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const stage = document.querySelector('.charm-stage');
const host = document.getElementById('charm3d');
const loading = document.getElementById('charmLoading');

const note = (text) => { if (loading) loading.textContent = text; };

if (stage && host) {
  let settled = false;
  const fail = (text) => {
    if (settled) return;
    settled = true;
    stage.classList.add('failed');
    note(text);
  };
  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) {
    fail('This device cannot show the 3D charm.');
  }

  if (renderer) {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
    camera.position.set(0, .7, 5.4);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, .85));
    const key = new THREE.DirectionalLight(0xfff1e0, 1.6); key.position.set(4, 6, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0x6d8bff, 1.3); rim.position.set(-6, 3, -5); scene.add(rim);
    const fill = new THREE.DirectionalLight(0xff8a5c, .65); fill.position.set(2, -3, 4); scene.add(fill);

    const group = new THREE.Group();
    group.rotation.y = Math.PI;
    group.position.y = .16;
    scene.add(group);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = .07;
    controls.enablePan = false;
    controls.minDistance = 3.4;
    controls.maxDistance = 9;
    controls.autoRotate = !reduced;
    controls.autoRotateSpeed = 1.5;
    // dragging the charm must not scroll the page
    renderer.domElement.style.touchAction = 'none';

    // it spins on its own, and hands you the controls the moment you take them
    let idle = null;
    const resume = () => { if (!reduced) controls.autoRotate = true; };
    controls.addEventListener('start', () => {
      controls.autoRotate = false;
      if (idle) clearTimeout(idle);
    });
    controls.addEventListener('end', () => {
      if (idle) clearTimeout(idle);
      idle = setTimeout(resume, 8000);
    });

    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    let frame = null;
    const loop = () => { controls.update(); renderer.render(scene, camera); };
    const onScreen = (on) => {
      if (on && !frame) { frame = requestAnimationFrame(function tick() { loop(); frame = requestAnimationFrame(tick); }); }
      if (!on && frame) { cancelAnimationFrame(frame); frame = null; }
    };
    new IntersectionObserver(([e]) => onScreen(e.isIntersecting), { threshold: .05 }).observe(stage);
    new ResizeObserver(resize).observe(host);
    addEventListener('resize', resize);

    const place = (obj) => {
      if (settled) return;
      settled = true;
      obj.rotation.x = -Math.PI / 2;   // the model is authored lying on its back
      group.add(obj);
      const size = new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3()).length();
      obj.scale.setScalar(2.65 / size);
      const box = new THREE.Box3().setFromObject(obj);
      obj.position.copy(box.getCenter(new THREE.Vector3())).negate();
      stage.classList.add('ready');
      resize();
      onScreen(true);
    };

    const gltfLoader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('./vendor/three/libs/draco/');
    gltfLoader.setDRACOLoader(draco);
    gltfLoader.load('assets/otter-charm.glb?v=6', (gltf) => {
      place(gltf.scene);
    }, undefined, () => fail('The charm could not be loaded.'));
    setTimeout(() => fail('The 3D charm is taking too long to load.'), 10000);
  }
}
