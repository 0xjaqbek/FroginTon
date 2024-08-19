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
            if (data && data.vector) {
                self.handleJoystickInput(data.vector);
            }
        });

        this.joystick.on('end', function () {
            self.reenviar = true;
        });

        global.canvas = this;
    }

    handleJoystickInput(vector) {
        // Invert the y-axis
        let x = vector.x;
        let y = -vector.y;

        this.target = {
            x: x * Number.MAX_VALUE,
            y: y * Number.MAX_VALUE
        };

        global.target = this.target;
        this.socket.emit('0', this.target);
    }

    // Remove old directionDown, directionUp, gameInput, touchInput, keyInput methods
    // as they are replaced by joystick input
}

module.exports = Canvas;
