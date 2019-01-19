const AZoneMotionDetector = require('./azoneproto.js');
var Service, Characteristic;

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerPlatform("homebridge-azonecam", "AZone MD", AZonePlatform);
};

function AZonePlatform(log, config) {
  this.log = log;
  this.config = config;
}

AZonePlatform.prototype = {

  accessories: function(foundAccessoryCallback) {
      this.azone = new AZoneMotionDetector(this.config.host,this.config.port,this.config.user,this.config.password);
      this.azone.on('connect', ()=>{
                this.log("Connected to " + this.config.host);
				this.buildAccessoryList();
				foundAccessoryCallback(this.myDetectors);
				// With cameras registered, now listen for MD events from DVR and dispatch
				this.azone.on('motion', (channel, value)=>{
					var detector = this.myDetectors[channel];
					if(detector) {
						detector.setMotion(value);
						}
					});
		});
	},

	buildAccessoryList: function() {
		this.myDetectors = [];
		var devinfo = {"Manufacturer":"AZone","Model":this.azone.SystemInfo.HardWare,"testSwitch":this.config.testSwitch};
		//search for the user requested cameras by name and create an accessory for each one
		this.config.cameras.forEach((camera)=>{
			this.log('Adding '+camera.name);
			var channel = this.azone.ChannelTitles.indexOf(camera.name);
			if(channel < 0) {
				this.log("Camera " + camera.name + " does not exist on DVR. Skipping.");
				return;
			}
			devinfo.name = camera.name;
			devinfo.SerialNumber = this.azone.SystemInfo.SerialNo + "-" + channel;
			var detector = new AZoneAccessory(devinfo, this.log);
			this.myDetectors[channel]=detector;
		});
	}
}

function AZoneAccessory(devinfo, log) {
  
  this.log = log;
  this.name = devinfo.name;
  this.informationService = new Service.AccessoryInformation();
  this.informationService
    .setCharacteristic(Characteristic.Manufacturer, devinfo.Manufacturer)
    .setCharacteristic(Characteristic.Model, devinfo.Model)
    .setCharacteristic(Characteristic.SerialNumber, devinfo.SerialNumber);

	this.mdService = new Service.MotionSensor(this.name);
   
	//optionally add a switch to debug
	if(devinfo.testSwitch) { 
    this.switchService = new Service.Switch(this.name);
    this.switchService.getCharacteristic(Characteristic.On).on('set', (state,callback)=>{
			this.setMotion(state);
			callback(null);
		});
	}
} 

AZoneAccessory.prototype = {

	setMotion: function (value) {
		this.log("Motion on "+this.name+" = "+value);
		this.mdService.getCharacteristic(Characteristic.MotionDetected).updateValue(value);
	}  ,
  
	getServices: function () {
		var offeredServices = [this.informationService, this.mdService];
		if(this.switchService) {
			offeredServices.push(this.switchService);
		}
		return offeredServices;
	}
};
