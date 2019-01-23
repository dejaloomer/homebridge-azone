# homebridge-azonecam

This plugin creates motion detector accessories for the cameras of an A-Zone NVR. Apparently many models of Chinese IP cameras all use the same hardware so this should be usable on those as well.
You can use it in conjunction with the excellent homebridge-camera-ffmpeg. When motion is detected you get a notification with a snapshot from the camera. When you tap the notification you are taken to a live camera feed. Cool!

To use create a platform entry with the following params:
{
  "platform":"AZone MD",
  "name": "MyAZPlatform",
  "host": "xx.xx.xx.xx",
  "port": 34567,
  "user": "admin",
  "password": "xxxxxxxxx",
  "testSwitch": true,
  "cameras": [
    {"name":"Patio"},
    {"name":"Front"},
    {"name":"Shed"},
    {"name":"Side"}
    ]
}

Set host,port,user,password to correct values for your environment.
You can edit the enclosed test.js script to quickly validate those values.
In the cameras section add the name (as set on your DVR) for each channel(camera) you want to create a motion detector accessory for. This lets you not create ones for cameras you aren't interested in.

testSwitch is optional. If included and set to true you will also get a Switch accessory for each detector. You can trigger a fake detection with this switch to make sure Homekit is delivering notifications. I also used it so I didn't have to keep going outside to wave at my camera while developing.

TODO: Recover from a dropped connection to DVR. Right now you have to restart homebridge. 
