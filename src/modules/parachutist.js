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

function draw_vector(scene , v, color = 0xff0000){
  const dir = v.clone().normalize(); 
  const length = v.length(); 
  scene.add(new THREE.ArrowHelper(dir , new THREE.Vector3(0,0,0),length,color)); 
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
    this.steeringInput = 0; // -1..1 left/right command
    this.wind = new THREE.Vector3(15, 0, 10);
    this.velocityArrow = null ; 
    this.mesh = null;
    this.parachute = null;
        this.posture = Postures.HEAD_DOWN; // Default posture is now Head-Down
    this.leftLine = null;
    this.rightLine = null;
    this.scene = null;
    this.lastVelocityDir = new THREE.Vector3(1, 0, 0);
    this.headingYaw = 0; // radians: canopy heading around world Y
  }

  load(scene) {
      return new Promise((resolve) => {
          this.scene = scene;
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
                  const vLen = this.velocity.length();
                  if (vLen > 0.0001) this.lastVelocityDir.copy(this.velocity).normalize();
                  const length = Math.max(vLen, 1);
                  this.velocityArrow = new THREE.ArrowHelper(this.lastVelocityDir.clone(), this.position.clone(), length, 0xff0000);
                  scene.add(this.velocityArrow); 
                  this.setPosture(this.posture); // Apply initial posture

                  // Create steering line visuals (left/right)
                  const lineMat = new THREE.LineBasicMaterial({ color: 0x000000 });
                  const leftGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
                  const rightGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
                  this.leftLine = new THREE.Line(leftGeom, lineMat);
                  this.rightLine = new THREE.Line(rightGeom, lineMat);
                  this.leftLine.visible = false;
                  this.rightLine.visible = false;
                  scene.add(this.leftLine);
                  scene.add(this.rightLine);

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
      if (this.parachute) this.parachute.visible = true;
      if (this.leftLine) this.leftLine.visible = true;
      if (this.rightLine) this.rightLine.visible = true;
      const hv = this.velocity.clone(); hv.y = 0;
      this.headingYaw = hv.lengthSq() > 1e-4 ? Math.atan2(hv.x, hv.z) : (this.mesh ? this.mesh.rotation.y : 0);
      console.log("Parachute deployed!");
    }
  }

  setSteeringInput(axis) {
    this.steeringInput = THREE.MathUtils.clamp(axis, -1, 1);
  }

  clearSteering() {
    this.steeringInput = 0;
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

    // Canopy open: glide forward along heading and add lateral from bank
    if (this.parachuteDeployed) {
        const forwardDir = new THREE.Vector3(Math.sin(this.headingYaw), 0, Math.cos(this.headingYaw));
        const up = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(forwardDir, up).normalize();

        const glideForce = 500; // N forward to maintain glide
        totalForce.addScaledVector(forwardDir, glideForce);

        const lateralForce = 200 * this.steeringInput; // N side force from bank
        this.steeringForce.copy(right).multiplyScalar(lateralForce);
        totalForce.add(this.steeringForce);
    }

    return totalForce;
  }

  updateState(deltaTime) {
    if (this.position.y <= 0) {
        this.wind.x = 0;
        this.wind.z = 0;
    }

    // Integrate heading from steering input (keeps new direction after release)
    if (this.parachuteDeployed) {
      const maxYawRate = THREE.MathUtils.degToRad(45); // rad/s
      this.headingYaw += this.steeringInput * maxYawRate * deltaTime;
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
    if (this.velocityArrow) {
      const vLen = this.velocity.length();
      const dir = vLen > 0.0001 ? this.velocity.clone().normalize() : this.velocityArrow.getDirection(new THREE.Vector3());
      const length = Math.max(vLen, 1);
      this.velocityArrow.setDirection(dir);
      this.velocityArrow.setLength(length);
      this.velocityArrow.position.copy(this.position);
    }

    // Visuals: bank canopy and yaw body towards heading
    this.updateParachuteVisuals(deltaTime);
  }
}

Parachutist.prototype.updateParachuteVisuals = function(deltaTime) {
  if (!this.parachuteDeployed || !this.mesh) return;

  const maxBankRadians = THREE.MathUtils.degToRad(25);
  const maxYawRate = THREE.MathUtils.degToRad(45); // deg/sec
  const smoothing = 5; // higher = snappier

  const steeringNorm = this.steeringInput; // use input directly for visuals

  if (this.parachute) {
    const targetBank = steeringNorm * maxBankRadians; // left input -> bank left
    const bankError = targetBank - this.parachute.rotation.z;
    this.parachute.rotation.z += bankError * Math.min(1, smoothing * deltaTime);
  }

  // Smoothly align body with heading
  const currentYaw = this.mesh.rotation.y;
  let yawDelta = this.headingYaw - currentYaw;
  yawDelta = Math.atan2(Math.sin(yawDelta), Math.cos(yawDelta));
  const maxStep = maxYawRate * deltaTime * (0.5 + Math.abs(steeringNorm));
  this.mesh.rotation.y += THREE.MathUtils.clamp(yawDelta, -maxStep, maxStep);

  // Update steering line geometry to reflect handle pulls
  this.updateSteeringLines(steeringNorm);
};

Parachutist.prototype.updateSteeringLines = function(steeringNorm) {
  if (!this.parachuteDeployed || !this.scene || !this.parachute || !this.mesh || !this.leftLine || !this.rightLine) return;

  const maxHandleDrop = 1.0; // meters
  const canopyOffsetY = 2.0;
  const canopyOffsetX = 2.5;
  const harnessOffsetY = 1.2;
  const harnessOffsetX = 0.6;

  // Canopy attachment points (world space)
  const leftCanopy = this.parachute.localToWorld(new THREE.Vector3(-canopyOffsetX, canopyOffsetY, 0));
  const rightCanopy = this.parachute.localToWorld(new THREE.Vector3(canopyOffsetX, canopyOffsetY, 0));

  // Harness handle points (base in world space)
  const baseLeftHandle = this.mesh.localToWorld(new THREE.Vector3(-harnessOffsetX, harnessOffsetY, 0.2));
  const baseRightHandle = this.mesh.localToWorld(new THREE.Vector3(harnessOffsetX, harnessOffsetY, 0.2));

  // Apply drop to the pulled side
  const leftDrop = steeringNorm < 0 ? -steeringNorm * maxHandleDrop : 0;
  const rightDrop = steeringNorm > 0 ? steeringNorm * maxHandleDrop : 0;

  const leftHandle = baseLeftHandle.clone();
  leftHandle.y -= leftDrop;
  const rightHandle = baseRightHandle.clone();
  rightHandle.y -= rightDrop;

  // Update line geometries
  this.leftLine.geometry.setFromPoints([leftCanopy, leftHandle]);
  this.rightLine.geometry.setFromPoints([rightCanopy, rightHandle]);
  this.leftLine.geometry.attributes.position.needsUpdate = true;
  this.rightLine.geometry.attributes.position.needsUpdate = true;
};

export { Parachutist, Postures };
