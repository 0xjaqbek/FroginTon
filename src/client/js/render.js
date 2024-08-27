const FULL_ANGLE = 2 * Math.PI;

const drawRoundObject = (position, radius, graph) => {
    graph.beginPath();
    graph.arc(position.x, position.y, radius, 0, FULL_ANGLE);
    graph.closePath();
    graph.fill();
    graph.stroke();
};

const drawFood = (position, food, graph) => {
    graph.fillStyle = 'hsl(' + food.hue + ', 100%, 50%)';
    graph.strokeStyle = 'hsl(' + food.hue + ', 100%, 45%)';
    graph.lineWidth = 0;
    drawRoundObject(position, food.radius, graph);
};

// Update the drawVirus function to use the image
const drawVirus = (position, virus, graph) => {
    if (virusConfig.image) {
        drawVirusImage(position, graph, virus);
    } else {
        // Fallback if image is not loaded, draw the virus as a polygon
        graph.strokeStyle = virus.stroke;
        graph.fillStyle = virus.fill;
        graph.lineWidth = virus.strokeWidth;
        let theta = 0;
        let sides = 20;

        graph.beginPath();
        for (let theta = 0; theta < FULL_ANGLE; theta += FULL_ANGLE / sides) {
            let point = circlePoint(position, virus.radius, theta);
            graph.lineTo(point.x, point.y);
        }
        graph.closePath();
        graph.stroke();
        graph.fill();
    }
};

const drawFireFood = (position, mass, playerConfig, graph) => {
    graph.strokeStyle = 'hsl(' + mass.hue + ', 100%, 45%)';
    graph.fillStyle = 'hsl(' + mass.hue + ', 100%, 50%)';
    graph.lineWidth = playerConfig.border + 2;
    drawRoundObject(position, mass.radius - 1, graph);
};

const valueInRange = (min, max, value) => Math.min(max, Math.max(min, value))

const circlePoint = (origo, radius, theta) => ({
    x: origo.x + radius * Math.cos(theta),
    y: origo.y + radius * Math.sin(theta)
});

const cellTouchingBorders = (cell, borders) =>
    cell.x - cell.radius <= borders.left ||
    cell.x + cell.radius >= borders.right ||
    cell.y - cell.radius <= borders.top ||
    cell.y + cell.radius >= borders.bottom

const regulatePoint = (point, borders) => ({
    x: valueInRange(borders.left, borders.right, point.x),
    y: valueInRange(borders.top, borders.bottom, point.y)
});

const drawCellWithLines = (cell, borders, graph) => {
    let pointCount = 30 + Math.floor(cell.mass / 5);
    let points = [];
    for (let theta = 0; theta < FULL_ANGLE; theta += FULL_ANGLE / pointCount) {
        let point = circlePoint(cell, cell.radius, theta);
        points.push(regulatePoint(point, borders));
    }
    graph.beginPath();
    graph.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        graph.lineTo(points[i].x, points[i].y);
    }
    graph.closePath();
    graph.fill();
    graph.stroke();
};


const drawCells = (cells, playerConfig, toggleMassState, borders, graph) => {
    cells.forEach(cell => {
        // Draw the cell itself
        graph.fillStyle = cell.color;
        graph.strokeStyle = cell.borderColor;
        graph.lineWidth = playerConfig.border;

        // Draw the cell with lines if it's touching borders
        if (cellTouchingBorders(cell, borders)) {
            drawCellWithLines(cell, borders, graph);
        } else {
            drawRoundObject({ x: cell.x, y: cell.y }, cell.radius, graph);
        }

        // Draw the player image over the player's cells only
        if (cell.isPlayerCell && playerConfig.image) {
            drawPlayerImage({ x: cell.x, y: cell.y }, graph, cell);
        }

        // Draw the cell's name
        if (cell.name) {
            graph.lineWidth = playerConfig.textBorderSize;
            graph.fillStyle = playerConfig.textColor;
            graph.strokeStyle = playerConfig.textBorder;
            graph.textBaseline = 'middle';
            graph.textAlign = 'center';
            graph.font = `bold ${Math.max(cell.radius / 3, 12)}px sans-serif`;

            // Calculate the position for the name to be above the image
            const nameYPosition = cell.y - cell.radius - Math.max(cell.radius / 3, 12) / 1.9;

            // Render the name above the image
            graph.strokeText(cell.name, cell.x, nameYPosition);
            graph.fillText(cell.name, cell.x, nameYPosition);
        }

        // Draw the cell's mass if toggled on
        if (toggleMassState) {
            const massText = Math.ceil(cell.mass).toString();
            graph.lineWidth = playerConfig.textBorderSize;
            graph.fillStyle = playerConfig.textColor;
            graph.strokeStyle = playerConfig.textBorder;
            graph.font = `bold ${Math.max(cell.radius / 4, 10)}px sans-serif`;

            // Render the mass slightly below the name
            graph.strokeText(massText, cell.x, cell.y + cell.radius / 2);
            graph.fillText(massText, cell.x, cell.y + cell.radius / 2);
        }
    });
};



// Define the sponsor image globally so it's accessible everywhere
let sponsorImage = new Image();

// Set the source of the sponsor image
sponsorImage.src = '../img/Sponsor_3.png'; // Update this path as necessary

// Ensure the image is loaded before drawing it
sponsorImage.onload = function() {
    console.log('Sponsor image successfully loaded:', sponsorImage);

    // Redraw or reinitialize the canvas or game if necessary
    // to ensure the sponsor image is drawn as expected.
};

sponsorImage.onerror = function() {
    console.error('Error loading sponsor image');
};

// Define and load the arena image globally
const arenaImage = new Image();
arenaImage.src = '../img/arena.png'; // Update the path as necessary

// Handle successful loading
arenaImage.onload = function() {
    console.log('Arena image loaded successfully');
    // Optionally, trigger a redraw or re-render if necessary
};

// Handle loading errors
arenaImage.onerror = function() {
    console.error('Failed to load arena image');
};

const drawGrid = (global, player, screen, graph) => {
    // Draw the grid lines first
    graph.lineWidth = 1;
    graph.strokeStyle = global.lineColor;
    graph.globalAlpha = 0.15;
    graph.beginPath();

    for (let x = -player.x; x < screen.width; x += screen.height / 18) {
        graph.moveTo(x, 0);
        graph.lineTo(x, screen.height);
    }

    for (let y = -player.y; y < screen.height; y += screen.height / 18) {
        graph.moveTo(0, y);
        graph.lineTo(screen.width, y);
    }

    graph.stroke();
    graph.globalAlpha = 1;

    // Draw the arena images in a 3x3 grid
    if (arenaImage.complete && arenaImage.naturalWidth > 0) {
        const gameWidth = global.game.width;
        const gameHeight = global.game.height;
        const gridSize = 3;
        
        // Use the smaller dimension to ensure square images
        const imageSize = Math.min(gameWidth, gameHeight) / gridSize;
        
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                // Calculate position for each image
                const imageX = col * imageSize;
                const imageY = row * imageSize;

                // Draw the image at its fixed position in the game world
                graph.drawImage(
                    arenaImage,
                    imageX - player.x,
                    imageY - player.y,
                    imageSize,
                    imageSize
                );
            }
        }
    } else {
        console.warn('Arena image not yet loaded or has invalid dimensions');
    }

    // Draw the sponsor image at the top of the screen (keeping this part unchanged)
    if (sponsorImage.complete && sponsorImage.naturalWidth > 0) {
        const sponsorImageWidth = screen.width;
        const sponsorImageHeight = sponsorImageWidth / sponsorImage.naturalWidth * sponsorImage.naturalHeight;

        graph.drawImage(
            sponsorImage,
            (screen.width - sponsorImageWidth) / 2,
            10,
            sponsorImageWidth,
            sponsorImageHeight
        );
    } else {
        console.warn('Sponsor image not yet loaded or has invalid dimensions');
    }
};



const drawBorder = (borders, graph) => {
    graph.lineWidth = 10;
    graph.strokeStyle = '#000000'
    graph.beginPath()
    graph.moveTo(borders.left, borders.top);
    graph.lineTo(borders.right, borders.top);
    graph.lineTo(borders.right, borders.bottom);
    graph.lineTo(borders.left, borders.bottom);
    graph.closePath()
    graph.stroke();
};

const drawErrorMessage = (message, graph, screen) => {
    graph.fillStyle = '#333333';
    graph.fillRect(0, 0, screen.width, screen.height);
    graph.textAlign = 'center';
    graph.fillStyle = '#FFFFFF';
    graph.font = 'bold 30px sans-serif';
    graph.fillText(message, screen.width / 2, screen.height / 2);
}

module.exports = {
    drawFood,
    drawVirus,
    drawFireFood,
    drawErrorMessage,
    drawGrid,
    drawBorder,
    drawCells
};