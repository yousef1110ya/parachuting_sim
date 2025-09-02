# Your Section Guide: Airplane & Free Fall

Hello! As requested, here is a guide to the files and code sections relevant to your responsibilities. I've added simple explanations as if you're new to Three.js.

---

## 1. The Airplane: Building and Deployment ✈️

This section covers how the airplane is created and how it moves.

### Key File: `src/modules/airplane.js`

This file defines everything about the airplane. In Three.js, objects are often called "Meshes". Think of a Mesh as a combination of a shape (Geometry) and a skin (Material).

#### Code to Study: Creating the Plane

The `load` method is where the 3D model of the plane is loaded, scaled, and positioned in the world. This is the "building" part.

```javascript
// from src/modules/airplane.js

load(scene) {
    return new Promise((resolve) => {
        loader.load('models/Airplane 1.glb', (gltf) => {
            this.mesh = gltf.scene;
            this.mesh.scale.set(20, 20, 20); // Makes the model bigger
            this.mesh.rotation.y = -Math.PI / 2; // Rotates it to face the right way
            this.mesh.position.set(-2400, 600, 0); // Places it at a starting position
            scene.add(this.mesh); // Adds the plane to the world
            resolve();
        });
    });
}
```

#### Code to Study: Moving the Plane

The `update` method is called on every frame to move the plane. This is the "deployment" part. It simply adds the plane's velocity to its position.

```javascript
// from src/modules/airplane.js

update(deltaTime) {
    if (this.mesh) {
        // Update airplane position
        this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    }
}
```

---

## 2. The Free Fall Phase 🪂

This section covers the moment the parachutist jumps and the physics of falling.

### Key File: `src/modules/parachutist.js`

This is the most important file for you. It handles the parachutist's state, including their position, velocity, and the forces acting on them.

#### Code to Study: Starting the Fall

The `jump` method is the simple trigger that begins the free fall sequence.

```javascript
// from src/modules/parachutist.js

jump() {
    if (!this.hasJumped) {
        this.hasJumped = true;
        console.log("Jumped!");
    }
}
```

#### Code to Study: The Physics of Falling

The `calculateForces` method is the core of the simulation. It calculates the force of gravity and the force of air resistance (drag) to determine how the parachutist will fall.

```javascript
// from src/modules/parachutist.js

calculateForces() {
    const airDensity = getAirDensity(this.position.y);
    // Force of gravity pulling the person down
    const gravitationalForce = new THREE.Vector3(0, -this.mass * GRAVITY, 0);

    // Apparent velocity considering wind
    const apparentVelocity = this.velocity.clone().sub(this.wind);

    // Force of air resistance pushing back against the direction of movement
    const dragMagnitude =
      0.5 *
      airDensity *
      apparentVelocity.lengthSq() *
      this.dragCoefficient *
      this.surfaceArea;
    const dragForce = apparentVelocity
      .clone()
      .negate()
      .normalize()
      .multiplyScalar(dragMagnitude);

    // ... the rest of the function combines these forces
    
    // Freefall: use full drag
    totalForce.add(dragForce);

    return totalForce;
}
```

### Key File: `src/main.js`

This file acts as the director, telling the airplane and parachutist when to update.

#### Code to Study: The Animation Loop

The `animate` function is the heart of the project. It's a loop that runs continuously to create motion. Notice the `if (parachutist.hasJumped)` check. This is how the simulation knows to switch from moving the parachutist with the plane to applying free fall physics.

```javascript
// from src/main.js

function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();

    airplane.update(deltaTime);

    if (parachutist.hasJumped) {
        // If the person has jumped, update their state using physics
        parachutist.updateState(deltaTime);
    } else {
        // If not, keep the person's position locked to the airplane's position
        if (airplane.mesh) {
            parachutist.position.copy(airplane.mesh.position);
        }
    }

    // ... rendering and other updates
    renderer.render(scene, camera);
}
```

---

This should give you a solid starting point. Let me know when you have more questions!
