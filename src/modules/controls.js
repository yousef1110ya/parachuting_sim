
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';

function setupControls(camera, renderer, parachutist, airplane, parachute, planeFolder, parachutistFolder) {
    const controls = new OrbitControls(camera, renderer.domElement);

    window.addEventListener('keydown', (event) => {
        if (event.code === 'ControlLeft' && !parachutist.hasJumped && airplane.mesh && parachutist.mesh) {
            parachutist.velocity.copy(airplane.velocity);
            parachutist.position.copy(airplane.mesh.position).z += 30;
            parachutist.mesh.position.copy(parachutist.position);
            parachutist.mesh.visible = true;
            parachutist.jump();

            planeFolder.hide();
            parachutistFolder.show();
        }
        if (event.code === 'Space' && parachutist.hasJumped) {
            parachutist.deployParachute();
            if(parachute) parachute.visible = true;
        }
        if (event.code === 'KeyA' && parachutist.parachuteDeployed) {
            // A = steer left
            parachutist.setSteeringInput(-1);
        }
        if (event.code === 'KeyD' && parachutist.parachuteDeployed) {
            // D = steer right
            parachutist.setSteeringInput(1);
        }
        if (event.code === 'KeyS' && parachutist.hasJumped) {
            parachutist.flare();
        }
    });

    window.addEventListener('keyup', (event) => {
        if (event.code === 'KeyA' || event.code === 'KeyD') {
            parachutist.clearSteering();
        }
        if (event.code === 'KeyS') {
            parachutist.unflare();
        }
    });

    return controls;
}

export { setupControls };
