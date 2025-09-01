import * as THREE from "three";
import { loader } from "./loader.js";

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(60000*0.2, 60000*0.2), // Increased ground size
  new THREE.MeshStandardMaterial({ color: 0x228b22, side: THREE.DoubleSide })
);
ground.rotation.x = Math.PI / 2;
ground.receiveShadow = true;

const cloudLayer = new THREE.Mesh(
  new THREE.PlaneGeometry(60000*0.2, 60000*0.2), // Increased cloud size
  new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
  })
);
cloudLayer.position.y = 2000*0.2;
cloudLayer.rotation.x = Math.PI / 2;

function loadCities(scene) {
  const cityConfigs = [
    {
      path: "cities/Rio de Janeiro.glb",
      scale: 1000*0.2,
      position: new THREE.Vector3(0, 500*0.2, 0),
    },
    {
      path: "cities/effil city.glb",
      scale: 100*0.2,
      position: new THREE.Vector3(11000*0.2, 0, 2000*0.2),
    },
    {
      path: "cities/Little City.glb",
      scale: 10000*0.2,
      position: new THREE.Vector3(-10000*0.2, 0, 2000*0.2),
    },
  ];

  cityConfigs.forEach((config) => {
    loader.load(config.path, (gltf) => {
      const city = gltf.scene;
      city.scale.set(config.scale, config.scale, config.scale);
      city.position.copy(config.position);
      scene.add(city);
    });
  });
}

export { ground, cloudLayer, loadCities };
