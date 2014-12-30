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
var Player = require('./player');

io.on('connection', function (socket) {

    socket.on('joinGame', function(playerData){
        console.log('Player joined game:' + playerData.name);


        var newPlayer = new Player(playerData.name, socket);
        game.addPlayer(newPlayer);
        //socket.emit('playerNumber', {playerNumber: game.getPlayers().length - 1});
        //setTimeout(function(){emitGameState(socket)}, 10000)
    });

    socket.on('startGame', function(){
        game.start();
    })

});

