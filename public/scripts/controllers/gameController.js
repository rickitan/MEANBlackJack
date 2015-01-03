var app = angular.module('app');
app.controller('gameController', function($scope, $interval){
    var previousPhase;
    var currentTimerPromise;
    $scope.playerName = prompt('Enter a username');

    var socket = io.connect('http://localhost:3000/');
    socket.on('connect', function(){
        socket.emit('joinGame', {name: $scope.playerName})
    })

    socket.on('gameState', function (gameState) {
        $scope.$apply(function(){
            $scope.gamePhase = gameState.gamePhase;
            $scope.dealer = gameState.dealer;
            $scope.players = gameState.players;
            $scope.playersIndexedByName = _.indexBy(gameState.players, 'name')
            turnTimerOn(gameState.gamePhase);
        })
    });

    $scope.dealer = {
        hand: {
            count: 14,
            cards: [
                {color: 'red', suit: 'diamond', value: 7, imageName: '7_of_diamonds'},
                {color: 'red', suit: 'diamond', value: 7, imageName: '7_of_diamonds'},
                {color: 'red', suit: 'diamond', value: 7, imageName: '7_of_diamonds'},
                {color: 'red', suit: 'diamond', value: 7, imageName: '7_of_diamonds'}
            ]
        }
    }


    $scope.players = [
        {
            name: 'Ricardo',
            bank: 2000,
            hand: {count: 14, cards:
                [
                    {color: 'red', suit: 'diamond', value: 7, imageName: '7_of_diamonds'},
                    {color: 'red', suit: 'diamond', value: 7, imageName: '7_of_diamonds'}
                ]
            },
            showControls: true
        },
        {
            name: 'Diego',
            bank: 2000,
            hand: {count: 14, cards:
                [
                    {color: 'red', suit: 'diamond', value: 7, imageName: '8_of_diamonds'},
                    {color: 'red', suit: 'diamond', value: 7, imageName: '7_of_diamonds'}
                ]
            },
            showControls: false
        }
    ];

    $scope.hit = function(){
        socket.emit('hit', {});
    }

    $scope.stand = function(){
        socket.emit('stand', {});
    }
    $scope.double = function(){
        socket.emit('double', {});
    }
    $scope.split = function(){
        socket.emit('split', {});
    }

    $scope.startGame = function(){
        socket.emit('startGame');
    }

    $scope.incrementStake = function(stake){
        var moneyAvailable = $scope.playersIndexedByName[$scope.playerName].bank;
        if (stake > moneyAvailable) {
            alert('You do not have enough money in the bank!');
            return;
        } 
        socket.emit('incrementStake', {stakeValue: stake});
    }

    var playerPlayed = false;
    function turnTimerOn(gamePhase){
        if(gamePhase === 'stakeRound' && gamePhase !== previousPhase){
            $scope.timer = 10;
            playerPlayed = false;
            currentTimerPromise = $interval(function(){
                if($scope.timer > 0){
                    $scope.timer--;
                }
            }, 1000, 10)
        }else if(gamePhase === 'inGame' && $scope.playersIndexedByName[$scope.playerName].turn === true && !playerPlayed){
            $scope.timer = 10;
            playerPlayed = true;
            currentTimerPromise = $interval(function(){
                if($scope.timer > 0){
                    $scope.timer--;
                }
            }, 1000, 10)
        }else if(gamePhase === 'inGame' && $scope.playersIndexedByName[$scope.playerName].turn === false){
            $interval.cancel(currentTimerPromise);
        }
        previousPhase = gamePhase;
    }


})