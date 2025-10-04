import * as THREE from "three";

function createRealisticPlanetTexture(planetType, radius, seed = Math.random()) {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    switch (planetType) {
        case 'Gas Giant':
        case 'Sub-Neptune':
            createGasGiantTexture(ctx, canvas.width, canvas.height, seed);
            break;
        case 'Rocky':
        case 'Super Earth':
        case 'Terrestrial':
        case 'Rocky Super Earth':
            createRockyTexture(ctx, canvas.width, canvas.height, seed);
            break;
        case 'Ice':
            createIceTexture(ctx, canvas.width, canvas.height, seed);
            break;
        case 'Ocean':
        case 'Earth-like':
            createOceanTexture(ctx, canvas.width, canvas.height, seed);
            break;
        case 'Volcanic':
            createVolcanicTexture(ctx, canvas.width, canvas.height, seed);
            break;
        default:
            createRockyTexture(ctx, canvas.width, canvas.height, seed);
    }

    return new THREE.CanvasTexture(canvas);
}

function createGasGiantTexture(ctx, width, height, seed) {
    // Vary base colors - oranges, browns, creams, tans
    const hueBase = 20 + (seed * 60); // Range: orange to yellow
    const saturation = 40 + (seed * 40);
    const lightness = 35 + (seed * 25);

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `hsl(${hueBase}, ${saturation}%, ${lightness + 15}%)`);
    gradient.addColorStop(0.3, `hsl(${hueBase + 10}, ${saturation - 10}%, ${lightness + 5}%)`);
    gradient.addColorStop(0.7, `hsl(${hueBase - 5}, ${saturation}%, ${lightness - 5}%)`);
    gradient.addColorStop(1, `hsl(${hueBase}, ${saturation - 15}%, ${lightness - 15}%)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const bandCount = 15 + Math.floor(seed * 10);

    // Add horizontal bands
    for (let i = 0; i < bandCount; i++) {
        const y = (height / bandCount) * i;
        const bandHeight = height / bandCount;

        const opacity = 0.1 + (seed * 0.2 + Math.random() * 0.2);
        const colorVariation = Math.floor(seed * 100);
        ctx.fillStyle = `rgba(${150 + colorVariation}, ${100 + colorVariation * 0.5}, ${50 + colorVariation * 0.3}, ${opacity})`;

        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x < width; x += 10) {
            const waveY = y + Math.sin(x * 0.02 + i + seed * 10) * (5 + seed * 15);
            ctx.lineTo(x, waveY);
        }
        ctx.lineTo(width, y + bandHeight);
        ctx.lineTo(0, y + bandHeight);
        ctx.closePath();
        ctx.fill();
    }

    // Add storm spots
    const stormCount = 2 + Math.floor(seed * 3);
    for (let i = 0; i < stormCount; i++) {
        const x = (seed * width + i * 500) % width;
        const y = (seed * height * 2 + i * 300) % height;
        const spotRadius = 30 + seed * 70;

        const spotGradient = ctx.createRadialGradient(x, y, 0, x, y, spotRadius);
        spotGradient.addColorStop(0, `rgba(${180 + seed * 50}, ${80 + seed * 40}, ${60 + seed * 30}, 0.7)`);
        spotGradient.addColorStop(1, `rgba(${180 + seed * 50}, ${80 + seed * 40}, ${60 + seed * 30}, 0)`);
        ctx.fillStyle = spotGradient;
        ctx.fillRect(x - spotRadius, y - spotRadius, spotRadius * 2, spotRadius * 2);
    }
}

function createRockyTexture(ctx, width, height, seed) {
    // Vary rocky colors - reds, browns, grays
    const hue = 10 + (seed * 40); // Range: red to orange-brown
    const saturation = 30 + (seed * 40);
    const lightness = 30 + (seed * 20);

    ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    ctx.fillRect(0, 0, width, height);

    // Add noise for terrain
    const noiseCount = 8000 + Math.floor(seed * 4000);
    for (let i = 0; i < noiseCount; i++) {
        const x = (seed * width * 3 + Math.random() * width) % width;
        const y = Math.random() * height;
        const size = Math.random() * 3;
        const brightness = Math.random() * 100 - 50;

        ctx.fillStyle = `rgba(${160 + brightness}, ${82 + brightness}, ${45 + brightness}, 0.5)`;
        ctx.fillRect(x, y, size, size);
    }

    // Add craters
    const craterCount = 20 + Math.floor(seed * 30);
    for (let i = 0; i < craterCount; i++) {
        const x = (seed * width * 2 + Math.random() * width) % width;
        const y = Math.random() * height;
        const radius = 10 + seed * 50 + Math.random() * 30;

        const craterGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        craterGradient.addColorStop(0, `rgba(0, 0, 0, ${0.4 + seed * 0.3})`);
        craterGradient.addColorStop(0.7, `rgba(100, 50, 30, ${0.2 + seed * 0.2})`);
        craterGradient.addColorStop(1, 'rgba(160, 82, 45, 0)');

        ctx.fillStyle = craterGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

function createIceTexture(ctx, width, height, seed) {
    // Vary ice colors - whites, light blues, cyans
    const hue = 180 + (seed * 40); // Range: cyan to blue
    const saturation = 30 + (seed * 50);
    const lightness = 70 + (seed * 20);

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `hsl(${hue}, ${saturation}%, ${lightness + 10}%)`);
    gradient.addColorStop(0.5, `hsl(${hue + 5}, ${saturation - 10}%, ${lightness}%)`);
    gradient.addColorStop(1, `hsl(${hue - 5}, ${saturation}%, ${lightness - 10}%)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add ice cracks
    ctx.strokeStyle = `rgba(${80 + seed * 40}, ${120 + seed * 30}, 150, ${0.3 + seed * 0.2})`;
    ctx.lineWidth = 2;
    const crackCount = 40 + Math.floor(seed * 30);
    for (let i = 0; i < crackCount; i++) {
        ctx.beginPath();
        let x = (seed * width + Math.random() * width) % width;
        let y = Math.random() * height;
        ctx.moveTo(x, y);

        for (let j = 0; j < 5; j++) {
            x += (Math.random() - 0.5) * 100;
            y += (Math.random() - 0.5) * 100;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    // Add frost patches
    const frostCount = 800 + Math.floor(seed * 400);
    for (let i = 0; i < frostCount; i++) {
        const x = (seed * width * 4 + Math.random() * width) % width;
        const y = Math.random() * height;
        const size = Math.random() * 2;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.4})`;
        ctx.fillRect(x, y, size, size);
    }
}

function createOceanTexture(ctx, width, height, seed) {
    // Vary ocean colors - blues with green tints
    const oceanHue = 200 + (seed * 40); // Range: cyan-blue to blue
    const oceanSat = 50 + (seed * 30);
    const oceanLight = 35 + (seed * 20);

    ctx.fillStyle = `hsl(${oceanHue}, ${oceanSat}%, ${oceanLight}%)`;
    ctx.fillRect(0, 0, width, height);

    // Add continents/land masses
    const landHue = 100 + (seed * 60); // Green to yellow-green
    const landCount = 6 + Math.floor(seed * 4);
    for (let i = 0; i < landCount; i++) {
        const x = (seed * width * 2 + i * 400) % width;
        const y = (seed * height + i * 200) % height;
        const size = 100 + seed * 250;

        ctx.fillStyle = `hsl(${landHue}, 40%, 35%)`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        // Add smaller islands
        for (let j = 0; j < 5; j++) {
            const ix = x + (Math.random() - 0.5) * size * 2;
            const iy = y + (Math.random() - 0.5) * size * 2;
            const isize = 20 + Math.random() * 40;
            ctx.beginPath();
            ctx.arc(ix, iy, isize, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Add cloud layer
    ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + seed * 0.2})`;
    const cloudCount = 25 + Math.floor(seed * 15);
    for (let i = 0; i < cloudCount; i++) {
        const x = (seed * width * 5 + Math.random() * width) % width;
        const y = Math.random() * height;
        const cloudWidth = 50 + seed * 200;
        const cloudHeight = 20 + seed * 50;

        ctx.beginPath();
        ctx.ellipse(x, y, cloudWidth, cloudHeight, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

function createVolcanicTexture(ctx, width, height, seed) {
    // Vary volcanic colors - dark grays to blacks with red/orange lava
    const baseLight = 5 + (seed * 15);
    ctx.fillStyle = `hsl(0, 20%, ${baseLight}%)`;
    ctx.fillRect(0, 0, width, height);

    // Vary lava colors
    const lavaHue = 10 + (seed * 30); // Range: red to orange
    const lavaSat = 80 + (seed * 20);

    // Add lava veins
    ctx.strokeStyle = `hsl(${lavaHue}, ${lavaSat}%, 50%)`;
    ctx.lineWidth = 2 + seed * 3;
    ctx.shadowColor = `hsl(${lavaHue}, ${lavaSat}%, 50%)`;
    ctx.shadowBlur = 8 + seed * 12;

    const veinCount = 25 + Math.floor(seed * 20);
    for (let i = 0; i < veinCount; i++) {
        ctx.beginPath();
        let x = (seed * width + Math.random() * width) % width;
        let y = Math.random() * height;
        ctx.moveTo(x, y);

        for (let j = 0; j < 10; j++) {
            x += (Math.random() - 0.5) * 50;
            y += (Math.random() - 0.5) * 50;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    // Add bright lava spots
    const spotCount = 15 + Math.floor(seed * 15);
    for (let i = 0; i < spotCount; i++) {
        const x = (seed * width * 3 + Math.random() * width) % width;
        const y = Math.random() * height;
        const radius = 10 + seed * 40;

        const lavaGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        lavaGradient.addColorStop(0, `hsla(${lavaHue + 40}, 100%, 60%, 1)`);
        lavaGradient.addColorStop(0.5, `hsla(${lavaHue}, ${lavaSat}%, 50%, 0.8)`);
        lavaGradient.addColorStop(1, `hsla(${lavaHue - 10}, 60%, 30%, 0)`);

        ctx.fillStyle = lavaGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

export { createRealisticPlanetTexture };