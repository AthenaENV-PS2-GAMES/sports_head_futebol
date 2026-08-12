import Gamepad from "../../shared/lib/gamepad.js";

function PlayerController(options){
    this.port = options.playerPort
}

PlayerController.prototype.kick = function () { return Gamepad.player(this.port).pressed(Pads.CROSS); };

export default PlayerController;