const net = require('net');
const EventEmitter = require('events');
const util = require('util');
const crypto = require('crypto');

/* found algorithm for creating dvr password at
https://fossies.org/linux/john/src/dahua_fmt_plug.c
It's the md5 with a simple conversion to characters
*/

function hashForDVR(password) {
	var dvrPass = '';

	var pmd = crypto.createHash('md5').update(password).digest()
	var dvrPass='';
	for(var i = 0; i<pmd.length; i+=2) {
		var b = (pmd[i] + pmd[i+1]) %62;
		if(b < 10) {
			b += 48;
		} else if (b < 36) {
			b += 55;
		} else {
			b += 61;
		}
	dvrPass = dvrPass.concat(String.fromCharCode(b));
	}
	return dvrPass;
}

class AZoneMotionDetector extends EventEmitter {
	constructor(host, port, user, password) {
	super();	
	this.host = host;
	this.port = port;
	this.user = user;
	this.password = hashForDVR(password);
	this.sessionID = 0;
	this.sequenceNumber = 0;
	this.netStream = Buffer.allocUnsafe(0);
	this.packetHeader;
	this.expectedBytes = 20;


	this.client = net.createConnection({ port: this.port, host: this.host }, () => {
  		// 'connect' listener
		this.sendPacket(0x03e80000, { EncryptType : "MD5", LoginType : "DVRIP-Web", PassWord : this.password, UserName : this.user});
	});

	this.client.on('data', (data) => {
		this.netStream = Buffer.concat([this.netStream,data]);
		this.processNetstream();
	});

	this.client.on('end', () => {
  		console.log('disconnected from server');
	});
}
	processNetstream() {
	//console.log("netstream contains " + this.netStream.length + " bytes, we want " + this.expectedBytes);
	if(this.netStream.length >= this.expectedBytes) {
		var payload = this.netStream.slice(0,this.expectedBytes);
		this.netStream = this.netStream.slice(this.expectedBytes);
		if(this.packetHeader == null) {
			this.packetHeader = {};
			this.packetHeader.sessionID = payload.readUInt32LE(4);
			this.packetHeader.sequenceNumber = payload.readUInt32LE(8);
			this.packetHeader.packetType = payload.readUInt32LE(12);
			this.packetHeader.packetLength = payload.readUInt32LE(16);
			//console.log(this.packetHeader);
			this.expectedBytes = this.packetHeader.packetLength;
			this.processNetstream();
		} else {
			var packet = JSON.parse(payload.slice(0,payload.length-2)); //ignore the lf and /0 at end
			//console.log(packet);
			var pt = this.packetHeader.packetType;

			if(pt === 0x03e90000) { //login completion
				this.sessionID = this.packetHeader.sessionID;
				//console.log("setting session id to " + sessionID.toString(16));
				this.sendPacket(0x03fc0000, {Name : "SystemInfo"});
				this.sendPacket(0x04180000, {Name : "ChannelTitle"});
				this.sendPacket(0x05dc0000, {Name : ""}); //enable motion events
				setInterval(()=> { this.sendPacket(0x03ee0000, {Name : "KeepAlive"});}, packet.AliveInterval*1000);
			} else if(pt == 0x03fd0000) { //system info
				this.SystemInfo = packet.SystemInfo;
			} else if(pt == 0x04190000) { //channel titles
				this.ChannelTitles = packet.ChannelTitle;
			} else if(pt == 0x05dd0000) { //motion detect armed
				this.emit('connect');
			} else if(pt == 0x05e00000) { //motion detection event
				var ai = packet.AlarmInfo;
				if(ai.Status == 'Start') {
					this.emit('motion', ai.Channel, true);
				} else if(ai.Status == 'Stop') {
					this.emit('motion', ai.Channel, false);
				}
			}
			// get ready for next header/packet in stream
			this.packetHeader = null;
			this.expectedBytes = 20;
			this.processNetstream();
		}
	}
	}
	sendPacket(type,payload) {
	var header = Buffer.allocUnsafe(20);
	var json = JSON.stringify(payload);
	var seq=0;
	if(this.sessionID != 0) {
		payload.SessionID = this.sessionID.toString(16);
	}
	header.writeUInt32LE(0xff, 0); //mystery constant
	header.writeUInt32LE(this.sessionID,4); //sessionID
	if(type != 0x03ee0000) {
		seq = this.sequenceNumber++;
	}
	header.writeUInt32LE(seq,8); //incrementing sequence number for non-keep alive packets
	header.writeUInt32LE(type,12); //packet type
	header.writeUInt32LE(json.length,16); //length of serialized json
	this.client.write(header);
	this.client.write(json);
	}

	getSystemInfo() {
		return this.SystemInfo;
	}

}
module.exports = AZoneMotionDetector;
