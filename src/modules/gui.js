
import GUI from 'lil-gui';
import { Postures } from './parachutist.js';

function setupGUI(parachutist, airplane) {
    const gui = new GUI();
    const guiState = {
        planeVelocityX: airplane.velocity.x,
        position: { x: '0.0', y: '0.0', z: '0.0' },
        velocity: { x: '0.0', y: '0.0', z: '0.0' },
        acceleration: { x: '0.0', y: '0.0', z: '0.0' },
        posture: parachutist.posture
    };

    const planeFolder = gui.addFolder('Airplane');
    planeFolder.add(guiState, 'planeVelocityX').name('Velocity X (m/s)').listen();

    const parachutistFolder = gui.addFolder('Parachutist');
    parachutistFolder.add(parachutist, 'mass', 50, 150).name('Mass (kg)');
    const dragController = parachutistFolder.add(parachutist, 'dragCoefficient', 0.1, 2, 0.001).name('Drag Coefficient').listen();
    const surfaceAreaController = parachutistFolder.add(parachutist, 'surfaceArea', 0.1, 30, 0.001).name('Surface Area (m^2)').listen();
    parachutistFolder.add(guiState, 'posture', Object.values(Postures)).name('Posture').onChange((value) => {
        parachutist.setPosture(value);
    }).setValue(parachutist.posture);
    const physicsFolder = parachutistFolder.addFolder('Real-time Physics');
    const positionFolder = physicsFolder.addFolder('Position');
    positionFolder.add(guiState.position, 'x').name('X').listen();
    positionFolder.add(guiState.position, 'y').name('Y (Altitude)').listen();
    positionFolder.add(guiState.position, 'z').name('Z').listen();
    const velocityFolder = physicsFolder.addFolder('Velocity');
    velocityFolder.add(guiState.velocity, 'x').name('X').listen();
    velocityFolder.add(guiState.velocity, 'y').name('Y').listen();
    velocityFolder.add(guiState.velocity, 'z').name('Z').listen();
    const accelerationFolder = physicsFolder.addFolder('Acceleration');
    accelerationFolder.add(guiState.acceleration, 'x').name('X').listen();
    accelerationFolder.add(guiState.acceleration, 'y').name('Y').listen();
    accelerationFolder.add(guiState.acceleration, 'z').name('Z').listen();
    const windFolder = parachutistFolder.addFolder('Environment');
    windFolder.add(parachutist.wind, 'x', -50, 50, 0.001).name('Wind X (m/s)');
    windFolder.add(parachutist.wind, 'z', -50, 50, 0.001).name('Wind Z (m/s)');
    parachutistFolder.hide();

    document.getElementById('velocity-arrow-toggle').addEventListener('change', (event) => {
        parachutist.velocityArrow.visible = event.target.checked;
    });

    document.getElementById('gravity-arrow-toggle').addEventListener('change', (event) => {
        parachutist.gravitationalForceArrow.visible = event.target.checked;
    });

    document.getElementById('drag-arrow-toggle').addEventListener('change', (event) => {
        parachutist.dragForceArrow.visible = event.target.checked;
    });

    document.getElementById('total-force-arrow-toggle').addEventListener('change', (event) => {
        parachutist.totalForceArrow.visible = event.target.checked;
    });

    return { gui, guiState, planeFolder, parachutistFolder, dragController, surfaceAreaController };
}

export { setupGUI };
