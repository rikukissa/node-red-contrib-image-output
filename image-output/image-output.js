module.exports = function(RED) {
  function ImageNode(config) {
    RED.nodes.createNode(this, config);
    this.active = (config.active === null || typeof config.active === "undefined") || config.active;
    var node = this;

    node.on("input", function(msg) {
      if (this.active) {
        RED.comms.publish("image", {
          id: this.id,
          data: msg.payload.toString("base64")
        });
      }
    });
  }
  RED.nodes.registerType("image-output", ImageNode);
  
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
};
