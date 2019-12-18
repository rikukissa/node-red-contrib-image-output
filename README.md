# 🏞 node-red-contrib-image-output

Simple image output node. Useful for previewing images (of face detecting, object recognition etc...) inside the Node-RED flow editor.

![](https://raw.githubusercontent.com/rikukissa/node-red-contrib-image-output/master/.github/preview.png)

Expects the `msg.payload` to contain a jpg or png image, which need to be either a buffer or a base64 string.


## Installation
Run the following npm command in your Node-RED user directory (typically ~/.node-red):
```
npm install --save node-red-contrib-image-output
```

## Node configuration

### Width
The width (in pixels) that the image needs to be displayed in the flow.  The height will be calculated automatically, with the same aspect ratio as the original image.

### Resize images on server side
By transferring smaller images the bandwith can be reduced, i.e. the number of bytes that is being send across the network.  When too much data is pushed (across the websocket), the flow editor can become ***unresponse***!

+ When this option is activated, the images will be resized (to the specified width) on the server side.  Then those small thumbnail images will be send to the browser, to reduce the bandwith. 
+ When this option is not activated, the (original) large images will be send to the browser.  Once they arrive there, the browser will resize them to the specified width.  As a result much more data needs to be transferred between the server and the browser.
        
Caution: resizing images on the server will require server-side CPU usage.  So it has to be decided what is prefferd: lower bandwidth or lower cpu usage on the server.  This decision will depend on the use case...
