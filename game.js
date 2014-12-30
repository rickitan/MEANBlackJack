var _ = require('underscore');

var deck = require('./deck');
var players = [];
var currentPlayerIndex = 0;
var dealer = {
    hand: {
        count: 0,
        cards: []
    }
}

function shuffle(){
    deck = _.shuffle(deck)
}

function dealCards(){
    for (var i = 0; i < 2; i++){
        for (var playerIndex = 0; playerIndex < players.length; playerIndex++){
            var card = deck.pop();
            players[playerIndex].hand.cards.push(card);
            players[playerIndex].hand.count += card.value;
        }
        var card = deck.pop();
        dealer.hand.cards.push(card);
        dealer.hand.count += card.value;
    }
}

function playersLoop(){

}


function start(){
    shuffle();
    dealCards();
    playersLoop();
}

function getPlayers(){
    return players;
}

function getDealer(){
    return dealer;
}

function addPlayer(player){
    players.push(player);
}

module.exports = {
    start: start,
    getPlayers: getPlayers,
    getDealer: getDealer,
    addPlayer: addPlayer
};




















