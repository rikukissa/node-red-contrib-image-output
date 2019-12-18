module.exports = function(RED) {
    var Jimp = require('jimp'); 
    
    function ImageNode(config) {
        RED.nodes.createNode(this, config);
        this.imageWidth = config.width;
        this.thumbnail = config.thumbnail;
        
        var node = this;
        
        function sendImageToClient(image, msg) {
            if (Buffer.isBuffer(image)) {
                image = image.toString("base64");
            }
                
            try {
                RED.comms.publish("image", { id:node.id, data:image });
                if (msg.hasOwnProperty("filename")) { node.status({text:" " + msg.filename}); }
            }
            catch(e) {
                node.error("Invalid image", msg);
            }
        } 

        node.on("input", function(msg) {
            var image = msg.payload;
            
            if (!Buffer.isBuffer(image) && (typeof image !== 'string') && !(image instanceof String)) {
                node.error("Input should be a buffer or a base64 string (containing a jpg or png image)");
                return;
            }
            
            if (node.thumbnail) {
                if (!Buffer.isBuffer(image)) {
                    // Convert the base64 string to a buffer, so Jimp can process it
                    image = new Buffer(image, 'base64');
                }
                
                Jimp.read(image).then(function(img) {
                    // Resize the width as specified in the config screen, and scale the height accordingly (preserving aspect ratio)
                    img.resize(250, Jimp.AUTO);
                    
                    // Convert the resized image to a base64 string
                    img.getBase64(Jimp.AUTO, (err, base64) => {
                        if (err) {
                            // Log the error and keep the original image (at its original size)
                            console.error(err);
                            sendImageToClient(image, msg);
                        }
                        else {
                            // Keep the base64 image from the data url
                            base64 = base64.replace(/^data:image\/png;base64,/, "");
                            
                            sendImageToClient(base64, msg);
                        }
                    })
                }).catch(function(err) {
                    // Log the error and keep the original image (at its original size)
                    console.error(err);
                    sendImageToClient(image, msg);
                });
            }
            else {    
                sendImageToClient(image, msg);
            }
        });

        node.on("close", function() {
            RED.comms.publish("image", { id:this.id });
            node.status({});
        });
    }
    RED.nodes.registerType("image", ImageNode);
};
