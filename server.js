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

var game = require('./game');
var player = require('./player');

io.on('connection', function (socket) {

    socket.on('joinGame', function(playerData){
        var newPlayer = new player(playerData.name);
        game.addPlayer(newPlayer);
        game.start();
        setTimeout(function(){emitGameState(socket)}, 10000)
    });

});

function emitGameState(socket){
    socket.emit('gameState', {players: game.getPlayers(), dealer: game.getDealer()});
}