#!/usr/bin/env node

console.log("hello");
const net = require('net');
function  sendPacket(client, type,payload) {
	var header = Buffer.allocUnsafe(20);
	var json = JSON.stringify(payload);
	var seq=0;
	if(sessionID != 0) {
		payload.SessionID = sessionID.toString(16);
	}
	header.writeUInt32LE(0xff, 0); //mystery constant
	header.writeUInt32LE(sessionID,4); //sessionID
	if(type != 0x03ee0000) {
		seq = sequenceNumber++;
	}
	header.writeUInt32LE(seq,8); //incrementing sequence number for non-keep alive packets
	header.writeUInt32LE(type,12); //packet type
	header.writeUInt32LE(json.length,16); //length of serialized json
	client.write(header);
	client.write(json);
}

function keepaliveHeartbeat() {
	console.log("Tick");
	sendPacket(client, 0x03ee0000, {Name : "KeepAlive"});
	//sendPacket(client, 0x04120000, {Name : "NetWork.ChnStatus"});
}

var sessionID = 0;
var sequenceNumber = 0;
const client = net.createConnection({ port: 34567, host: "10.0.0.30" }, () => {
  // 'connect' listener
  console.log('connected to server!');
	var message = {
	EncryptType : "MD5",
	LoginType : "DVRIP-Web",
	PassWord : "RG3GZbA9",
	UserName : "admin"
}
	sendPacket(client, 0x03e80000, message);
 // sendPacket(client, 0x03e80000, '{ "EncryptType" : "MD5", "LoginType" : "DVRIP-Web", "PassWord" : "RG3GZbA9", "UserName" : "admin" }\n');
});
client.on('data', (data) => {
  var payload = JSON.parse(data.slice(20,data.length-2));
	console.log(payload);
	var pktType = data.readUInt32LE(12);
	console.log(pktType.toString(16));
	if(pktType === 0x03e90000) {
		sessionID = data.readUInt32LE(4);
		console.log("Setting session ID to " + sessionID.toString(16));
		//sendPacket(client, 0x03fc0000, {Name : "SystemInfo"});
		sendPacket(client, 0x05dc0000, {Name : ""});
		setInterval(keepaliveHeartbeat, payload.AliveInterval*1000);
	}
	
	
	
//  client.end();
});
client.on('end', () => {
  console.log('disconnected from server');
});
