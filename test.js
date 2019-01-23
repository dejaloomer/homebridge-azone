#!/usr/bin/env node
const AZoneMotionDetector = require('./azoneproto.js');

var detector = new AZoneMotionDetector("10.0.0.30",34567,"admin",process.argv[2]);
detector.on('connect', ()=>{console.log("we connected");
	console.log(detector.getSystemInfo());
	console.log(detector.ChannelTitles);
	});
detector.on('motion', (channel, value)=>{console.log("Motion on channel "+channel+"="+value)});

