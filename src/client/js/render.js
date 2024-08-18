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
            const nameYPosition = cell.y - cell.radius - Math.max(cell.radius / 3, 12) / 2;

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






const drawGrid = (global, player, screen, graph) => {
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
};

const drawBorder = (borders, graph) => {
    graph.lineWidth = 1;
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