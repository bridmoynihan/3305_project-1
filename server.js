const express = require('express');
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var usersSockets = {}; //Key: socket, Value: username
var users = {}; //Key: username, Value: socket
var onlinePlayers = {};
var games = {};
var freeGames = [];

app.use(express.static('public'));
//app.set('view engine', 'ejs');

app.get('/', function (req, res) {
  //res.send('Hello World!');
  //res.render ('index');
    res.sendFile ('/index.html');
})

http.listen(56630, function(){
    console.log('Listening on *:56630');
});

function createPlayerProfile (name, socket) {
    var player = {};
    player.name = name;
    player.socket = socket;
    player.currentGameID = null;
    return player;
}

function createNewPlayer (name, socket) {
    var player = {};
    player.name = name;
    player.socket = socket;
    player.money = 0;
    player.properties = [];
    player.getOutOfJail = 0;
    return player;
}

function createNewGame (name, maxPlayers, isLocked, password) {
    var game = {};
    //game.players = {};
    game.name = "Game_" + name;
    game.players = [];
    if (typeof (maxPlayers) == "undefined") {
        game.maxPlayers = 8;
    }
    else {
        game.maxPlayers = maxPlayers;
    }
    
    if (isLocked) {
        game.isLocked = true;
        game.password = password
    }

    game.isFull = false;

    game.join = function (name, socket) {
        //game.players[name] = (createNewPlayer(name, socket)); 
        game.players.push(createNewPlayer(name, socket));    
    }

    game.getPlayers = function () {
        return game.players;
    }

    game.removePlayer = function (username) {  
        for (var i in game.players) {
            if (game.players[i].name == username) {
                console.log ("Removing " + game.players[i].name + "from game (" + game.name + ").")
                delete game.players[i];
            }
        }
    }

    return game;
}

io.on('connection', function (socket){
    //console.log('A user connected');
    socket.on('disconnect', function(){
        // if (usersSockets[socket.request.connection.remoteAddress]) {
        if (usersSockets[socket]) {
            // console.log(usersSockets[socket.request.connection.remoteAddress] + ' user disconnected');
            // delete users[usersSockets[socket.request.connection.remoteAddress]];
            // delete usersSockets[socket.request.connection.remoteAddress];
            console.log(usersSockets[socket] + ' user disconnected');
            delete users[usersSockets[socket]];
            delete usersSockets[socket];

            //Make method in player to remove certain players on disconnect

            console.log (usersSockets);
            console.log (users);
        }
    });

    socket.on('setName', function (data){
        // usersSockets[socket.request.connection.remoteAddress] = data;
        // users[data] = socket.request.connection.remoteAddress;
        usersSockets[socket] = data;
        users[data] = socket;
        console.log (usersSockets);
        console.log (users);
        console.log(data + " has joined at IP: " + socket.request.connection.remoteAddress); //Prints the username and IP of client
        socket.emit("nameConfirmation", "Welcome to the game");
        var gameID = Math.random().toString(36).substr(4, 15);
        games["Game_" + gameID] = createNewGame(gameID);
        //games["Game_" + gameID].addNewPlayer("test");
        freeGames.push("Game_" + gameID); //push to make sure people who've been waiting longest start first
        // onlinePlayers[data] = createPlayerProfile (data, socket.request.connection.remoteAddress);
        onlinePlayers[data] = createPlayerProfile (data, socket);
        console.log (games);
        console.log (onlinePlayers);
    });

    socket.on ('gameSelect', function (data) {
        console.log (data);
        if (data == "Join") {
            // joinGame(socket.request.connection.remoteAddress);
            joinGame(socket);
        }
    })
});

function joinGame (socket) {
    try {
        games[freeGames[0]].join(usersSockets[socket], socket);
    }
    catch (err){
        return ("Error");
    }
    onlinePlayers[usersSockets[socket]].currentGameID = freeGames[0];
    console.log(games);
    console.log (onlinePlayers);
   // broadcastToPlayers(freeGames[0]);
//    var data = []
//    data.push(freeGames.slice(0, 1));
//    data.push(games[freeGames.slice(0, 1)].getPlayers());
   socket.emit("returnGame", "Test");

   //console.log(data);
   //broadcast data to the client using broadcastToPlayers()
}

function broadcastToPlayers (socket, gameID) {
    games[gameID].getPlayers().forEach(element => {
        console.log(element); //Issue is that it returns an object reference not a player object   
        var clientName = element["name"];
        console.log (clientName);
        //clientSocket.emit("welcomeToGame", "Welcome to the game");
        //io.sockets.socket(element["socket"]).emit("welcomeToGame", "Welcome to the game");
        //io.to
        io.to(users[clientName]).emit("nameConfirmation", "Welcome to the game scrubz");
    });
}

//Allow user to name their game if they create it, add name and ID attributes to game class. Maybe also add a game owner
//View game names on the select game screen
