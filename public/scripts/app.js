angular.module('app', ['ngRoute'])
    .config(function($locationProvider, $routeProvider){
        $routeProvider
            .when('/game', {
                templateUrl: 'views/game.html',
                controller: 'gameController'
            })

        $locationProvider.html5Mode(true);
    })
    .run(function(){

    });