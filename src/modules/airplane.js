
import * as THREE from 'three';
import { loader } from './loader.js';

class Airplane {
    constructor() {
        this.velocity = new THREE.Vector3(150, 0, 0);
        this.mesh = null;
    }

    load(scene) {
        return new Promise((resolve) => {
            loader.load('models/Airplane 1.glb', (gltf) => {
                this.mesh = gltf.scene;
                this.mesh.scale.set(20, 20, 20);
                this.mesh.rotation.y = -Math.PI / 2;
                this.mesh.traverse(node => { if (node.isMesh) node.castShadow = true; });
                this.mesh.position.set(0, 3000, 0);
                scene.add(this.mesh);
                resolve();
            });
        });
    }

    update(deltaTime) {
        if (this.mesh) {
            this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        }
    }
}

export { Airplane };
