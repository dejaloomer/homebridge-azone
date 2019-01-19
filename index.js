var Service, Characteristic;

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerPlatform("homebridge-azonecam", "AZone MD", AZonePlatform);
};

function AZonePlatform(log, config) {
  this.log = log;
  this.config = config;
  this.statusCallbacks = {};
  this.statusTimeout = 0;
}

AZonePlatform.prototype = {

  accessories: function(callback) {
    var foundAccessories = this.config.accessories;
    var myAccessories = [];
        var accessory = new AZoneAccessory(this.log, this.config, this);
        this.log('Created ' + accessory.name + ' Accessory');
        myAccessories.push(accessory);
      
    callback(myAccessories);
  }

}

function AZoneAccessory(log,config,azPlatform) {
  
  this.log = log;
  this.name = "PWC AccName";
  this.azPlatform = azPlatform;
  this.motionDetected = false;
}

AZoneAccessory.prototype = {
  
 getState: function (callback) {
    this.log("Returning state " + this.motionDetected);
    callback(null, this.motionDetected);
 },
    
  getServices: function () {
    var me = this;
    let informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Manufacturer, "PWC Manufacturing")
      .setCharacteristic(Characteristic.Model, "T-100")
      .setCharacteristic(Characteristic.SerialNumber, "pwc-123-456-789");
    var mdService = new Service.MotionSensor(me.name);
    
    mdService
      .getCharacteristic(Characteristic.MotionDetected)
        .on('get', this.getState.bind(this));
 
    this.informationService = informationService;
    this.mdService = mdService;
    return [informationService, mdService];
  }

};
