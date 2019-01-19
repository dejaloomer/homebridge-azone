#!/usr/bin/env node
const AZoneMotionDetector = require('./azoneproto.js');

var detector = new AZoneMotionDetector("10.0.0.30",34567,"admin","RG3GZbA9");
detector.on('connect', ()=>{console.log("we connected");
	console.log(detector.getSystemInfo());
	console.log(detector.ChannelTitles);
	});
detector.on('motion', (channel, value)=>{console.log("Motion on channel "+channel+"="+value)});
detector.on('motionStop', (name)=>{console.log("Motion STOPPED on "+name)});
