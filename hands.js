var _ = require('underscore');

//TODO: Add methods to prototype instead of instance

module.exports = function Hands() {
    var hands = [getNewHandModel()];
    var currentHandIndex = 0;

    this.discardCards = function() {
        restoreAcesToDefaultState();
        return _.chain(hands)
            .map(function(hand){return hand.cards})
            .flatten()
            .value()
    };

    this.initHands = function() {
        currentHandIndex = 0;
        hands = [getNewHandModel()];
    };

   this.receiveCard = function(card) {
       var hand = getCurrentHand();
       hand.cards.push(card);
       hand.count += card.value;
   };

    this.currentHandCount = function() {
        var hand = getCurrentHand();
        return hand.count;
    };

    this.aceReduced = function() {
        var currentHand = getCurrentHand();
        var cards = currentHand.cards;
        var aceReduced = false;

        for (var i = 0; i < cards.length; i++) {
            var card = cards[i];
            if (card.value === 11 && (card.valueReduced === undefined)) {
                card.valueReduced = true;
                aceReduced = true;
                break;
            }
        }

        if (aceReduced) {
            currentHand.count = currentHand.count - 11;
            currentHand.count = currentHand.count + 1;
        }

        return aceReduced;
    };

    this.hasNextHand = function() {
        var nextHandIndex = currentHandIndex + 1;
        return !!hands[nextHandIndex];
    };

    this.moveToNextHand = function() {
        currentHandIndex++;
    };

    this.getCurrentHandStake = function() {
        return getCurrentHand().stake;
    };

    this.incrementStake = function(stake) {
        getCurrentHand().stake += stake;
    };

    this.canSplit = function() {
      var hand = getCurrentHand();
      return  hand.cards.length === 2 && hand.cards[0].value === hand.cards[1].value && hand.cards[0].type === hand.cards[1].type;
    };

    this.split = function() {
        var splitHand = getNewHandModel();
        var currentHand = getCurrentHand();

        var splitCard = currentHand.cards.pop();
        currentHand.count -= splitCard.value;

        splitHand.cards.push(splitCard);
        splitHand.count += splitCard.value;
        splitHand.stake = currentHand.stake;

        hands.push(splitHand);
    };

    this.getHands = function() {
        return hands;
    };

    function getCurrentHand() {
        return hands[currentHandIndex];
    }

    function getNewHandModel(){
        return {count: 0, cards: [], gameOutCome: '', stake: 0};
    }

    function restoreAcesToDefaultState() {
        _.each(hands, function(hand) {
            _.each(hand.cards, function(card){
                delete card.valueReduced;
            });
        });
    }

};