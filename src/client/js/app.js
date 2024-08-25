var io = require('socket.io-client');
var render = require('./render');
var ChatClient = require('./chat-client');
var Canvas = require('./canvas');
var global = require('./global');
// Correctly declare and initialize 'position'
let position = { x: 0, y: 0 };
var playerNameInput = document.getElementById('playerNameInput');
var socket;
let initialMass = 0;
var debug = function (args) {
    if (console && console.log) {
        console.log(args);
    }
};

if (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
    global.mobile = true;
}





function startGame(type) {
    global.playerName = global.playerName || playerNameInput.value.replace(/(<([^>]+)>)/ig, '').substring(0, 25);
    global.playerType = type;

    global.screen.width = window.innerWidth;
    global.screen.height = window.innerHeight;

    document.getElementById('startMenuWrapper').style.maxHeight = '0px';
    document.getElementById('gameAreaWrapper').style.opacity = 1;
    if (!socket) {
        socket = io({ query: "type=" + type });
        setupSocket(socket);
    }
    if (!global.animLoopHandle)
        animloop();
    socket.emit('respawn', { playerName: global.playerName });
    window.chat.socket = socket;
    window.chat.registerFunctions();
    window.canvas.socket = socket;
    global.socket = socket;
    redrawGameElements();
}

// Checks if the nick chosen contains valid alphanumeric characters (and underscores).
function validNick() {
    var regex = /^\w*$/;
    debug('Regex Test', regex.exec(playerNameInput.value));
    return regex.exec(playerNameInput.value) !== null;
}

window.onload = function () {
    console.log("Script loaded and running");

    var isTelegramWebApp = typeof Telegram !== 'undefined' && Telegram.WebApp;

    if (isTelegramWebApp) {
        console.log("Running in Telegram Web App");
        window.Telegram.WebApp.disableVerticalSwipes();

        Telegram.WebApp.ready();
        Telegram.WebApp.setHeaderColor('bg_color');
        console.log("Header color", Telegram.WebApp.setHeaderColor);
        
        // Debug: Check the entire initDataUnsafe object
        console.log("Telegram WebApp initDataUnsafe:", Telegram.WebApp.initDataUnsafe);

        // Get user data
        var user = Telegram.WebApp.initDataUnsafe.user;

        // Debug: Check if user data is available
        console.log("User data:", user);

        if (user) {
            var username = user.username || "Unnamed";
            var userId = user.id || "No ID";  // Obtain the Telegram user ID

            console.log("Username: " + username);
            console.log("User ID: " + userId);

            // Set the player name to the obtained Telegram username
            global.playerName = username;
            global.playerId = userId;  // Optionally, store the user ID
            console.log("Player name set to: " + global.playerName);
            console.log("Player ID set to: " + global.playerId);

            // Remove the playerNameInput field from the DOM
            var playerNameInput = document.getElementById('playerNameInput');
            if (playerNameInput) {
                playerNameInput.remove();
                console.log("playerNameInput field removed.");
            }

            // Optionally, start the game automatically
            // startGame("default");  // Uncomment this line if you want the game to start automatically

        } else {
            console.log("No user data available.");
        }
    } else {
        console.log("Not running in Telegram Web App");
    }
};


// Firebase configuration
var firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  
  function storeMassData(massChange, playerName, playerId) { // Add playerId as an argument
    const playerRef = firebase.database().ref(`players/${playerId}`);
    playerRef.update({
      mass: firebase.database.ServerValue.increment(massChange), // Update total mass
      playerName: playerName,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    })
    .then(() => {
      console.log(`Mass data for player ${playerId} updated successfully.`);
    })
    .catch((error) => {
      console.error(`Error updating mass data for player ${playerId}:`, error);
    });
}
  
// Event listener for the retrieve data button
document.getElementById('retrieveDataButton').addEventListener('click', () => {
    // Ensure playerId is defined
    if (!playerId) {
        console.error('Player ID is not defined!');
        return;
    }

    // Get a reference to the Firebase Realtime Database
    const database = firebase.database();

    // Define the path to the data you want to retrieve
    const dataRef = database.ref(`players/${playerId}`); // Replace with your actual path

    // Read the data from the database
    dataRef.once('value', (snapshot) => {
        // Handle the data
        const data = snapshot.val();

        // Do something with the retrieved data
        console.log(data); // Log the data to the console

        // Example: Update a UI element with the data
        const dataElement = document.getElementById('dataElement');
        if (dataElement) {
            dataElement.textContent = JSON.stringify(data, null, 2); // Format data as JSON string
        }
    });
});


var btn = document.getElementById('startButton');
var nickErrorText = document.querySelector('#startMenu .input-error'); // Make sure this is not commented out

btn.onclick = function () {
    // Checks if the nick is valid.
    if (validNick()) {
        nickErrorText.style.opacity = 0;
        startGame('player');
    } else {
        nickErrorText.style.opacity = 1;
    }
};

    playerNameInput.addEventListener('keypress', function (e) {
        var key = e.which || e.keyCode;

        if (key === global.KEY_ENTER) {
            if (validNick()) {
                nickErrorText.style.opacity = 0;
                startGame('player');
            } else {
                nickErrorText.style.opacity = 1;
            }
        }
    });


// TODO: Break out into GameControls.

// Define player configuration
var playerConfig = {
    border: 0,
    textColor: '#FFFFFF',
    textBorder: '#000000',
    textBorderSize: 3,
    defaultSize: 30,
    image: null // Placeholder for image
};

// Load player image
var playerImage = new Image();
playerImage.src = '../img/Frogin_main.svg'; // Update with actual path
console.log("Loading player image from:", playerImage.src);

playerImage.onload = function() {
    console.log('Player image successfully loaded:', playerImage);
    playerConfig.image = playerImage;
    redrawGameElements();  // Ensure the game elements are redrawn after the image is loaded
};

playerImage.onerror = function() {
    console.error('Failed to load player image from:', playerImage.src);
};

function drawPlayerImage(position, graph, cell) {
    const imageSize = cell.radius * 2;  // Scale the image to the cell's diameter
    const textSize = 12; // Size of the font
    const textColor = '#FFFFFF'; // Color of the text

    // Draw the player image
    if (isAnimating && animationFrames.length === 5) {
        // Calculate the current frame based on the elapsed time
        let elapsedTime = (Date.now() - animationStartTime) / 1000; // in seconds
        currentFrameIndex = Math.floor(elapsedTime / frameInterval) % 5;

        // Draw the current frame of the animation
        graph.drawImage(
            animationFrames[currentFrameIndex],
            position.x - imageSize / 2,
            position.y - imageSize / 2,
            imageSize,
            imageSize
        );

        // Stop the animation if it's completed
        if (elapsedTime >= animationDuration) {
            isAnimating = false;
        }
    } else {
        // Draw the regular player image
        graph.drawImage(
            playerConfig.image, 
            position.x - imageSize / 2, 
            position.y - imageSize / 2, 
            imageSize, 
            imageSize
        );
    }

    // Draw the mass next to the player's cell
    graph.font = `${textSize}px Arial`;
    graph.fillStyle = textColor;
    graph.textAlign = 'center';
    graph.textBaseline = 'middle';

    // Position the text to the right of the cell
    graph.fillText(
        Math.round(cell.mass), 
        position.x,
        position.y + imageSize / 2 + 10,  // Adjust the offset as needed
    );
}


var animationFrames = [];
var currentFrameIndex = 0;
var isAnimating = false;
var animationStartTime = null;
var animationDuration = 0.5; // duration in seconds
var frameInterval = animationDuration / 5; // 5 frames, so divide the duration

// Load animation frames
for (let i = 1; i <= 5; i++) {
    let img = new Image();
    img.src = `../img/F${i}.svg`; // Assuming all SVGs are in the same directory
    animationFrames.push(img);
}

var virusConfig = {
    image: null // Placeholder for virus image
};

// Load the image for other users' cells
var otherUsersImage = new Image();
otherUsersImage.src = '../img/Sponsor_2.png'; // Path to the image
console.log("Loading image for other users' cells from:", otherUsersImage.src);

otherUsersImage.onload = function() {
    console.log('Image for other users\' cells successfully loaded:', otherUsersImage);
    redrawGameElements();  // Ensure the game elements are redrawn after the image is loaded
};

otherUsersImage.onerror = function() {
    console.error('Failed to load image for other users\' cells from:', otherUsersImage.src);
};

function drawOtherUserImage(position, graph, cell) {
    const imageSize = cell.radius * 2;  // Scale the image to the cell's diameter

    // Draw the image for other users' cells
    graph.drawImage(
        otherUsersImage, 
        position.x - imageSize / 2, 
        position.y - imageSize / 2, 
        imageSize, 
        imageSize
    );

    // Draw the mass next to the other player's cell
    graph.font = '12px Arial';
    graph.fillStyle = '#FFFFFF';
    graph.textAlign = 'center';
    graph.textBaseline = 'middle';

    // Position the text to the right of the cell
    graph.fillText(
        Math.round(cell.mass), 
        position.x,
        position.y + imageSize / 2 + 10  // Adjust the offset as needed
    );
}


var sponsorImage = new Image();
sponsorImage.src = '../img/Sponsor_3.png'; // Update with the actual path
console.log("Loading sponsor image from:", sponsorImage.src);

sponsorImage.onload = function() {
    console.log('Sponsor image successfully loaded:', sponsorImage);
    redrawGameElements();  // Ensure the game elements are redrawn after the image is loaded
};

sponsorImage.onerror = function() {
    console.error('Failed to load sponsor image from:', sponsorImage.src);
};

// Load virus image
var virusImage = new Image();
virusImage.src = '../img/spansor.png'; // Update with the actual path to spansor.png
console.log("Loading virus image from:", virusImage.src);

virusImage.onload = function() {
    console.log('Virus image successfully loaded:', virusImage);
    virusConfig.image = virusImage;
    redrawGameElements();  // Ensure the game elements are redrawn after the image is loaded
};

virusImage.onerror = function() {
    console.error('Failed to load virus image from:', virusImage.src);
};

function drawVirusImage(position, graph, virus) {
    if (virusConfig.image) {
        const imageSize = virus.radius * 2;  // Scale the image to the virus's diameter
        graph.drawImage(
            virusConfig.image, 
            position.x - imageSize / 2, 
            position.y - imageSize / 2, 
            imageSize, 
            imageSize
        );
    } else {
        console.error('Virus image is not loaded or available');
    }
}

var player = {
    id: -1,
    x: global.screen.width / 2,
    y: global.screen.height / 2,
    screenWidth: global.screen.width,
    screenHeight: global.screen.height,
    target: { x: global.screen.width / 2, y: global.screen.height / 2 }
};
global.player = player;

var foods = [];
var viruses = [];
var fireFood = [];
var users = [];
var leaderboard = [];
var target = { x: player.x, y: player.y };
global.target = target;

window.canvas = new Canvas();
window.chat = new ChatClient();

var c = window.canvas.cv;
var graph = c.getContext('2d');

$("#feed").click(function () {
    socket.emit('1');
    window.canvas.reenviar = false;
});

$("#split").click(function () {
    socket.emit('2');
    window.canvas.reenviar = false;
});

function handleDisconnect() {
    socket.close();
    const currentMass = player.massTotal || 0;
    const massGained = currentMass - (initialMass || 0);
    console.log(`Mass gained during the game: ${massGained}`);
    if (!global.kicked) { // We have a more specific error message 
        render.drawErrorMessage('Disconnected!', graph, global.screen);
    }
}

// socket stuff.
function setupSocket(socket) {
    // Handle ping.
    socket.on('pongcheck', function () {
        var latency = Date.now() - global.startPingTime;
        debug('Latency: ' + latency + 'ms');
        window.chat.addSystemLine('Ping: ' + latency + 'ms');
    });

    // Handle error.
    socket.on('connect_error', handleDisconnect);
    socket.on('disconnect', handleDisconnect);

    // Handle connection.
    socket.on('welcome', function (playerSettings, gameSizes) {
        player = playerSettings;
        player.name = global.playerName || 'Unnamed';  // Fallback to Unnamed if global.playerName is not set
        player.screenWidth = global.screen.width;
        player.screenHeight = global.screen.height;
        player.target = window.canvas.target;
        // Ensure player.cells is an array
        player.cells = player.cells || [];    
        global.player = player;
        window.chat.player = player;
        initialMass = player.massTotal || 0;
        socket.emit('gotit', player);
        global.gameStart = true;
        window.chat.addSystemLine('Connected to the game!');
        window.chat.addSystemLine('Type <b>-help</b> for a list of commands.');
        if (global.mobile) {
            document.getElementById('gameAreaWrapper').removeChild(document.getElementById('chatbox'));
        }
        c.focus();
        global.game.width = gameSizes.width;
        global.game.height = gameSizes.height;
        resize();
    });

    socket.on('playerDied', (data) => {
        const player = isUnnamedCell(data.playerEatenName) ? 'An unnamed cell' : data.playerEatenName;
        //const killer = isUnnamedCell(data.playerWhoAtePlayerName) ? 'An unnamed cell' : data.playerWhoAtePlayerName;

        //window.chat.addSystemLine('{GAME} - <b>' + (player) + '</b> was eaten by <b>' + (killer) + '</b>');
        window.chat.addSystemLine('{GAME} - <b>' + (player) + '</b> was eaten');
    });

    socket.on('playerDisconnect', (data) => {
        window.chat.addSystemLine('{GAME} - <b>' + (isUnnamedCell(data.name) ? 'An unnamed cell' : data.name) + '</b> disconnected.');
    });

socket.on('playerJoin', (data) => {
    window.chat.addSystemLine('{GAME} - <b>' + (data.name || 'An unnamed cell') + '</b> joined.');
});

    socket.on('leaderboard', (data) => {
        leaderboard = data.leaderboard;
        var status = '<span class="title">Top</span>';
        for (var i = 0; i < leaderboard.length; i++) {
            status += '<br />';
            if (leaderboard[i].id == player.id) {
                if (leaderboard[i].name.length !== 0)
                    status += '<span class="me">' + (i + 1) + '. ' + leaderboard[i].name + "</span>";
                else
                    status += '<span class="me">' + (i + 1) + ". An unnamed cell</span>";
            } else {
                if (leaderboard[i].name.length !== 0)
                    status += (i + 1) + '. ' + leaderboard[i].name;
                else
                    status += (i + 1) + '. An unnamed cell';
            }
        }
        //status += '<br />Players: ' + data.players;
        document.getElementById('status').innerHTML = status;
    });

    socket.on('serverMSG', function (data) {
        window.chat.addSystemLine(data);
    });

    // Chat.
    socket.on('serverSendPlayerChat', function (data) {
        window.chat.addChatLine(data.sender, data.message, false);
    });

    // Handle movement.
    socket.on('serverTellPlayerMove', function (playerData, userData, foodsList, massList, virusList) {
        if (global.playerType == 'player') {
     // Check if player gained mass
        if (playerData.massTotal > player.massTotal) {
            isAnimating = true;
            animationStartTime = Date.now();
        }
            player.x = playerData.x;
            player.y = playerData.y;
            player.hue = playerData.hue;
            player.massTotal = playerData.massTotal;
            player.cells = playerData.cells;
        }
        users = userData;
        foods = foodsList;
        viruses = virusList;
        fireFood = massList;
    });

    // Death.
    socket.on('RIP', function () {
        global.gameStart = false;
        const currentMass = player.massTotal || 0;
        const massGained = currentMass - (initialMass || 0);
        console.log(`Mass gained during the game: ${massGained}`);
            // Safeguard: Check if user ID is available
    const userId = global.playerId || 'unknown';
    storeMassData(massGained, global.playerName, userId);
        render.drawErrorMessage('You died!', graph, global.screen);
        window.setTimeout(() => {
            document.getElementById('gameAreaWrapper').style.opacity = 0;
            document.getElementById('startMenuWrapper').style.maxHeight = '1000px';
            if (global.animLoopHandle) {
                window.cancelAnimationFrame(global.animLoopHandle);
                global.animLoopHandle = undefined;
            }
        }, 2500);
    });

    socket.on('kick', function (reason) {
        global.gameStart = false;
        global.kicked = true;
        const currentMass = player.massTotal || 0;
        const massGained = currentMass - (initialMass || 0);
        console.log(`Mass gained during the game: ${massGained}`);
            // Safeguard: Check if user ID is available
    const userId = global.playerId || 'unknown';
    storeMassData(massGained, global.playerName, userId);
        if (reason !== '') {
            render.drawErrorMessage('You were kicked for: ' + reason, graph, global.screen);
        }
        else {
            render.drawErrorMessage('You were kicked!', graph, global.screen);
        }
        socket.close();
    });
}

const isUnnamedCell = (name) => name.length < 1;

const getPosition = (entity, player, screen) => {
    return {
        x: entity.x - player.x + screen.width / 2,
        y: entity.y - player.y + screen.height / 2
    }
}

window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

window.cancelAnimFrame = (function (handle) {
    return window.cancelAnimationFrame ||
        window.mozCancelAnimationFrame;
})();

function animloop() {
    global.animLoopHandle = window.requestAnimFrame(animloop);
    gameLoop();
}

function gameLoop() {
    if (global.gameStart) {
        // Clear the canvas and redraw the background
        graph.fillStyle = global.backgroundColor;
        graph.fillRect(0, 0, global.screen.width, global.screen.height);

        // Adjust the visible area based on the player's cell size
        adjustViewableArea();

        // Draw the grid
        render.drawGrid(global, player, global.screen, graph);

        // Draw each game entity based on the new screen size and player position
        foods.forEach(food => {
            let position = getPosition(food, player, global.screen);
            render.drawFood(position, food, graph);
        });

        fireFood.forEach(fireFood => {
            let position = getPosition(fireFood, player, global.screen);
            render.drawFireFood(position, fireFood, playerConfig, graph);
        });

        viruses.forEach(virus => {
            let position = getPosition(virus, player, global.screen);
            drawVirusImage(position, graph, virus);
        });

        let borders = {
            left: global.screen.width / 2 - player.x,
            right: global.screen.width / 2 + global.game.width - player.x,
            top: global.screen.height / 2 - player.y,
            bottom: global.screen.height / 2 + global.game.height - player.y
        };

        if (global.borderDraw) {
            render.drawBorder(borders, graph);
        }

        var cellsToDraw = [];
        users.forEach(user => {
            let color = 'hsl(' + user.hue + ', 100%, 50%, 0.01)';
            let borderColor = 'hsl(' + user.hue + ', 100%, 45%, 0.1)';
        
            user.cells.forEach(cell => {
                let position = {
                    x: cell.x - player.x + global.screen.width / 2,
                    y: cell.y - player.y + global.screen.height / 2
                };
        
                // Add each cell to the drawing queue
                cellsToDraw.push({
                    color: color,
                    borderColor: borderColor,
                    mass: cell.mass,
                    name: user.name,
                    radius: cell.radius,
                    x: position.x,
                    y: position.y
                });

                // Draw the image for other users' cells
                if (user.id !== player.id) {
                    drawOtherUserImage(position, graph, cell);
                }
            });
        });
        
        // Sort cells by mass before drawing them
        cellsToDraw.sort((obj1, obj2) => obj1.mass - obj2.mass);
        
        // Draw cells first, then draw the player image over the player's cells
        render.drawCells(cellsToDraw, playerConfig, global.toggleMassState, borders, graph);

        // Draw the player image over the player's cells only
        users.forEach(user => {
            if (user.id === player.id) {
                user.cells.forEach(cell => {
                    let position = getPosition(cell, player, global.screen);
                    drawPlayerImage(position, graph, cell);
                });
            }
        });

        // Send heartbeat data
        socket.emit('0', window.canvas.target);
    }
}


function adjustViewableArea() {
    let maxCellSize = Math.max(...player.cells.map(cell => cell.radius * 2));

    if (maxCellSize > global.screen.width * 0.33) {
        // Log cell size for debugging
        console.log(`Player's cell is larger than 33% of the screen width: ${maxCellSize}px`);

        // Expand the viewable area to ensure all elements are visible
        let scalingFactor = 1.2;  // Increase the scaling factor for better visibility
        global.screen.width *= scalingFactor;
        global.screen.height *= scalingFactor;

        // Update canvas size
        c.width = global.screen.width;
        c.height = global.screen.height;

        // Update player screen size
        player.screenWidth = global.screen.width;
        player.screenHeight = global.screen.height;

        // Ensure the player remains centered
        player.x = Math.max(Math.min(player.x, global.game.width - global.screen.width / 2), global.screen.width / 2);
        player.y = Math.max(Math.min(player.y, global.game.height - global.screen.height / 2), global.screen.height / 2);

        // Emit the resized window dimensions to the server
        socket.emit('windowResized', { screenWidth: global.screen.width, screenHeight: global.screen.height });
    }
}

function resize() {
    if (!socket) return;

    if (global.mobile) {
        global.screen.width = window.innerWidth;
        global.screen.height = window.innerHeight;
    } else {
        global.screen.width = global.playerType == 'player' ? window.innerWidth : global.game.width;
        global.screen.height = global.playerType == 'player' ? window.innerHeight : global.game.height;
    }

    if (c.width !== global.screen.width || c.height !== global.screen.height) {
        c.width = global.screen.width;
        c.height = global.screen.height;
    }

    player.screenWidth = global.screen.width;
    player.screenHeight = global.screen.height;

    player.x = Math.max(Math.min(player.x, global.game.width - global.screen.width / 2), global.screen.width / 2);
    player.y = Math.max(Math.min(player.y, global.game.height - global.screen.height / 2), global.screen.height / 2);

    redrawGameElements();

    socket.emit('windowResized', { screenWidth: global.screen.width, screenHeight: global.screen.height });
}


function redrawGameElements() {
    // Clear the entire canvas with the background color
    graph.fillStyle = global.backgroundColor;
    graph.fillRect(0, 0, global.screen.width, global.screen.height);

    // Check if sponsor image is loaded and log details
    if (sponsorImage && sponsorImage.complete) {
        console.log('Drawing sponsor image...');
        const sponsorImageWidth = global.screen.width; // Scale width to 50% of screen width
        const sponsorImageHeight = sponsorImageWidth / sponsorImage.width * sponsorImage.height; // Maintain aspect ratio
        graph.drawImage(
            sponsorImage, 
            (global.screen.width - sponsorImageWidth) / 2, // Center horizontally
            10, // Top margin of 10 pixels
            sponsorImageWidth,
            sponsorImageHeight
        );
    } else {
        console.error('Sponsor image is not loaded or available');
    }

    // Redraw grid and all game elements
    render.drawGrid(global, player, global.screen, graph);

    foods.forEach(food => {
        let position = getPosition(food, player, global.screen);
        render.drawFood(position, food, graph);
    });

    fireFood.forEach(fireFood => {
        let position = getPosition(fireFood, player, global.screen);
        render.drawFireFood(position, fireFood, playerConfig, graph);
    });

    viruses.forEach(virus => {
        let position = getPosition(virus, player, global.screen);
        render.drawVirus(position, virus, graph);
    });

    let borders = {
        left: global.screen.width / 2 - player.x,
        right: global.screen.width / 2 + global.game.width - player.x,
        top: global.screen.height / 2 - player.y,
        bottom: global.screen.height / 2 + global.game.height - player.y
    };

    if (global.borderDraw) {
        render.drawBorder(borders, graph);
    }

    // Redraw player cells sorted by mass
    let cellsToDraw = [];
    users.forEach(user => {
        let color = 'hsl(' + user.hue + ', 100%, 50%)';
        let borderColor = 'hsl(' + user.hue + ', 100%, 45%)';
        user.cells.forEach(cell => {
            cellsToDraw.push({
                color: color,
                borderColor: borderColor,
                mass: cell.mass,
                name: user.name,
                radius: cell.radius,
                x: cell.x - player.x + global.screen.width / 2,
                y: cell.y - player.y + global.screen.height / 2
            });
        });
    });
    if (playerConfig.image) {
        console.log('Attempting to draw player image at:', position);
        graph.drawImage(
            playerConfig.image,
            position.x - playerConfig.image.width / 20,
            position.y - playerConfig.image.height / 20
        );
    } else {
        console.log('Player image not available');
    }

    cellsToDraw.sort((obj1, obj2) => obj1.mass - obj2.mass);
    render.drawCells(cellsToDraw, playerConfig, global.toggleMassState, borders, graph);
    if (!c || !graph) {
        console.error('Canvas or context not initialized');
    }
}
