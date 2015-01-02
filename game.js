var _ = require('underscore');
var originalDeck = require('./deck');

module.exports = function Game(){
    var players = [];
    var waitingPlayer = [];
    var currentPlayerIndex = 0;
    var isGameActive = false;
    var deck = _.clone(originalDeck);

    var dealer = {
        hand: {
            count: 0,
            cards: []
        }
    };

    /*** Public Methods ***/

    this.addPlayer = function addPlayer(player){
        if (isGameActive) { waitingPlayer.push(player) }
        players.push(player);
        createListenActions(player);
    };

    this.getPlayers = getPlayers;

    /**********************/

    function start(){
        shuffle();
        dealCards();
        players[currentPlayerIndex].turn = true;
        emitGameState();
    }

    function shuffle(){
        deck = _.shuffle(deck);
    }

    function dealCards(){
        for (var i = 0; i < 2; i++){
            for (var playerIndex = 0; playerIndex < players.length; playerIndex++){
                var card = deck.pop();
                players[playerIndex].hand.cards.push(card);
                players[playerIndex].hand.count += card.value;
            }
            giveDealerCard();
        }
    }

    function giveDealerCard(){
        var card = deck.pop();
        dealer.hand.cards.push(card);
        dealer.hand.count += card.value;
    }

    function getPlayers(){
        return _.map(players, function(p){return _.omit(p, 'socket')});
    }

    function getDealer(){
        return dealer;
    }

    function giveCardToPlayer(playerNumber){
        var card = deck.pop();
        players[playerNumber].hand.cards.push(card);
        players[playerNumber].hand.count += card.value;
    }

    function createListenActions(player){
        player.socket.on('hit', function(data){
            //TODO validate that the player is hitting is the same as player index
            giveCardToPlayer(currentPlayerIndex);
            if(player.hand.count >= 21){
                nextPlayer();
            }else{
                emitGameState();
            }
        });

        player.socket.on('double', function(data){
            players[currentPlayerIndex].stake = players[currentPlayerIndex].stake * 2;
            giveCardToPlayer(currentPlayerIndex);
            nextPlayer();
        });

        player.socket.on('stand', function(data){
            nextPlayer();
        });

        player.socket.on('startGame', function(){
            start();
        });

        player.socket.on('incrementStake', function(stake){
            incrementStake(stake);
        });
    }

    function nextPlayer(){
        players[currentPlayerIndex].turn = false;
        currentPlayerIndex++;
        if(players[currentPlayerIndex]){
            players[currentPlayerIndex].turn = true;
            emitGameState();
        }else{
            dealerTurn();
        }
    }

    function dealerTurn(){
        while(dealer.hand.count < 17){
            giveDealerCard();
        }
        pickWinners();
    }

    function pickWinners(){
        var dealerScore = dealer.hand.count;
        _.each(players, function(player){
            if(player.hand.count > dealerScore){
                player.bank += (player.stake * 2);
            }else if(player.hand.count === dealerScore){
                player.bank += player.stake;
            }else{
                player.bank = player.bank - player.stake;
            }
            player.stake = 0;
        });
        emitGameState();
    }

    function emitGameState(){
        _.each(players, function(player){
            player.socket.emit('gameState', {players: getPlayers(), dealer: getDealer()});
        })
    }

    function incrementStake(stakeData) {
        var currentPlayer = players[currentPlayerIndex];
        var stakeValue = stakeData.stakeValue;
        currentPlayer.stake += stakeValue;
        currentPlayer.bank -= stakeValue;
        currentPlayer.socket.emit('gameState', {players: getPlayers(), dealer: getDealer()});
    }

};




















