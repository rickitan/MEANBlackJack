angular.module('app')
    .controller('gameController', function($scope){

        var socket = io.connect('http://localhost:3000/');
        socket.on('connect', function(){
            socket.emit('joinGame', {name: 'Ricardo Macario'})
        })

        socket.on('gameState', function (gameState) {
            $scope.$apply(function(){
                $scope.dealer = gameState.dealer;
                $scope.players = gameState.players;
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

        }

        $scope.stand = function(){

        }
        $scope.double = function(){

        }
        $scope.split = function(){

        }


    })