import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

// 3D Brownie charm inside the SOS button (mobile demo). Replaces the flat
// brownie-button.jpg look with the real model: brown body, black eyes,
// pink cheeks. Falls back to plain STL body if the GLB is missing.
const host = document.getElementById('sos3d');
if (host) {
  try {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1.5, .1, 100);
    camera.position.set(0, .55, 5.2);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, .9));
    const key = new THREE.DirectionalLight(0xfff1e0, 1.6);
    key.position.set(4, 6, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x6d8bff, 1.2);
    rim.position.set(-6, 3, -5);
    scene.add(rim);

    const group = new THREE.Group();
    group.rotation.y = Math.PI;
    group.position.y = .16;
    scene.add(group);

    const resize = () => {
      const w = host.clientWidth || 190;
      const h = host.clientHeight || 127;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const place = (obj) => {
      obj.rotation.x = -Math.PI / 2;   // the model is authored lying on its back
      group.add(obj);
      const size = new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3()).length();
      obj.scale.setScalar(2.65 / size);
      const box = new THREE.Box3().setFromObject(obj);
      obj.position.copy(box.getCenter(new THREE.Vector3())).negate();
      resize();
      host.previousElementSibling?.remove();   // drop the flat jpg once 3D is live
      renderer.setAnimationLoop(() => {
        group.rotation.z += .008;
        renderer.render(scene, camera);
      });
    };

    const gltfLoader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/');
    gltfLoader.setDRACOLoader(draco);
    gltfLoader.load('../assets/otter-charm.glb?v=3', (gltf) => {
      place(gltf.scene);
    }, undefined, () => new STLLoader().load('../assets/otter-charm.stl', (geo) => {
      place(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xb06a3c, roughness: .55, metalness: .06 })));
    }));

    addEventListener('resize', resize);
  } catch (e) {
    host.remove();   // no WebGL: keep the jpg
  }
}
