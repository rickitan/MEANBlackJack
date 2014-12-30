angular.module('app')
    .controller('gameController', function($scope){
        $scope.playerName = prompt('Enter a username');

        var socket = io.connect('http://localhost:3000/');
        socket.on('connect', function(){
            socket.emit('joinGame', {name: $scope.playerName})
        })

        socket.on('gameState', function (gameState) {
            $scope.$apply(function(){
                $scope.dealer = gameState.dealer;
                $scope.players = gameState.players;
                $scope.playersIndexedByName = _.indexBy(gameState.players, 'name')
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


    })