document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('config-form');

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const config = {
            airplane: {
                velocity: {
                    x: parseFloat(document.getElementById('airplane-velocity-x').value)
                }
            },
            parachutist: {
                mass: parseFloat(document.getElementById('parachutist-mass').value),
                dragCoefficient: parseFloat(document.getElementById('parachutist-drag-coefficient').value),
                surfaceArea: parseFloat(document.getElementById('parachutist-surface-area').value)
            },
            environment: {
                wind: {
                    x: parseFloat(document.getElementById('wind-x').value),
                    z: parseFloat(document.getElementById('wind-z').value)
                }
            }
        };

        localStorage.setItem('parachuting-config', JSON.stringify(config));

        window.location.href = '/simulation.html';
    });
});