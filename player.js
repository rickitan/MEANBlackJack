module.exports = function player(name, socket){
    this.name = (name || '');
    this.bank = 2000;
    this.stake = 0;
    this.hand = {count: 0, cards: []};
    this.showControls = false;
    this.socket = socket;
    this.turn = false;
};