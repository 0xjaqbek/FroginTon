// Ensure to include the necessary libraries
var global = require('./global');

class Canvas {
    constructor(_params) {
        this.directionLock = true;
        this.target = global.target;
        this.reenviar = true;
        this.socket = global.socket;
        this.directions = [];
        this.joystickActive = true;
        var self = this;

        this.cv = document.getElementById('cvs');
        this.cv.width = global.screen.width;
        this.cv.height = global.screen.height;
        this.cv.addEventListener('mousemove', this.gameInput, false);
        this.cv.addEventListener('mouseout', this.outOfBounds, false);
        this.cv.addEventListener('keypress', this.keyInput, false);
        this.cv.addEventListener('keyup', function(event) {
            self.reenviar = true;
            self.directionUp(event);
        }, false);
        this.cv.addEventListener('keydown', this.directionDown, false);
        this.cv.addEventListener('touchmove', this.touchInput, false);
        this.cv.parent = self;
        global.canvas = this;

        // Initialize joystick if on mobile
        if (global.mobile) {
            this.initializeJoystick();
        }
    }

    // Joystick initialization
    initializeJoystick() {
        var self = this;
    
        // Get the screen dimensions
        const screenWidth = this.cv.width;
        const screenHeight = this.cv.height;
    
        // Calculate the static position for the joystick
        const joystickX = screenWidth / 2; // Centered horizontally
        const joystickY = screenHeight * 0.8; // 25% of screen height from the bottom
    
        this.joystick = nipplejs.create({
            zone: document.getElementById('gameAreaWrapper'),
            mode: 'static', // Set to static mode
            position: { left: joystickX + 'px', top: joystickY + 'px' }, // Position the joystick
            color: 'blue',
            size: 75 // You can adjust the size as needed
        });

        let initialPosition = { x: 0, y: 0 };

        this.joystick.on('start', function(_evt, data) {
            if (data && data.position) {
                initialPosition.x = data.position.x;
                initialPosition.y = data.position.y;
            }
        });

        this.joystick.on('move', function (_evt, data) {
            if (data && data.direction) {
                const angle = data.angle.radian;
                const distance = data.distance;

                let joystickTarget = {
                    x: initialPosition.x + Math.cos(angle) * distance,
                    y: initialPosition.y + Math.sin(angle) * distance
                };

                self.joystickInput(joystickTarget, initialPosition);
            }
        });

        this.joystick.on('end', function () {
            global.playerMovement = { x: 0, y: 0 };
        });
    }

    // Modified joystickInput function
    joystickInput(joystickTarget, initialPosition) {
        if (!this.directionLock) {
            // Adjust the calculation to ensure it reacts properly within the joystick's area
            let movementX = joystickTarget.x - initialPosition.x;
            let movementY = joystickTarget.y - initialPosition.y;
    
            // Ensure these coordinates are correctly adjusted based on your canvas size
            this.parent.target.x = (movementX / this.cv.width) * 2 - 1;
            this.parent.target.y = (movementY / this.cv.height) * 2 - 1;
    
            // Update the global target for game logic
            global.target = this.parent.target;
        }
    }

    // Function called when a key is pressed, will change direction if arrow key.
    directionDown(event) {
        var key = event.which || event.keyCode;
        var self = this.parent; 
        if (self.directional(key)) {
            self.directionLock = true;
            if (self.newDirection(key, self.directions, true)) {
                self.updateTarget(self.directions);
                self.socket.emit('0', self.target);
            }
        }
    }

    directionUp(event) {
        var key = event.which || event.keyCode;
        if (this.directional(key)) {
            if (this.newDirection(key, this.directions, false)) {
                this.updateTarget(this.directions);
                if (this.directions.length === 0) this.directionLock = false;
                this.socket.emit('0', this.target);
            }
        }
    }

    // Updates the direction array including information about the new direction.
    newDirection(direction, list, isAddition) {
        var result = false;
        var found = false;
        for (var i = 0, len = list.length; i < len; i++) {
            if (list[i] == direction) {
                found = true;
                if (!isAddition) {
                    result = true;
                    list.splice(i, 1);
                }
                break;
            }
        }
        if (isAddition && !found) {
            result = true;
            list.push(direction);
        }
        return result;
    }

    updateTarget(list) {
        this.target = { x : 0, y: 0 };
        var directionHorizontal = 0;
        var directionVertical = 0;
        for (var i = 0, len = list.length; i < len; i++) {
            if (directionHorizontal === 0) {
                if (list[i] == global.KEY_LEFT) directionHorizontal -= Number.MAX_VALUE;
                else if (list[i] == global.KEY_RIGHT) directionHorizontal += Number.MAX_VALUE;
            }
            if (directionVertical === 0) {
                if (list[i] == global.KEY_UP) directionVertical -= Number.MAX_VALUE;
                else if (list[i] == global.KEY_DOWN) directionVertical += Number.MAX_VALUE;
            }
        }
        this.target.x += directionHorizontal;
        this.target.y += directionVertical;
        global.target = this.target;
    }

    directional(key) {
        return this.horizontal(key) || this.vertical(key);
    }

    horizontal(key) {
        return key == global.KEY_LEFT || key == global.KEY_RIGHT;
    }

    vertical(key) {
        return key == global.KEY_DOWN || key == global.KEY_UP;
    }

    outOfBounds() {
        if (!global.continuity) {
            this.parent.target = { x : 0, y: 0 };
            global.target = this.parent.target;
        }
    }

    gameInput(mouse) {
        if (!this.directionLock) {
            this.parent.target.x = mouse.clientX - this.width / 2;
            this.parent.target.y = mouse.clientY - this.height / 2;
            global.target = this.parent.target;
        }
    }

    touchInput(touch) {
        touch.preventDefault();
        touch.stopPropagation();

        const touchX = touch.touches[0].clientX;
        const touchY = touch.touches[0].clientY;

        if (!this.directionLock) {
            this.parent.target.x = touchX - this.width / 2;
            this.parent.target.y = touchY - this.height / 2;
            global.target = this.parent.target;
        }
    }

    keyInput(event) {
        var key = event.which || event.keyCode;
        if (key === global.KEY_FIREFOOD && this.parent.reenviar) {
            this.parent.socket.emit('1');
            this.parent.reenviar = false;
        }
        else if (key === global.KEY_SPLIT && this.parent.reenviar) {
            document.getElementById('split_cell').play();
            this.parent.socket.emit('2');
            this.parent.reenviar = false;
        }
        else if (key === global.KEY_CHAT) {
            document.getElementById('chatInput').focus();
        }
    }
}

module.exports = Canvas;
