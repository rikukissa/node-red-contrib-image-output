module.exports = function(RED) {
  function ImageNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.on("input", function(msg) {
      RED.comms.publish("image", {
        id: this.id,
        data: msg.payload.toString("base64")
      });
    });
  }
  RED.nodes.registerType("image", ImageNode);
};
