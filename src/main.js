
import * as THREE from 'three';
import { scene, camera, renderer,updateCameraPosition } from './modules/scene.js';
import { ground, cloudLayer, loadCities } from './modules/environment.js';
import { Parachutist } from './modules/parachutist.js';
import { Airplane } from './modules/airplane.js';
import { setupControls } from './modules/controls.js';
import { setupGUI } from './modules/gui.js';

// Scene setup
scene.add(ground);
scene.add(cloudLayer);
loadCities(scene);

// Load config from localStorage
const config = JSON.parse(localStorage.getItem('parachuting-config')) || {
    airplane: {
        velocity: {
            x: 150
        }
    },
    parachutist: {
        mass: 80,
        dragCoefficient: 0.5,
        surfaceArea: 1
    },
    environment: {
        wind: {
            x: 15,
            z: 10
        }
    }
};

// Airplane
const airplane = new Airplane();
airplane.velocity.x = config.airplane.velocity.x;

// Parachutist
const parachutist = new Parachutist(
    config.parachutist.mass,
    config.parachutist.dragCoefficient,
    config.parachutist.surfaceArea
);
parachutist.wind.x = config.environment.wind.x;
parachutist.wind.z = config.environment.wind.z;

// GUI
const { gui, guiState, planeFolder, parachutistFolder, dragController, surfaceAreaController } = setupGUI(parachutist, airplane);

// Load models and then initialize controls and animation
Promise.all([
    airplane.load(scene),
    parachutist.load(scene)
]).then(() => {
    // Controls
    const controls = setupControls(camera, renderer, parachutist, airplane, parachutist.parachute, planeFolder, parachutistFolder);

    // Main Loop
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const deltaTime = clock.getDelta();

        airplane.update(deltaTime);

        if (parachutist.hasJumped) {
            parachutist.updateState(deltaTime); console.log("updated the camera and the position of the parachutist is :" , parachutist.position);
            updateCameraPosition(parachutist.position.x ,parachutist.position.y ,  parachutist.position.z) ;
           
        } else {
            if (airplane.mesh) {
                parachutist.position.copy(airplane.mesh.position);
            }
        }

        const target = !parachutist.hasJumped && airplane.mesh ? airplane.mesh.position : parachutist.position;
        controls.target.copy(target);
        controls.update();

        if (!parachutist.hasJumped && airplane.mesh) {
            guiState.planeVelocityX = airplane.velocity.x;
        } else {
            guiState.position.x = parachutist.position.x.toFixed(1);
            guiState.position.y = parachutist.position.y.toFixed(1);
            guiState.position.z = parachutist.position.z.toFixed(1);
            guiState.velocity.x = parachutist.velocity.x.toFixed(1);
            guiState.velocity.y = parachutist.velocity.y.toFixed(1);
            guiState.velocity.z = parachutist.velocity.z.toFixed(1);
            guiState.acceleration.x = parachutist.acceleration.x.toFixed(1);
            guiState.acceleration.y = parachutist.acceleration.y.toFixed(1);
            guiState.acceleration.z = parachutist.acceleration.z.toFixed(1);
            guiState.posture = parachutist.posture;
            dragController.updateDisplay();
            surfaceAreaController.updateDisplay();
        }

        renderer.render(scene, camera);
    }

    animate();
});
