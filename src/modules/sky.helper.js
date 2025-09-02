import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

export const setSky = (scene, imagePath) => {
  let hdrTexture = new RGBELoader().load(imagePath);

  let skySphereGeometry = new THREE.SphereGeometry(3000, 600, 600);
  let skySphereMaterial = new THREE.MeshPhongMaterial({
    map: hdrTexture,
  });

  skySphereMaterial.side = THREE.BackSide;
  let skySphereMesh = new THREE.Mesh(skySphereGeometry, skySphereMaterial);
  scene.add(skySphereMesh);
};
