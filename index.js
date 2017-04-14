'use strict';

const path = require('path');

const SerialPort = require('serialport');
const CONF       = require(path.resolve('conf.json'));

const internals = function() {
	this.comName = "";
	this.switch  = false;
	this.status  = {
		state: "disconnected",
		error: false
	};

	this.initSwitch();
};

internals.prototype.initSwitch = function() {
	let that = this;

	that.loadPort()
		.then((comName) => {
			that.comName = comName;

			console.info(['info', 'switch'], "USB switch identified as " + that.comName);

			that.switch = new SerialPort(that.comName, {
				baudRate: CONF.baudRate
			});

			that.switch.on('open', () => {
				that.status.state = 'open';
				console.info(['info', 'switch'], that.status);
			});

			that.switch.on('error', (err) => {
				that.status.state = 'errored';
				that.status.error = err;

				console.info(['info', 'switch'], that.status);
			});

			that.switch.on("close", () => {
				that.switchStatus = 'closed';
			});

			that.switch.on("disconnect", (err) => {
				that.status.state = 'disconnected';
				that.status.error = err;

				console.info(['info', 'switch'], that.status);
			});
		})
		.catch((err) => {
			that.status.state = 'errored';
			that.status.error = err;

			console.info(['info', 'switch'], that.status);
		});

};

internals.prototype.getSwitchStatus = function() {
    return this.status;
};

internals.prototype.loadPort = function() {
    let that = this;

    return new Promise((resolve, reject) => {
        try {
            SerialPort.list((err, ports) => {
                ports.forEach((port) => {
                    if(port.vendorId === CONF.vendorId && port.productId === CONF.productId) {
                        resolve(port.comName);
                    }
                });
                reject(new Error("No vendorId matching " + CONF.vendorId + " or productId matching " + CONF.productId));
            });

        } catch(e) {
            reject(e);
        }
    });
};

internals.prototype.toggleSwitch = function(toggle) {
    let that = this;
    let command = (!!toggle) ? CONF.onCommand : CONF.offCommand;

    if(that.status.state === 'open') {
        that.switch.write(Buffer.from(command, 'hex'), (err) => { // on A00101A2 off A00100A1
            console.info(['info', 'toggle'], "Switch Toggled " + !!toggle);
        });
    }
};

exports = new internals();

