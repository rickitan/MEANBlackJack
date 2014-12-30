angular.module('app')
    .controller('gameController', function($scope){

        $scope.players = [
            {
                name: 'Ricardo',
                bank: 2000,
                hand: {count: 14, cards:
                    [
                        {color: 'red', suit: 'diamond', value: 7, imageName: '7_of_diamonds.svg'},
                        {color: 'red', suit: 'diamond', value: 7, imageName: '7_of_diamonds.svg'}
                    ]
                }
            },
            {
                name: 'Diego',
                bank: 2000,
                hand: {count: 14, cards:
                    [
                        {color: 'red', suit: 'diamond', value: 7, imageName: '7_of_diamonds.svg'},
                        {color: 'red', suit: 'diamond', value: 7, imageName: '7_of_diamonds.svg'}
                    ]
                }
            }
        ];


    })