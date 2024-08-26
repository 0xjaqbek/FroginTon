var global = require('./global');
var nipplejs = require('nipplejs');

class Canvas {
    constructor(params) {
        this.directionLock = false;
        this.target = global.target;
        this.reenviar = true;
        this.socket = global.socket;
        this.directions = [];
        var self = this;

        this.cv = document.getElementById('cvs');
        this.cv.width = global.screen.width;
        this.cv.height = global.screen.height;
    
        
            // Initialize joystick with nipple.js
        this.joystick = nipplejs.create({
            zone: document.getElementById('joystick-zone'),  // assuming there is a div with id 'joystick-zone'
            mode: 'static',
            position: { left: '50%', top: '80%' },
            color: 'white',
            size: 100,
        });

        // Handle joystick move events
        this.joystick.on('move', function (evt, data) {
            if (data && data.vector && data.distance) {
                self.handleJoystickInput(data.vector, data.distance);
            }
        });

        this.joystick.on('end', function () {
            self.reenviar = true;
        });

        global.canvas = this;
    }

    handleJoystickInput(vector, distance) {
        // Invert the y-axis
        let x = vector.x;
        let y = -vector.y;
    
        // Normalize the distance to a value between 0 and 1
        const maxDistance = this.joystick.options.size / 2;
        let normalizedDistance = Math.min(distance / maxDistance, 1);
    
        // Add a dead zone
        const deadZone = 0.1;
        if (normalizedDistance < deadZone) {
            this.target = { x: 0, y: 0 };
            global.target = this.target;
            this.socket.emit('0', this.target);
            return;
        }
    
        // Adjust the curve for more precise control
        let speedFactor = Math.pow((normalizedDistance - deadZone) / (1 - deadZone), 3);
    
        // Scale down the maximum speed
        const maxSpeed = 1 * Number.MAX_VALUE;
    
        // Adjust target coordinates based on the speed factor
        this.target = {
            x: x * speedFactor * maxSpeed,
            y: y * speedFactor * maxSpeed
        };
    
        global.target = this.target;
        this.socket.emit('0', this.target);
    }

}

module.exports = Canvas;