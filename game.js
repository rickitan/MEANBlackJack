var _ = require('underscore');
var originalDeck = require('./deck');

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
            restoreAcesToDefaultState(player.hand.cards);
            discardedCards = discardedCards.concat(player.hand.cards);
            player.hand.cards = [];
            player.hand.count = 0;
            player.turn = false;
        });

        restoreAcesToDefaultState(dealer.hand.cards);
        discardedCards = discardedCards.concat(dealer.hand.cards);
        dealer.hand.cards = [];
        dealer.hand.count = 0;
    }

    function restoreAcesToDefaultState(cards) {
        _.each(cards, function(card) {
            delete card.valueReduced;
        });
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
                var card = deck.pop();
                players[playerIndex].hand.cards.push(card);
                players[playerIndex].hand.count += card.value;
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
        if (deck.length === 0) handleEmptyDeck();
        var card = deck.pop();
        players[playerNumber].hand.cards.push(card);
        players[playerNumber].hand.count += card.value;
    }

    function createListenActions(player){
        player.socket.on('hit', function(data){
            //TODO validate that the player is hitting is the same as player index
            clearTimeout(playerTurnTimeoutId);
            giveCardToPlayer(currentPlayerIndex);
            if (player.hand.count > 21) {
                if (handContainsAce(player.hand.cards)){
                    players[currentPlayerIndex].hand.count -= 11;
                    players[currentPlayerIndex].hand.count += 1;
                    emitGameState("inGame");
                } else {
                    nextPlayer();
                }
            } else {
                emitGameState("inGame");
            }
        });

        player.socket.on('double', function(data){
            clearTimeout(playerTurnTimeoutId);
            players[currentPlayerIndex].stake = players[currentPlayerIndex].stake * 2;
            giveCardToPlayer(currentPlayerIndex);
            nextPlayer();
        });

        player.socket.on('split', function() {
            if (player.hand.cards.length > 2 || player.hand.cards[0].value !== player.hand.cards[1].value) return;
            console.log('we splitting!');
        });

        player.socket.on('stand', function(data){
            clearTimeout(playerTurnTimeoutId);
            nextPlayer();
        });

        player.socket.on('startGame', function(){
            start();
        });

        player.socket.on('disconnect', function(){
            offlinePlayers.push(player);
        });

        player.socket.on('incrementStake', function(stake){
            var stakeValue = stake.stakeValue;
            player.stake += stakeValue;
            player.bank -= stakeValue;

            console.log('player', player.stake, player.bank);

            emitGameState("stakeRound");
        });
    }

    function handContainsAce(cards) {
        var containsAce = false;

        for (var i = 0; i < cards.length; i++) {
            var card = cards[i];
            if (card.value === 11 && (card.valueReduced === undefined)) {
                card.valueReduced = true;
                containsAce = true;
                break;
            }
        }
        return containsAce;
    }

    function nextPlayer(){
        if(currentPlayerIndex === undefined){
            currentPlayerIndex = 0;
        }else{
            players[currentPlayerIndex].turn = false;
            currentPlayerIndex++;
        }

        console.log('currentPlayerIndex --> ', currentPlayerIndex);

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

};




















