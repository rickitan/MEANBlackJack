module.exports = function player(name, socket){
    this.name = (name || '');
    this.bank = 2000;
    this.hands = [{count: 0, cards: [], gameOutCome: '', stake: 0}];
    this.showControls = false;
    this.socket = socket;
    this.turn = false;
    this.currentHandIndex = 0;
};