/**
 * Important note: this application is not suitable for benchmarks!
 */

var http = require('http'),
   url = require('url')
  , path = require('path')
  , util = require('util')
  , fs = require('fs')
  , io = require('socket.io')
  , sys = require('sys')
  , server;

function findType(uri) {
  var types = {
    '.js': 'text/javascript',
    '.html': 'text/html',
    '.css': 'text/css',
    '.ico': 'image/x-icon',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
  };

  var ext = uri.match(/\.\w+$/gi);
  if (ext && ext.length > 0) {
    ext = ext[0].toLowerCase();
    if (ext in types) {
      return types[ext];
    }
  }
  return undefined;
}

function sendError(code, response) {
  response.writeHead(code);
  response.end();
  return;
}


server = http.createServer(function(request, response) {
  var uri = url.parse(request.url).pathname;
  if (uri === '/') {uri = '/test.html';}
  var _file = path.join(process.cwd(), uri);

  path.exists(_file, function(exists) {
    if (!exists) {
      sendError(404, response);
    } else {
      fs.stat(_file, function(err, stat) {
        var file = __dirname + uri,
            type = findType(uri),
            size = stat.size;
        if (!type) {
          sendError(500, response);
        }
        response.writeHead(200, {'Content-Type':type, 'Content-Length':size});
        var rs = fs.createReadStream(file);
        util.pump(rs, response, function(err) {
          if (err) {
            console.log("ReadStream, WriteStream error for util.pump");
            response.end();
          }
        });
      });
    }
  });

});


server.listen(8080, '127.0.0.1');

var io = io.listen(server)
  , buffer = []
  , players={}
  , clients_id={}
  ;
  
io.on('connection', function(client){
 
  //client.broadcast({ announcement: client.sessionId + ' connected' });
  
  client.on('message', function(message){
    var msg = { message: [client.sessionId, message] };
    //console.log(msg);
    switch(message.type) {
	  case 'heartbeat':
	  	client.broadcast({type: 'new_player_connected', players:players});
	  	break;
      case 'player_connected':
	 // console.log("player connected "+message.id);
	  	if(!players[message.id])players[message.id]={id:message.id,x:message.x,z:message.z,rotation:message.rotation};
		clients_id[client.sessionId] = message.id;
		client.broadcast({type: 'new_player_connected', players:players});
		break;
	  case 'player_fired':
	  	client.broadcast({type:'player_fired',id:message.id,x:message.x,z:message.z,rotation:message.rotation});
		break;
      case 'player_hit':
	  	if(players[message.tid]&&players[message.id]){
		  	//console.log("player hit "+players[message.tid].x+" x:"+message.x);
			//console.log("player hit "+players[message.tid].z+" x:"+message.z)
			if(Math.abs(players[message.tid].x-message.x)<20&&Math.abs(players[message.tid].z-message.z)<20){
					//console.log("player hit hit hit");
					client.broadcast({type:'player_hit',id:message.id,tid:message.tid});
				}
		}
		break;
	  case 'player_moved':
		  //console.log("player moved "+message.id);
	
			if(players[message.id]){
				players[message.id].x=message.x;
				players[message.id].z=message.z;
				players[message.id].rotation=message.rotation;		
			}
		//client.broadcast({type: 'new_player_connected', players:players});

        client.broadcast({type: "player_moved", id: message.id, x:message.x, z:message.z, rotation:message.rotation});
        break;
		
     
    }
  });

  client.on('disconnect', function(){
	 var m_id=clients_id[client.sessionId];
	 delete players[m_id];
	 delete clients_id[client.sessionId];
	 client.broadcast({type: 'remove_player', id:m_id});
     //client.broadcast({ announcement: client.sessionId + ' disconnected' });
  });
});
