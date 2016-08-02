const GeoTraceroute = require('./GeoTraceroute');
let geoTracer = new GeoTraceroute();

let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);


app.get('/traceroute', (req, res) => {
	if(typeof req.query.location !== "undefined"){
		res.send('location received'); // sending back confirmation to client, not working for some reason
		geoTracer.trace(req.query.location);
	}
});

io.on('connection', function(socket){
	console.log('a client connected');
	socket.on('disconnect', function(){
		console.log('client disconnected');
	});
});


http.listen(3001, () => {
	console.log('Server listening on http://localhost:3001');
});

geoTracer.on('trace-started', destination => console.log(`Trace started to ${destination}`));
geoTracer.on('ordered-hop', hop => {
	let str;
	if (hop.geo) {
		str = `hop #${hop.hop}: ${hop.geo.ip} [${hop.geo.latitude}, ${hop.geo.longitude}]`;
		str += ` ${hop.geo.city} ${hop.geo.region_name} ${hop.geo.country_name}`;
	} else {
		str = `hop #${hop.hop}: ${hop.ip}`
	}
	console.log(str)

	// let addon worker know of hop
	io.emit('trace hop', hop ); 
});

geoTracer.on('trace-finished', hops => {
	console.log('Trace complete');

	// let addon worker know of trace completion
	io.emit('trace complete', hops ); 
});

geoTracer.on('error', err => { 
	throw err;
});



