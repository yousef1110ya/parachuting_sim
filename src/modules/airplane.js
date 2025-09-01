
import * as THREE from 'three';
import { loader } from './loader.js';

class Airplane {
    constructor() {
        this.velocity = new THREE.Vector3(150, 0, 0);
        this.mesh = null;
        this.velocityArrow = null; // store reference to arrow
    }

    load(scene) {
        return new Promise((resolve) => {
            loader.load('models/Airplane 1.glb', (gltf) => {
                this.mesh = gltf.scene;
                this.mesh.scale.set(20, 20, 20);
                this.mesh.rotation.y = -Math.PI / 2;
                this.mesh.traverse(node => { if (node.isMesh) node.castShadow = true; });
                this.mesh.position.set(-2400, 600, 0);
                scene.add(this.mesh);

                // Create velocity arrow
                const dir = this.velocity.clone().normalize();
                const length = this.velocity.length();
                this.velocityArrow = new THREE.ArrowHelper(dir, this.mesh.position.clone(), length, 0xff0000);
                scene.add(this.velocityArrow);

                resolve();
            });
        });
    }

    update(deltaTime) {
        if (this.mesh) {
            // Update airplane position
            this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));

            // Update velocity arrow
            if (this.velocityArrow) {
                const dir = this.velocity.clone().normalize();
                const length = this.velocity.length();
                this.velocityArrow.setDirection(dir);
                this.velocityArrow.setLength(length);
                this.velocityArrow.position.copy(this.mesh.position);
            }
        }
    }
}

export { Airplane };

