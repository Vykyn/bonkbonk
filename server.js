/**
 * Important note: this application is not suitable for benchmarks!
 */

var http = require('http')
  , url = require('url')
  , fs = require('fs')
  , io = require('./')
  , sys = require('sys')
  , server;
    
server = http.createServer(function(req, res){
  // your normal server code
  var path = url.parse(req.url).pathname, content_type;
  switch (path){
    case '/':
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write('<h1><a href="index.html">Play</a></h1>');
      res.end();
      break;
     
	case '/js/socket.io-client/socket.io.js':
	case '/js/Cube.js':  
	case '/js/Three.js':
	case '/test.html':
	
	      if(path.match(/\.js$/) != null) {
        content_type = 'text/javascript';
      } else if(path.match(/\.css$/) != null) {
        content_type = 'text/css';
      } else if(path.match(/\.png$/) != null) {
        content_type = 'image/png';
      } else {
        content_type = 'text/html';
      }
       

      fs.readFile(__dirname + path, function(err, data){
        if (err) {
			 res.writeHead(404);
  			 res.write(err.toString());
  			 res.end();
			 return send404(res);
		}
        res.writeHead(200, {'Content-Type': content_type})
        res.write(data, 'utf8');
        res.end();
      });
      break;
      
    default: send404(res);
  }
}),

send404 = function(res){
  res.writeHead(404);
  res.write('404');
  res.end();
};

server.listen(80);

var io = io.listen(server)
  , buffer = []
  , players={}
  , clients_id={}
  ;
  
io.on('connection', function(client){
 
  //client.broadcast({ announcement: client.sessionId + ' connected' });
  
  client.on('message', function(message){
    var msg = { message: [client.sessionId, message] };
    console.log(msg);
    switch(message.type) {
	  case 'heartbeat':
	  	client.broadcast({type: 'new_player_connected', players:players});
	  	break;
      case 'player_connected':
	  console.log("player connected "+message.id);
	  	if(!players[message.id])players[message.id]={id:message.id,x:message.x,z:message.z,rotation:message.rotation};
		clients_id[client.sessionId] = message.id;
		client.broadcast({type: 'new_player_connected', players:players});
		break;
	  case 'player_fired':
	  	client.broadcast({type:'player_fired',id:message.id,x:message.x,z:message.z,rotation:message.rotation});
		break;
      case 'player_hit':
	  	if(players[message.tid]&&players[message.id]){
				if(Math.abs(players[message.tid].x-message.x)<10&&Math.abs(players[message.tid].z-message.z)<10){
					client.broadcast({type:'player_hit',id:message.id,tid:message.tid});
				}
		}
		break;
	  case 'player_moved':
		  console.log("player moved "+message.id);
	
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
