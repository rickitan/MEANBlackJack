var _ = require('underscore');
var originalDeck = require('./deck');

module.exports = function Game(){
    var players = [];
    var waitingPlayer = [];
    var offlinePlayers = [];
    var currentPlayerIndex = 0;
    var isGameActive = false;
    var deck = _.clone(originalDeck);
    var playerTurnTimeoutId;

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
        players[0].turn = true;
        emitGameState("stakeRound");
    }

    function newHand(){
        removeOfflinePlayers();
        _.each(players, function(player){
            player.hand.cards = [];
            player.hand.count = 0;
            player.turn = false;
        });
        dealer.hand.cards = [];
        dealer.hand.count = 0;
        players[0].turn = true;
        currentPlayerIndex = 0;
        dealCards();
        emitGameState("inGame");
    }

    function removeOfflinePlayers(){
        _.each(offlinePlayers, function(offlinePlayer){
            var indexOfflinePlayer = players.indexOf(offlinePlayer);
            players.splice(indexOfflinePlayer, 1);
        });
        offlinePlayers = [];
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
            clearTimeout(playerTurnTimeoutId);
            giveCardToPlayer(currentPlayerIndex);
            if(player.hand.count >= 21){
                nextPlayer();
            }else{
                emitGameState("inGame");
            }
        });

        player.socket.on('double', function(data){
            clearTimeout(playerTurnTimeoutId);
            players[currentPlayerIndex].stake = players[currentPlayerIndex].stake * 2;
            giveCardToPlayer(currentPlayerIndex);
            nextPlayer();
        });

        player.socket.on('stand', function(data){
            clearTimeout(playerTurnTimeoutId);
            nextPlayer();
        });

        player.socket.on('startGame', function(){
            start();
        })

        player.socket.on('disconnect', function(){
            offlinePlayers.push(player);
        })

        player.socket.on('incrementStake', function(stake){
            incrementStake(stake);
        });
    }

    function nextPlayer(){
        players[currentPlayerIndex].turn = false;
        currentPlayerIndex++;
        if(players[currentPlayerIndex]){
            players[currentPlayerIndex].turn = true;
            emitGameState("inGame");
            playerTurnTimeoutId = setTimeout(nextPlayer, 10000);
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
        var playerScore;
        console.log('pickingwinners');
        console.log('dealer score = ' + dealerScore);
        _.each(players, function(player){
            playerScore = player.hand.count;
            console.log('player score = ' + player.hand.count);
            
            if (playerScore <= 21) {
                if (playerScore > dealerScore || dealerScore > 21) {
                    if (playerScore === 21 && player.hand.cards.length === 2) {
                        player.bank += (player.stake * 3/2);
                        player.gameOutCome = "Blackjack!";
                    } else {
                        player.bank += (player.stake * 2);
                        player.gameOutCome = "You Win!";
                    }
                } else if (player.hand.count === dealerScore) {
                    player.bank += player.stake;
                    player.gameOutCome = "Push";
                } else {
                    player.gameOutCome = "You lose!";
                }
            } else {
                player.gameOutCome = "You lose!";
            }
            player.stake = 0;
        });

        emitGameState("gameOver");
        setTimeout(newHand, 5000);
    }

    function emitGameState(gamePhase){
        _.each(players, function(player){
            player.socket.emit('gameState', {players: getPlayers(), dealer: getDealer(), gamePhase: gamePhase});
        })
    }

    function incrementStake(stakeData) {
        var currentPlayer = players[currentPlayerIndex];
        var stakeValue = stakeData.stakeValue;
        currentPlayer.stake += stakeValue;
        currentPlayer.bank -= stakeValue;
        emitGameState("stakeRound");
    }

};




















