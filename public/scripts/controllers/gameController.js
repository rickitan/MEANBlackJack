var app = angular.module('app');
app.controller('gameController', function($scope, $interval){
    var previousPhase;
    var currentTimerPromise;
    $scope.playerName = prompt('Enter a username');
    $scope.uiPlayer;

    var socket = io.connect('http://localhost:3000/');
    socket.on('connect', function(){
        socket.emit('joinGame', {name: $scope.playerName})
    });

    socket.on('gameState', function (gameState) {
        $scope.$apply(function(){
            $scope.gamePhase = gameState.gamePhase;
            $scope.dealer = gameState.dealer;
            $scope.players = gameState.players;
            gameState.players.forEach(function(player){
               if (player.name === $scope.playerName) {
                   $scope.uiPlayer = player;
               }
            });
            //turnTimerOn(gameState.gamePhase);
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
        var moneyAvailable = $scope.uiPlayer.bank;
        if (stake > moneyAvailable) {
            alert('You do not have enough money in the bank!');
            return;
        } 
        socket.emit('incrementStake', {stakeValue: stake});
    }

    var playerPlayed = false;
    $scope.timer = {time: 0, active: false, promise: null};
    function turnTimerOn(gamePhase){
        if(gamePhase === 'stakeRound' && gamePhase !== previousPhase){
            playerPlayed = false;
            startTimer();
        }else if(gamePhase === 'inGame' && $scope.playersIndexedByName[$scope.playerName].turn === true && !playerPlayed){
            playerPlayed = true;
            startTimer();
        }else if($scope.playersIndexedByName[$scope.playerName].turn === false && gamePhase !== 'stakeRound' ){
            $scope.timer.active = false;
            $interval.cancel($scope.timer.promise);
        }
        previousPhase = gamePhase;
    }

    function startTimer(){
        if($scope.timer.promise){ $interval.cancel($scope.timer.promise); }

        $scope.timer.time = 10;
        $scope.timer.active = true;
        $scope.timer.promise = $interval(function(){
            if($scope.timer.time > 0){
                $scope.timer.time--;
            }
        }, 1000, 10);
    }


});