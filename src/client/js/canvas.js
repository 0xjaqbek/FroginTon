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
        const maxDistance = this.joystick.options.size / 2; // Half the joystick size is the maximum distance
        let normalizedDistance = Math.min(distance / maxDistance, 1); // Ensure it stays within [0, 1]

        // Define speedFactor based on distance ranges
        let speedFactor;
        if (normalizedDistance < 0.67) {
            // First two-thirds: apply a quadratic function for a gradual increase
            speedFactor = Math.pow(normalizedDistance / 0.67, 2) * 0.5;
        } else {
            // Last third: use a linear function that ramps up quickly
            speedFactor = 0.5 + ((normalizedDistance - 0.67) / 0.33) * 0.5;
        }

        // Adjust target coordinates based on the speed factor
        this.target = {
            x: x * speedFactor * Number.MAX_VALUE,
            y: y * speedFactor * Number.MAX_VALUE
        };

        global.target = this.target;
        this.socket.emit('0', this.target);
    }

}

module.exports = Canvas;
