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

### Show thumbnail images
When activated, the input image will be resized automatically (to the specified) width.  This way the bandwith can be reduced, i.e. the number of bytes that is being send across the network.  When too much data is pushed (across the websocket), the flow editor can become ***unresponse***!

Caution: resizing images will require server-side CPU usage.  So it has decided what is required: lower bandwidth or lower cpu usage.  This decision will depend on the use case...
