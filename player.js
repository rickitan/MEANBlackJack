module.exports = function player(name){
    this.name = (name || '');
    this.bank = 2000;
    this.hand = {count: 0, cards: []};
    this.showControls = false;
};