var _ = require('underscore');
var originalDeck = require('./deck');
var Hands = require('./hands');


module.exports = function Game(){
    var players = [];
    var waitingPlayer = [];
    var offlinePlayers = [];
    var currentPlayerIndex;
    var isGameActive = false;
    var deck = _.clone(originalDeck);
    var playerTurnTimeoutId;
    var discardedCards = [];

    var dealer = {
        hands: new Hands()
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
        newHand();
    }

    function newHand(){
        discardPreviousHand();
        removeOfflinePlayers();
        players[0].turn = true;
        currentPlayerIndex = undefined;
        emitGameState('stakeRound');
        setTimeout(function(){
            dealCards();
            nextPlayer();
        }, 10000);
    }

    function discardPreviousHand() {
        _.each(players, function(player){
            discardedCards = discardedCards.concat(player.hands.discardCards());
            player.hands.initHands();
            player.turn = false;
            player.currentHandIndex = 0;
        });
        discardedCards = discardedCards.concat(dealer.hands.discardCards());
        dealer.hands.initHands();
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
                if (deck.length === 0) handleEmptyDeck();
                giveCardToPlayer(players[playerIndex]);
            }
            giveDealerCard();
        }
    }

    function handleEmptyDeck() {
        deck = _.chain(discardedCards).shuffle().clone().value();
        discardedCards = [];
    }

    function giveDealerCard(){
        if (deck.length === 0) handleEmptyDeck();
        var card = deck.pop();
        dealer.hands.receiveCard(card);
    }

    function giveCardToPlayer(player){
        if (deck.length === 0) handleEmptyDeck();
        var card = deck.pop();
        player.hands.receiveCard(card);
    }

    function getPlayers(){
        return _.map(players, function(player){ // return the player without the sockets and the hands object transformed
                return {name: player.name,
                    bank: player.bank,
                    hands: player.hands.getHands(),
                    turn: player.turn,
                    showControls: player.showControls
                }
            });
    }

    function getDealer(){
        return {hands: dealer.hands.getHands()};
    }

    function createListenActions(player){
        player.socket.on('hit', function(){
            if (players[currentPlayerIndex] !== player) return;
            clearTimeout(playerTurnTimeoutId);
            giveCardToPlayer(player);

            if (player.hands.currentHandCount() > 21) {
                if (player.hands.aceReduced()) {
                    emitGameState("inGame");
                } else if (player.hands.hasNextHand()) {
                    transitionToNextHand(player);
                } else {
                    nextPlayer();
                }
            } else {
                emitGameState("inGame");
            }
        });

        player.socket.on('double', function(){
            if (players[currentPlayerIndex] !== player) return;
            if (player.hands.getCurrentHandStake() > player.bank) return; //Not enough money

            clearTimeout(playerTurnTimeoutId);
            player.bank -= player.hands.getCurrentHandStake();
            player.hands.incrementStake(player.hands.getCurrentHandStake() * 2); //Double the stake
            giveCardToPlayer(player);

            if (player.hands.hasNextHand()) {
                transitionToNextHand(player);
            } else {
                nextPlayer();
            }
        });

        player.socket.on('split', function() {
            if (players[currentPlayerIndex] !== player) return;
            if (player.hands.getCurrentHandStake() > player.bank || !player.hands.canSplit()) return;

            player.hands.split(); //Split operation takes care of everything except substracting to the bank
            player.bank -= player.hands.getCurrentHandStake();
            giveCardToPlayer(player);

            emitGameState('inGame');
        });

        player.socket.on('stand', function(){
            if (players[currentPlayerIndex] !== player) return;
            clearTimeout(playerTurnTimeoutId);
            if (player.hands.hasNextHand()) {
                transitionToNextHand(player);
            } else {
                nextPlayer();
            }
        });

        player.socket.on('startGame', function(){
            start();
        });

        player.socket.on('disconnect', function(){
            offlinePlayers.push(player);
        });

        player.socket.on('incrementStake', function(stake){
            var stakeValue = stake.stakeValue;
            player.hands.incrementStake(stakeValue);
            player.bank -= stakeValue;
            emitGameState("stakeRound");
        });
    }

    function transitionToNextHand(currentPlayer) {
        currentPlayer.hands.moveToNextHand();
        giveCardToPlayer(currentPlayer);
        emitGameState('inGame');
    }

    function nextPlayer(){
        if (currentPlayerIndex === undefined) {
            currentPlayerIndex = 0;
        } else {
            players[currentPlayerIndex].turn = false;
            currentPlayerIndex++;
        }

        console.log('currentPlayerIndex --> ', currentPlayerIndex);

        if (players[currentPlayerIndex]) {
            players[currentPlayerIndex].turn = true;
            emitGameState("inGame");
            playerTurnTimeoutId = setTimeout(nextPlayer, 10000);
        } else {
            dealerTurn();
        }
    }

    function dealerTurn(){
        while(dealer.hands.currentHandCount() < 17){
            giveDealerCard();
        }
        pickWinners();
    }

    function pickWinners(){
        _.each(players, function(player){
            _.each(player.hands.getHands(), function(hand){
               decideHandOutCome(hand, player);
            });
        });

        emitGameState("gameOver");
        setTimeout(newHand, 5000);
    }

    function decideHandOutCome(hand, player){
        var dealerScore = dealer.hands.currentHandCount();
        var playerScore = hand.count;
        console.log('player score = ' + hand.count);

        if (playerScore <= 21) {
            if (playerScore > dealerScore || dealerScore > 21) {
                if (playerScore === 21 && hand.cards.length === 2) {
                    player.bank += (hand.stake * 3/2.1);
                    hand.gameOutCome = "Blackjack!";
                } else {
                    player.bank += (hand.stake * 2);
                    hand.gameOutCome = "You Win!";
                }
            } else if (hand.count === dealerScore) {
                player.bank += hand.stake;
                hand.gameOutCome = "Push";
            } else {
                hand.gameOutCome = "You lose!";
            }
        } else {
            hand.gameOutCome = "You lose!";
        }
    }

    function emitGameState(gamePhase){
        _.each(players, function(player){
            player.socket.emit('gameState', {players: getPlayers(), dealer: getDealer(), gamePhase: gamePhase});
        })
    }

};




















