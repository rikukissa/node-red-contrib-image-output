module.exports = function(RED) {
   var fs = require('fs');
   var path = require('path');
  
  function ImageNode(config) {
    RED.nodes.createNode(this, config);
    this.active = (config.active === null || typeof config.active === "undefined") || config.active;
    this.content = null;
        
    function pushImage(data) {
       RED.comms.publish("image", {
            id: node.id,
            data: data
       });
    }
       
    // Cache the no_image.png file
    var filePath = path.join(__dirname, 'no_image.png');
    this.noImage = fs.readFileSync(filePath).toString("base64"); 
    
    // Cache the incorrect_input.png file
    filePath = path.join(__dirname, 'incorrect_input.png');
    this.incorrectInput = fs.readFileSync(filePath).toString("base64");
    
    var node = this;
    
    // Show a 'no image' at the start, in case no images will be pushed afterwards
    pushImage(node.noImage);

    node.on("input", function(msg) {
      var data = null;
      
      if (Buffer.isBuffer(msg.payload) || typeof data === 'string') {
        data = msg.payload.toString("base64");
        node.contentType = "inputImage";
      }
      else {
        node.error("Input should be a Buffer or a string", msg);
        
        // It is useless to send a series of incorrect_input.png 
        if (node.contentType === "incorrectInput") {
            return;
        }
        
        data = node.incorrectInput;
        node.contentType = "incorrectInput";
      }
      
      if (this.active) {
        pushImage(data);
      }
    });
    
    node.on("close",function() {
      // Clear the content type, to make sure the static images will be pushed again after a (re)deploy
      node.contentType = null;
    });
  }
  
  // Via the button on the node (in the flow editor), the image pushing can be enabled or disabled
  RED.httpAdmin.post("/image-output/:id/:state", RED.auth.needsPermission("image-output.write"), function(req,res) {
    var node = RED.nodes.getNode(req.params.id);
    var state = req.params.state;
    if (node !== null && typeof node !== "undefined" ) {
        if (state === "enable") {
            node.active = true;
            res.sendStatus(200);
        } else if (state === "disable") {
            node.active = false;
            res.sendStatus(201);
        } else {
            res.sendStatus(404);
        }
    } else {
        res.sendStatus(404);
    }
  });

  RED.nodes.registerType("image", ImageNode);
};
