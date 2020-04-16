module.exports = function(RED) {
    var Jimp = require('jimp-compact'); 
    
    function ImageNode(config) {
        RED.nodes.createNode(this, config);
        this.imageWidth = parseInt(config.width || 160);
        this.data       = config.data || "";
        this.dataType   = config.dataType || "msg";
        this.thumbnail  = config.thumbnail;
        this.active     = (config.active === null || typeof config.active === "undefined") || config.active;
        this.pass       = config.pass;
        
        var node = this;
        var oldimage;
        
        function sendImageToClient(image, msg) {
            var d = { id:node.id }
            if (image !== null) { 
                if (Buffer.isBuffer(image)) {
                    image = image.toString("base64");
                }
                d.data = image;
            }
            try {
                RED.comms.publish("image", d);
                if (msg.hasOwnProperty("filename")) { node.status({text:" " + msg.filename}); }
            }
            catch(e) {
                node.error("Invalid image", msg);
            }
        }
        
        function handleError(err, msg, statusText) {
            node.status({ fill:"red", shape:"dot", text:statusText });
            node.error(err, msg);
        }
        
        function resizeJimpImage(jimpImage, msg) {
            // Resize the width as specified in the config screen, and scale the height accordingly (preserving aspect ratio)
            jimpImage.resize(node.imageWidth, Jimp.AUTO);
            
            // Convert the resized image to a base64 string
            jimpImage.getBase64(Jimp.AUTO, (err, base64) => {
                if (err) {
                    // Log the error and keep the original image (at its original size)
                    node.status({ fill:"red", shape:"dot", text:"Resize failed" });
                    node.log(err.toString());
                    sendImageToClient(oldimage, msg);
                }
                else {
                    // Keep the base64 image from the data url
                    base64 = base64.replace(/^data:image\/[a-z]+;base64,/, "");
                    sendImageToClient(base64, msg);
                }
            })
        }
        
        function isJimpObject(image) {
            // For some reason "instanceof Jimp" does not always work...
            // See https://discourse.nodered.org/t/checking-object-instance/19482
            return (image instanceof Jimp) || (image.constructor && (image.constructor.name === "Jimp"));
        }

        node.on("input", function(msg) {
            var image;
            
            if (this.active !== true) { return; }
            
            if (node.pass) { node.send(msg); }
            
            // Get the image from the location specified in the typedinput field
            RED.util.evaluateNodeProperty(node.data, node.dataType, node, msg, (err, value) => {
                if (err) {
                    handleError(err, msg, "Invalid source");
                    return;
                } else {
                    image = value;
                }
            });
            
            // Reset the image in case an empty payload arrives
            if (!image || image === "") {
                sendImageToClient(null, msg);
                return;
            }
        
            if (!Buffer.isBuffer(image) && (typeof image !== 'string') && !(image instanceof String) && !isJimpObject(image)) {
                node.error("Input should be a buffer or a base64 string or a Jimp image (containing a jpg or png image)",msg);
                return;
            }
            
            if (node.thumbnail) {
                if (isJimpObject(image)) {
                    // Use the input Jimp image straight away, for maximum performance
                    resizeJimpImage(image, msg);
                }
                else {
                    if (!Buffer.isBuffer(image)) {
                        // Convert the base64 string to a buffer, so Jimp can process it
                        image = new Buffer.from(image.replace(/^data:image\/[a-z]+;base64,/, ""), 'base64');
                    }
                    oldimage = image;
                    Jimp.read(image).then(function(jimpImage) {
                        resizeJimpImage(jimpImage, msg); 
                        node.status("");      
                    }).catch(function(err) {
                        // Log the error and keep the original image (at its original size)
                        handleError(err, msg, "Resize failed");
                        sendImageToClient(image, msg);
                    });
                }
            }
            else {    
                if (isJimpObject(image)) {
                    image.getBase64(Jimp.AUTO, (err, base64) => {
                        // Keep the base64 image from the data url
                        base64 = base64.replace(/^data:image\/[a-z]+;base64,/, "");
                        sendImageToClient(base64, msg);
                    })
                }
                else {
                    if (typeof image === "string") {
                        sendImageToClient(image.replace(/^data:image\/[a-z]+;base64,/, ""), msg);
                    }
                    else { sendImageToClient(image, msg) }
                }
            }
        });

        node.on("close", function() {
            RED.comms.publish("image", { id:this.id });
            node.status({});
        });
    }
    RED.nodes.registerType("image", ImageNode);
    
    // Via the button on the node (in the FLOW EDITOR), the image pushing can be enabled or disabled
    RED.httpAdmin.post("/image-output/:id/:state", RED.auth.needsPermission("image-output.write"), function(req,res) {
        var state = req.params.state;
        var node = RED.nodes.getNode(req.params.id);
        
        if(node === null || typeof node === "undefined") {
            res.sendStatus(404);
            return;  
        }

        if (state === "enable") {
            node.active = true;
            res.send('activated');
        }
        else if (state === "disable") {
            node.active = false;
            res.send('deactivated');
        }
        else {
            res.sendStatus(404);
        }
    });
};
