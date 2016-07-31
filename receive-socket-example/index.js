var app = require('express')();
var http = require('http').Server(app);

app.get('/', function(req, res) {
	if( typeof req.query.location !== "undefined" ){
		console.log( 'location received: '+req.query.location );
		res.send('location received'); // sending back confirmation to client, not working for some reason
	} else {
		console.log('request made missing location');
	}
});

http.listen(3001, function(){
	console.log('listening on *:3001');
});