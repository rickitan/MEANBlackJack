var express = require('express')
  , app = express()
  , io =  require('socket.io')


app.use(express.static(__dirname + '/public'));


app.get('*', function (req, res) {
    res.sendFile(__dirname + '/public/views/index.html');
});

var server = app.listen(3000, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);

});

io = io(server);

var Game = require('./game');
var Player = require('./player');
var games = [new Game(), new Game(), new Game()];

io.on('connection', function (socket) {

    socket.on('joinGame', function(playerData){
        var newPlayer = new Player(playerData.name, socket);
        console.log('Player joined game:' + playerData.name);
        for (var i = 0; i < games.length; i++){
            if(games[i].getPlayers().length < 3){
                games[i].addPlayer(newPlayer);
                break;
            }
        }
    });

});

