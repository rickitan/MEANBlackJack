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
        hands: [
            {
                count: 0,
                cards: []
            }
        ]
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

    function getNewHandModel(){
        return {count: 0, cards: [], gameOutCome: '', stake: 0};
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
            restoreAcesToDefaultState(player.hands);
            discardCards(player.hands);
            player.hands = [getNewHandModel()];
            player.turn = false;
            player.currentHandIndex = 0;
        });
        restoreAcesToDefaultState(dealer.hands);
        discardCards(dealer.hands);
        dealer.hands = [getNewHandModel()];
    }

    function discardCards(hands){
        discardedCards = discardedCards.concat(
            _.chain(hands)
                .map(function(hand){return hand.cards})
                .flatten()
                .value()
        );
    }

    function restoreAcesToDefaultState(hands) {
        _.each(hands, function(hand) {
            _.each(hand.cards, function(card){
                delete card.valueReduced;
            });
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
                players[playerIndex].hands[0].cards.push(card);
                players[playerIndex].hands[0].count += card.value;
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
        dealer.hands[0].cards.push(card);
        dealer.hands[0].count += card.value;
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
        var player = players[playerNumber];
        player.hands[player.currentHandIndex].cards.push(card);
        player.hands[player.currentHandIndex].count += card.value;
    }

    function createListenActions(player){
        player.socket.on('hit', function(data){
            clearTimeout(playerTurnTimeoutId);
            giveCardToPlayer(currentPlayerIndex);
            var currentHandIndex = player.currentHandIndex;

            if (player.hands[currentHandIndex].count > 21) {
                var currentHand = player.hands[currentHandIndex];
                if (handContainsAce(currentHand.cards)){
                    currentHand.count -= 11;
                    currentHand.count += 1;
                    emitGameState("inGame");
                } else if (hasNextHand(player)) {
                    transitionToNextHand();
                } else {
                    nextPlayer();
                }
            } else {
                emitGameState("inGame");
            }
        });

        player.socket.on('double', function(){
            if (player.hands[player.currentHandIndex].stake > player.bank) return;
            clearTimeout(playerTurnTimeoutId);
            player.bank -= players[currentPlayerIndex].hands[player.currentHandIndex].stake;
            players[currentPlayerIndex].hands[player.currentHandIndex].stake *= 2;
            giveCardToPlayer(currentPlayerIndex);
            if (hasNextHand(player)) {
                transitionToNextHand(player);
            } else {
                nextPlayer();
            }
        });

        player.socket.on('split', function() {
            var currentHandIndex = player.currentHandIndex;
            if (player.hands[currentHandIndex].stake > player.bank || 
                player.hands[currentHandIndex].cards.length > 2 ||
                player.hands[currentHandIndex].cards[0].value !== player.hands[currentHandIndex].cards[1].value ||
                player.hands[currentHandIndex].cards[0].suit !== player.hands[currentHandIndex].cards[1].suit ) return;

            var stakeValue = player.hands[0].stake;
            var splitHand = getNewHandModel();
            var splitCard = player.hands[currentHandIndex].cards.pop();
            player.hands[currentHandIndex].count -= splitCard.value;
            splitHand.cards.push(splitCard);
            splitHand.count += splitCard.value;

            splitHand.stake += stakeValue;
            player.bank -= stakeValue;

            player.hands.push(splitHand);
            giveCardToPlayer(currentPlayerIndex);

            emitGameState('inGame');
        });

        player.socket.on('stand', function(){
            clearTimeout(playerTurnTimeoutId);
            if (hasNextHand(player)) {
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
            player.hands[0].stake += stakeValue;
            player.bank -= stakeValue;

            console.log('player', player.hands[0].stake, player.bank);

            emitGameState("stakeRound");
        });
    }

    function transitionToNextHand(currentPlayer) {
        currentPlayer.currentHandIndex++;
        giveCardToPlayer(currentPlayerIndex);
        emitGameState('inGame');
    }

    function hasNextHand(player){
        var nextHandIndex = player.currentHandIndex + 1;
        return !!player.hands[nextHandIndex];
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
        while(dealer.hands[0].count < 17){
            giveDealerCard();
        }
        pickWinners();
    }

    function pickWinners(){
        _.each(players, function(player){
            _.each(player.hands, function(hand){
               decideHandOutCome(hand, player);
            });
        });

        emitGameState("gameOver");
        setTimeout(newHand, 5000);
    }

    function decideHandOutCome(hand, player){
        var dealerScore = dealer.hands[0].count;
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




















