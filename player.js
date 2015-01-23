var Hands = require('./hands');

module.exports = function player(name, socket){
    this.name = (name || '');
    this.bank = 2000;
    this.hands = new Hands();
    this.showControls = false;
    this.socket = socket;
    this.turn = false;
};

