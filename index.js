"use strict";

var Service, Characteristic;
var fs = require('fs');

module.exports = function(homebridge) {
 
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  
  homebridge.registerAccessory("homebridge-dummy", "DummySwitch", DummySwitch);
}

function DummySwitch(log, config) {
	this.log = log;
	this.name = config.name;
	this.onState = undefined;
	this.autoOffTimer = config.autoOffTimer;
  
	try {
		let data = fs.readFileSync(__dirname + "/last_device_state_" + this.name, 'utf8');
		this.onState = JSON.parse(data)['on'];
		this.log("The devices file was loaded!");
	} catch (err) {
		// Here you get the error when the file was not found,
		// but you also get any other error
		if (err.code === 'ENOENT') {
			this.log('File not found!');
		} else {
			this.log(err);
			// throw err;
		}
		this.onState = false;
	}
	
	this._service = new Service.Switch(this.name);
	this._service.getCharacteristic(Characteristic.On)
	.on('set', this._setOn.bind(this));
	
	this._service.setCharacteristic(Characteristic.On, this.onState);
}

DummySwitch.prototype.getServices = function() {
  return [this._service];
}

DummySwitch.prototype._setOn = function(on, callback) {
	
	let that = this;
	that.log("Setting switch to " + on);
	that.onState = on;
  
	if (on && that.autoOffTimer && that.autoOffTimer > 0) {
		setTimeout(function() {
			that._service.setCharacteristic(Characteristic.On, false);
		}.bind(that), that.autoOffTimer);
	}
  
	fs.writeFile(__dirname + "/last_device_state_" + that.name, JSON.stringify({'on': that.onState}), 'utf8', function(err) {
		if (err) {
			that.log(err);
		} else {
			that.log("The device file was saved!");
		}
	});
  
	callback();
}
