import * as THREE from 'three';
import { loader } from './loader.js';

const GRAVITY = 9.81; // m/s^2

const Postures = {
    BELLY_TO_EARTH: 'Belly-to-Earth',
    STAND_UP: 'Stand-Up',
    HEAD_DOWN: 'Head-Down',
    TRACKING: 'Tracking',
    SIT_FLY: 'Sit-Fly',
    BACKFLY: 'Backfly'
};

function getAirDensity(altitude) {
    if (altitude >= 10000) return 0.4135;
    if (altitude >= 9000) return 0.4671;
    if (altitude >= 8000) return 0.5258;
    if (altitude >= 7000) return 0.5900;
    if (altitude >= 6000) return 0.6601;
    if (altitude >= 5000) return 0.7364;
    if (altitude >= 4000) return 0.8194;
    if (altitude >= 3000) return 0.9093;
    if (altitude >= 2000) return 1.0066;
    if (altitude >= 1000) return 1.1117;
    return 1.2250; // Sea level
}

class Parachutist {
  constructor(mass, dragCoefficient, surfaceArea) {
    this.mass = mass;
    this.dragCoefficient = dragCoefficient;
    this.surfaceArea = surfaceArea;
    this.defaultDragCoefficient = dragCoefficient;

    this.position = new THREE.Vector3(0, 3000, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.acceleration = new THREE.Vector3(0, 0, 0);

    this.hasJumped = false;
    this.parachuteDeployed = false;
    this.flaring = false;
    this.steeringForce = new THREE.Vector3(0, 0, 0);
    this.wind = new THREE.Vector3(15, 0, 10);

    this.mesh = null;
    this.parachute = null;
        this.posture = Postures.HEAD_DOWN; // Default posture is now Head-Down
  }

  load(scene) {
      return new Promise((resolve) => {
          loader.load('models/parachutist 1.glb', (gltf) => {
              this.mesh = gltf.scene;
              this.mesh.scale.set(5, 5, 5);
              this.mesh.traverse(node => { if (node.isMesh) node.castShadow = true; });
              this.mesh.visible = false;
              scene.add(this.mesh);

              loader.load('models/Parachute 1.glb', (gltf) => {
                  this.parachute = gltf.scene;
                  this.parachute.scale.set(1.5, 1.5, 1.5);
                  this.parachute.visible = false;
                  this.parachute.traverse(node => { if (node.isMesh) node.castShadow = true; });
                  this.mesh.add(this.parachute);
                  this.setPosture(this.posture); // Apply initial posture
                  resolve();
              });
          });
      });
  }

  setPosture(posture) {
    if (this.parachuteDeployed) {
        return;
    }

    this.posture = posture;

    // Stop any existing animations/rotations
    if (this.mesh) {
        this.mesh.rotation.set(0, 0, 0);
    }

    switch (posture) {
        case Postures.BELLY_TO_EARTH:
            this.surfaceArea = 1.2;
            if (this.mesh) this.mesh.rotation.x = Math.PI / 2; // Rotate 90 degrees to be flat
            break;
        case Postures.STAND_UP:
            this.surfaceArea = 0.6;
            // No rotation needed, this is the default model orientation
            break;
        case Postures.HEAD_DOWN:
            this.surfaceArea = 0.5;
            if (this.mesh) this.mesh.rotation.x = Math.PI; // Rotate 180 degrees
            break;
        case Postures.TRACKING:
            this.surfaceArea = 0.8;
            if (this.mesh) this.mesh.rotation.x = Math.PI / 2 * 0.8; // Mostly horizontal
            break;
        case Postures.SIT_FLY:
            this.surfaceArea = 0.7;
            if (this.mesh) this.mesh.rotation.x = Math.PI / 4; // 45 degrees from standing
            break;
        case Postures.BACKFLY:
            this.surfaceArea = 0.9;
            if (this.mesh) this.mesh.rotation.x = -Math.PI / 2; // Rotated 90 degrees onto back
            break;
    }
  }

  jump() {
    if (!this.hasJumped) {
        this.hasJumped = true;
        console.log("Jumped!");
    }
  }

  deployParachute() {
    if (this.hasJumped && !this.parachuteDeployed) {
      this.setPosture(Postures.STAND_UP); // Revert to stand-up before deploying
      this.parachuteDeployed = true;
      this.dragCoefficient = 1.8;
      this.defaultDragCoefficient = 1.8;
      this.surfaceArea = 25;
      console.log("Parachute deployed!");
    }
  }

  setSteering(direction) {
    const steeringMagnitude = 100;
    this.steeringForce.copy(direction).multiplyScalar(steeringMagnitude);
  }

  clearSteering() {
    this.steeringForce.set(0, 0, 0);
  }

  flare() {
    if (this.parachuteDeployed && !this.flaring) {
      this.flaring = true;
      this.dragCoefficient *= 2.5;
      console.log("Flaring!");
    }
  }

  unflare() {
    if (this.flaring) {
      this.flaring = false;
      this.dragCoefficient = this.defaultDragCoefficient;
      console.log("Unflared.");
    }
  }

  calculateForces() {
    const airDensity = getAirDensity(this.position.y);
    const gravitationalForce = new THREE.Vector3(0, -this.mass * GRAVITY, 0);
    const apparentVelocity = this.velocity.clone().sub(this.wind);
    const dragMagnitude = 0.5 * airDensity * apparentVelocity.lengthSq() * this.dragCoefficient * this.surfaceArea;
    const dragForce = apparentVelocity.clone().negate().normalize().multiplyScalar(dragMagnitude);

    const totalForce = new THREE.Vector3().addVectors(gravitationalForce, dragForce);

    if (this.parachuteDeployed) {
        totalForce.add(this.steeringForce);
    }

    return totalForce;
  }

  updateState(deltaTime) {
    if (this.position.y <= 0) {
        this.wind.x = 0;
        this.wind.z = 0;
    }

    const totalForce = this.calculateForces();

    this.acceleration.copy(totalForce).divideScalar(this.mass);
    this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

    if (this.position.y < 0) {
      this.position.y = 0;
      this.velocity.set(0, 0, 0);
      this.acceleration.set(0, 0, 0);
    }

    if (this.mesh) {
        this.mesh.position.copy(this.position);
    }
  }
}

export { Parachutist, Postures };