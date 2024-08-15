var io = require('socket.io-client');
var render = require('./render');
var ChatClient = require('./chat-client');
var Canvas = require('./canvas');
var global = require('./global');

var playerNameInput = document.getElementById('playerNameInput');
var socket;
// Initialize variables for nipple.js
var joystick = null;
var joystickTarget = { x: global.screen.width / 2, y: global.screen.height / 2 };

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
    if (!global.animLoopHandle) {
        animloop();
    }
    socket.emit('respawn', { playerName: global.playerName });
    window.chat.socket = socket;
    window.chat.registerFunctions();
    window.canvas.socket = socket;
    global.socket = socket;

    if (global.mobile) {
        initializeJoystick();
    }
}

function initializeJoystick() {
    // Create a joystick using nipple.js
    joystick = nipplejs.create({
        zone: document.getElementById('gameAreaWrapper'), // Use the game area for the joystick zone
        mode: 'dynamic',
        color: 'blue'
    });

    joystick.on('move', function (evt, data) {
        if (data && data.direction) {
            const angle = data.angle.radian;
            const distance = data.distance;

            // Calculate the new target based on joystick input
            joystickTarget.x = player.x + Math.cos(angle) * distance;
            joystickTarget.y = player.y + Math.sin(angle) * distance;

            // Ensure the target doesn't go out of bounds
            joystickTarget.x = Math.max(0, Math.min(joystickTarget.x, global.game.width));
            joystickTarget.y = Math.max(0, Math.min(joystickTarget.y, global.game.height));

            // Update the global target for the player
            global.target.x = joystickTarget.x;
            global.target.y = joystickTarget.y;
        }
    });

    joystick.on('end', function () {
        // Stop movement when the joystick is released
        playerMovement.x = 0;
        playerMovement.y = 0;
    });
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

        Telegram.WebApp.ready();

        // Debug: Check the entire initDataUnsafe object
        console.log("Telegram WebApp initDataUnsafe:", Telegram.WebApp.initDataUnsafe);

        // Get user data
        var user = Telegram.WebApp.initDataUnsafe.user;

        // Debug: Check if user data is available
        console.log("User data:", user);

        if (user) {
            var username = user.username || "Unnamed";

            console.log("Username: " + username);

            // Set the player name to the obtained Telegram username
            global.playerName = username;
            console.log("Player name set to: " + global.playerName);

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
            // Update player's target position based on joystick input
            if (global.mobile && joystick) {
                player.target.x = global.target.x;
                player.target.y = global.target.y;
            }
};



    var btn = document.getElementById('startButton'),
        btnS = document.getElementById('spectateButton'),
        nickErrorText = document.querySelector('#startMenu .input-error');

    btnS.onclick = function () {
        startGame('spectator');
    };

    btn.onclick = function () {

        // Checks if the nick is valid.
        if (validNick()) {
            nickErrorText.style.opacity = 0;
            startGame('player');
        } else {
            nickErrorText.style.opacity = 1;
        }
    };

    var settingsMenu = document.getElementById('settingsButton');
    var settings = document.getElementById('settings');

    settingsMenu.onclick = function () {
        if (settings.style.maxHeight == '300px') {
            settings.style.maxHeight = '0px';
        } else {
            settings.style.maxHeight = '300px';
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

var playerConfig = {
    border: 6,
    textColor: '#FFFFFF',
    textBorder: '#000000',
    textBorderSize: 3,
    defaultSize: 30
};

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

var visibleBorderSetting = document.getElementById('visBord');
visibleBorderSetting.onchange = settings.toggleBorder;

var showMassSetting = document.getElementById('showMass');
showMassSetting.onchange = settings.toggleMass;

var continuitySetting = document.getElementById('continuity');
continuitySetting.onchange = settings.toggleContinuity;

var roundFoodSetting = document.getElementById('roundFood');
roundFoodSetting.onchange = settings.toggleRoundFood;

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
        global.player = player;
        window.chat.player = player;
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
        var status = '<span class="title">Leaderboard</span>';
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
        // Clear the entire canvas with the background color
        graph.fillStyle = global.backgroundColor;
        graph.fillRect(0, 0, global.screen.width, global.screen.height);

        // Adjust the visible area dynamically based on the player's cell size
        adjustViewableArea();

        // Redraw the grid
        render.drawGrid(global, player, global.screen, graph);

        // Recalculate and draw each game entity based on the new screen size and player position
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

        var cellsToDraw = [];
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

        cellsToDraw.sort((obj1, obj2) => obj1.mass - obj2.mass);

        render.drawCells(cellsToDraw, playerConfig, global.toggleMassState, borders, graph);

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

    // Adjust screen dimensions based on device type
    if (global.mobile) {
        global.screen.width = window.innerWidth;
        global.screen.height = window.innerHeight;
    } else {
        global.screen.width = global.playerType == 'player' ? window.innerWidth : global.game.width;
        global.screen.height = global.playerType == 'player' ? window.innerHeight : global.game.height;
    }

    // Update canvas size if it has changed
    if (c.width !== global.screen.width || c.height !== global.screen.height) {
        c.width = global.screen.width;
        c.height = global.screen.height;
    }

    // Update player screen size
    player.screenWidth = global.screen.width;
    player.screenHeight = global.screen.height;

    // Ensure the player is centered within the new screen dimensions
    player.x = Math.max(Math.min(player.x, global.game.width - global.screen.width / 2), global.screen.width / 2);
    player.y = Math.max(Math.min(player.y, global.game.height - global.screen.height / 2), global.screen.height / 2);

    // Trigger redraw after resizing
    redrawGameElements();

    // Emit the resized window dimensions to the server
    socket.emit('windowResized', { screenWidth: global.screen.width, screenHeight: global.screen.height });
}

function redrawGameElements() {
    // Clear the entire canvas with the background color
    graph.fillStyle = global.backgroundColor;
    graph.fillRect(0, 0, global.screen.width, global.screen.height);

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

    cellsToDraw.sort((obj1, obj2) => obj1.mass - obj2.mass);
    render.drawCells(cellsToDraw, playerConfig, global.toggleMassState, borders, graph);
}
