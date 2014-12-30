angular.module('app')
    .controller('gameController', function($scope){

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