var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(8080);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200,{'Content-Type': 'text/html'});
    res.end(data);
  });
}
var players={}
  ,clients_id={}
  ;


io.sockets.on('connection', function (client) {
  


  client.on("heartbeat",function(data){
      client.broadcast.emit('new_player_connected', {players:players});
  });

  client.on("player_connected",function(data){
     if(!players[data.id])players[data.id]={id:data.id,x:data.x,z:data.z,rotation:data.rotation};
        clients_id[client.sessionId] = data.id;
        client.broadcast.emit('new_player_connected', {players:players});
  });

  client.on("player_fired",function(data){
    client.broadcast.emit('player_fired',{id:data.id,x:data.x,z:data.z,rotation:data.rotation});
  });

  client.on("player_hit",function(data){
    if(players[data.tid]&&players[data.id]){
          //console.log("player hit "+players[message.tid].x+" x:"+message.x);
          //console.log("player hit "+players[message.tid].z+" x:"+message.z)
          if(Math.abs(players[data.tid].x-data.x)<20&&Math.abs(players[data.tid].z-data.z)<20){
          //console.log("player hit hit hit");
              client.broadcast.emit('player_hit',{id:data.id,tid:data.tid});
            }
        }
  });

  client.on("player_moved",function(data){
    if(players[data.id]){
            players[data.id].x=data.x;
            players[data.id].z=data.z;
            players[data.id].rotation=data.rotation;
          }
          //client.broadcast.emit("server_emit",{type: 'new_player_connected', players:players});
          client.broadcast.emit("player_moved", {id: data.id, x:data.x, z:data.z, rotation:data.rotation});
  });

  client.on('disconnect', function(){
   var m_id=clients_id[client.sessionId];
   delete players[m_id];
   delete clients_id[client.sessionId];
   client.broadcast.emit('remove_player', {id:m_id});
     //client.broadcast.emit("server_emit",{ announcement: client.sessionId + ' disconnected' });
  });

});










