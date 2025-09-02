import * as THREE from "three";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100000,
);
camera.position.set(-2400, 3080 * 0.2, 250 * 0.2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
sunLight.position.set(300, 600, 300);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 4096;
sunLight.shadow.mapSize.height = 4096;
sunLight.shadow.camera.far = 1200;
scene.add(sunLight);

const cameraTargetPos = new THREE.Vector3();
const cameraLookAtPos = new THREE.Vector3();
const worldUp = new THREE.Vector3(0, 1, 0);

function updateCameraPosition(
  parachutistPosition,
  parachutistVelocity,
  damping = 0.05,
) {
  if (parachutistVelocity.lengthSq() === 0) return;

  const dir = parachutistVelocity.clone().normalize();

  cameraTargetPos
    .copy(parachutistPosition)
    .addScaledVector(dir, -90) // behind
    .add(new THREE.Vector3(0, 10, 0)); // above
  camera.position.lerp(cameraTargetPos, damping);

  cameraLookAtPos.copy(parachutistPosition).addScaledVector(dir, 100);
  const smoothLookAt = new THREE.Vector3().lerpVectors(
    cameraLookAtPos,
    camera.getWorldDirection(new THREE.Vector3()).add(camera.position),
    damping,
  );
  camera.lookAt(smoothLookAt);

  // Keep camera horizon level to avoid tilting the whole world
  camera.up.copy(worldUp);
}

export {
  scene,
  camera,
  renderer,
  ambientLight,
  sunLight,
  updateCameraPosition,
};
